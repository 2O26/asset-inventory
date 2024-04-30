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

var ports = []int{1, 3, 4, 6, 7, 9, 13, 17, 19, 20, 21, 22, 23, 24, 25, 26, 30, 32, 33, 37, 42, 43, 49, 53, 70, 79, 80, 81, 82, 83, 84, 85, 88, 89, 90, 99, 100, 106, 109, 110, 111, 113, 119, 125, 135, 139, 143, 144, 146, 161, 163, 179, 199, 211, 212, 222, 254, 255, 256, 259, 264, 280, 301, 306, 311, 340, 366, 389, 406, 407, 416, 417, 425, 427, 443, 444, 445, 458, 464, 465, 481, 497, 500, 512, 513, 514, 515, 524, 541, 543, 544, 545, 548, 554, 555, 563, 587, 593, 616, 617, 625, 631, 636, 646, 648, 666, 667, 668, 683, 687, 691, 700, 705, 711, 714, 720, 722, 726, 749, 765, 777, 783, 787, 800, 801, 808, 843, 873, 880, 888, 898, 900, 901, 902, 903, 911, 912, 981, 987, 990, 992, 993, 995, 999, 1000, 1001, 1002, 1007, 1009, 1010, 1011, 1021, 1022, 1023, 1024, 1025, 1026, 1027, 1028, 1029, 1030, 1031, 1032, 1033, 1034, 1035, 1036, 1037, 1038, 1039, 1040, 1041, 1042, 1043, 1044, 1045, 1046, 1047, 1048, 1049, 1050, 1051, 1052, 1053, 1054, 1055, 1056, 1057, 1058, 1059, 1060, 1061, 1062, 1063, 1064, 1065, 1066, 1067, 1068, 1069, 1070, 1071, 1072, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1088, 1089, 1090, 1091, 1092, 1093, 1094, 1095, 1096, 1097, 1098, 1099, 1100, 1102, 1104, 1105, 1106, 1107, 1108, 1110, 1111, 1112, 1113, 1114, 1117, 1119, 1121, 1122, 1123, 1124, 1126, 1130, 1131, 1132, 1137, 1138, 1141, 1145, 1147, 1148, 1149, 1151, 1152, 1154, 1163, 1164, 1165, 1166, 1169, 1174, 1175, 1183, 1185, 1186, 1187, 1192, 1198, 1199, 1201, 1213, 1216, 1217, 1218, 1233, 1234, 1236, 1244, 1247, 1248, 1259, 1271, 1272, 1277, 1287, 1296, 1300, 1301, 1309, 1310, 1311, 1322, 1328, 1334, 1352, 1417, 1433, 1434, 1443, 1455, 1461, 1494, 1500, 1501, 1503, 1521, 1524, 1533, 1556, 1580, 1583, 1594, 1600, 1641, 1658, 1666, 1687, 1688, 1700, 1717, 1718, 1719, 1720, 1721, 1723, 1755, 1761, 1782, 1783, 1801, 1805, 1812, 1839, 1840, 1862, 1863, 1864, 1875, 1900, 1914, 1935, 1947, 1971, 1972, 1974, 1984, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2013, 2020, 2021, 2022, 2030, 2033, 2034, 2035, 2038, 2040, 2041, 2042, 2043, 2045, 2046, 2047, 2048, 2049, 2065, 2068, 2099, 2100, 2103, 2105, 2106, 2107, 2111, 2119, 2121, 2126, 2135, 2144, 2160, 2161, 2170, 2179, 2190, 2191, 2196, 2200, 2222, 2251, 2260, 2288, 2301, 2323, 2366, 2381, 2382, 2383, 2393, 2394, 2399, 2401, 2492, 2500, 2522, 2525, 2557, 2601, 2602, 2604, 2605, 2607, 2608, 2638, 2701, 2702, 2710, 2717, 2718, 2725, 2800, 2809, 2811, 2869, 2875, 2909, 2910, 2920, 2967, 2968, 2998, 3000, 3001, 3003, 3005, 3006, 3007, 3011, 3013, 3017, 3030, 3031, 3052, 3071, 3077, 3128, 3168, 3211, 3221, 3260, 3261, 3268, 3269, 3283, 3300, 3301, 3306, 3322, 3323, 3324, 3325, 3333, 3351, 3367, 3369, 3370, 3371, 3372, 3389, 3390, 3404, 3476, 3493, 3517, 3527, 3546, 3551, 3580, 3659, 3689, 3690, 3703, 3737, 3766, 3784, 3800, 3801, 3809, 3814, 3826, 3827, 3828, 3851, 3869, 3871, 3878, 3880, 3889, 3905, 3914, 3918, 3920, 3945, 3971, 3986, 3995, 3998, 4000, 4001, 4002, 4003, 4004, 4005, 4006, 4045, 4111, 4125, 4126, 4129, 4224, 4242, 4279, 4321, 4343, 4443, 4444, 4445, 4446, 4449, 4550, 4567, 4662, 4848, 4899, 4900, 4998, 5000, 5001, 5002, 5003, 5004, 5009, 5030, 5033, 5050, 5051, 5054, 5060, 5061, 5080, 5087, 5100, 5101, 5102, 5120, 5190, 5200, 5214, 5221, 5222, 5225, 5226, 5269, 5280, 5298, 5357, 5405, 5414, 5431, 5432, 5440, 5500, 5510, 5544, 5550, 5555, 5560, 5566, 5631, 5633, 5666, 5678, 5679, 5718, 5730, 5800, 5801, 5802, 5810, 5811, 5815, 5822, 5825, 5850, 5859, 5862, 5877, 5900, 5901, 5902, 5903, 5904, 5906, 5907, 5910, 5911, 5915, 5922, 5925, 5950, 5952, 5959, 5960, 5961, 5962, 5963, 5987, 5988, 5989, 5998, 5999, 6000, 6001, 6002, 6003, 6004, 6005, 6006, 6007, 6009, 6025, 6059, 6100, 6101, 6106, 6112, 6123, 6129, 6156, 6346, 6389, 6502, 6510, 6543, 6547, 6565, 6566, 6567, 6580, 6646, 6666, 6667, 6668, 6669, 6689, 6692, 6699, 6779, 6788, 6789, 6792, 6839, 6881, 6901, 6969, 7000, 7001, 7002, 7004, 7007, 7019, 7025, 7070, 7100, 7103, 7106, 7200, 7201, 7402, 7435, 7443, 7496, 7512, 7625, 7627, 7676, 7741, 7777, 7778, 7800, 7911, 7920, 7921, 7937, 7938, 7999, 8000, 8001, 8002, 8007, 8008, 8009, 8010, 8011, 8021, 8022, 8031, 8042, 8045, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8090, 8093, 8099, 8100, 8180, 8181, 8192, 8193, 8194, 8200, 8222, 8254, 8290, 8291, 8292, 8300, 8333, 8383, 8400, 8402, 8443, 8500, 8600, 8649, 8651, 8652, 8654, 8701, 8800, 8873, 8888, 8899, 8994, 9000, 9001, 9002, 9003, 9009, 9010, 9011, 9040, 9050, 9071, 9080, 9081, 9090, 9091, 9099, 9100, 9101, 9102, 9103, 9110, 9111, 9200, 9207, 9220, 9290, 9415, 9418, 9485, 9500, 9502, 9503, 9535, 9575, 9593, 9594, 9595, 9618, 9666, 9876, 9877, 9878, 9898, 9900, 9917, 9929, 9943, 9944, 9968, 9998, 9999, 10000, 10001, 10002, 10003, 10004, 10009, 10010, 10012, 10024, 10025, 10082, 10180, 10215, 10243, 10566, 10616, 10617, 10621, 10626, 10628, 10629, 10778, 11110, 11111, 11967, 12000, 12174, 12265, 12345, 13456, 13722, 13782, 13783, 14000, 14238, 14441, 14442, 15000, 15002, 15003, 15004, 15660, 15742, 16000, 16001, 16012, 16016, 16018, 16080, 16113, 16992, 16993, 17877, 17988, 18040, 18101, 18988, 19101, 19283, 19315, 19350, 19780, 19801, 19842, 20000, 20005, 20031, 20221, 20222, 20828, 21571, 22939, 23502, 24444, 24800, 25734, 25735, 26214, 27000, 27352, 27353, 27355, 27356, 27715, 28201, 30000, 30718, 30951, 31038, 31337, 32768, 32769, 32770, 32771, 32772, 32773, 32774, 32775, 32776, 32777, 32778, 32779, 32780, 32781, 32782, 32783, 32784, 32785, 33354, 33899, 34571, 34572, 34573, 35500, 38292, 40193, 40911, 41511, 42510, 44176, 44442, 44443, 44501, 45100, 48080, 49152, 49153, 49154, 49155, 49156, 49157, 49158, 49159, 49160, 49161, 49163, 49165, 49167, 49175, 49176, 49400, 49999, 50000, 50001, 50002, 50003, 50006, 50300, 50389, 50500, 50636, 50800, 51103, 51493, 52673, 52822, 52848, 52869, 54045, 54328, 55055, 55056, 55555, 55600, 56737, 56738, 57294, 57797, 58080, 60020, 60443, 61532, 61900, 62078, 63331, 64623, 64680, 65000, 65129, 65389}

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

	router.POST("/deleteAsset", func(c *gin.Context) {
		deleteAsset(scansHelper, c)
	})

	log.Println("Server starting on port 8081...")
	if err := router.Run(":8081"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func deleteAsset(db dbcon.DatabaseHelper, c *gin.Context) {
	assetIDs := c.PostFormArray("assetID")
	err := dbcon.DeleteAsset(db, assetIDs)
	if err != nil {
		log.Println("Failed to remove netscan asset with ID(s)", assetIDs, "from database. Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to remove netscan asset from database.",
		})
		return
	}
	log.Println("Asset(s) with ID(s) ", assetIDs, "removed.")
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Netscan asset removed."),
	})
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
		DateCreated: time.Now().Format(time.RFC3339),
		DateUpdated: time.Now().Format(time.RFC3339),
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
			asset, err := createAsset(status, result.ip.String(), target, "simple")
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
	nextU, err := flake.NextID()
	if err != nil {
		return dbcon.Scan{}, err
	}
	next := strconv.FormatUint(nextU, 10)
	scan := dbcon.Scan{
		StateID:     next, // Replace with actual state ID
		DateCreated: time.Now().Format(time.RFC3339),
		DateUpdated: time.Now().Format(time.RFC3339),
		State:       make(map[string]dbcon.Asset),
	}
	fmt.Println("Scan object created")

	// Create channels for tasks and results
	tasks := make(chan net.IP, 256)
	results := make(chan dbcon.Asset, 256)

	// Create a WaitGroup to wait for all workers to finish
	var wg sync.WaitGroup

	// Start workers
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for ip := range tasks {
				asset, err := scanIP(ip, target)
				if err != nil {
					log.Printf("Failed to scan IP %s: %v", ip, err)
					continue
				}
				results <- asset
			}
		}()
	}

	// Send tasks
	go func() {
		ip := cloneIP(networkAddress)
		for subnet.Contains(ip) {
			tasks <- cloneIP(ip) // clone the IP before sending it as a task
			inc(ip)
		}
		close(tasks)
	}()

	// Wait for all workers to finish and close the results channel
	go func() {
		wg.Wait()
		close(results)
	}()

	// Collect results
	for asset := range results {
		scan.State[asset.UID] = asset
	}

	return scan, nil
}

func scanIP(ip net.IP, target string) (dbcon.Asset, error) {
	var openPorts []int
	var wg sync.WaitGroup
	portChan := make(chan int, len(ports))

	// Check if IP address is up and discover open ports
	for _, port := range ports {
		wg.Add(1)
		go func(port int) {
			defer wg.Done()
			address := fmt.Sprintf("%s:%d", ip.String(), port)
			conn, err := net.DialTimeout("tcp", address, time.Second*10)
			if err != nil {
				fmt.Printf("Port %d is closed or filtered\n", port)
				return
			}
			conn.Close()
			fmt.Printf("Port %d is open\n", port)
			portChan <- port
		}(port)
	}

	// Wait for all port scans to finish and close the channel
	go func() {
		wg.Wait()
		close(portChan)
	}()

	// Collect open ports
	for port := range portChan {
		openPorts = append(openPorts, port)
	}

	// Create an asset if any open ports were found
	if len(openPorts) > 0 {
		asset, err := createAsset("up", ip.String(), target, "extensive")
		if err != nil {
			fmt.Printf("Failed to create asset for IP %s: %v\n", ip.String(), err)
			return dbcon.Asset{}, err
		}

		// Add the open ports to the asset's OpenPorts field
		asset.OpenPorts = openPorts

		return asset, nil
	}

	return dbcon.Asset{}, fmt.Errorf("No open ports found on IP %s", ip)
}

func createAsset(status string, ip string, target string, scanType string) (dbcon.Asset, error) {
	nextU, err := flake.NextID()
	if err != nil {
		return dbcon.Asset{}, err
	}
	next := strconv.FormatUint(nextU, 10)

	asset := dbcon.Asset{
		UID:            next,
		Status:         status,
		IPv4Addr:       ip,
		Subnet:         target,
		OpenPorts:      []int{},
		ScanType:       scanType,
		LastDiscovered: time.Now().Format(time.RFC3339),
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
