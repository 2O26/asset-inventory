package dbcon

import (
	"context"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
	"net/http"
	"time"
)

var scanResultGlobal Scan

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

func AddScan(db DatabaseHelper, c *gin.Context) {
	var newScan Scan

	if err := c.ShouldBindJSON(&newScan); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newScan.DateUpdated = time.Now().Format("2006-01-02 15:04:05")

	result, err := db.InsertOne(context.TODO(), newScan)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while inserting new scan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Scan added successfully", "result": result})
}
