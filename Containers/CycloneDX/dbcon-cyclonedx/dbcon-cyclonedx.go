package dbcon_cyclonedx

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type CycloneDXDocument struct {
	ID               string    `bson:"_id,omitempty"`
	SBOMData         []byte    `bson:"sbom_data"`
	MostRecentUpdate time.Time `json:"mostRecentUpdate"`
}

type AuthResponse struct {
	Authenticated   bool     `json:"authenticated"`
	Roles           []string `json:"roles"`
	IsAdmin         bool     `json:"isAdmin"`
	CanManageAssets bool     `json:"canManageAssets"`
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

func AuthorizeUser(c *gin.Context) AuthResponse {

	emptyAuth := AuthResponse{
		Authenticated:   false,
		Roles:           nil,
		IsAdmin:         false,
		CanManageAssets: false,
	}
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "User unauthorized", "success": false})
		return emptyAuth
	}

	// Perform authentication
	authURL := "http://authhandler:3003/getRoles"
	req, err := http.NewRequest("GET", authURL, nil)
	if err != nil {
		log.Printf("Failed to fetch authentication token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch authentication token"})
		return emptyAuth
	}
	req.Header.Add("Authorization", authHeader)
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Failed to connect to validation server: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to validation server"})
		return emptyAuth
	}

	defer resp.Body.Close()

	var auth AuthResponse
	fmt.Println("Response Status:", resp.StatusCode)
	err = json.NewDecoder(resp.Body).Decode(&auth)
	if err != nil {
		log.Printf("Failed to fetch authentication token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch authentication token"})
		return emptyAuth
	}

	return auth
}

func SaveCycloneDX(db DatabaseHelper, sbomData []byte, assetID string) error {
	doc := CycloneDXDocument{
		ID:               assetID,
		SBOMData:         sbomData,
		MostRecentUpdate: time.Now(),
	}

	filter := bson.M{"_id": assetID}

	// Check if the document exists
	existingDoc := CycloneDXDocument{}
	err := db.FindOne(context.Background(), filter).Decode(&existingDoc)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// If the document doesn't exist, insert a new one
			_, err = db.InsertOne(context.Background(), doc)
			if err != nil {
				return fmt.Errorf("%w", err)
			}
		} else {
			return fmt.Errorf("%w", err)
		}
	} else {
		// If the document exists, replace it with the new document
		_, err = db.ReplaceOne(context.Background(), filter, doc)
		if err != nil {
			return fmt.Errorf("%w", err)
		}
	}

	return nil
}

func RemoveCycloneDX(db DatabaseHelper, assetID string) error {
	filter := bson.M{"_id": assetID}
	result, err := db.DeleteOne(context.Background(), filter)
	if err != nil {
		return fmt.Errorf("%w", err)
	} else if result.DeletedCount == 0 {
		return fmt.Errorf("no files deleted")
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
