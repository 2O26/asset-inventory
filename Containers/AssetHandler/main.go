package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type asset struct {
	ID     string `json:"id"`
	Status string `json:"status"`
	IP     string `json:"ip"`
	MAC    string `json:"mac"`
}

// AssethandlerStatusResponse represents the JSON structure of the response.
type AssethandlerStatusResponse struct {
	Message string `json:"message"`
	Time    string `json:"time"` // Add a timestamp field
	Asset   asset  `json:"asset"`
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

func getNetScanStatus() asset {
	url := "http://networkscan:8081/status"
	// url := "http://localhost:8081/status"

	// GET request from netscan
	response, err := http.Get(url)

	if err != nil {
		log.Fatal(err)
	}

	defer response.Body.Close() // Ensure the body is closed after reading
	// Read the response body
	body, err := ioutil.ReadAll(response.Body)

	// Convert the body to a string and print
	fmt.Println(string(body)) // prints out correct output

	// TODO convert body to asset type.

	var firstAsset asset
	firstAsset.ID = "1"
	firstAsset.Status = "2"
	firstAsset.IP = "3"
	firstAsset.MAC = "4"

	// firstAsset.ID = result[0]["ID"].(string)
	// firstAsset.Status = result[1]["Status"].(string)
	// firstAsset.IP = result[2]["IP"].(string)
	// firstAsset.MAC = result[3]["MAC"].(string)

	return firstAsset
}

func assetHandlerStatus(c *gin.Context) {

	var authSuccess = true

	if authSuccess {
		currentTime := time.Now().Format("2006-01-02 15:04:05")
		firstAsset := getNetScanStatus()
		response := AssethandlerStatusResponse{Message: "Hello world", Time: currentTime, Asset: firstAsset}
		c.IndentedJSON(http.StatusOK, response)
	} else {
		response := AssethandlerStatusResponse{Message: "failed"}
		c.IndentedJSON(http.StatusOK, response)
	}
}

func main() {
	router := gin.Default()
	// Apply the CORS middleware
	router.Use(CORSMiddleware())

	router.GET("/assetHandlerStatus", assetHandlerStatus)

	fmt.Println("Starting server at port 8080")

	router.Run(":8080")
}
