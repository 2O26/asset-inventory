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
type Asset struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name        string             `json:"name"`
	Owner       string             `json:"owner"`
	DateCreated string             `json:"dateCreated"`
	DateUpdated string             `json:"dateUpdated"`
	Criticality int                `json:"criticality"`
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
