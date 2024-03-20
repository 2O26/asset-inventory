package dbcon

import (
	"assetinventory/assethandler/jsonhandler"
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

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
		log.Printf("Failed to retrieve the latest scan: %v", err)
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}
	// Find the latest scan to update
	var latestScan jsonhandler.BackState
	if err := db.FindOne(context.TODO(), bson.D{}, options.FindOne().SetSort(bson.D{{Key: "mostRecentUpdate", Value: -1}})).Decode(&latestScan); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while retrieving the latest scan: " + err.Error()})
		return
	}
	// Check if there are no assets in the latest scan
	if latestScan.Assets == nil {
		c.JSON(http.StatusOK, gin.H{"message": "No assets found in the latest scan"})
		return
	}
	// Check if there are no relations in the latest scan
	if latestScan.Relations == nil {
		c.JSON(http.StatusOK, gin.H{"message": "No relation found in the latest scan"})
		return
	}
	// Check if there are no operation in the request
	if len(req.AddAsset) == 0 && len(req.UpdatedAsset) == 0 && len(req.RemoveAsset) == 0 && len(req.AddRelations) == 0 && len(req.RemoveRelations) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "The request does not contain any operations to perform"})
		return
	}

	// Adding new assets
	if len(req.AddAsset) > 0 {
		for _, newAsset := range req.AddAsset {
			newAssetID := primitive.NewObjectID().Hex() // Generate new ID
			newAsset.DateCreated = time.Now().Format("2006-01-02 15:04:05")
			newAsset.DateUpdated = newAsset.DateCreated
			latestScan.Assets[newAssetID] = newAsset
		}
		update := bson.M{"$set": bson.M{"assets": latestScan.Assets}}
		_, err := db.UpdateOne(context.TODO(), bson.M{"_id": latestScan.ID}, update)
		if err != nil {
			errors = append(errors, "Failed to add new assets: "+err.Error())
		}
		messages = append(messages, "Asset added successfully to the latest scan")
	}

	// Updating assets
	if len(req.UpdatedAsset) > 0 {
		for assetID, updatedAsset := range req.UpdatedAsset {
			if existingAsset, exists := latestScan.Assets[assetID]; exists {
				updatedAsset.DateUpdated = time.Now().Format("2006-01-02 15:04:05") // Optionally set/update DateUpdated here
				updatedAsset.DateCreated = existingAsset.DateCreated
				latestScan.Assets[assetID] = updatedAsset
			} else {
				errors = append(errors, "Asset not found")
			}
		}
		update := bson.M{"$set": bson.M{"assets": latestScan.Assets}}
		result, err := db.UpdateOne(context.TODO(), bson.M{"_id": latestScan.ID}, update)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update assets: " + err.Error()})
			return
		}
		if result.ModifiedCount == 0 {
			errors = append(errors, "No assets were updated")
		}
		messages = append(messages, "Asset updated successfully in the latest scan")
	}

	// Removing assets and their related relations
	if len(req.RemoveAsset) > 0 && req.RemoveAsset != nil {
		for _, assetID := range req.RemoveAsset {
			delete(latestScan.Assets, assetID)
			for relationID, relation := range latestScan.Relations {
				if relation.From == assetID || relation.To == assetID {
					delete(latestScan.Relations, relationID)
				}
			}
		}
		update := bson.M{"$set": bson.M{"assets": latestScan.Assets, "relations": latestScan.Relations}}
		_, err := db.UpdateOne(context.TODO(), bson.M{"_id": latestScan.ID}, update)
		if err != nil {
			errors = append(errors, "Failed to remove assets and related relations: "+err.Error())

		}
		messages = append(messages, "Asset and related relations removed successfully from the latest scan")
	}
	// Adding new relations
	if len(req.AddRelations) > 0 {
		// Create a map to track existing relations and avoid duplicates
		existingRelations := make(map[string]bool)
		for _, relation := range latestScan.Relations {
			key := fmt.Sprintf("%s-%s", relation.From, relation.To)
			existingRelations[key] = true
		}
		// Prepare a slice to hold any new relations that will be added
		var newRelations []jsonhandler.Relation
		for _, newRelation := range req.AddRelations {
			key := fmt.Sprintf("%s-%s", newRelation.From, newRelation.To)
			// Check if the assets involved in the new relation exist in latestScan.Assets
			// _, fromAssetExists := latestScan.Assets[newRelation.From]
			// _, toAssetExists := latestScan.Assets[newRelation.To]

			// Check if the new relation already exists
			if !existingRelations[key] {
				newRelationID := primitive.NewObjectID().Hex()
				newRelation.DateCreated = time.Now().Format("2006-01-02 15:04:05")
				latestScan.Relations[newRelationID] = newRelation
				newRelations = append(newRelations, newRelation)
			}
			// 	if !fromAssetExists || !toAssetExists {
			// 		errors = append(errors, "Failed to add new relation as one or both assets do not exist")
			// 	}
		}
		// After processing all new relations, check if any were actually added that are not duplicates and add them to the latest scan
		if len(newRelations) > 0 {
			update := bson.M{"$set": bson.M{"relations": latestScan.Relations}}
			if _, err := db.UpdateOne(context.TODO(), bson.M{"_id": latestScan.ID}, update); err != nil {
				errors = append(errors, "Failed to add new relations: "+err.Error())
			}
			// If the update is successful, return a success message
			messages = append(messages, "New relations added successfully to the latest scan")
		} else {
			// If no new relations were added (all were duplicates), return a message indicating so
			messages = append(messages, "No new relations were added as they already exist")
		}
	}

	// Removing specified relations
	if len(req.RemoveRelations) > 0 {
		for _, relationID := range req.RemoveRelations {
			delete(latestScan.Relations, relationID)
		}
		update := bson.M{"$set": bson.M{"relations": latestScan.Relations}}
		_, err := db.UpdateOne(context.TODO(), bson.M{"_id": latestScan.ID}, update)
		if err != nil {
			errors = append(errors, "Failed to remove relation: "+err.Error())
		}
		messages = append(messages, "Relations removed successfully from the latest scan")
	}
	// Send the response as a list of messages
	if len(messages) > 0 {
		c.JSON(http.StatusOK, gin.H{"messages": messages, "errors": errors})
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"messages": messages, "errors": errors})
	}
}

func PrintAllDocuments(db DatabaseHelper, c *gin.Context) {
	results, err := db.Find(context.TODO(), bson.D{})
	if err != nil {
		log.Println("Failed to find documents:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching documents"})
		return
	}

	c.JSON(http.StatusOK, results)
}

func DeleteAllDocuments(db DatabaseHelper, c *gin.Context) {
	deleteResult, err := db.DeleteMany(context.TODO(), bson.D{})
	if err != nil {
		log.Println("Failed to delete documents:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting documents"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Documents deleted", "count": deleteResult.DeletedCount})
}
