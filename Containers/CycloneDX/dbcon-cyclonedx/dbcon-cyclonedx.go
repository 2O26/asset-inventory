package dbcon_cyclonedx

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type CycloneDXDocument struct {
	ID       string `bson:"_id,omitempty"`
	SBOMData []byte `bson:"sbom_data"`
}

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

// SaveCycloneDX saves the CycloneDX file data to the database.
func SaveCycloneDX(db DatabaseHelper, sbomData []byte, assetID string) error {
	doc := CycloneDXDocument{
		ID:       assetID,
		SBOMData: sbomData,
	}

	_, err := db.InsertOne(context.Background(), doc)
	if err != nil {
		return fmt.Errorf("%w", err)
	}

	return nil
}

// GetCycloneDXFile retrieves the CycloneDX file for the specified asset ID from the database.
func GetCycloneDXFile(db DatabaseHelper, c *gin.Context) {
	// Fetch the assetID from the POST request
	var assetID string

	if id := c.Query("assetID"); id != "" { // Check if asset ID is provided as a query parameter
		assetID = id
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Asset ID is missing"})
		return
	}

	// Define a filter to find the document with the specified asset ID
	filter := bson.M{"_id": assetID}

	// Find the document in the database
	result := db.FindOne(context.Background(), filter)
	if err := result.Err(); err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{
				"error": fmt.Sprintf("CycloneDX file not found for asset ID: %s", assetID),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("failed to find CycloneDX file in database: %v", err),
		})
		return
	}

	// Extract the CycloneDX file data from the document
	var doc CycloneDXDocument
	if err := result.Decode(&doc); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("failed to decode CycloneDX file data: %v", err),
		})
		return
	}

	c.Data(http.StatusOK, "application/json", doc.SBOMData)
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
