package dbcon_networkscan

import (
	"context"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
	"net/http"
	"time"
)

type Scan struct {
	StateID     string
	DateCreated string
	DateUpdated string
	State       map[string]Asset
}

type Asset struct {
	Status        string
	IPv4Addr      string
	IPv6Addr      string
	Subnet        string
	Hostname      string
	KernelVersion string // Changed from OS to KernelVersion
	MACAddr       string // New field for MAC addresses
}

type Host struct {
	Status    Status     `xml:"status"`
	Address   []Address  `xml:"address"`
	Hostnames []Hostname `xml:"hostnames>hostname"`
	OS        OS         `xml:"os>osmatch"`
}

type Status struct {
	State string `xml:"state,attr"`
}

type Address struct {
	AddrType string `xml:"addrtype,attr"`
	Addr     string `xml:"addr,attr"`
}

type Nmaprun struct {
	Hosts []Host `xml:"host"`
}

type ScanRequest struct {
	CmdSelection string          `json:"cmdSelection"`
	IPRanges     map[string]bool `json:"IPRanges"`
}

type Hostname struct {
	Name string `xml:"name,attr"` // New field for hostname
}

type OS struct {
	Name string `xml:"name,attr"` // This struct might be better named as KernelVersion
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

func AddScan(db DatabaseHelper, scan Scan) {

	scan.DateUpdated = time.Now().Format("2006-01-02 15:04:05")

	result, err := db.InsertOne(context.TODO(), scan)

	if err != nil {
		log.Fatalf("Could not insert scan: %s", err)
	}

	log.Printf("OK!, %v", result)

}

func GetLatestScan(db DatabaseHelper, c *gin.Context) {
	var scan Scan

	// Find the latest scan based on the mostRecentUpdate field
	// Sorting by -1 to ensure the latest document is returned first mostRecentUpdate
	err := db.FindOne(context.TODO(), bson.D{}, options.FindOne().SetSort(bson.D{{Key: "dateupdated", Value: -1}})).Decode(&scan)
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
