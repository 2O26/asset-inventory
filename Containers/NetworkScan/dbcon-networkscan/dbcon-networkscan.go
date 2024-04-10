package dbcon_networkscan

import (
	"context"
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
	UID       string `bson:"uid" json:"uid"`
	Status    string `bson:"status" json:"status"`
	IPv4Addr  string `bson:"ipv4Addr" json:"ipv4Addr"`
	Subnet    string `bson:"subnet" json:"subnet"`
	OpenPorts []int  `bson:"openPorts" json:"openPorts"`
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

func compareScanStates(currentScan Scan, previousScan Scan) Scan {
	updatedScan := Scan{
		StateID:     currentScan.StateID,
		DateCreated: currentScan.DateCreated,
		DateUpdated: currentScan.DateUpdated,
		State:       make(map[string]Asset),
	}

	// Loop through assets in the previous scan
	for oldAssetID, prevAsset := range previousScan.State {
		found := false
		for _, asset := range currentScan.State {
			if prevAsset.IPv4Addr == asset.IPv4Addr {
				// IP address exists in the current scan, update the asset
				updatedScan.State[oldAssetID] = asset
				found = true
				break
			}
		}
		if !found {
			// IP address does not exist in the current scan, add the previous asset with status "down"
			prevAsset.Status = "down"
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

func AddScan(db DatabaseHelper, scan Scan) {
	var previousScan Scan
	err := db.FindOne(context.TODO(), bson.D{}, options.FindOne().SetSort(bson.D{{Key: "dateupdated", Value: -1}})).Decode(&previousScan)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Detta är den första skannen, infoga den direkt
			scan.DateUpdated = time.Now().Format("2006-01-02 15:04:05")
			result, err := db.InsertOne(context.TODO(), scan)
			if err != nil {
				log.Fatalf("Could not insert scan: %s", err)
			}
			log.Printf("OK!, %v", result)
			return
		}
		log.Printf("Failed to retrieve the latest scan: %v", err)
		return
	}

	updatedScan := compareScanStates(scan, previousScan)
	updatedScan.DateUpdated = time.Now().Format("2006-01-02 15:04:05")
	result, err := db.InsertOne(context.TODO(), updatedScan)

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

// func test() {
// 	scan1 := Scan{
// 		StateID:     "",
// 		DateCreated: "2024-04-03 17:28:24",
// 		DateUpdated: "2024-04-03 17:36:34",
// 		State: map[string]Asset{
// 			"3403275042825": {
// 				Status:    "down",
// 				IPv4Addr:  "192.168.39.1",
// 				Subnet:    "192.168.39.0/24",
// 				OpenPorts: []int{},
// 			},
// 			"3816296546313": {
// 				Status:    "down",
// 				IPv4Addr:  "192.168.39.125",
// 				Subnet:    "192.168.39.0/24",
// 				OpenPorts: []int{},
// 			},
// 			"3823024209929": {
// 				Status:    "down",
// 				IPv4Addr:  "192.168.39.128",
// 				Subnet:    "192.168.39.0/24",
// 				OpenPorts: []int{},
// 			},
// 			"3840002752521": {
// 				Status:    "up",
// 				IPv4Addr:  "192.168.39.134",
// 				Subnet:    "192.168.39.0/24",
// 				OpenPorts: []int{},
// 			},
// 			"3864480710665": {
// 				Status:    "up",
// 				IPv4Addr:  "192.168.39.142",
// 				Subnet:    "192.168.39.0/24",
// 				OpenPorts: []int{},
// 			},
// 			"3873372635145": {
// 				Status:    "up",
// 				IPv4Addr:  "192.168.39.145",
// 				Subnet:    "192.168.39.0/24",
// 				OpenPorts: []int{},
// 			},
// 			"3947225939977": {
// 				Status:    "up",
// 				IPv4Addr:  "192.168.39.168",
// 				Subnet:    "192.168.39.0/24",
// 				OpenPorts: []int{},
// 			},
// 			"3950581383177": {
// 				Status:    "up",
// 				IPv4Addr:  "192.168.39.170",
// 				Subnet:    "192.168.39.0/24",
// 				OpenPorts: []int{},
// 			},
// 			"3950698823689": {
// 				Status:    "up",
// 				IPv4Addr:  "192.168.39.171",
// 				Subnet:    "192.168.39.0/24",
// 				OpenPorts: []int{},
// 			},
// 			"4011650449417": {
// 				Status:    "up",
// 				IPv4Addr:  "192.168.39.190",
// 				Subnet:    "192.168.39.0/24",
// 				OpenPorts: []int{},
// 			},
// 			"4011784667145": {
// 				Status:    "up",
// 				IPv4Addr:  "192.168.39.191",
// 				Subnet:    "192.168.39.0/24",
// 				OpenPorts: []int{},
// 			},
// 		},
// 	}

// scan2 := Scan{
// 	StateID:     "",
// 	DateCreated: "2024-04-03 17:28:24",
// 	DateUpdated: "2024-04-03 19:36:34",
// 	State: map[string]Asset{
// 		"3403275042825": {
// 			Status:    "up",
// 			IPv4Addr:  "192.168.39.1",
// 			Subnet:    "192.168.39.0/24",
// 			OpenPorts: []int{},
// 		},
// 		"3816296546313": {
// 			Status:    "up",
// 			IPv4Addr:  "192.168.39.102",
// 			Subnet:    "192.168.39.0/24",
// 			OpenPorts: []int{},
// 		},
// 		"3823024209929": {
// 			Status:    "up",
// 			IPv4Addr:  "192.168.39.118",
// 			Subnet:    "192.168.39.0/24",
// 			OpenPorts: []int{},
// 		},
// 		"3816296526313": {
// 			Status:    "up",
// 			IPv4Addr:  "192.168.39.100",
// 			Subnet:    "192.168.39.0/24",
// 			OpenPorts: []int{},
// 		},
// 		"3823024209924": {
// 			Status:    "up",
// 			IPv4Addr:  "192.168.39.216",
// 			Subnet:    "192.168.39.0/24",
// 			OpenPorts: []int{},
// 		},
// 		"3823024201924": {
// 			Status:    "up",
// 			IPv4Addr:  "192.168.39.125",
// 			Subnet:    "192.168.39.0/24",
// 			OpenPorts: []int{},
// 		},
// 	},
// }
// 	db := &MongoDBHelper{Collection: GetCollection("scans")}
// 	AddScan(db, scan1)
// 	time.Sleep(2 * time.Second)
// 	AddScan(db, scan2)

// }

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
