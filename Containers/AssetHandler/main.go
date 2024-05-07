package main

import (
	"assetinventory/assethandler/dbcon"
	"assetinventory/assethandler/jsonhandler"
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/sony/sonyflake"

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
	Status         string `bson:"Status" json:"Status"`
	IPv4Addr       string `bson:"IPv4 Address" json:"IPv4 Address"`
	Subnet         string `bson:"Subnet" json:"Subnet"`
	OpenPorts      []int  `bson:"Open Ports" json:"Open Ports"`
	LastDiscovered string `bson:"Last Discovered at" json:"Last Discovered at"`
}

var flake, _ = sonyflake.New(sonyflake.Settings{
	StartTime: time.Date(2023, 6, 1, 7, 15, 20, 0, time.UTC),
})

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

func authorizeUser(c *gin.Context) jsonhandler.AuthResponse {

	emptyAuth := jsonhandler.AuthResponse{
		Authenticated:   false,
		Roles:           nil,
		IsAdmin:         false,
		CanManageAssets: false,
	}
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		response := StateResponse{Message: "No authorization token provided."}
		c.IndentedJSON(http.StatusUnauthorized, response)
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

	var auth jsonhandler.AuthResponse
	fmt.Println("Response Status:", resp.StatusCode)
	err = json.NewDecoder(resp.Body).Decode(&auth)
	if err != nil {
		log.Printf("Failed to fetch authentication token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch authentication token"})
		return emptyAuth
	}

	return auth

}

func getLatestState(c *gin.Context) {

	auth := authorizeUser(c)

	// Add assets from network scan
	if auth.Authenticated {

		subnets, ok := c.GetPostFormArray("subnets")
		if !ok {
			log.Printf("Failed to get subnets")
		}
		fmt.Println("SUBNETS IN REQUEST:", subnets)
		getNetworkScan()
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

		currentStateJSON, err := jsonhandler.BackToFront(json.RawMessage(scanResultJSON), nil)

		if err != nil {
			log.Println(err)
		}

		var currentState jsonhandler.FrontState
		json.Unmarshal(currentStateJSON, &currentState)
		log.Println(string(currentStateJSON))

		// Will now remove any data that a user cannot access.
		if len(subnets) > 0 {
			currentState = jsonhandler.FilterBySubnets(currentState, auth, subnets)
		} else if !auth.IsAdmin {
			currentState = jsonhandler.NeedToKnow(currentState, auth)
		}

		response := StateResponse{Message: "Authentication success.", State: currentState}
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
	var addAsset []jsonhandler.Asset
	var assetIDs []string
	for k := range netassets.State {
		assetIDs = append(assetIDs, k)
	}
	// Iterate over the State map and print UID values'
	// There might be a bug here where the assets are not added in the right order
	for i := 1; i <= len(netassets.State); i++ {
		asset := jsonhandler.Asset{
			Name:        "netscan-" + fmt.Sprint(netassets.DateUpdated) + "-" + fmt.Sprint(i),
			Owner:       "",
			Type:        []string{},
			Criticality: 0,
			IP:          netassets.State[assetIDs[i-1]].IPv4Addr,
		}
		addAsset = append(addAsset, asset)
		fmt.Println("Asset: ", asset)
	}
	request := dbcon.AssetRequest{
		AddAsset: addAsset,
	}
	fmt.Println("Request: ", request)
	_, addedassets := dbcon.AddAssets(request, assetIDs)
	pluginState := jsonhandler.PluginState{
		StateID:     "netscan",
		DateCreated: netassets.DateCreated,
		DateUpdated: netassets.DateUpdated,
		State:       make(map[string]any),
	}

	for k, v := range netassets.State {
		pluginState.State[k] = v
	}
	plugin := jsonhandler.Plugin{
		PluginStateID: netassets.StateID,
	}
	fmt.Println("PluginState: ", pluginState)

	// Will need to iterate over the subnets present in scan and make assets if they don't already exist
	addedSubnetAssets := addSubnetAssets(netassets)
	addedRelations := addSubnetRelations(netassets)

	addPluginData := dbcon.AddPluginData(pluginState, plugin)
	addedassets = append(addedassets, addedSubnetAssets...)
	changes := dbcon.Timeline{
		AddedAssets:      addedassets,
		RemovedAssets:    nil,
		UpdatedAssets:    addPluginData,
		AddedRelations:   addedRelations,
		RemovedRelations: nil,
	}
	timelineDB := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("timelineDB")}

	err = dbcon.SaveChange(changes, timelineDB)
	if err != nil {
		log.Fatalf("Failed to save changes: %v", err)
	}

}

func addSubnetAssets(netassets networkResponse) []string {
	var addAsset []jsonhandler.Asset
	var assetIDs []string
	subnets := make(map[string]bool)

	for _, asset := range netassets.State {
		subnets[asset.Subnet] = true
	}

	for subnet := range subnets {
		fmt.Println("SUBNET: ", subnet)
		asset := jsonhandler.Asset{
			Name:        subnet,
			Owner:       "netscan",
			Type:        []string{"Subnet"},
			Criticality: 0,
			IP:          subnet,
		}
		addAsset = append(addAsset, asset)
	}

	for i := 1; i <= len(addAsset); i++ {
		nextU, err := flake.NextID()
		if err != nil {
			log.Fatal(err)
		}
		next := strconv.FormatUint(nextU, 10)
		assetIDs = append(assetIDs, next)
	}

	assetRequest := dbcon.AssetRequest{
		AddAsset: addAsset,
	}
	_, addedSubnetAssets := dbcon.AddAssets(assetRequest, assetIDs)
	return addedSubnetAssets
}

func addSubnetRelations(netassets networkResponse) []dbcon.RelationChang {
	db := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("scans")}
	latestScan, err := dbcon.GetLatestScan(db)
	if err != nil {
		// Log and return error if it's not ErrNoDocuments
		log.Printf("Failed to retrieve the latest scan: %v\n", err)
		return nil
	}
	var addRelation []jsonhandler.Relation
	var relationIDs []string
	subnets := make(map[string]bool)
	subnetAssets := make(map[string]jsonhandler.Asset)
	for _, asset := range netassets.State {
		subnets[asset.Subnet] = true
	}
	// Find all assets in subnet, then add relations between them.
	// dbcon.Addrelations will check if they already exist
	for subnet := range subnets {
		for assetID, asset := range latestScan.Assets {
			if subnet == asset.IP && asset.Type[0] == "Subnet" {
				//we have found the subnet asset. Add it to subnets
				subnetAssets[assetID] = asset
			}
		}
	}
	//Now have all subnet assets. Adding relations between subnets and assets

	for subnetAssetID, subnetAsset := range subnetAssets {
		for netAssetID, netAsset := range netassets.State {
			if netAsset.Subnet == subnetAsset.IP {
				//have match, now make relation
				relation := jsonhandler.Relation{
					From:        subnetAssetID,
					To:          netAssetID,
					Direction:   "uni",
					Owner:       "netscan",
					DateCreated: time.Now().Format(time.RFC3339),
				}
				addRelation = append(addRelation, relation)
			}
		}
	}
	//generate relation IDs
	for i := 1; i <= len(addRelation); i++ {
		nextU, err := flake.NextID()
		if err != nil {
			log.Fatal(err)
		}
		next := strconv.FormatUint(nextU, 10)
		relationIDs = append(relationIDs, next)
	}

	relationRequest := dbcon.AssetRequest{
		AddRelations: addRelation,
	}
	_, AddRelations := dbcon.AddRelations(relationRequest, relationIDs)
	return AddRelations

}

// func addInitialScan(scansHelper dbcon.DatabaseHelper) {
// 	// Add initial scan
// 	initialScan := jsonhandler.BackState{
// 		ID:               primitive.NewObjectID(),
// 		MostRecentUpdate: time.Now(),
// 		Assets: map[string]jsonhandler.Asset{
// 			"65f8671cfe55e5c76465d840": {
// 				Name:        "PC-A",
// 				Owner:       "UID_2332",
// 				Type:        []string{"PC", "Windows"},
// 				DateCreated: "2024-02-14T23:00:00Z",
// 				DateUpdated: "2024-02-14T23:00:30Z",
// 				Criticality: 2,
// 			},
// 			"65f8671cfe55e5c76465d841": {
// 				Name:        "Chromecast",
// 				Owner:       "UID_2332",
// 				Type:        []string{"IoT", "Media"},
// 				DateCreated: "2024-02-10T20:04:20Z",
// 				DateUpdated: "2024-02-14T23:00:30Z",
// 				Criticality: 1,
// 			},
// 			"65f8671cfe55e5c76465d842": {
// 				Name:        "Password Vault",
// 				Owner:       "UID_2332",
// 				Type:        []string{"Server", "Database"},
// 				DateCreated: "2024-02-14T23:00:00Z",
// 				DateUpdated: "2024-02-14T23:00:30Z",
// 				Criticality: 4,
// 			},
// 			"65f8671cfe55e5c76465d843": {
// 				Name:        "Smart Thermostat",
// 				Owner:       "UID_2332",
// 				Type:        []string{"IoT", "HVAC"},
// 				DateCreated: "2024-03-01T12:15:00Z",
// 				DateUpdated: "2024-03-18T09:50:00Z",
// 				Criticality: 2,
// 			},
// 			"65f8671cfe55e5c76465d844": {
// 				Name:        "Work Laptop",
// 				Owner:       "UID_6372",
// 				Type:        []string{"Laptop", "Windows"},
// 				DateCreated: "2024-02-25T08:30:00Z",
// 				DateUpdated: "2024-03-18T10:00:00Z",
// 				Criticality: 3,
// 			},
// 		},
// 		Plugins: map[string]jsonhandler.Plugin{
// 			"ipScan": {
// 				PluginStateID: "20240214-1300A",
// 			},
// 			"macScan": {
// 				PluginStateID: "20240215-0800G",
// 			},
// 		},
// 		Relations: map[string]jsonhandler.Relation{
// 			"65f8671cfe55e5c76465d845": {
// 				From:        "65f8671cfe55e5c76465d840",
// 				To:          "65f8671cfe55e5c76465d841",
// 				Direction:   "uni",
// 				Owner:       "UID_2332",
// 				DateCreated: "2024-02-14T23:35:53Z",
// 			},
// 			"65f8671cfe55e5c76465d846": {
// 				From:        "65f8671cfe55e5c76465d841",
// 				To:          "65f8671cfe55e5c76465d842",
// 				Direction:   "bi",
// 				Owner:       "UID_6372",
// 				DateCreated: "2024-01-22T07:32:32Z",
// 			},
// 			"65f8671cfe55e5c76465d847": {
// 				From:        "65f8671cfe55e5c76465d842",
// 				To:          "65f8671cfe55e5c76465d843",
// 				Direction:   "uni",
// 				Owner:       "UID_2332",
// 				DateCreated: "2024-03-01T12:30:00Z",
// 			},
// 			"65f8671cfe55e5c76465d848": {
// 				From:        "65f8671cfe55e5c76465d840",
// 				To:          "65f8671cfe55e5c76465d844",
// 				Direction:   "uni",
// 				Owner:       "UID_6372",
// 				DateCreated: "2024-03-05T14:20:00Z",
// 			},
// 		},
// 		PluginStates: map[string]jsonhandler.PluginState{
// 			"IPscan": {
// 				StateID:     "20240214-1300A",
// 				DateCreated: "2024-02-14T13:00:00",
// 				DateUpdated: "2024-02-14Z13:30:00",
// 				State: map[string]interface{}{
// 					"65f8671cfe55e5c76465d840": map[string]interface{}{
// 						"status":    "down",
// 						"ipv4Addr":  "192.168.1.1",
// 						"subnet":    "192.168.1.0/24",
// 						"openPorts": []int{},
// 					},
// 				},
// 			},
// 		}}
// 	_, err := scansHelper.InsertOne(context.Background(), initialScan)
// 	if err != nil {
// 		log.Fatalf("Failed to add initial scan: %v", err)
// 	}
// 	log.Println("Initial scan added successfully")
// }

func addEmptyScan(scansHelper dbcon.DatabaseHelper) {
	// Create an initial empty scan with no assets but ready to accept new assets
	emptyScan := jsonhandler.BackState{
		ID:               primitive.NewObjectID(),              // Generate a new ID for the scan
		MostRecentUpdate: time.Now(),                           // Set the current time as the most recent update
		Assets:           map[string]jsonhandler.Asset{},       // No assets initially
		Relations:        map[string]jsonhandler.Relation{},    // No relations initially
		PluginStates:     map[string]jsonhandler.PluginState{}, // No plugin states initially
	}

	// Insert the empty scan into the database
	_, err := scansHelper.InsertOne(context.Background(), emptyScan)
	if err != nil {
		log.Fatalf("Failed to add empty initial scan: %v", err)
	}
	log.Println("Empty initial scan added successfully")
}

func main() {

	router := gin.Default()
	// Apply the CORS middleware
	router.Use(CORSMiddleware())
	// router.POST("/uploadCycloneDX", uploadCycloneDX)

	err := dbcon.SetupDatabase("mongodb://dbstorage:27017/", "scan")
	if err != nil {
		log.Fatalf("Could not set up database: %v", err)
	}

	timelineDB := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("timelineDB")}
	scansHelper := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("scans")}
	// assetsHelper := &dbcon-networkscan.MongoDBHelper{Collection: dbcon-networkscan.GetCollection("assets")}
	addEmptyScan(scansHelper)
	router.POST("/getLatestState", getLatestState)
	router.POST("/AddScan", func(c *gin.Context) {
		dbcon.AddScan(scansHelper, c)
	})

	router.GET("/GetLatestScan", func(c *gin.Context) {
		dbcon.GetLatestState(scansHelper, c)
	})

	router.POST("/assetHandler", func(c *gin.Context) {
		auth := authorizeUser(c)
		if auth.Authenticated {
			if auth.IsAdmin || auth.CanManageAssets {
				dbcon.ManageAssetsAndRelations(scansHelper, timelineDB, c)
			} else {
				log.Println("User with insufficient privileges tried to access /assetHandler.")
				response := StateResponse{Message: "Insufficient privileges for requested operation."}
				c.IndentedJSON(http.StatusForbidden, response)
			}
		} else {
			log.Println("Unauthorized user tried to access /assetHandler.")
			response := StateResponse{Message: "User unauthorized."}
			c.IndentedJSON(http.StatusUnauthorized, response)
		}
	})
	router.GET("/PrintAllDocuments", func(c *gin.Context) {
		// dbcon.PrintAllDocuments(scansHelper, c)
		dbcon.PrintAllDocuments(timelineDB, c)
	})

	router.GET("/DeleteAllDocuments", func(c *gin.Context) {
		dbcon.DeleteAllDocuments(scansHelper, c)
		dbcon.DeleteAllDocuments(timelineDB, c)

		// Empty state after deletion
		addEmptyScan(scansHelper)
		c.JSON(http.StatusOK, gin.H{"message": "All documents deleted and base state reinitialized"})
	})

	router.POST("/GetTimelineData", func(c *gin.Context) {
		// dbcon.DeleteAllDocuments(scansHelper, c)
		dbcon.GetTimelineData(timelineDB, c)
	})

	log.Println("Server starting on port 8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}

}
