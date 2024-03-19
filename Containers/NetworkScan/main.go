package main

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"math/rand" // This is a tmp package for generating random MAC addresses
	"net/http"
	"os/exec"
	"regexp"
	"strings"
	"time"

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

// Global variable to store the scan result
var scanResultGlobal Scan

type Scan struct {
	StateID     string
	DateCreated string
	DateUpdated string
	State       map[string]Asset
}

type Asset struct {
	Status        string
	IPv4Addr      string
	IPv6Addr      string
	Subnet        string
	Hostname      string
	KernelVersion string // Changed from OS to KernelVersion
	MACAddr       string // New field for MAC addresses
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
	CmdSelection string          `json:"cmdSelection"`
	IPRanges     map[string]bool `json:"IPRanges"`
}

type Hostname struct {
	Name string `xml:"name,attr"` // New field for hostname
}

type OS struct {
	Name string `xml:"name,attr"` // This struct might be better named as KernelVersion
}

func fillWithRandomMACAddresses(scan *Scan) {
	macAddressTemplate := "00:00:00:%02x:%02x:%02x"
	for key := range scan.State {
		state := scan.State[key]                                                                        // Get the struct value from the map
		state.MACAddr = fmt.Sprintf(macAddressTemplate, rand.Intn(256), rand.Intn(256), rand.Intn(256)) // Modify the struct value
		scan.State[key] = state                                                                         // Put the struct value back into the map
	}
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

func main() {
	router := gin.Default()

	router.Use(CORSMiddleware())
	router.GET("/getScanResult", getScan)
	router.POST("/startNetScan", postNetScan)

	router.Run(":8081")
}

func validNmapTarget(nmapTarget string) bool {
	//Example of strings able to be handled "192.168.1.0/24, 172.15.1.1-100, 10.10.1.145"
	regex := `^(\b(?:\d{1,3}\.){3}\d{1,3}(?:/\d{1,2})?|\b(?:\d{1,3}\.){3}\d{1,3}-\d{1,3}\b)$` // `` Have to be used instead of "" or the regex breaks

	// regex first boundry matches an IPV4 address and an aditional optional CIDR notation -> (.1/24). OR an IPV4 address range with after a "-"
	match, err := regexp.MatchString(regex, nmapTarget)

	if err != nil {
		return false
	}
	return match
}

func performScan(target string) (Scan, error) {
	fmt.Printf("performScan\n")
	if validNmapTarget(target) == false { //Validation of nmap parameters
		return Scan{}, fmt.Errorf("Invalid nmap target!")
	}
	cmd := exec.Command("nmap", "-O", "-R", "-oX", "-", target)
	var stderr strings.Builder
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if err != nil {
		return Scan{}, fmt.Errorf("%s: %s", err, stderr.String())
	}

	// Unmarshal XML to struct
	var nmaprun Nmaprun
	err = xml.Unmarshal(out, &nmaprun)
	if err != nil {
		return Scan{}, fmt.Errorf("xml.Unmarshal: %s", err)
	}

	scan := Scan{
		StateID:     "", // Replace with actual state ID
		DateCreated: time.Now().Format("2006-01-02 15:04:05"),
		DateUpdated: time.Now().Format("2006-01-02 15:04:05"),
		State:       make(map[string]Asset),
	}

	for _, host := range nmaprun.Hosts {
		var ipv4, ipv6, hostname, kernelVersion string
		for _, address := range host.Address {
			if address.AddrType == "ipv4" {
				ipv4 = address.Addr
			} else if address.AddrType == "ipv6" {
				ipv6 = address.Addr
			}
		}
		if len(host.Hostnames) > 0 {
			hostname = host.Hostnames[0].Name
		}
		kernelVersion = host.OS.Name
		scan.State[ipv4] = Asset{
			Status:        host.Status.State,
			IPv4Addr:      ipv4,
			IPv6Addr:      ipv6,
			Subnet:        target,        // Store the target subnet
			Hostname:      hostname,      // Store the hostname
			KernelVersion: kernelVersion, // Store the OS information
			MACAddr:       "",            // MAC address is empty for now
		}
	}

	return scan, nil
}

func getScan(c *gin.Context) {
	fmt.Printf("getScan\n")
	// Send the global scan result to the requester
	c.JSON(http.StatusOK, scanResultGlobal)
}
func postNetScan(c *gin.Context) {
	var req ScanRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("Starting to scan...\n")
	// Perform the scan for each target in the request
	for target, _ := range req.IPRanges {
		scanResult, err := performScan(target)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		fillWithRandomMACAddresses(&scanResult) // This is a tmp function to fill the MAC addresses

		scanResultGlobal = scanResult
	}

	fmt.Printf("Finished postNetScan\n")

	c.JSON(http.StatusOK, gin.H{"message": "Scan performed successfully", "success": true})
}
