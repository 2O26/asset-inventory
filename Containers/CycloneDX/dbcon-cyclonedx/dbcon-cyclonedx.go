package dbcon_cyclonedx

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"
	"encoding/json"
	"os"
	"os/exec"
	"syscall"
	"strings"
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

type CVEEntry struct {
	ID          string    `bson:"_id,omitempty"`
	Vendor		string	  `bson:"vendor"`
	Product 	string    `bson:"product"`
	Version     string    `bson:"version"`
	Score		string    `bson:"score"`		
	CVEs        []string  `bson:"cves"`
	ReportDate  time.Time `bson:"reportDate"`
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

func ScanAndSaveCVEs(assetID string, sbomFilePath string) {
	outputFilePath := fmt.Sprintf("cve-results-%s.json", assetID)

    cmd := exec.Command("cve-bin-tool", "--sbom", "cyclonedx", "--sbom-file", "sbom.json", "-f", "json", "-o", "cve")
	startTime := time.Now()
	fmt.Printf("Running command: %s\n", strings.Join(cmd.Args, " "))

    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr

    err := cmd.Run()

	elapsedTime := time.Since(startTime)
	
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			if waitStatus, ok := exitErr.Sys().(syscall.WaitStatus); ok {
				// cve-binary-tool despite its succesfull execution, exits with status code 1
				// Considered sucessful for the time being
				if waitStatus.ExitStatus() == 1 {
					fmt.Println("Command exited with status 1, considered successful")
				} else {
					fmt.Printf("Command failed with exit code: %d\n", waitStatus.ExitStatus())
					os.Exit(waitStatus.ExitStatus())
				}
			}
		} else {
			fmt.Printf("Command failed to run: %s\n", err)
			os.Exit(1)
		}
	}

    //mt.Println(string(output))
    fmt.Printf("Command executed in %s\n", elapsedTime)

	// Read the scan results
	fileBytes, err := os.ReadFile(outputFilePath)
	if err != nil {
		log.Printf("Failed to read CVE scan results: %v", err)
		return
	}

	// Parse the JSON results
	var cveResults []string
	if err := json.Unmarshal(fileBytes, &cveResults); err != nil {
		log.Printf("Failed to parse CVE scan results: %v", err)
		return
	}

	cveEntry := CVEEntry{
		Vendor:     "exampleVendor",
		Product:    "exampleProduct",
		Version:    "1.0.0",
		Score:      "5.5",
		CVEs:       cveResults,
		ReportDate: time.Now(),
	}

	cveCollection := GetCollection("CVEs")
	_, err = cveCollection.InsertOne(context.Background(), cveEntry)
	if err != nil {
		log.Printf("Failed to save CVE data: %v", err)
	}
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
