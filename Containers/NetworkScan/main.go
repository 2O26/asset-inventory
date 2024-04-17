package main

import (
	dbcon "assetinventory/networkscan/dbcon-networkscan"
	"fmt"
	"log"
	"net"
	"net/http"
	"regexp"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sony/sonyflake"
	"golang.org/x/net/icmp"
	"golang.org/x/net/ipv4"
)

// Global variable to store the scan result
var scanResultGlobal dbcon.Scan

var flake, _ = sonyflake.New(sonyflake.Settings{
	StartTime: time.Date(2023, 6, 1, 7, 15, 20, 0, time.UTC),
})

func printActiveIPs(scan dbcon.Scan) { // This is a tmp function
	fmt.Println("Active IP addresses:")
	for ip := range scan.State {
		fmt.Println(ip)
	}
}

var (
	counter int
	mu      sync.Mutex
)

func nextID() int {
	mu.Lock()
	defer mu.Unlock()
	counter++
	return counter
}

// Create a map to store the unique ID and sequence number of each request
var requests = make(map[int]chan bool)

// ping sends an ICMP echo request (ping) to the specified IP address and waits for a response.
// It returns a boolean value indicating whether the host is up (true) or down (false), and an error value.
//
// The function works as follows:
// 1. It opens a raw ICMP network connection.
// 2. It resolves the IP address of the target host.
// 3. It creates an ICMP echo message (a "ping" request).
// 4. It sends the ICMP echo message to the target host.
// 5. It waits for a response from the target host within a specified timeout (10 seconds).
// 6. If a response is received within the timeout, it checks if the response is an ICMP echo reply (a "pong").
// 7. If the response is an ICMP echo reply, the function returns true, indicating that the host is up.
// 8. If no response is received within the timeout, or if the response is not an ICMP echo reply, the function returns false, indicating that the host is not up.
//
// The function will return false without an error if it doesn't receive a response from the target host within the timeout.
func ping(addr string) (bool, error) {
	fmt.Println("Starting ping")

	c, err := icmp.ListenPacket("ip4:icmp", "0.0.0.0")
	if err != nil {
		return false, err
	}
	defer c.Close()

	fmt.Println("Resolved IP address")

	dst, err := net.ResolveIPAddr("ip4", addr)
	if err != nil {
		return false, err
	}

	// Generate a unique ID for this echo request
	id := nextID()

	wm := icmp.Message{
		Type: ipv4.ICMPTypeEcho, Code: 0,
		Body: &icmp.Echo{
			ID: int(id & 0xffff), Seq: 1, // Use the unique ID here
			Data: []byte(""),
		},
	}

	wb, err := wm.Marshal(nil)
	if err != nil {
		return false, err
	}

	fmt.Println("Sent ICMP message")

	if _, err = c.WriteTo(wb, dst); err != nil {
		return false, err
	}

	rb := make([]byte, 1500)
	err = c.SetReadDeadline(time.Now().Add(5 * time.Second)) //Changed from 5 seconds to 2 to speed up scan
	if err != nil {
		return false, err
	}

	fmt.Println("Waiting for response")

	for {
		n, _, err := c.ReadFrom(rb)
		if err != nil {
			if neterr, ok := err.(net.Error); ok && neterr.Timeout() {
				fmt.Println("Read timeout, no response received")
				return false, nil // Return false if no response was received
			} else {
				return false, err
			}
		}

		fmt.Println("Received response")

		rm, err := icmp.ParseMessage(ipv4.ICMPTypeEchoReply.Protocol(), rb[:n])
		if err != nil {
			return false, err
		}

		switch rm.Type {
		case ipv4.ICMPTypeEchoReply:
			if rm.Body.(*icmp.Echo).ID == int(id&0xffff) {
				fmt.Println("Received echo reply")
				return true, nil
			}
		}
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
	router.GET("/PrintAllDocuments", func(c *gin.Context) {
		dbcon.PrintAllDocuments(scansHelper, c)
	})

	router.GET("/DeleteAllDocuments", func(c *gin.Context) {
		dbcon.DeleteAllDocuments(scansHelper, c)
	})
	log.Println("Server starting on port 8081...")
	if err := router.Run(":8081"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// OBS!!! THIS IS CURRENTLY NOT IN USE WE NEED TO CONNECT THE CODE
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

const maxPort = 65535

type pingResult struct {
	ip   net.IP
	isUp bool
	err  error
}

func getNetworkAndBroadcastAddresses(target string) (net.IP, net.IP, *net.IPNet, error) {
	// Split the target into IP and subnet
	ip, subnet, err := net.ParseCIDR(target)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("invalid target: %s", err)
	}
	fmt.Printf("Parsed CIDR: IP: %s, Subnet: %s\n", ip, subnet)

	// Get the network and broadcast addresses
	networkAddress := subnet.IP
	broadcastAddress := make(net.IP, len(networkAddress))
	for i := range networkAddress {
		broadcastAddress[i] = networkAddress[i] | ^subnet.Mask[i]
	}
	fmt.Printf("Network Address: %s, Broadcast Address: %s\n", networkAddress, broadcastAddress)

	return networkAddress, broadcastAddress, subnet, nil
}

func performSimpleScan(target string) (dbcon.Scan, error) {
	fmt.Printf("Starting scan for target: %s\n", target)

	networkAddress, _, subnet, err := getNetworkAndBroadcastAddresses(target)
	if err != nil {
		return dbcon.Scan{}, err
	}

	// Create a new scan
	scan := dbcon.Scan{
		StateID:     "", // Replace with actual state ID
		DateCreated: time.Now().Format("2006-01-02 15:04:05"),
		DateUpdated: time.Now().Format("2006-01-02 15:04:05"),
		State:       make(map[string]dbcon.Asset),
	}
	fmt.Println("Scan object created")

	// Create a channel to communicate the ping results
	pingResults := make(chan pingResult)
	fmt.Println("Ping results channel created")

	var wg sync.WaitGroup
	fmt.Println("WaitGroup created")

	// Start a new goroutine for each IP address in the subnet
	for ip := cloneIP(networkAddress); subnet.Contains(ip); inc(ip) {
		wg.Add(1)
		go func(ip net.IP) {
			defer wg.Done()
			isUp, err := ping(ip.String())
			if err != nil {
				fmt.Println("Error pinging: ", ip, " Error: ", err)
			} else if isUp {
				fmt.Println("Finished ping for: ", ip, " with status: ", isUp)
				pingResults <- pingResult{ip: ip, isUp: isUp, err: err}
			}
		}(cloneIP(ip))
	}
	fmt.Println("Started goroutines for each IP")

	// Wait for all goroutines to finish
	go func() {
		wg.Wait()
		close(pingResults)
	}()
	fmt.Println("Waiting for all goroutines to finish")

	// Iterate over the ping results
	for result := range pingResults {
		if result.err != nil {
			fmt.Printf("Error pinging IP: %s: %v\n", result.ip, result.err)
			continue
		}

		// Update the status of the IP address in the scan
		status := "down"
		if result.isUp {
			status = "up"
			asset, err := createAsset(status, result.ip.String(), target)
			if err != nil {
				fmt.Printf("Error creating asset: %v\n", err)
				return dbcon.Scan{}, err
			}
			scan.State[asset.UID] = asset
		}

	}

	fmt.Println("Finished scanning")
	return scan, nil
}

func performAdvancedScan(target string) (dbcon.Scan, error) {
	fmt.Println("Entered performAdvancedScan function")

	networkAddress, _, subnet, err := getNetworkAndBroadcastAddresses(target)
	println("Network address: ", networkAddress, " Subnet: ", subnet)
	if err != nil {
		return dbcon.Scan{}, err
	}

	// Create a new scan
	scan := dbcon.Scan{
		StateID:     "", // Replace with actual state ID
		DateCreated: time.Now().Format("2006-01-02 15:04:05"),
		DateUpdated: time.Now().Format("2006-01-02 15:04:05"),
		State:       make(map[string]dbcon.Asset),
	}
	fmt.Println("Scan object created")

	for ip := cloneIP(networkAddress); subnet.Contains(ip); inc(ip) {
		var openPorts []int

		// Check if IP address is up and discover open ports
		for port := 0; port <= 1024; port++ {
			address := fmt.Sprintf("%s:%d", ip.String(), port)
			conn, err := net.DialTimeout("tcp", address, time.Second*20)
			println("Connection: ", conn, " Error: ", err) // Added println
			if err != nil {
				fmt.Printf("Port %d is closed or filtered\n", port)
				continue
			}
			conn.Close()
			fmt.Printf("Port %d is open\n", port)

			// Add the open port to the openPorts slice
			openPorts = append(openPorts, port)
		}

		// Create an asset if any open ports were found
		if len(openPorts) > 0 {
			asset, err := createAsset("up", ip.String(), target)
			if err != nil {
				fmt.Printf("Failed to create asset for IP %s: %v\n", ip.String(), err)
				continue
			}

			// Add the open ports to the asset's OpenPorts field
			asset.OpenPorts = openPorts

			scan.State[asset.UID] = asset
		}
	}

	return scan, nil
}
func getNetworkInterface() (*net.Interface, error) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp != 0 && iface.Flags&net.FlagLoopback == 0 {
			return &iface, nil
		}
	}

	return nil, fmt.Errorf("no active network interface found")
}

func createAsset(status string, ip string, target string) (dbcon.Asset, error) {
	nextU, err := flake.NextID()
	if err != nil {
		return dbcon.Asset{}, err
	}
	next := strconv.FormatUint(nextU, 10)

	asset := dbcon.Asset{
		UID:       next,
		Status:    status,
		IPv4Addr:  ip,
		Subnet:    target,
		OpenPorts: []int{},
	}

	return asset, nil
}

func cloneIP(ip net.IP) net.IP {
	dup := make(net.IP, len(ip))
	copy(dup, ip)
	return dup
}

func inc(ip net.IP) {
	for j := len(ip) - 1; j >= 0; j-- {
		ip[j]++
		if ip[j] > 0 {
			break
		}
	}
}

func postNetScan(db dbcon.DatabaseHelper, c *gin.Context) {
	var req dbcon.ScanRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Failed to bind JSON: %+v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to bind JSON"})
		return
	}

	log.Printf("Received request: %+v\n", req)

	log.Printf("Starting to scan...\n")

	// Perform the scan for each target in the request
	for _, target := range req.IPRanges {

		var err error

		switch req.CmdSelection {
		case "extensive":
			scanResultGlobal, err = performAdvancedScan(target)
		case "simple":
			scanResultGlobal, err = performSimpleScan(target)
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "No valid scan selection provided"})
			return
		}

		if err != nil {
			log.Printf("Failed to perform scan: %+v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to perform scan"})
			return
		}

		printActiveIPs(scanResultGlobal) // Print the active IP addresses
	}

	log.Printf("Finished postNetScan\n")

	dbcon.AddScan(db, scanResultGlobal)

	c.JSON(http.StatusOK, gin.H{"message": "Scan performed successfully", "success": true})
}
