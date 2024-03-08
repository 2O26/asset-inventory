package main

import (
	"assetinventory/assethandler/dbcon"
	"assetinventory/assethandler/jsonhandler"

	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type StateResponse struct {
	Message string                 `json:"message"`
	State   jsonhandler.FrontState `json:"state"`
}

type PluginState struct {
	StateID     string         `json:"stateID"`
	DateCreated string         `json:"dateCreated"`
	DateUpdated string         `json:"dateUpdated"`
	State       map[string]any `json:"state"`
}

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

	var netassets PluginState
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

	//GET STATE FROM MONGO HERE
	PLACEHOLDER := `{
		"mostRecentUpdate": "2024-02-14 23:35:53",
		"assets": {
			"AID_4123523": {
				"Name": "PC-A",
				"Owner": "UID_2332",
				"Type": ["PC", "Windows"],
				"Created at": "2024-02-14 23:00:00",
				"Updated at": "2024-02-14 23:00:30",
				"Criticality": 2,
				"Hostname": "Desktop-123"
			},
			"AID_5784393": {
				"Name": "Chromecast",
				"Owner": "UID_2332",
				"Type": ["IoT", "Media"],
				"Created at": "2024-02-10 20:04:20",
				"Updated at": "2024-02-14 23:00:30",
				"Criticality": 1,
				"Hostname": "LivingRoom"
			},
			"AID_9823482": {
				"Name": "Password Vault",
				"Owner": "UID_2332",
				"Type": ["Server", "Database"],
				"Created at": "2024-02-14 23:00:00",
				"Updated at": "2024-02-14 23:00:30",
				"Criticality": 4
			}
		},
		"plugins": {
			"ipScan": {
				"pluginStateID": "20240214-1300A"
			},
			"macScan": {
				"pluginStateID": "20240215-0800G"
			}
		},
		"relations": {
			"RID_2613785": {
				"from": "AID_4123523",
				"to": "AID_5784393",
				"direction": "uni",
				"owner": "UID_2332",
				"dateCreated":"2024-02-14 23:35:53"
			},
			"RID_6492733": {
				"from": "AID_5784393",
				"to": "AID_9823482",
				"direction": "bi",
				"owner": "UID_6372",
				"dateCreated": "2024-01-22 07:32:32"
			}    
		}    
	}
	`

	var authSuccess = true

	if authSuccess {

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

		currentStateJSON, err := jsonhandler.BackToFront(json.RawMessage(PLACEHOLDER), pluginStates)
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

func main() {

	router := gin.Default()
	// Apply the CORS middleware
	router.Use(CORSMiddleware())

	router.GET("/getLatestState", getLatestState)

	err := dbcon.SetupDatabase("mongodb://asset-inventory-dbstorage-1:27017/", "scan")
	if err != nil {
		log.Fatalf("Could not set up database: %v", err)
	}

	scansHelper := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("scans")}
	assetsHelper := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("assets")}
	router.POST("/AddScan", func(c *gin.Context) {
		dbcon.AddScan(scansHelper, c) // Anropa AddScan med dbHelper och Gin context
	})
	router.GET("/GetLatestScan", func(c *gin.Context) {
		dbcon.GetLatestScan(scansHelper, c) // Anropar funktionen med den riktiga databasen
	})
	router.POST("/AddAsset", func(c *gin.Context) {
		dbcon.AddAsset(assetsHelper, c)
	})
	router.POST("/UpdateAsset", func(c *gin.Context) {
		dbcon.UpdateAsset(assetsHelper, c)
	})
	router.POST("/DeleteAsset", func(c *gin.Context) {
		dbcon.DeleteAsset(assetsHelper, c)
	})
	router.GET("/PrintAllDocuments", func(c *gin.Context) {
		dbcon.PrintAllDocuments(assetsHelper, c) // Antag att `assetsHelper` är din `MongoDBHelper` instans
		dbcon.PrintAllDocuments(scansHelper, c)
	})

	router.GET("/DeleteAllDocuments", func(c *gin.Context) {
		dbcon.DeleteAllDocuments(assetsHelper, c)
		dbcon.DeleteAllDocuments(scansHelper, c)
	})

	log.Println("Server starting on port 8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
