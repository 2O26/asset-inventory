package dbcon_networkscan

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Scan struct {
	StateID     string
	DateCreated string
	DateUpdated string
	State       map[string]Asset
}

type Asset struct {
	UID            string `bson:"uid" json:"uid"`
	Status         string `bson:"Status" json:"Status"`
	IPv4Addr       string `bson:"ipv4Addr" json:"IPv4 Address"`
	Subnet         string `bson:"subnet" json:"Subnet"`
	OpenPorts      []int  `bson:"openPorts" json:"Open Ports"`
	ScanType       string `bson:"scanType" json:"Scan Type"`
	LastDiscovered string `bson:"lastDiscovered" json:"Last Discovered at"`
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
	CmdSelection string   `json:"cmdSelection"`
	IPRanges     []string `json:"IPRanges"`
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

func compareScanStates(currentScan Scan, previousScan Scan) Scan {
	updatedScan := Scan{
		StateID:     currentScan.StateID,
		DateCreated: currentScan.DateCreated,
		DateUpdated: currentScan.DateUpdated,
		State:       make(map[string]Asset),
	}

	// Get the subnet of the current scan
	var currentSubnet string
	for _, asset := range currentScan.State {
		currentSubnet = asset.Subnet
		break
	}

	// Loop through assets in the previous scan
	for oldAssetID, prevAsset := range previousScan.State {
		found := false
		for assetID, asset := range currentScan.State {
			if prevAsset.IPv4Addr == asset.IPv4Addr {
				// IP address exists in the current scan, update the asset
				if asset.ScanType != "extensive" {
					// Preserve ports if simple scan
					asset.OpenPorts = prevAsset.OpenPorts
				}

				updatedScan.State[oldAssetID] = asset
				currentScan.State[assetID] = asset // Update the asset in currentScan's map as well
				found = true
				break
			}
		}
		if !found && prevAsset.Subnet == currentSubnet {
			// IP address does not exist in the current scan, add the previous asset with status "down"
			// Needs to be changed so that only assets on the same subnet get status down
			prevAsset.Status = "down"
			updatedScan.State[oldAssetID] = prevAsset
		} else if !found {
			// IP address is outside the scan's subnet, add the previous asset with same status as before
			updatedScan.State[oldAssetID] = prevAsset
		}
	}

	// Loop through assets in the current scan
	for assetID, asset := range currentScan.State {
		found := false
		for oldAssetID, prevAsset := range updatedScan.State {
			// Check if the IP address exists in the previous scan
			if prevAsset.IPv4Addr == asset.IPv4Addr {
				found = true
				// Status has changed, update the asset
				if prevAsset.Status != asset.Status {
					asset.Status = "up"
				}
				updatedScan.State[oldAssetID] = asset
				break
			}
		}
		if !found {
			// New IP address, add the asset
			updatedScan.State[assetID] = asset
		}
	}

	return updatedScan
}

func AddScan(db DatabaseHelper, scan Scan) error {
	var previousScan Scan
	err := db.FindOne(context.TODO(), bson.D{}, options.FindOne().SetSort(bson.D{{Key: "dateupdated", Value: -1}})).Decode(&previousScan)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Detta är den första skannen, infoga den direkt
			scan.DateUpdated = time.Now().Format(time.RFC3339)
			result, err := db.InsertOne(context.TODO(), scan)
			if err != nil {
				return fmt.Errorf("could not insert scan: %v", err)
			}
			log.Printf("OK!, %v", result)
			return nil
		}
		return fmt.Errorf("failed to retrieve the latest scan: %v", err)
	}

	updatedScan := compareScanStates(scan, previousScan)
	updatedScan.DateUpdated = time.Now().Format(time.RFC3339)
	result, err := db.InsertOne(context.TODO(), updatedScan)
	if err != nil {
		return fmt.Errorf("could not insert scan: %v", err)
	}
	log.Printf("OK!, %v", result)
	return nil
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

func DeleteAsset(db DatabaseHelper, assetIDs []string) error {
	//will delete asset by adding a new state without the asset in question

	var scan Scan
	err := db.FindOne(context.TODO(), bson.D{}, options.FindOne().SetSort(bson.D{{Key: "dateupdated", Value: -1}})).Decode(&scan)
	if err != nil {
		log.Printf("Failed to retrieve the latest scan: %v\n", err)
		if err == mongo.ErrNoDocuments {
			return fmt.Errorf("no scans found")
		} else {
			return fmt.Errorf("error while retrieving the latest scan")
		}
	}
	for ID := range scan.State {
		for _, assetID := range assetIDs {
			if ID == assetID {
				delete(scan.State, ID)
			}
		}
	}
	scan.DateUpdated = time.Now().Format(time.RFC3339)
	status, err := db.InsertOne(context.TODO(), scan)
	if err != nil {
		return fmt.Errorf("%w", err)
	} else {
		log.Println("Asset deleted successfully", status)
		return nil
	}
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
	// test()
}
