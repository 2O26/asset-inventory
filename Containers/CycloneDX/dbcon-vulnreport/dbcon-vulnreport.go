package dbconVulnreport

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
	ID         string              `bson:"_id,omitempty"`
	SBOMData   []byte              `bson:"sbom_data"`
	VulnReport VulnerabilityReport `bson:"vuln_report"`
}

type VulnerabilityReport struct {
	Vulnerabilities map[string]VulnerabilityDetail `json:"vulnerabilities"`
}

// VulnerabilityDetail captures common fields across ecosystems, with some fields being more relevant to certain ecosystems.
type VulnerabilityDetail struct {
	Name         string      `json:"name"`
	Severity     string      `json:"severity"`
	IsDirect     bool        `json:"isDirect"`
	Via          []ViaDetail `json:"via"`
	Effects      []string    `json:"effects"`
	Range        string      `json:"range"`
	Nodes        []string    `json:"nodes"`
	FixAvailable bool        `json:"fixAvailable"`
	Ecosystem    string      `json:"ecosystem"` // Added to specify the package ecosystem (e.g., npm, maven, go)
}

// ViaDetail captures information about the path through which a vulnerability is introduced.
type ViaDetail struct {
	Name       string   `json:"name"`
	Dependency string   `json:"dependency"`
	Title      string   `json:"title"`
	URL        string   `json:"url"`
	Severity   string   `json:"severity"`
	CWE        []string `json:"cwe"`
	CVSS       CVSS     `json:"cvss"`
	Range      string   `json:"range"`
	Ecosystem  string   `json:"ecosystem"`            // Added to specify the package ecosystem
	GroupID    string   `json:"groupId,omitempty"`    // Specific to Maven
	ArtifactID string   `json:"artifactId,omitempty"` // Specific to Maven
	ModulePath string   `json:"modulePath,omitempty"` // Specific to Go modules
}

// CVSS captures the CVSS score details of the vulnerability.
type CVSS struct {
	Score        float64 `json:"score"`
	VectorString string  `json:"vectorString"`
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

func SaveReducedSBOM(db DatabaseHelper, sbomData []byte, assetID string) error {
	var vulnreport VulnerabilityReport = VulnerabilityReport{
		Vulnerabilities: make(map[string]VulnerabilityDetail), // Initializes the map so it's not nil
	}

	doc := CycloneDXDocument{
		ID:         assetID,
		SBOMData:   sbomData,
		VulnReport: vulnreport,
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
