package main

import (
	dbcon "assetinventory/networkscan/dbcon-networkscan"
	"encoding/xml"
	"fmt"
	"github.com/gin-gonic/gin"
	"log"
	"math/rand" // This is a tmp package for generating random MAC addresses
	"net/http"
	"os/exec"
	"regexp"
	"strings"
	"time"
)

// Global variable to store the scan result
var scanResultGlobal dbcon.Scan

func fillWithRandomMACAddresses(scan *dbcon.Scan) {
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

	err := dbcon.SetupDatabase("mongodb://netscanstorage:27019/", "scan")
	if err != nil {
		log.Fatalf("Error setting up database: %v", err)
	}
	scansHelper := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("scans")}
	router.POST("/startNetScan", func(c *gin.Context) {
		postNetScan(scansHelper, c)
	})
	router.GET("/getLatestScan", func(c *gin.Context) {
		dbcon.GetLatestScan(scansHelper, c)
	})
	log.Println("Server starting on port 8081...")
	if err := router.Run(":8081"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func validNmapTarget(nmapTarget string) bool {
	//Example of strings able to be handled "192.168.1.0/24, 172.15.1.1-100, 10.10.1.145"
	regex := `^(\b(?:\d{1,3}\.){3}\d{1,3}(?:/\d{1,2})?|\b(?:\d{1,3}\.){3}\d{1,3}-\d{1,3}\b)$` // `` Have to be used instead of "" or the regex breaks

	// regex first boundary matches an IPV4 address and an additional optional CIDR notation -> (.1/24). OR an IPV4 address range with after a "-"
	match, err := regexp.MatchString(regex, nmapTarget)

	if err != nil {
		return false
	}
	return match
}

func performScan(target string) (dbcon.Scan, error) {
	fmt.Printf("performScan\n")
	if validNmapTarget(target) == false { //Validation of nmap parameters
		return dbcon.Scan{}, fmt.Errorf("invalid nmap target")
	}
	cmd := exec.Command("nmap", "-O", "-R", "-oX", "-", target)
	var stderr strings.Builder
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if err != nil {
		return dbcon.Scan{}, fmt.Errorf("%s: %s", err, stderr.String())
	}

	// Unmarshal XML to struct
	var nmaprun dbcon.Nmaprun
	err = xml.Unmarshal(out, &nmaprun)
	if err != nil {
		return dbcon.Scan{}, fmt.Errorf("xml.Unmarshal: %s", err)
	}

	scan := dbcon.Scan{
		StateID:     "", // Replace with actual state ID
		DateCreated: time.Now().Format("2006-01-02 15:04:05"),
		DateUpdated: time.Now().Format("2006-01-02 15:04:05"),
		State:       make(map[string]dbcon.Asset),
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
		scan.State[ipv4] = dbcon.Asset{
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

func postNetScan(db dbcon.DatabaseHelper, c *gin.Context) {
	var req dbcon.ScanRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("Starting to scan...\n")
	// Perform the scan for each target in the request
	for target := range req.IPRanges {
		scanResult, err := performScan(target)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		fillWithRandomMACAddresses(&scanResult) // This is a tmp function to fill the MAC addresses

		scanResultGlobal = scanResult
	}

	fmt.Printf("Finished postNetScan\n")

	dbcon.AddScan(db, scanResultGlobal)

	c.JSON(http.StatusOK, gin.H{"message": "Scan performed successfully", "success": true})
}
