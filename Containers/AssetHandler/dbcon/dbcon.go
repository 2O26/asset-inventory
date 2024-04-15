package dbcon

import (
	"assetinventory/assethandler/jsonhandler"
	"context"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/sony/sonyflake"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AssetRequest struct {
	AddAsset        []jsonhandler.Asset          `json:"addAsset"`        // To add new assets
	RemoveAsset     []string                     `json:"removeAsset"`     // Asset IDs to remove
	UpdatedAsset    map[string]jsonhandler.Asset `json:"updateAsset"`     // Asset ID to updated Asset mapping
	AddRelations    []jsonhandler.Relation       `json:"addRelations"`    // Relations to add
	RemoveRelations []string                     `json:"removeRelations"` // Relation IDs to remove
}
type Timeline struct {
	AddAsset        map[string]jsonhandler.Asset    `json:"addAsset"`        // To add new assets
	RemoveAsset     map[string]jsonhandler.Asset    `json:"removeAsset"`     // Asset IDs to remove
	UpdatedAsset    map[string]jsonhandler.Asset    `json:"updateAsset"`     // Asset ID to updated Asset mapping
	AddRelations    map[string]jsonhandler.Relation `json:"addRelations"`    // Relations to add
	RemoveRelations map[string]jsonhandler.Relation `json:"removeRelations"` // Relation IDs to remove

}

// Change struct to log changes in the timelineDB collection
type Change struct {
	Type          string    `bson:"type"`
	Timestamp     time.Time `bson:"timestamp"`
	ChangeDetails Timeline  `bson:"changeDetails"`
}

var client *mongo.Client
var dbName string

var flake, _ = sonyflake.New(sonyflake.Settings{
	StartTime: time.Date(2023, 6, 1, 7, 15, 20, 0, time.UTC),
})

func SetupDatabase(uri string, databaseName string) error {
	ctx := context.TODO()
	clientOptions := options.Client().ApplyURI(uri)

	var err error
	client, err = mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal(err)
		return err
	}
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
		return err
	}

	dbName = databaseName
	return nil
}

func GetCollection(collectionName string) *mongo.Collection {
	return client.Database(dbName).Collection(collectionName)
}

func isValidName(hostName string) bool {
	valid := regexp.MustCompile(`^\b[A-Za-z0-9 -._]*[A-Za-z0-9]$`)

	return valid.MatchString(hostName)
}

func isValidOwner(ownerName string) bool {
	for _, char := range ownerName {
		if !unicode.IsLetter(char) && char != ' ' && char != '-' {
			return false
		}
	}
	return true
}

func isValidType(assetTypes []string) bool {
	for _, t := range assetTypes {
		for _, char := range t {
			if !unicode.IsLetter(char) && char != '-' && char != ' ' {
				return false
			}
		}
	}
	return true
}

func AddScan(db DatabaseHelper, c *gin.Context) {
	var newScan jsonhandler.BackState

	if err := c.ShouldBindJSON(&newScan); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newScan.MostRecentUpdate = time.Now()

	var st = sonyflake.Settings{
		StartTime: time.Date(2023, 6, 1, 7, 15, 20, 0, time.UTC),
	}

	flake, err := sonyflake.New(st)

	if err != nil {
		log.Fatalf("Failed to create sonyflake generator: %v", err)
	}
	if flake == nil {
		log.Fatalf("sonyflake.New unexpectedly returned nil with settings: %+v", st)
	}

	updatedAssets := make(map[string]jsonhandler.Asset)
	for _, asset := range newScan.Assets {
		id, err := flake.NextID()
		if err != nil {
			log.Fatalf("Failed to generate Sonyflake ID: %v", err)
		}

		assetID := fmt.Sprintf("%x", id) // Generate a new ID
		updatedAssets[assetID] = asset   // Use the new ID as the key
	}
	newScan.Assets = updatedAssets

	// Update relations with new IDs
	updatedRelations := make(map[string]jsonhandler.Relation)
	for _, relation := range newScan.Relations {
		id, err := flake.NextID()
		if err != nil {
			log.Fatalf("Failed to generate Sonyflake ID for relation: %v", err)
		}

		relationID := fmt.Sprintf("%x", id)     // Generate a new ID for the relation
		updatedRelations[relationID] = relation // Use the new ID as the key
	}

	newScan.Relations = updatedRelations
	result, err := db.InsertOne(context.TODO(), newScan)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while inserting new scan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Scan added successfully", "result": result})
}

func GetLatestState(db DatabaseHelper, c *gin.Context) {
	var scan jsonhandler.BackState

	// Find the latest scan based on the mostRecentUpdate field
	// Sorting by -1 to ensure the latest document is returned first mostRecentUpdate
	err := db.FindOne(context.TODO(), bson.D{}, options.FindOne().SetSort(bson.D{{Key: "mostRecentUpdate", Value: -1}})).Decode(&scan)
	if err != nil {
		log.Printf("Failed to retrieve the latest scan: %v\n", err)
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "No scans found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while retrieving the latest scan"})
		}
		return
	}

	c.JSON(http.StatusOK, scan)
}

// Save the change to the timelineDB collection
func saveChange(changeType string, changes Timeline, timelineDB DatabaseHelper) error {
	change := Change{
		Type:          changeType,
		Timestamp:     time.Now(),
		ChangeDetails: changes,
	}
	// timelineDB := &MongoDBHelper{Collection: GetCollection("timelineDB")}
	_, err := timelineDB.InsertOne(context.TODO(), change)
	if err != nil {
		log.Printf("Failed to save changings for timeline: %v", err)
		return err
	}

	return nil
}

func ManageAssetsAndRelations(db DatabaseHelper, timelineDB DatabaseHelper, c *gin.Context) {
	var req AssetRequest
	var messages []string
	var errors []string
	var changes Timeline
	var changesAddedAssets map[string]jsonhandler.Asset
	var changesUpdatedAssets map[string]jsonhandler.Asset
	var changesRemovedAssets map[string]jsonhandler.Asset
	var changesRemovedRelations1 map[string]jsonhandler.Relation
	var changesRemovedRelations2 map[string]jsonhandler.Relation
	var changesAddedRelations map[string]jsonhandler.Relation
	// Bind JSON to the req struct
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Error binding request data: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}
	// Find the latest scan to update
	latestScan, err := GetLatestScan(db)
	if err != nil {
		log.Printf("Error retrieving the latest scan: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// Check if there are no assets nad relations in the latest scan
	// if latestScan.Assets == nil && latestScan.Relations == nil {
	// 	c.JSON(http.StatusOK, gin.H{"message": "No assets or relations found in the latest scan"})
	// 	return
	// }
	// Check if there are no operation in the request
	if len(req.AddAsset) == 0 && len(req.UpdatedAsset) == 0 && len(req.RemoveAsset) == 0 && len(req.AddRelations) == 0 && len(req.RemoveRelations) == 0 {
		log.Printf("The request does not contain any operations to perform.\n")
		c.JSON(http.StatusOK, gin.H{"message": "The request does not contain any operations to perform"})
		return
	}
	// Call the respective functions for each operation
	messages, errors, changesRemovedAssets, changesRemovedRelations1 = removeAssets(req, latestScan, db, messages, errors)
	messages, errors, changesRemovedRelations2 = removeRelations(req, latestScan, db, messages, errors)
	messages, errors, changesAddedAssets = addAssets(req, latestScan, db, messages, errors)
	messages, errors, changesUpdatedAssets = updateAssets(req, latestScan, db, messages, errors)
	messages, errors, changesAddedRelations = addRelations(req, latestScan, db, messages, errors)
	// Combine all the changes
	for relationID, relation := range changesRemovedRelations1 {
		changesRemovedRelations2[relationID] = relation
	}
	// Combine all the changes
	changes = Timeline{
		AddAsset:        changesAddedAssets,
		RemoveAsset:     changesRemovedAssets,
		UpdatedAsset:    changesUpdatedAssets,
		AddRelations:    changesAddedRelations,
		RemoveRelations: changesRemovedRelations2,
	}
	// Only save the changes if the request contains operations
	if len(changes.AddAsset) > 0 || len(changes.RemoveAsset) > 0 || len(changes.UpdatedAsset) > 0 || len(changes.AddRelations) > 0 || len(changes.RemoveRelations) > 0 {
		saveChange("Asset and Relation manually changed", changes, timelineDB)
	}
	// Send the response as a list of messages
	if len(messages) > 0 {
		log.Printf("Messages: %v\n, Errors: %v\n", messages, errors)
		c.JSON(http.StatusOK, gin.H{"messages": messages, "errors": errors})
	} else {
		log.Printf("Messages: %v\n, Errors: %v\n", messages, errors)
		c.JSON(http.StatusInternalServerError, gin.H{"messages": messages, "errors": errors})
	}
}

// GetLatestScan retrieves the latest scan from the database and returns it along with any error that occurs.

func GetLatestScan(db DatabaseHelper) (jsonhandler.BackState, error) {
	var latestScan jsonhandler.BackState
	if err := db.FindOne(context.TODO(), bson.D{}, options.FindOne().SetSort(bson.D{{Key: "mostRecentUpdate", Value: -1}})).Decode(&latestScan); err != nil {
		log.Printf("Failed to retrieve the latest scan: %v\n", err)
		return latestScan, fmt.Errorf("error while retrieving the latest scan: %v", err)
	}
	return latestScan, nil
}

// addAssets adds new assets to the latest scan
func addAssets(req AssetRequest, latestScan jsonhandler.BackState, db DatabaseHelper, messages, errors []string) ([]string, []string, map[string]jsonhandler.Asset) {
	changes := make(map[string]jsonhandler.Asset)
	if len(req.AddAsset) > 0 {
		// Loop through the new assets and add them to the latest scan
		for _, newAsset := range req.AddAsset {
			if !(isValidName(newAsset.Name) && isValidOwner(newAsset.Owner) && isValidType(newAsset.Type)) {
				log.Printf("Error user input contains illegal charachters!")
				errors = append(errors, "Failed to add new assets: User input contains illegal characters!")
				return messages, errors, changes
			}
			nextU, err := flake.NextID()
			if err != nil {
				log.Printf("Error generating UID: %v\n", err)
				errors = append(errors, "Failed to add new assets: "+err.Error())
				return messages, errors, changes
			}
			next := strconv.FormatUint(nextU, 10)
			newAssetID := next
			newAsset.DateCreated = time.Now().Format("2006-01-02 15:04:05")
			newAsset.DateUpdated = newAsset.DateCreated
			latestScan.Assets[newAssetID] = newAsset
			changes[newAssetID] = newAsset
		}

		// Update the latest scan with the new assets
		update := bson.M{"$set": bson.M{"assets": latestScan.Assets}}
		_, err := db.UpdateOne(context.TODO(), bson.M{"_id": latestScan.ID}, update)
		if err != nil {
			log.Printf("Failed to add new assets: %v\n", err)
			errors = append(errors, "Failed to add new assets: "+err.Error())
		} else {
			log.Printf("Asset added successfully to the latest scan.\n")
			messages = append(messages, "Asset added successfully to the latest scan")
		}
	}
	return messages, errors, changes
}

func AddPluginData(pluginState jsonhandler.PluginState, plugin jsonhandler.Plugin) {
	fmt.Println("##############Adding plugin data##############")
	// Find the latest scan to update
	db := &MongoDBHelper{Collection: GetCollection("scans")}
	latestScan, err := GetLatestScan(db)
	if err != nil {
		// Log and return error if it's not ErrNoDocuments
		log.Printf("Failed to retrieve the latest scan: %v\n", err)
		return
	}

	// Check if the plugin state already exists in the latest scan
	_, exists := latestScan.PluginStates[pluginState.StateID]
	if exists {
		// Update the existing plugin state
		pluginState.DateUpdated = pluginState.DateCreated
		latestScan.PluginStates[pluginState.StateID] = pluginState
	} else {
		// Add the new plugin state
		pluginState.DateCreated = time.Now().Format("2006-01-02 15:04:05")
		pluginState.DateUpdated = pluginState.DateCreated
		latestScan.PluginStates[pluginState.StateID] = pluginState
	}

	// Add the new plugin
	latestScan.Plugins[pluginState.StateID] = plugin

	// Update the latest scan with the new/updated plugin data
	update := bson.M{"$set": bson.M{"pluginStates": latestScan.PluginStates, "plugins": latestScan.Plugins}}
	_, err = db.UpdateOne(context.TODO(), bson.M{"_id": latestScan.ID}, update)
	if err != nil {
		log.Printf("Failed to add/update plugin data: %v\n", err)
	} else {
		log.Printf("Plugin data added/updated successfully to the latest scan.\n")
	}
}

// addAssets adds form network scan
func AddAssets(req AssetRequest, assetIDS []string) string {
	// Find the latest scan to update
	firstScan := false
	db := &MongoDBHelper{Collection: GetCollection("scans")}
	var latestScan jsonhandler.BackState
	latestScan, _ = GetLatestScan(db)
	if latestScan.Assets == nil {
		firstScan = true
		//No assets in previous scan, need to initialize latestScan
		latestScan.Assets = make(map[string]jsonhandler.Asset)
		latestScan.Relations = make(map[string]jsonhandler.Relation)
		latestScan.PluginStates = make(map[string]jsonhandler.PluginState)
		latestScan.Plugins = make(map[string]jsonhandler.Plugin)
	}

	//if err != nil && err.Error() != mongo.ErrNoDocuments.Error() {
	//	// Log and return error if it's not ErrNoDocuments
	//	log.Printf("Failed to retrieve the latest scan: %v\n", err)
	//	return "Failed to retrieve the latest scan: " + err.Error()
	//}

	var newAssetIDS []string
	// Check if there are new assets to add
	if len(req.AddAsset) > 0 {
		var newAssets []jsonhandler.Asset
		for i, newAsset := range req.AddAsset {
			// Check if an asset with the same name already exists
			exists := false
			for _, existingAsset := range latestScan.Assets {
				if existingAsset.Hostname == newAsset.Hostname {
					exists = true
					log.Printf("Asset with hostname %s already exists in the latest scan.\n", newAsset.Hostname)
					break
				}
			}
			if !exists {
				newAssets = append(newAssets, newAsset)
				newAssetIDS = append(newAssetIDS, assetIDS[i])
			}
		}

		if len(newAssets) > 0 {
			for i, newAsset := range newAssets {
				// newAssetID := primitive.NewObjectID().Hex()
				newAsset.DateCreated = time.Now().Format("2006-01-02 15:04:05")
				newAsset.DateUpdated = newAsset.DateCreated

				latestScan.Assets[newAssetIDS[i]] = newAsset
			}

			// Update the latest scan with the new assets

			update := bson.M{"$set": bson.M{"assets": latestScan.Assets}}
			var err error
			if firstScan {
				_, err = db.InsertOne(context.TODO(), latestScan)
			} else {
				_, err = db.UpdateOne(context.TODO(), bson.M{"_id": latestScan.ID}, update)
			}
			if err != nil {
				log.Printf("Failed to add new assets: %v\n", err)
				return "Failed to add new assets: " + err.Error()
			} else {
				log.Printf("New assets added successfully to the latest scan.\n")
				return "New assets added successfully to the latest scan"
			}
		} else {
			log.Printf("No new assets to add, all assets already exist.\n")
			return "No new assets to add, all assets already exist"
		}
	}

	return "No new assets to add"
}

// AddRelations adds relations from network scan
func AddRelations(req AssetRequest, relationIDS []string) string {
	// Find the latest scan to update
	db := &MongoDBHelper{Collection: GetCollection("scans")}
	latestScan, err := GetLatestScan(db)
	if err != nil {
		// Log and return error if it's not ErrNoDocuments
		log.Printf("Failed to retrieve the latest scan: %v\n", err)
		return "Failed to retrieve the latest scan: " + err.Error()
	}
	var newRelationIDS []string
	// Check if there are new assets to add
	if len(req.AddRelations) > 0 {
		var newRelations []jsonhandler.Relation
		for i, newRelation := range req.AddRelations {
			// Check if the relation already exists
			exists := false
			for _, existingRelation := range latestScan.Relations {
				if existingRelation.From == newRelation.From && existingRelation.To == newRelation.To {
					exists = true
					log.Printf("Relation from %s to %s already exists in the latest scan.\n", newRelation.From, newRelation.To)
					break
				}
			}
			if !exists {
				newRelations = append(newRelations, newRelation)
				newRelationIDS = append(newRelationIDS, relationIDS[i])
			}
		}
		if len(newRelations) > 0 {
			for i, newRelation := range newRelations {
				// newAssetID := primitive.NewObjectID().Hex()
				newRelation.DateCreated = time.Now().Format("2006-01-02 15:04:05")
				latestScan.Relations[newRelationIDS[i]] = newRelation
			}

			// Update the latest scan with the new assets
			update := bson.M{"$set": bson.M{"relations": latestScan.Relations}}
			_, err := db.UpdateOne(context.TODO(), bson.M{"_id": latestScan.ID}, update)
			if err != nil {
				log.Printf("Failed to add new relations: %v\n", err)
				return "Failed to add new relations: " + err.Error()
			} else {
				log.Printf("New relations added successfully to the latest scan.\n")
				return "New relations added successfully to the latest scan"
			}
		} else {
			log.Printf("No new relations to add, all relations already exist.\n")
			return "No new relations to add, all relations already exist"
		}
	}

	return "No new relations to add"
}

// updateAssets updates existing assets in the latest scan
func updateAssets(req AssetRequest, latestScan jsonhandler.BackState, db DatabaseHelper, messages, errors []string) ([]string, []string, map[string]jsonhandler.Asset) {
	changes := make(map[string]jsonhandler.Asset)
	if len(req.UpdatedAsset) > 0 {
		// Loop through the updated assets and update them in the latest scan
		for assetID, updatedAsset := range req.UpdatedAsset {
			if assetID == "" {
				log.Printf("Asset ID is empty.\n")
				messages = append(messages, "Asset ID is empty")
				continue
			}
			if existingAsset, exists := latestScan.Assets[assetID]; exists {
				updatedAsset.DateUpdated = time.Now().Format("2006-01-02 15:04:05")
				updatedAsset.DateCreated = existingAsset.DateCreated
				latestScan.Assets[assetID] = updatedAsset
				changes[assetID] = updatedAsset
			} else if !exists {
				log.Printf("Asset with ID %s not found.\n", assetID)
				messages = append(messages, "Asset not found")
			}
		}
		// Update the latest scan with the updated assets
		update := bson.M{"$set": bson.M{"assets": latestScan.Assets}}
		_, err := db.UpdateOne(context.TODO(), bson.M{"_id": latestScan.ID}, update)
		if err != nil {
			log.Printf("Failed to update assets: %v\n", err)
			errors = append(errors, "Failed to update assets: "+err.Error())
		} else {
			log.Printf("Asset updated successfully in the latest scan.\n")
			messages = append(messages, "Asset updated successfully in the latest scan")
		}
	}
	return messages, errors, changes
}

// Removing assets and their related relations
func removeAssets(req AssetRequest, latestScan jsonhandler.BackState, db DatabaseHelper, messages, errors []string) ([]string, []string, map[string]jsonhandler.Asset, map[string]jsonhandler.Relation) {
	changes := make(map[string]jsonhandler.Asset)
	changes2 := make(map[string]jsonhandler.Relation)
	if len(req.RemoveAsset) > 0 && req.RemoveAsset != nil {
		// Loop through the assets to remove and delete them from the latest scan
		for _, assetID := range req.RemoveAsset {
			if assetID == "" {
				log.Printf("Asset ID is empty.\n")
				messages = append(messages, "Asset ID is empty")
				continue
			}
			if asset, exists := latestScan.Assets[assetID]; exists {
				delete(latestScan.Assets, assetID)
				changes[assetID] = asset
			} else if !exists {
				log.Printf("Cannot remove asset, asset with ID %s not found.\n", assetID)
				messages = append(messages, "Cannot remove asset, Asset not found")
			}
			// Loop through the relations to remove and delete them from the latest scan
			for relationID, relation := range latestScan.Relations {
				if relation.From == assetID || relation.To == assetID {
					delete(latestScan.Relations, relationID)
					changes2[relationID] = relation
				}

			}
		}
		// Update the latest scan with the removed assets and relations
		update := bson.M{"$set": bson.M{"assets": latestScan.Assets, "relations": latestScan.Relations}}
		_, err := db.UpdateOne(context.TODO(), bson.M{"_id": latestScan.ID}, update)
		if err != nil {
			log.Printf("Failed to remove assets and related relations: %v\n", err)
			errors = append(errors, "Failed to remove assets and related relations: "+err.Error())
		} else {
			log.Printf("Asset and related relations removed successfully from the latest scan.\n")
			messages = append(messages, "Asset and related relations removed successfully from the latest scan")
		}
	}
	return messages, errors, changes, changes2
}

// Adding new relations
func addRelations(req AssetRequest, latestScan jsonhandler.BackState, db DatabaseHelper, messages, errors []string) ([]string, []string, map[string]jsonhandler.Relation) {
	changes := make(map[string]jsonhandler.Relation)
	if len(req.AddRelations) > 0 {
		// Create a map to track existing relations and avoid duplicates
		existingRelations := make(map[string]bool)
		for _, relation := range latestScan.Relations {
			key := fmt.Sprintf("%s-%s", relation.From, relation.To)
			existingRelations[key] = true
		}

		var anyNewRelationsAdded bool
		for _, newRelation := range req.AddRelations {
			key := fmt.Sprintf("%s-%s", newRelation.From, newRelation.To)
			// Check if the assets in the relation exist in latestScan.Assets
			if _, fromAssetExists := latestScan.Assets[newRelation.From]; !fromAssetExists {
				log.Printf("Failed to add relation, Asset with ID %s (from relation) not found in the latest scan.\n", newRelation.From)
				messages = append(messages, fmt.Sprintf("Failed to add relation, Asset with ID %s (from relation) not found in the latest scan", newRelation.From))
				continue
			}
			if _, toAssetExists := latestScan.Assets[newRelation.To]; !toAssetExists {
				log.Printf("Failed to add relation, Asset with ID %s (to relation) not found in the latest scan.\n", newRelation.To)
				messages = append(messages, fmt.Sprintf("Failed to add relation, Asset with ID %s (to relation) not found in the latest scan", newRelation.To))
				continue
			}
			// Check if the new relation already exists
			if !existingRelations[key] {
				nextU, err := flake.NextID()
				if err != nil {
					log.Printf("Error generating UID: %v\n", err)
					errors = append(errors, "Failed to add new assets: "+err.Error())
					return messages, errors, changes
				}
				next := strconv.FormatUint(nextU, 10)
				newRelationID := next
				newRelation.DateCreated = time.Now().Format("2006-01-02 15:04:05")
				latestScan.Relations[newRelationID] = newRelation
				existingRelations[key] = true // Update existingRelations to include this new relation
				anyNewRelationsAdded = true
				changes[newRelationID] = newRelation
			} else {
				log.Printf("No new relations were added as they already exist.\n")
				messages = append(messages, "No new relations were added as they already exist")
			}
		}

		// After processing all new relations, update the scan if any new relations were added
		if anyNewRelationsAdded {
			update := bson.M{"$set": bson.M{"relations": latestScan.Relations}}
			if _, err := db.UpdateOne(context.TODO(), bson.M{"_id": latestScan.ID}, update); err != nil {
				log.Printf("Failed to add new relations: %v\n", err)
				errors = append(errors, "Failed to add new relations: "+err.Error())
			} else {
				log.Printf("New relations added successfully to the latest scan.\n")
				messages = append(messages, "New relations added successfully to the latest scan")
			}
		}
	}
	return messages, errors, changes
}

// removeRelations removes specified relations from the latest scan
func removeRelations(req AssetRequest, latestScan jsonhandler.BackState, db DatabaseHelper, messages, errors []string) ([]string, []string, map[string]jsonhandler.Relation) {
	changes := make(map[string]jsonhandler.Relation)
	if len(req.RemoveRelations) > 0 {
		// Loop through the relations to remove and delete them from the latest scan
		var removedRelations []string
		for _, relationID := range req.RemoveRelations {
			if relationID == "" {
				log.Printf("Relation ID is empty.\n")
				messages = append(messages, "Asset ID is empty")
				continue
			}
			if relation, exists := latestScan.Relations[relationID]; exists {
				delete(latestScan.Relations, relationID)
				removedRelations = append(removedRelations, relationID)
				changes[relationID] = relation
			} else {
				log.Printf("Failed to remove relation, Relation with ID %s not found in the latest scan.\n", relationID)
				messages = append(messages, "Failed to remove relation, Relation not found in the latest scan")
			}
		}
		// Update the latest scan with the removed relations
		if len(removedRelations) > 0 {
			update := bson.M{"$set": bson.M{"relations": latestScan.Relations}}
			_, err := db.UpdateOne(context.TODO(), bson.M{"_id": latestScan.ID}, update)
			if err != nil {
				log.Printf("Failed to remove relations: %v\n", err)
				errors = append(errors, "Failed to remove relation: "+err.Error())
			} else {
				log.Printf("Relations removed successfully from the latest scan.\n")
				messages = append(messages, "Relations removed successfully from the latest scan")
			}
		}
	}
	return messages, errors, changes
}

func PrintAllDocuments(db DatabaseHelper, c *gin.Context) {
	results, err := db.Find(context.TODO(), bson.D{})
	if err != nil {
		log.Printf("Failed to find documents:%v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching documents"})
		return
	}

	c.IndentedJSON(http.StatusOK, results)
}

func DeleteAllDocuments(db DatabaseHelper, c *gin.Context) {
	deleteResult, err := db.DeleteMany(context.TODO(), bson.D{})
	if err != nil {
		log.Printf("Failed to delete documents:%v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting documents"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Documents deleted", "count": deleteResult.DeletedCount})
}

func GetTimelineData(db DatabaseHelper, c *gin.Context) {
	ctx := context.TODO()
	assetID := c.Query("assetID")
	log.Printf("Retrieved assetID:%v\n", assetID)

	var filter bson.M
	if assetID != "" {
		// If assetID provided, filter for it
		filter = bson.M{
			"$or": []bson.M{
				{"changeDetails.updatedasset." + assetID: bson.M{"$exists": true}},
				{"changeDetails.addasset." + assetID: bson.M{"$exists": true}},
				{"changeDetails.removeasset." + assetID: bson.M{"$exists": true}},
				{"changeDetails.addrelations." + assetID: bson.M{"$exists": true}},
				{"changeDetails.removerelations." + assetID: bson.M{"$exists": true}},
				// Wildcard not working, RelationID required?
				// {"changeDetails.addrelations.*.from": assetID},
				// {"changeDetails.addrelations.*.to": assetID},
				// {"changeDetails.removerelations.*.from": assetID},
				// {"changeDetails.removerelations.*.to": assetID},
			},
		}
	} else {
		// If no assetID is provided, retrieve all records
		filter = bson.M{}
	}

	results, err := db.Find(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve data"})
		return
	}

	// Sort results by time
	// Timestamp stored as primitive.DateTime
	sort.Slice(results, func(i, j int) bool {
		dt1 := results[i]["timestamp"].(primitive.DateTime)
		dt2 := results[j]["timestamp"].(primitive.DateTime)
		return dt1 > dt2
	})

	// Limit to 10 most recent entries
	if len(results) > 10 {
		results = results[:10]
	}

	c.JSON(http.StatusOK, results)
}
