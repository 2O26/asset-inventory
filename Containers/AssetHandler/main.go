package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

type asset struct {
	ID     string `json:"id"`
	Status string `json:"status"`
	IP     string `json:"ip"`
	MAC    string `json:"mac"`
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}

// AssethandlerStatusResponse represents the JSON structure of the response.
type AssethandlerStatusResponse struct {
	Message string `json:"message"`
	Time    string `json:"time"` // Add a timestamp field
	Asset   asset  `json:"asset"`
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

// AuthStatusHandler handles the /authStatus endpoint.
func assetHandlerStatus(w http.ResponseWriter, r *http.Request) {
	// Example: Check some condition to determine auth status
	// This is where you'd implement your actual authentication check logic.
	authSuccess := true // Placeholder for actual auth check
	enableCors(&w)

	w.Header().Set("Content-Type", "application/json")

	if authSuccess {
		currentTime := time.Now().Format("2006-01-02 15:04:05")
		firstAsset := getNetScanStatus()
		response := AssethandlerStatusResponse{Message: "Hello World", Time: currentTime, Asset: firstAsset}
		json.NewEncoder(w).Encode(response)
	} else {
		w.WriteHeader(http.StatusUnauthorized) // 401 status code
		response := AssethandlerStatusResponse{Message: "failed"}
		json.NewEncoder(w).Encode(response)
	}
}

func main() {
	http.HandleFunc("/assetHandlerStatus", assetHandlerStatus)

	fmt.Println("Starting server at port 8080")

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
