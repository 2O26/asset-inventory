package main

import (
	"encoding/json"
	"net/http"
    "os/exec"
    "strings"
    "fmt"
	"github.com/gin-gonic/gin"
    "encoding/xml"
    "time"
    
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

type Asset struct {
    Status  string `json:"status"`
    IPv4Addr string `json:"ipv4addr"`
    IPv6Addr string `json:"ipv6addr"`
    Subnet   string `json:"subnet"`
}

type Scan struct {
    StateID     string           `json:"stateID"`
    DateCreated string           `json:"dateCreated"`
    DateUpdated string           `json:"dateUpdated"`
    State       map[string]Asset `json:"state"`
}

type Host struct {
    Status Status `xml:"status"`
    Address []Address `xml:"address"`
}

type Status struct {
    State string `xml:"state,attr"`
}

type Address struct {
    AddrType string `xml:"addrtype,attr"`
    Addr string `xml:"addr,attr"`
}

type Nmaprun struct {
    Hosts []Host `xml:"host"`
}
func main() {
	router := gin.Default()
	router.GET("/status", getScan)
	router.POST("/startNetScan", postNetScan)

	router.Run(":8081")
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}

func performScan(target string) (string, error) {
    cmd := exec.Command("nmap", "-sV", "-oX", "-", target)
    var stderr strings.Builder
    cmd.Stderr = &stderr
    out, err := cmd.Output()
    if err != nil {
        return "", fmt.Errorf("%s: %s", err, stderr.String())
    }

    // Unmarshal XML to struct
    var nmaprun Nmaprun
    err = xml.Unmarshal(out, &nmaprun)
    if err != nil {
        return "", fmt.Errorf("xml.Unmarshal: %s", err)
    }

    scan := Scan{
        StateID:     "", // Replace with actual state ID
        DateCreated: time.Now().Format("2006-01-02 15:04:05"),
        DateUpdated: time.Now().Format("2006-01-02 15:04:05"),
        State:       make(map[string]Asset),
    }

    for _, host := range nmaprun.Hosts {
        var ipv4, ipv6 string
        for _, address := range host.Address {
            if address.AddrType == "ipv4" {
                ipv4 = address.Addr
            } else if address.AddrType == "ipv6" {
                ipv6 = address.Addr
            }
        }
        scan.State[ipv4] = Asset{
            Status:  host.Status.State,
            IPv4Addr: ipv4,
            IPv6Addr: ipv6,
            Subnet:   "", // Replace with actual subnet
        }
    }

    jsonOut, err := json.Marshal(scan)
    if err != nil {
        return "", fmt.Errorf("json.Marshal: %s", err)
    }

    return string(jsonOut), nil
}

func getScan(c *gin.Context) {
    target := c.Query("target") // get the target from the query parameters
    scanResult, err := performScan(target)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    var scan Scan
    err = json.Unmarshal([]byte(scanResult), &scan)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, scan)
}
func postNetScan(c *gin.Context) {

	c.IndentedJSON(http.StatusCreated, hardcodedScan)
}
