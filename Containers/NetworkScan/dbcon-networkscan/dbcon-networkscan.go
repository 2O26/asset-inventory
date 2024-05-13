package dbcon_networkscan

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/netip"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AuthResponse struct {
	Authenticated   bool     `json:"authenticated"`
	Roles           []string `json:"roles"`
	IsAdmin         bool     `json:"isAdmin"`
	CanManageAssets bool     `json:"canManageAssets"`
}

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

func AuthorizeUser(c *gin.Context, url ...string) AuthResponse {
	var authURL string
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
	if len(url) > 0 {
		authURL = url[0]
	} else {
		// Perform authentication
		authURL = "http://authhandler:3003/getRoles"
	}
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

func AddScan(db DatabaseHelper, scan Scan) (Scan, error) {
	var previousScan Scan
	err := db.FindOne(context.TODO(), bson.D{}, options.FindOne().SetSort(bson.D{{Key: "dateupdated", Value: -1}})).Decode(&previousScan)
	if errors.Is(err, mongo.ErrNoDocuments) {
		scan.DateUpdated = time.Now().Format(time.RFC3339)
		result, err := db.InsertOne(context.TODO(), scan)
		if err != nil {
			log.Printf("Could not insert scan: %s", err)
			return Scan{}, fmt.Errorf("could not insert scan: %v", err)
		}
		log.Printf("OK!, %v", result)
		return scan, nil
	} else if err != nil {
		log.Printf("Failed to retrieve the latest scan: %v", err)
		return Scan{}, fmt.Errorf("failed to retrieve the latest scan: %v", err)
	}

	updatedScan := compareScanStates(scan, previousScan)
	updatedScan.DateUpdated = time.Now().Format(time.RFC3339)
	result, err := db.InsertOne(context.TODO(), updatedScan)

	if err != nil {
		log.Printf("Could not insert scan: %s", err)
		return Scan{}, fmt.Errorf("could not insert scan: %v", err)
	}
	log.Printf("OK!, %v", result)

	return updatedScan, nil
}

func GetLatestScan(db DatabaseHelper, c *gin.Context, auth AuthResponse) {
	if !auth.Authenticated {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "User unauthorized", "success": false})
		return
	}

	var scan Scan
	// Find the latest scan based on the mostRecentUpdate field
	// Sorting by -1 to ensure the latest document is returned first mostRecentUpdate
	err := db.FindOne(context.TODO(), bson.D{}, options.FindOne().SetSort(bson.D{{Key: "dateupdated", Value: -1}})).Decode(&scan)
	if errors.Is(err, mongo.ErrNoDocuments) {
		log.Printf("Failed to retrieve the latest scan: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "No scans found"})
		return
	} else if err != nil {
		log.Printf("Failed to retrieve the latest scan: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while retrieving the latest scan"})
		return
	}
	if auth.IsAdmin {
		c.JSON(http.StatusOK, scan)
		return
	} else {

		updatedScan := Scan{
			StateID:     scan.StateID,
			DateCreated: scan.DateCreated,
			DateUpdated: scan.DateUpdated,
			State:       make(map[string]Asset),
		}

		for _, subnet := range auth.Roles {
			network, err := netip.ParsePrefix(subnet)
			if err != nil {
				continue //have found non-subnet role
			}
			for assetID, asset := range scan.State {
				assetIP, err := netip.ParseAddr(asset.IPv4Addr)
				if err != nil {
					panic(err)
				}
				if network.Contains(assetIP) {
					updatedScan.State[assetID] = asset
				}
			}
		}
		fmt.Println("UPDATED SCAN FOR USER:", updatedScan)
		c.JSON(http.StatusOK, updatedScan)
		return
	}

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
