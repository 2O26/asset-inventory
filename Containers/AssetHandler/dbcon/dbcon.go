package dbcon

import (
	"assetinventory/assethandler/jsonhandler"
	"context"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var client *mongo.Client
var dbName string

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

	updatedAssets := make(map[string]jsonhandler.Asset)
	for _, asset := range newScan.Assets {
		assetID := primitive.NewObjectID().Hex() // Generate a new ID
		updatedAssets[assetID] = asset           // Use the new ID as the key
	}
	newScan.Assets = updatedAssets

	// Update relations with new IDs
	updatedRelations := make(map[string]jsonhandler.Relation)
	for _, relation := range newScan.Relations {
		relationID := primitive.NewObjectID().Hex() // Generate a new ID
		updatedRelations[relationID] = relation     // Use the new ID as the key
	}
	newScan.Relations = updatedRelations
	result, err := db.InsertOne(context.TODO(), newScan)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while inserting new scan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Scan added successfully", "result": result})
}

func GetLatestScan(db DatabaseHelper, c *gin.Context) {
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

type AssetRequest struct {
	AddAsset        []jsonhandler.Asset          `json:"addAsset"`        // To add new assets
	RemoveAsset     []string                     `json:"removeAsset"`     // Asset IDs to remove
	UpdatedAsset    map[string]jsonhandler.Asset `json:"updateAsset"`     // Asset ID to updated Asset mapping
	AddRelations    []jsonhandler.Relation       `json:"addRelations"`    // Relations to add
	RemoveRelations []string                     `json:"removeRelations"` // Relation IDs to remove
}

func ManageAssetsAndRelations(db DatabaseHelper, c *gin.Context) {
	var req AssetRequest
	var messages []string
	var errors []string
	// Bind JSON to the req struct
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Error binding request data: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}
	// Find the latest scan to update
	latestScan, err := getLatestScan(db)
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
	messages, errors = removeAssets(req, latestScan, db, messages, errors)
	messages, errors = removeRelations(req, latestScan, db, messages, errors)
	messages, errors = addAssets(req, latestScan, db, messages, errors)
	messages, errors = updateAssets(req, latestScan, db, messages, errors)
	messages, errors = addRelations(req, latestScan, db, messages, errors)

	// Send the response as a list of messages
	if len(messages) > 0 {
		log.Printf("Messages: %v\n, Errors: %v\n", messages, errors)
		c.JSON(http.StatusOK, gin.H{"messages": messages, "errors": errors})
	} else {
		log.Printf("Messages: %v\n, Errors: %v\n", messages, errors)
		c.JSON(http.StatusInternalServerError, gin.H{"messages": messages, "errors": errors})
	}
}

// getLatestScan retrieves the latest scan from the database and returns it along with any error that occurs.

func getLatestScan(db DatabaseHelper) (jsonhandler.BackState, error) {
	var latestScan jsonhandler.BackState
	if err := db.FindOne(context.TODO(), bson.D{}, options.FindOne().SetSort(bson.D{{Key: "mostRecentUpdate", Value: -1}})).Decode(&latestScan); err != nil {
		log.Printf("Failed to retrieve the latest scan: %v\n", err)
		return latestScan, fmt.Errorf("error while retrieving the latest scan: %v", err)
	}
	return latestScan, nil
}

// addAssets adds new assets to the latest scan
func addAssets(req AssetRequest, latestScan jsonhandler.BackState, db DatabaseHelper, messages, errors []string) ([]string, []string) {
	if len(req.AddAsset) > 0 {
		// Loop through the new assets and add them to the latest scan
		for _, newAsset := range req.AddAsset {
			if !(isValidName(newAsset.Name) && isValidOwner(newAsset.Owner) && isValidType(newAsset.Type)) {
				log.Printf("Error user input contains illegal charachters!")
				errors = append(errors, "Failed to add new assets: User input contains illegal charachters!")
				return messages, errors
			}
			newAssetID := primitive.NewObjectID().Hex()
			newAsset.DateCreated = time.Now().Format("2006-01-02 15:04:05")
			newAsset.DateUpdated = newAsset.DateCreated
			latestScan.Assets[newAssetID] = newAsset
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
	return messages, errors
}
func AddPluginData(pluginState jsonhandler.PluginState, plugin jsonhandler.Plugin) {
	fmt.Println("##############Adding plugin data##############")
	// Find the latest scan to update
	db := &MongoDBHelper{Collection: GetCollection("scans")}
	latestScan, err := getLatestScan(db)
	if err != nil {
		// Log and return error if it's not ErrNoDocuments
		log.Printf("Failed to retrieve the latest scan: %v\n", err)
		return
	}

	// Check if the plugin state already exists in the latest scan
	existingPluginState, exists := latestScan.PluginStates[pluginState.StateID]
	if exists {
		// Update the existing plugin state
		existingPluginState.State = pluginState.State
		existingPluginState.DateUpdated = time.Now().Format("2006-01-02 15:04:05")
		latestScan.PluginStates[pluginState.StateID] = existingPluginState
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
func AddAssets(req AssetRequest) string {
	// Find the latest scan to update
	db := &MongoDBHelper{Collection: GetCollection("scans")}
	latestScan, err := getLatestScan(db)
	if err != nil {
		// Log and return error if it's not ErrNoDocuments
		log.Printf("Failed to retrieve the latest scan: %v\n", err)
		return "Failed to retrieve the latest scan: " + err.Error()
	}
	// Check if there are new assets to add
	if len(req.AddAsset) > 0 {
		fmt.Println("AddAsset: ", req.AddAsset)
		var newAssets []jsonhandler.Asset
		for _, newAsset := range req.AddAsset {
			// Check if an asset with the same hostname already exists
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
			}
		}
		if len(newAssets) > 0 {
			for _, newAsset := range newAssets {
				newAssetID := primitive.NewObjectID().Hex()
				newAsset.DateCreated = time.Now().Format("2006-01-02 15:04:05")
				newAsset.DateUpdated = newAsset.DateCreated
				latestScan.Assets[newAssetID] = newAsset
			}

			// Update the latest scan with the new assets
			update := bson.M{"$set": bson.M{"assets": latestScan.Assets}}
			_, err := db.UpdateOne(context.TODO(), bson.M{"_id": latestScan.ID}, update)
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

// updateAssets updates existing assets in the latest scan
func updateAssets(req AssetRequest, latestScan jsonhandler.BackState, db DatabaseHelper, messages, errors []string) ([]string, []string) {
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
	return messages, errors
}

// Removing assets and their related relations
func removeAssets(req AssetRequest, latestScan jsonhandler.BackState, db DatabaseHelper, messages, errors []string) ([]string, []string) {
	if len(req.RemoveAsset) > 0 && req.RemoveAsset != nil {
		// Loop through the assets to remove and delete them from the latest scan
		for _, assetID := range req.RemoveAsset {
			if assetID == "" {
				log.Printf("Asset ID is empty.\n")
				messages = append(messages, "Asset ID is empty")
				continue
			}
			if _, exists := latestScan.Assets[assetID]; exists {
				delete(latestScan.Assets, assetID)
			} else if !exists {
				log.Printf("Cannot remove asset, asset with ID %s not found.\n", assetID)
				messages = append(messages, "Cannot remove asset, Asset not found")
			}
			// Loop through the relations to remove and delete them from the latest scan
			for relationID, relation := range latestScan.Relations {
				if relation.From == assetID || relation.To == assetID {
					delete(latestScan.Relations, relationID)
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
	return messages, errors
}

// Adding new relations
func addRelations(req AssetRequest, latestScan jsonhandler.BackState, db DatabaseHelper, messages, errors []string) ([]string, []string) {
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
				newRelationID := primitive.NewObjectID().Hex()
				newRelation.DateCreated = time.Now().Format("2006-01-02 15:04:05")
				latestScan.Relations[newRelationID] = newRelation
				existingRelations[key] = true // Update existingRelations to include this new relation
				anyNewRelationsAdded = true
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
	return messages, errors
}

// removeRelations removes specified relations from the latest scan
func removeRelations(req AssetRequest, latestScan jsonhandler.BackState, db DatabaseHelper, messages, errors []string) ([]string, []string) {
	if len(req.RemoveRelations) > 0 {
		// Loop through the relations to remove and delete them from the latest scan
		var removedRelations []string
		for _, relationID := range req.RemoveRelations {
			if relationID == "" {
				log.Printf("Relation ID is empty.\n")
				messages = append(messages, "Asset ID is empty")
				continue
			}
			if _, exists := latestScan.Relations[relationID]; exists {
				delete(latestScan.Relations, relationID)
				removedRelations = append(removedRelations, relationID)
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
	return messages, errors
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
