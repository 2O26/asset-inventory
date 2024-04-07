package main

import (
	"assetinventory/assethandler/dbcon"
	"assetinventory/assethandler/jsonhandler"
	"context"
	"fmt"
	"time"

	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type StateResponse struct {
	Message string                 `json:"message"`
	State   jsonhandler.FrontState `json:"state"`
}
type networkResponse struct {
	StateID     string
	DateCreated string
	DateUpdated string
	State       map[string]networkAsset
}

type networkAsset struct {
	UID       string `bson:"uid" json:"uid"`
	Status    string `bson:"status" json:"status"`
	IPv4Addr  string `bson:"ipv4Addr" json:"ipv4Addr"`
	Subnet    string `bson:"subnet" json:"subnet"`
	OpenPorts []int  `bson:"openPorts" json:"openPorts"`
}

// type PluginState struct {
// 	StateID     string         `json:"stateID"`
// 	DateCreated string         `json:"dateCreated"`
// 	DateUpdated string         `json:"dateUpdated"`
// 	State       map[string]any `json:"state"`
// }

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func getNetScanStatus() json.RawMessage {
	url := "http://networkscan:8081/status"

	// GET request from netscan
	response, err := http.Get(url)

	if err != nil {
		log.Fatal(err)
	}

	defer response.Body.Close() // Ensure the body is closed after reading

	var netassets jsonhandler.PluginState
	// Read the response body
	json.NewDecoder(response.Body).Decode(&netassets) //puts the response into netassets
	if err != nil {
		log.Fatal(err)
	}

	netassetsJSON, _ := json.Marshal(netassets)
	log.Println("NetscanStatus Gave:", string(netassetsJSON))
	return netassetsJSON

}

func getLatestState(c *gin.Context) {
	// Add assets from network scan
	getNetworkScan()
	// Simulate authentication
	var authSuccess = true
	if authSuccess {
		url := "http://localhost:8080/GetLatestScan"
		resp, err := http.Get(url)

		if err != nil {
			log.Printf("Failed to get latest scan: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get latest scan"})
			return
		}
		defer resp.Body.Close()
		var scanResult jsonhandler.BackState
		// Läs in responskroppen
		err = json.NewDecoder(resp.Body).Decode(&scanResult)
		if err != nil {
			log.Printf("Failed to decode latest scan: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode latest scan data"})
			return
		}

		scanResultJSON, err := json.Marshal(scanResult)
		if err != nil {
			log.Printf("Failed to marshal scanResult: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare scan data"})
			return
		}
		pluginStates := make(map[string]json.RawMessage)
		netassets := getNetScanStatus()
		pluginStates["netscan"] = netassets
		var mockOSScan = json.RawMessage(`
		{
			"stateID": "20240417-1400B",
			"dateCreated": "2024-02-30 23:00:00",
			"dateUpdated": "2024-02-31 23:00:30",
			"state": {
				"AID_4123523": {
					"OS": "Windows XP"
				}
			}
		}`)

		pluginStates["osscan"] = mockOSScan

		currentStateJSON, err := jsonhandler.BackToFront(json.RawMessage(scanResultJSON), nil)
		if err != nil {
			log.Println(err)
		}

		var currentState jsonhandler.FrontState
		json.Unmarshal(currentStateJSON, &currentState)
		log.Println(string(currentStateJSON))
		response := StateResponse{Message: "Authentication success.", State: currentState}
		c.IndentedJSON(http.StatusOK, response)
	} else {
		response := StateResponse{Message: "Authenication failure."}
		c.IndentedJSON(http.StatusOK, response)
	}
}

func getNetworkScan() {
	fmt.Println("########Getting network scan##########")
	url := "http://networkscan:8081/getLatestScan"
	// GET request from netscan
	response, err := http.Get(url)

	if err != nil {
		log.Fatal(err)
	}

	defer response.Body.Close() // Ensure the body is closed after reading

	var netassets networkResponse
	// Read the response body
	json.NewDecoder(response.Body).Decode(&netassets) //puts the response into netassets
	if err != nil {
		log.Fatal(err)
	}
	addAsset := []jsonhandler.Asset{}
	// Iterate over the State map and print UID values'
	for _, stateEntry := range netassets.State {
		asset := jsonhandler.Asset{
			Name:        "",
			Owner:       "",
			Type:        []string{},
			Criticality: 0,
			Hostname:    stateEntry.IPv4Addr,
		}
		addAsset = append(addAsset, asset)
	}
	request := dbcon.AssetRequest{
		AddAsset: addAsset,
	}
	dbcon.AddAssets(request)
	fmt.Println("Added asset: ", request)
}

func addInitialScan(scansHelper dbcon.DatabaseHelper) {
	// Add initial scan
	initialScan := jsonhandler.BackState{
		ID:               primitive.NewObjectID(),
		MostRecentUpdate: time.Now(),
		Assets: map[string]jsonhandler.Asset{
			"65f8671cfe55e5c76465d840": {
				Name:        "PC-A",
				Owner:       "UID_2332",
				Type:        []string{"PC", "Windows"},
				DateCreated: "2024-02-14 23:00:00",
				DateUpdated: "2024-02-14 23:00:30",
				Criticality: 2,
				Hostname:    "Desktop-123",
			},
			"65f8671cfe55e5c76465d841": {
				Name:        "Chromecast",
				Owner:       "UID_2332",
				Type:        []string{"IoT", "Media"},
				DateCreated: "2024-02-10 20:04:20",
				DateUpdated: "2024-02-14 23:00:30",
				Criticality: 1,
				Hostname:    "LivingRoom",
			},
			"65f8671cfe55e5c76465d842": {
				Name:        "Password Vault",
				Owner:       "UID_2332",
				Type:        []string{"Server", "Database"},
				DateCreated: "2024-02-14 23:00:00",
				DateUpdated: "2024-02-14 23:00:30",
				Criticality: 4,
				Hostname:    "Vault-123",
			},
			"65f8671cfe55e5c76465d843": {
				Name:        "Smart Thermostat",
				Owner:       "UID_2332",
				Type:        []string{"IoT", "HVAC"},
				DateCreated: "2024-03-01 12:15:00",
				DateUpdated: "2024-03-18 09:50:00",
				Criticality: 2,
				Hostname:    "Thermostat-1",
			},
			"65f8671cfe55e5c76465d844": {
				Name:        "Work Laptop",
				Owner:       "UID_6372",
				Type:        []string{"Laptop", "Windows"},
				DateCreated: "2024-02-25 08:30:00",
				DateUpdated: "2024-03-18 10:00:00",
				Criticality: 3,
				Hostname:    "Work-Laptop-56",
			},
		},
		Plugins: map[string]jsonhandler.Plugin{
			"ipScan": {
				PluginStateID: "20240214-1300A",
			},
			"macScan": {
				PluginStateID: "20240215-0800G",
			},
		},
		Relations: map[string]jsonhandler.Relation{
			"65f8671cfe55e5c76465d845": {
				From:        "65f8671cfe55e5c76465d840",
				To:          "65f8671cfe55e5c76465d841",
				Direction:   "uni",
				Owner:       "UID_2332",
				DateCreated: "2024-02-14 23:35:53",
			},
			"65f8671cfe55e5c76465d846": {
				From:        "65f8671cfe55e5c76465d841",
				To:          "65f8671cfe55e5c76465d842",
				Direction:   "bi",
				Owner:       "UID_6372",
				DateCreated: "2024-01-22 07:32:32",
			},
			"65f8671cfe55e5c76465d847": {
				From:        "65f8671cfe55e5c76465d842",
				To:          "65f8671cfe55e5c76465d843",
				Direction:   "uni",
				Owner:       "UID_2332",
				DateCreated: "2024-03-01 12:30:00",
			},
			"65f8671cfe55e5c76465d848": {
				From:        "65f8671cfe55e5c76465d840",
				To:          "65f8671cfe55e5c76465d844",
				Direction:   "uni",
				Owner:       "UID_6372",
				DateCreated: "2024-03-05 14:20:00",
			},
		},
	}
	_, err := scansHelper.InsertOne(context.Background(), initialScan)
	if err != nil {
		log.Fatalf("Failed to add initial scan: %v", err)
	}
	log.Println("Initial scan added successfully")
}

func main() {

	router := gin.Default()
	// Apply the CORS middleware
	router.Use(CORSMiddleware())

	router.GET("/getLatestState", getLatestState)
	// router.POST("/uploadCycloneDX", uploadCycloneDX)

	err := dbcon.SetupDatabase("mongodb://dbstorage:27017/", "scan")
	if err != nil {
		log.Fatalf("Could not set up database: %v", err)
	}

	scansHelper := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("scans")}
	// assetsHelper := &dbcon-networkscan.MongoDBHelper{Collection: dbcon-networkscan.GetCollection("assets")}
	addInitialScan(scansHelper)
	router.POST("/AddScan", func(c *gin.Context) {
		dbcon.AddScan(scansHelper, c)
	})
	router.GET("/GetLatestScan", func(c *gin.Context) {
		dbcon.GetLatestScan(scansHelper, c)
	})

	router.POST("/assetHandler", func(c *gin.Context) {
		dbcon.ManageAssetsAndRelations(scansHelper, c)
	})
	router.GET("/PrintAllDocuments", func(c *gin.Context) {
		dbcon.PrintAllDocuments(scansHelper, c)
	})

	router.GET("/DeleteAllDocuments", func(c *gin.Context) {
		dbcon.DeleteAllDocuments(scansHelper, c)
	})

	log.Println("Server starting on port 8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}

}
