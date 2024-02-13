package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type assetScan struct {
	ID     string `json:"id"`
	Status string `json:"status"`
	IP     string `json:"ip"`
	MAC    string `json:"mac"`
}

var hardcodedScan = []assetScan{
	{ID: "1", Status: "up", IP: "192.168.1.1", MAC: "10:25:96:12:34:56"},
	{ID: "2", Status: "down", IP: "172.168.1.1", MAC: "20:25:96:12:34:56"},
	{ID: "3", Status: "dormant", IP: "10.168.1.1", MAC: "30:25:96:12:34:56"},
}

func main() {
	router := gin.Default()
	router.GET("/status", getStatus)
	// router.GET("/albums/:id", getAlbumByID)
	router.POST("/addMockScan", postMockScan)

	router.Run(":8081")
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}

func getStatus(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, hardcodedScan)
}

func postMockScan(c *gin.Context) {
	var newAssetScan assetScan

	// Call BindJSON to bind the received JSON to
	// newAlbum.
	if err := c.BindJSON(&newAssetScan); err != nil {
		return
	}

	// Add the new album to the slice.
	hardcodedScan = append(hardcodedScan, newAssetScan)
	c.IndentedJSON(http.StatusCreated, newAssetScan)
}
