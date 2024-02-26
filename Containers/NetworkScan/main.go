package main

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Will get scan array from DB
var hardcodedScan = json.RawMessage(`
{
    "stateID": "20240214-1300A",
    "dateCreated": "2024-02-14 23:00:00",
    "dateUpdated": "2024-02-14 23:00:30",
    "state": {
        "AID_4123523": {
            "status": "up",
            "ipv4addr": "192.168.1.1",
            "ipv6addr": "10:25:96:12:34:56",
            "subnet": "192.168.1.0/24"
        },
        "AID_5784393": {
            "status": "down",
            "ipv4addr": "172.168.1.1",
            "ipv6addr": "20:25:96:12:34:56",
            "subnet": "192.168.1.0/24"
        }
    }
}`)

func main() {
	router := gin.Default()
	router.GET("/status", getScan)
	router.POST("/addMockScan", postMockScan)

	router.Run(":8081")
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}

func getScan(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, hardcodedScan)
}

func postMockScan(c *gin.Context) {

	c.IndentedJSON(http.StatusCreated, hardcodedScan)
}
