package main

import (
	"assetinventory/assethandler/dbcon"
	"assetinventory/assethandler/jsonhandler"
	"context"
	"fmt"
	"net/netip"
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
	OpenPorts      []int  `bson:"Open Ports" json:"Open Ports"`
	LastDiscovered string `bson:"Last Discovered at" json:"Last Discovered at"`
}

var flake, _ = sonyflake.New(sonyflake.Settings{
	StartTime: time.Date(2023, 6, 1, 7, 15, 20, 0, time.UTC),
})

const netscanURL = "http://networkscan:8081"

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
		netassets := getNetworkScan(c)
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

func getNetworkScan(c *gin.Context) json.RawMessage {
	fmt.Println("########Getting network scan##########")
	url := "http://networkscan:8081/getLatestScan"
	// GET request from netscan
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Fatal(err)
	}
	//add auth token
	req.Header.Add("Authorization", c.GetHeader("Authorization"))
	req.Header.Add("Content-Type", "application/json")

	response, err := http.DefaultClient.Do(req)
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

func addSubnetAssets(subnets []string) []string {
	var addAsset []jsonhandler.Asset
	var assetIDs []string

	for _, subnet := range subnets {
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

func addSubnetRelations(netassets networkResponse, subnets []string) []dbcon.RelationChang {
	db := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("scans")}
	latestScan, err := dbcon.GetLatestScan(db)
	if err != nil {
		// Log and return error if it's not ErrNoDocuments
		log.Printf("Failed to retrieve the latest scan: %v\n", err)
		return nil
	}
	var addRelation []jsonhandler.Relation
	var relationIDs []string
	subnetAssets := make(map[string]jsonhandler.Asset)

	// Find all assets in subnet, then add relations between them.
	// dbcon.Addrelations will check if they already exist
	for _, subnet := range subnets {
		for assetID, asset := range latestScan.Assets {
			if subnet == asset.IP && asset.Type[0] == "Subnet" {
				//we have found the subnet asset. Add it to subnets
				subnetAssets[assetID] = asset
			}
		}
	}
	//Now have all subnet assets. Adding relations between subnets and assets

	//netip parse stuff here

	for subnetAssetID, subnetAsset := range subnetAssets {
		var network netip.Prefix
		network, err = netip.ParsePrefix(subnetAsset.Name)
		if err != nil {
			log.Panic("Failed to parse subnet: ", err)
		}
		for netAssetID, netAsset := range netassets.State {
			var assetIP netip.Addr
			assetIP, err = netip.ParseAddr(netAsset.IPv4Addr)
			if err != nil {
				log.Panic("Failed to parse IP: ", err)
			}
			if network.Contains(assetIP) {
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

func addEmptyScan(scansHelper dbcon.DatabaseHelper) {
	emptyScan := jsonhandler.BackState{
		ID:               primitive.NewObjectID(),
		MostRecentUpdate: time.Now(),
		Assets:           map[string]jsonhandler.Asset{},
		Relations:        map[string]jsonhandler.Relation{},
		PluginStates:     map[string]jsonhandler.PluginState{},
	}

	_, err := scansHelper.InsertOne(context.Background(), emptyScan)
	if err != nil {
		log.Fatalf("Failed to add empty initial scan: %v", err)
	}
	log.Println("Empty initial scan added successfully")
}

func updateNetscanAssets(c *gin.Context) {
	// this function only accepts connection from netscan
	if c.GetHeader("Origin") != netscanURL {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unknown origin"})
		return
	}
	//This function will not perform authentication, as cronjob has no token

	type updateRequest struct {
		Scan    networkResponse `json:"scan"`
		Subnets []string        `json:"subnets"`
	}
	requestData := updateRequest{}
	err := c.ShouldBindJSON(&requestData)
	if err != nil {
		log.Printf("Failed to bind JSON: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to bind JSON"})
		return
	}
	netscanData := requestData.Scan
	subnets := requestData.Subnets

	fmt.Println("NETSCAN DATA: ", netscanData)

	//getting our subnets from the scan allows us to not have a subnet key in the netscan asset data
	var addAsset []jsonhandler.Asset
	var assetIDs []string
	for k := range netscanData.State {
		assetIDs = append(assetIDs, k)
	}
	// Iterate over the State map and print UID values'
	// There might be a bug here where the assets are not added in the right order
	for i := 0; i < len(netscanData.State); i++ {
		asset := jsonhandler.Asset{
			Name:        netscanData.State[assetIDs[i]].IPv4Addr,
			Owner:       "",
			Type:        []string{},
			Criticality: 0,
			IP:          netscanData.State[assetIDs[i]].IPv4Addr,
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
		DateCreated: netscanData.DateCreated,
		DateUpdated: netscanData.DateUpdated,
		State:       make(map[string]any),
	}

	for k, v := range netscanData.State {
		pluginState.State[k] = v
	}
	plugin := jsonhandler.Plugin{
		PluginStateID: netscanData.StateID,
	}
	fmt.Println("PluginState: ", pluginState)

	// Will need to iterate over the subnets present in scan and make assets if they don't already exist
	addedSubnetAssets := addSubnetAssets(subnets)
	fmt.Println("ADDED SUBNET ASSETS")
	addedRelations := addSubnetRelations(netscanData, subnets)
	fmt.Println("ADDED SUBNET RELATIONS")

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

	router.POST("/updateNetscanAssets", updateNetscanAssets)

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

	router.POST("/GetTimelineData", func(c *gin.Context) {
		// dbcon.DeleteAllDocuments(scansHelper, c)
		dbcon.GetTimelineData(timelineDB, c)
	})

	log.Println("Server starting on port 8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}

}
