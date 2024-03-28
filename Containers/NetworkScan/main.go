package main

import (
	dbcon "assetinventory/networkscan/dbcon-networkscan"
	"fmt"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"regexp"
	"time"
	"net"
    "golang.org/x/net/icmp"
    "golang.org/x/net/ipv4"
    "os"
)

// Global variable to store the scan result
var scanResultGlobal dbcon.Scan

func printActiveIPs(scan dbcon.Scan) { // This is a tmp function
    fmt.Println("Active IP addresses:")
    for ip := range scan.State {
        fmt.Println(ip)
    }
}

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
    c, err := icmp.ListenPacket("ip4:icmp", "0.0.0.0")
    if err != nil {
        return false, err
    }
    defer c.Close()

    dst, err := net.ResolveIPAddr("ip4", addr)
    if err != nil {
        return false, err
    }

    wm := icmp.Message{
        Type: ipv4.ICMPTypeEcho, Code: 0,
        Body: &icmp.Echo{
            ID: os.Getpid() & 0xffff, Seq: 1,
            Data: []byte(""),
        },
    }

    wb, err := wm.Marshal(nil)
    if err != nil {
        return false, err
    }

    if _, err = c.WriteTo(wb, dst); err != nil {
        return false, err
    }

    rb := make([]byte, 1500)
    err = c.SetReadDeadline(time.Now().Add(5 * time.Second))
    if err != nil {
        return false, err
    }
    n, _, err := c.ReadFrom(rb)
    if err != nil {
        return false, nil // Return false if no response was received
    }

    rm, err := icmp.ParseMessage(ipv4.ICMPTypeEchoReply.Protocol(), rb[:n])
    if err != nil {
        return false, err
    }

    switch rm.Type {
    case ipv4.ICMPTypeEchoReply:
        return true, nil
    default:
        return false, fmt.Errorf("got %+v from %v; want echo reply", rm, dst)
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


func performScan(target string, cmdSelection string) (dbcon.Scan, error) {
    fmt.Printf("Starting scan for target: %s\n", target)

    // Split the target into IP and subnet
    ip, subnet, err := net.ParseCIDR(target)
    if err != nil {
        return dbcon.Scan{}, fmt.Errorf("invalid target: %s", err)
    }

    // Create a new scan
    scan := dbcon.Scan{
        StateID:     "", // Replace with actual state ID
        DateCreated: time.Now().Format("2006-01-02 15:04:05"),
        DateUpdated: time.Now().Format("2006-01-02 15:04:05"),
        State:       make(map[string]dbcon.Asset),
    }

    // Calculate the network address and the broadcast address
    networkAddress := ip.Mask(subnet.Mask)
    broadcastAddress := make(net.IP, len(networkAddress))
    for i := range networkAddress {
        broadcastAddress[i] = networkAddress[i] | ^subnet.Mask[i]
    }

    // Function to increment IP
    inc := func(ip net.IP) {
        for j := len(ip) - 1; j >= 0; j-- {
            ip[j]++
            if ip[j] > 0 {
                break
            }
        }
    }


       // Iterate over all IPs in the subnet
    for ; subnet.Contains(ip) && !ip.Equal(broadcastAddress); inc(ip) {

        // Check if the IP address is up
        isUp, err := ping(ip.String())
        if err != nil {
            fmt.Printf("Error pinging IP: %s: %v\n", ip, err)
            continue
        }

        // Update the status of the IP address in the scan
        status := "down"
        if isUp {
            status = "up"
        }
        asset := dbcon.Asset{
            Status:        status, // up means that the ip responded to the ping
            IPv4Addr:      ip.String(),
            IPv6Addr:      "", // IPv6 address is empty for now
            Subnet:        target, 
            Hostname:      "",     
            KernelVersion: "",     // OS information is empty for now
            MACAddr:       "",     // MAC address is empty for now
            OpenPorts:     []int{}, 
        }
        scan.State[ip.String()] = asset

        // Skip port scanning if CmdSelection is "simple" or the IP is down
        if cmdSelection != "simple" && isUp {
            // Iterate over all ports
            for port := 1; port <= 65535; port++ {
                // Try to connect to the IP on the current port
                conn, err := net.DialTimeout("tcp", fmt.Sprintf("%s:%d", ip, port), time.Second)
                if err != nil {
                    // If the connection failed, the port is probably closed
                    continue
                }
                conn.Close()

                // If the connection succeeded, the port is open
                fmt.Printf("Open port found: %d\n", port)
                // Get the asset from the map
                asset := scan.State[ip.String()]

                // Append the open port
                asset.OpenPorts = append(asset.OpenPorts, port)

                // Put the modified asset back into the map
                scan.State[ip.String()] = asset
            }
        }
    }

    fmt.Printf("Scan completed for target: %s\n", target)
    return scan, nil
}

func postNetScan(db dbcon.DatabaseHelper, c *gin.Context) {
    var req dbcon.ScanRequest

    if err := c.ShouldBindJSON(&req); err != nil {
        fmt.Printf("Error 1: %+v\n", err)
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Print the request body
    fmt.Printf("Received request: %+v\n", req)

    fmt.Printf("Starting to scan...\n")
    // Perform the scan for each target in the request
    for target := range req.IPRanges {
        scanResult, err := performScan(target, req.CmdSelection)
        if err != nil {
            fmt.Printf("Error 2: %+v\n", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }


        scanResultGlobal = scanResult
        printActiveIPs(scanResult) // Print the active IP addresses
    }

    fmt.Printf("Finished postNetScan\n")

    dbcon.AddScan(db, scanResultGlobal)

    c.JSON(http.StatusOK, gin.H{"message": "Scan performed successfully", "success": true})
}
