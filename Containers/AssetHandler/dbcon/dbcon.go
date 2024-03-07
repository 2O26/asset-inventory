package dbcon

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Assuming these types are defined as per your provided structure
// type Asset struct {
// 	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
// 	Name        string             `json:"name"`
// 	Owner       string             `json:"owner"`
// 	DateCreated string             `json:"dateCreated"`
// 	DateUpdated string             `json:"dateUpdated"`
// 	Criticality int                `json:"criticality"`
// }

type Asset struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name        string             `json:"Name"`
	Owner       string             `json:"Owner"`
	Type        []string           `json:"Type"` // array with type -> subtype -> subsubtype, etc
	DateCreated string             `json:"Created at"`
	DateUpdated string             `json:"Updated at"`
	Criticality int                `json:"Criticality"`
	Hostname    string             `json:"Hostname"`
}

type Scan struct {
	ID               primitive.ObjectID     `bson:"_id,omitempty" json:"id,omitempty"`
	MostRecentUpdate time.Time              `bson:"mostRecentUpdate" json:"mostRecentUpdate"`
	Assets           map[string]Asset       `json:"assets"`
	Plugins          map[string]PluginState `json:"plugins"`
	Relations        map[string]Relation    `json:"relations"`
}

type Plugin struct {
	PluginStateID string `json:"pluginStateID"`
}

type PluginState struct {
	StateID     string         `json:"stateID"`
	DateCreated string         `json:"dateCreated"`
	DateUpdated string         `json:"dateUpdated"`
	State       map[string]any `json:"state"`
}

type Relation struct {
	From        string `json:"from"`
	To          string `json:"to"`
	Direction   string `json:"direction"`
	Owner       string `json:"owner"`
	DateCreated string `json:"dateCreated"`
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

func AddScan(db DatabaseHelper, c *gin.Context) {
	var newScan Scan

	if err := c.ShouldBindJSON(&newScan); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newScan.MostRecentUpdate = time.Now()

	result, err := db.InsertOne(context.TODO(), newScan)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while inserting new scan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Scan added successfully", "result": result})
}

func GetLatestScan(db DatabaseHelper, c *gin.Context) {
	var scan Scan

	// Find the latest scan based on the mostRecentUpdate field
	// Sorting by -1 to ensure the latest document is returned first
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

	c.JSON(http.StatusOK, gin.H{"latestScan": scan})
}

func AddAsset(db DatabaseHelper, c *gin.Context) {
	var newAsset Asset

	// Bind JSON to the newAsset struct
	if err := c.ShouldBindJSON(&newAsset); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}
	// Update the dateUpdated field to the current time
	currentTime := time.Now().Format("2006-01-02 15:04:05")
	newAsset.DateCreated = currentTime
	newAsset.DateUpdated = currentTime
	result, err := db.InsertOne(context.TODO(), newAsset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while inserting new Asset"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Asset added successfully", "result": result})

}

func UpdateAsset(db DatabaseHelper, c *gin.Context) {
	var updateAsset Asset

	// Bind JSON to the updateAsset struct
	if err := c.ShouldBindJSON(&updateAsset); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	filter := bson.M{"_id": updateAsset.ID}

	// Attempt to find the existing asset to ensure it exists before updating
	var existingAsset Asset
	err := db.FindOne(context.TODO(), filter).Decode(&existingAsset)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// If no existing asset is found, return an error
			c.JSON(http.StatusNotFound, gin.H{"error": "Asset does not exist"})
		} else {
			// If an error occurs during the find operation, return an internal server error
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error checking if asset exists"})
		}
		return
	}
	// Update the dateUpdated field to the current time
	currentTime := time.Now().Format("2006-01-02 15:04:05")
	updateAsset.DateUpdated = currentTime
	updateAsset.DateCreated = existingAsset.DateCreated
	// Proceed with the update if the asset exists
	update := bson.M{"$set": updateAsset}
	updateResult, updateErr := db.UpdateOne(context.TODO(), filter, update)
	if updateErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while updating existing asset"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Asset updated successfully", "result": updateResult})
}

func DeleteAsset(db DatabaseHelper, c *gin.Context) {
	var DeleteAsset Asset
	// Bind JSON to the assetData struct to get the name of the asset to delete
	if err := c.ShouldBindJSON(&DeleteAsset); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	filter := bson.M{"_id": DeleteAsset.ID}

	// Attempt to find the asset to ensure it exists before deleting
	var existingAsset Asset
	err := db.FindOne(context.TODO(), filter).Decode(&existingAsset)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// If no existing asset is found, return an error
			c.JSON(http.StatusNotFound, gin.H{"error": "Asset does not exist"})
		} else {
			// If an error occurs during the find operation, return an internal server error
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error checking if asset exists"})
		}
		return
	}

	// Proceed with the deletion if the asset exists
	deleteResult, deleteErr := db.DeleteOne(context.TODO(), filter)
	if deleteErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while deleting existing asset"})
		return
	}

	// Check if an asset was actually deleted
	if deleteResult.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No asset was deleted, asset may not exist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Asset deleted successfully"})
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
