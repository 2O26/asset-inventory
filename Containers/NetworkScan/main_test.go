package main

import (
	dbcon "assetinventory/networkscan/dbcon-networkscan"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"reflect"
	"sync"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/mongo"
)

var testScan1 = dbcon.Scan{
	StateID:     "",
	DateCreated: "2024-04-25 11:33:31",
	DateUpdated: "2024-04-25 11:33:36",
	State: map[string]dbcon.Asset{
		"47716233453240327": {
			IPv4Addr:  "192.168.1.12",
			OpenPorts: []int{},
			ScanType:  "simple",
			Status:    "up",
			Subnet:    "192.168.1.0/24",
			UID:       "47716233453240327",
		},
		"47716233537126407": {
			IPv4Addr:  "192.168.1.115",
			OpenPorts: []int{},
			ScanType:  "simple",
			Status:    "up",
			Subnet:    "192.168.1.0/24",
			UID:       "47716233537126407",
		},
		"47716234560536583": {
			IPv4Addr:  "192.168.1.58",
			OpenPorts: []int{},
			ScanType:  "simple",
			Status:    "up",
			Subnet:    "192.168.1.0/24",
			UID:       "47716234560536583",
		},
		"47716234560536590": {
			IPv4Addr:  "10.10.1.10",
			OpenPorts: []int{},
			ScanType:  "simple",
			Status:    "up",
			Subnet:    "10.10.1.0/24",
			UID:       "47716234560536590",
		},
		"47716234560536588": {
			IPv4Addr:  "192.168.1.59",
			OpenPorts: []int{},
			ScanType:  "simple",
			Status:    "down",
			Subnet:    "192.168.1.0/24",
			UID:       "47716234560536588",
		},
	},
}

func TestValidNmapTarget(t *testing.T) {
	tests := []struct {
		target string
		result bool
	}{
		{"192.168.1.49", true},
		{"192.168.1.0/24", true},
		{"172.15.1.1-100", true},
		{"10.10.1.145", true},
		{"0.0.0.0", true},
		{"0.255.255.255", true},
		{"10.0.0.0/8", true},
		{"1.0.0.0", true},
		{"172.15.1.1-172.15.1.100", false},
		{"a string", false},
		{"a.st.ri.ng", false},
		{"a.st.ri.ng/24", false},
		{"a.st.ri.ng-100", false},
		{"", false},
		{"2001:db8::1", false},
		{"`172.15.1.1-100` ; DROP TABLE users; -- ", false},
	}

	for _, test := range tests {
		valid := validNmapTarget(test.target)
		if valid != test.result {
			t.Errorf("nmap Target: %s is %t it should be %t", test.target, valid, test.result)
		}
	}
}

func TestCORSMiddleware(t *testing.T) {
	router := gin.New()
	router.Use(CORSMiddleware())

	router.GET("/test-cors", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Test preflight request
	w := httptest.NewRecorder()
	req, err := http.NewRequest("OPTIONS", "/test-cors", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	router.ServeHTTP(w, req)

	// Check the status code for OPTIONS request
	if w.Code != http.StatusNoContent {
		t.Errorf("Expected HTTP status %d for OPTIONS request, got %d", http.StatusNoContent, w.Code)
	}

	// Test simple GET request
	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/test-cors", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	router.ServeHTTP(w, req)

	// Check the status code for GET request
	if w.Code != http.StatusOK {
		t.Errorf("Expected HTTP status %d for GET request, got %d", http.StatusOK, w.Code)
	}

	// Check CORS headers
	headers := w.Header()
	if headers.Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("Expected Access-Control-Allow-Origin header to be '*', got '%s'", headers.Get("Access-Control-Allow-Origin"))
	}
	if headers.Get("Access-Control-Allow-Credentials") != "true" {
		t.Errorf("Expected Access-Control-Allow-Credentials header to be 'true', got '%s'", headers.Get("Access-Control-Allow-Credentials"))
	}
	if headers.Get("Access-Control-Allow-Headers") != "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With" {
		t.Errorf("Expected Access-Control-Allow-Headers header to be '%s', got '%s'", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With", headers.Get("Access-Control-Allow-Headers"))
	}
	if headers.Get("Access-Control-Allow-Methods") != "POST, OPTIONS, GET, PUT" {
		t.Errorf("Expected Access-Control-Allow-Methods header to be 'POST, OPTIONS, GET, PUT', got '%s'", headers.Get("Access-Control-Allow-Methods"))
	}
}

func TestGetNetworkAndBroadcastAddresses(t *testing.T) {
	testCases := []struct {
		name            string
		input           string
		expectedNetwork net.IP
		expectedBroad   net.IP
		expectedSubnet  *net.IPNet
		expectErr       bool
	}{
		{
			name:            "Valid IPv4 CIDR",
			input:           "127.0.0.1/24",
			expectedNetwork: net.ParseIP("127.0.0.0"),
			expectedBroad:   net.ParseIP("127.0.0.255"),
			expectedSubnet:  &net.IPNet{IP: net.ParseIP("127.0.0.0"), Mask: net.IPv4Mask(255, 255, 255, 0)},
			expectErr:       false,
		},
		{
			name:      "Invalid CIDR",
			input:     "invalid",
			expectErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			network, broad, subnet, err := getNetworkAndBroadcastAddresses(tc.input)
			if tc.expectErr && err == nil {
				t.Errorf("Expected error, but got nil")
			} else if !tc.expectErr && err != nil {
				t.Errorf("Unexpected error: %v", err)
			} else if !tc.expectErr {
				if !network.Equal(tc.expectedNetwork) {
					t.Errorf("Network address mismatch. Expected: %s, Got: %s", tc.expectedNetwork, network)
				}
				if !broad.Equal(tc.expectedBroad) {
					t.Errorf("Broadcast address mismatch. Expected: %s, Got: %s", tc.expectedBroad, broad)
				}
				if !subnet.IP.Equal(tc.expectedSubnet.IP) || !bytes.Equal(subnet.Mask, tc.expectedSubnet.Mask) {
					t.Errorf("Subnet mismatch. Expected: %s, Got: %s", tc.expectedSubnet, subnet)
				}
			}
		})
	}
}

func TestCloneIP(t *testing.T) {
	testCases := []struct {
		name     string
		input    net.IP
		expected net.IP
	}{
		{
			name:     "Clone IPv4 address",
			input:    net.ParseIP("127.0.0.1"),
			expected: net.ParseIP("127.0.0.1"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			cloned := cloneIP(tc.input)
			if !cloned.Equal(tc.expected) {
				t.Errorf("Expected %s, got %s", tc.expected, cloned)
			}
		})
	}
}
func TestPerformAdvancedScan(t *testing.T) {
	testCases := []struct {
		name     string
		target   string
		expected dbcon.Scan
	}{
		{
			name:   "Perform IPv4 scan",
			target: "127.0.0.1/32",
			expected: dbcon.Scan{
				StateID:     "",
				DateCreated: time.Now().Format(time.RFC3339),
				DateUpdated: time.Now().Format(time.RFC3339),
				State:       make(map[string]dbcon.Asset),
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			scan, err := performAdvancedScan(tc.target)
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
			}

			if !reflect.DeepEqual(scan.DateCreated, tc.expected.DateCreated) {
				t.Errorf("DateCreated mismatch. Expected: %s, Got: %s", tc.expected.DateCreated, scan.DateCreated)
			}
			if !reflect.DeepEqual(scan.DateUpdated, tc.expected.DateUpdated) {
				t.Errorf("DateUpdated mismatch. Expected: %s, Got: %s", tc.expected.DateUpdated, scan.DateUpdated)
			}

		})
	}
}

func TestPrintActiveIPs(t *testing.T) {
	testCases := []struct {
		name string
		scan dbcon.Scan
	}{
		{
			name: "No active IPs",
			scan: dbcon.Scan{
				State: make(map[string]dbcon.Asset),
			},
		},
		{
			name: "Multiple active IPs",
			scan: dbcon.Scan{
				State: map[string]dbcon.Asset{
					"192.168.1.100": {IPv4Addr: "192.168.1.100"},
					"192.168.1.101": {IPv4Addr: "192.168.1.101"},
					"192.168.1.102": {IPv4Addr: "192.168.1.102"},
				},
			},
		},
	}

	for _, tc := range testCases {

		t.Run(tc.name, func(t *testing.T) {

			printActiveIPs(tc.scan)

		})
	}
}

// The program need to be up for the test to pass
func TestPostNetScan(t *testing.T) {
	testCases := []struct {
		name            string
		body            dbcon.ScanRequest
		payload         []byte
		expectedStatus  int
		expectedError   string
		authenticated   bool
		isAdmin         bool
		canManageAssets bool
	}{
		{
			name: "Valid extensive scan",
			body: dbcon.ScanRequest{
				CmdSelection: "extensive",
				IPRanges:     []string{"127.0.0.1/32"},
			},
			expectedStatus:  http.StatusOK,
			expectedError:   "",
			authenticated:   true,
			isAdmin:         true,
			canManageAssets: false,
		},
		{
			name: "Valid simple scan",
			body: dbcon.ScanRequest{
				CmdSelection: "simple",
				IPRanges:     []string{"127.0.0.1/32"},
			},
			expectedStatus:  http.StatusOK,
			expectedError:   "",
			authenticated:   true,
			isAdmin:         true,
			canManageAssets: false,
		},
		{
			name:            "Invalid body",
			payload:         []byte(`{"cmdSelection":1,"ipRanges":[127.0.0.1/32]}`),
			expectedStatus:  http.StatusBadRequest,
			expectedError:   "Failed to bind JSON",
			authenticated:   true,
			isAdmin:         true,
			canManageAssets: false,
		},
		{
			name: "Invalid request body",
			body: dbcon.ScanRequest{
				CmdSelection: "invalid",
				IPRanges:     []string{"127.0.0.1/32"},
			},
			expectedStatus:  http.StatusBadRequest,
			expectedError:   "No valid scan selection provided",
			authenticated:   true,
			isAdmin:         true,
			canManageAssets: false,
		},
		{
			name: "Invalid target",
			body: dbcon.ScanRequest{
				CmdSelection: "extensive",
				IPRanges:     []string{"invaled"},
			},
			expectedStatus:  http.StatusInternalServerError,
			expectedError:   "Failed to perform scan",
			authenticated:   true,
			isAdmin:         true,
			canManageAssets: false,
		},
	}
	url := "http://localhost:8080/updateNetscanAssets"
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			if tc.name == "Invalid body" {
				req, _ := http.NewRequest(http.MethodPost, "/scan", bytes.NewBuffer(tc.payload))
				c.Request = req
			} else {

				bodyBytes, _ := json.Marshal(tc.body)
				req, _ := http.NewRequest(http.MethodPost, "/scan", bytes.NewBuffer(bodyBytes))
				c.Request = req
			}
			mockDB := &dbcon.MockDB{}
			mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, nil, nil))
			mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, nil)
			auth := dbcon.AuthResponse{
				Authenticated:   tc.authenticated,
				Roles:           nil,
				IsAdmin:         tc.isAdmin,
				CanManageAssets: tc.canManageAssets,
			}

			postNetScan(mockDB, c, auth, url)

			if w.Code != tc.expectedStatus {
				t.Errorf("Expected status %d, got %d", tc.expectedStatus, w.Code)
			}

			var response struct {
				Error string `json:"error"`
			}
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				t.Errorf("Failed to unmarshal response body: %v", err)
			} else if response.Error != tc.expectedError {
				t.Errorf("Expected error '%s', got '%s'", tc.expectedError, response.Error)
			}
		})
	}
}

func TestRecurringScan(t *testing.T) {
	testCases := []struct {
		name           string
		body           dbcon.ScanRequest
		payload        []byte
		expectedStatus int
		expectedError  string
	}{
		{
			name: "Valid extensive scan",
			body: dbcon.ScanRequest{
				CmdSelection: "extensive",
				IPRanges:     []string{"127.0.0.1/32"},
			},
			expectedStatus: http.StatusOK,
			expectedError:  "",
		},
		{
			name: "Valid simple scan",
			body: dbcon.ScanRequest{
				CmdSelection: "simple",
				IPRanges:     []string{"127.0.0.1/32"},
			},
			expectedStatus: http.StatusOK,
			expectedError:  "",
		},
		{
			name:           "Invalid body",
			payload:        []byte(`{"cmdSelection":1,"ipRanges":[127.0.0.1/32]}`),
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Failed to bind JSON",
		},
		{
			name: "Invalid request body",
			body: dbcon.ScanRequest{
				CmdSelection: "invalid",
				IPRanges:     []string{"127.0.0.1/32"},
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "No valid scan selection provided",
		},
		{
			name: "Invalid target",
			body: dbcon.ScanRequest{
				CmdSelection: "extensive",
				IPRanges:     []string{"invaled"},
			},
			expectedStatus: http.StatusInternalServerError,
			expectedError:  "Failed to perform scan",
		},
	}
	url := "http://localhost:8080/updateNetscanAssets"
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			if tc.name == "Invalid body" {
				req, _ := http.NewRequest(http.MethodPost, "/scan", bytes.NewBuffer(tc.payload))
				c.Request = req
			} else {

				bodyBytes, _ := json.Marshal(tc.body)
				req, _ := http.NewRequest(http.MethodPost, "/scan", bytes.NewBuffer(bodyBytes))
				c.Request = req
			}
			mockDB := &dbcon.MockDB{}
			mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, nil, nil))
			mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, nil)

			recurringScan(mockDB, c, url)

			if w.Code != tc.expectedStatus {
				t.Errorf("Expected status %d, got %d", tc.expectedStatus, w.Code)
			}

			var response struct {
				Error string `json:"error"`
			}
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				t.Errorf("Failed to unmarshal response body: %v", err)
			} else if response.Error != tc.expectedError {
				t.Errorf("Expected error '%s', got '%s'", tc.expectedError, response.Error)
			}
		})
	}
}
func TestNextID(t *testing.T) {
	// Reset the counter for the test
	counter = 0

	// Test with a single goroutine
	id := nextID()
	if id != 1 {
		t.Errorf("Expected 1, got %d", id)
	}

	// Test with multiple goroutines
	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			nextID()
		}()
	}
	wg.Wait()

	// Check that the counter is 101 after 100 goroutines
	if counter != 101 {
		t.Errorf("Expected 101, got %d", counter)
	}
}

func TestCreateAsset(t *testing.T) {
	testCases := []struct {
		name      string
		status    string
		ip        string
		target    string
		scanType  string
		expectErr bool
	}{
		{
			name:      "Valid asset",
			status:    "open",
			ip:        "127.0.0.1",
			target:    "127.0.0.0/24",
			scanType:  "extensive",
			expectErr: false,
		},
		{
			name:      "Empty status",
			status:    "",
			ip:        "10.0.0.1",
			target:    "10.0.0.0/8",
			scanType:  "simple",
			expectErr: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			asset, err := createAsset(tc.status, tc.ip, tc.target, tc.scanType)
			if tc.expectErr && err == nil {
				t.Errorf("Expected error, but got nil")
			} else if !tc.expectErr && err != nil {
				t.Errorf("Unexpected error: %v", err)
			} else if !tc.expectErr {
				if asset.Status != tc.status {
					t.Errorf("Status mismatch. Expected: %s, Got: %s", tc.status, asset.Status)
				}
				if asset.IPv4Addr != tc.ip {
					t.Errorf("IP mismatch. Expected: %s, Got: %s", tc.ip, asset.IPv4Addr)
				}
				if asset.Subnet != tc.target {
					t.Errorf("Subnet mismatch. Expected: %s, Got: %s", tc.target, asset.Subnet)
				}
				if asset.ScanType != tc.scanType {
					t.Errorf("ScanType mismatch. Expected: %s, Got: %s", tc.scanType, asset.ScanType)
				}
			}
		})
	}
}

func TestDeleteAsset(t *testing.T) {
	testCases := []struct {
		name            string
		assetIDs        []string
		deleteErr       error
		mockSetup       func(*dbcon.MockDB)
		expectedStatus  int
		expectedMessage string
		authenticated   bool
		isAdmin         bool
		canManageAssets bool
	}{
		{
			name:      "Success",
			assetIDs:  []string{"47716233453240327"},
			deleteErr: nil,
			mockSetup: func(mockDB *dbcon.MockDB) {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, nil, nil))
				mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{InsertedID: "mockID"}, nil)
			},
			expectedStatus:  http.StatusOK,
			expectedMessage: "Netscan asset removed.",
			authenticated:   true,
			isAdmin:         true,
			canManageAssets: false,
		},
		{
			name:      "Asset not found",
			assetIDs:  []string{"47716233453240327"},
			deleteErr: errors.New("error while retrieving the latest scan"),
			mockSetup: func(mockDB *dbcon.MockDB) {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, errors.New("error while retrieving the latest scan"), nil))
			},
			expectedStatus:  http.StatusInternalServerError,
			expectedMessage: "Failed to remove netscan asset from database.",
			authenticated:   true,
			isAdmin:         true,
			canManageAssets: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			body := bytes.NewBufferString("assetID=47716233453240327")
			req, _ := http.NewRequest(http.MethodPost, "/deleteAsset", body)
			c.Request = req

			mockDB := new(dbcon.MockDB)
			tc.mockSetup(mockDB)
			auth := dbcon.AuthResponse{
				Authenticated:   tc.authenticated,
				Roles:           nil,
				IsAdmin:         tc.isAdmin,
				CanManageAssets: tc.canManageAssets,
			}

			deleteAsset(mockDB, c, auth)

			if w.Code != tc.expectedStatus {
				t.Errorf("Expected status %d, got %d", tc.expectedStatus, w.Code)
			}

			respBody := w.Body.String()
			var expected string
			if tc.expectedStatus == http.StatusOK {
				expected = fmt.Sprintf(`{"message":"%s"}`, tc.expectedMessage)
			} else {
				expected = fmt.Sprintf(`{"error":"%s"}`, tc.expectedMessage)
			}

			if respBody != expected {
				t.Errorf("Expected response body '%s', got '%s'", expected, respBody)
			}
		})
	}
}

func TestScanIP(t *testing.T) {
	testCases := []struct {
		name          string
		ip            net.IP
		target        string
		expectedAsset dbcon.Asset
		expectedErr   error
	}{
		// The test case with open ports found is commented out because it requires open port on the ip.
		// {
		// 	name:   "Open ports found",
		// 	ip:     net.ParseIP("127.0.0.1"),
		// 	target: "127.0.0.1/32",
		// 	expectedAsset: dbcon.Asset{
		// 		Status:   "up",
		// 		IPv4Addr: "127.0.0.1",
		// 		Subnet:   "127.0.0.1/32",
		// 		ScanType: "extensive",
		// 	},
		// 	expectedErr: nil,
		// },

		{
			name:          "No open ports",
			ip:            net.ParseIP("192.168.1.101"),
			target:        "192.168.1.0/32",
			expectedAsset: dbcon.Asset{},
			expectedErr:   &net.AddrError{Err: "no open ports found on IP 192.168.1.101"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {

			asset, err := scanIP(tc.ip, tc.target)
			if tc.expectedErr == nil && err != nil {
				t.Errorf("Unexpected error: %v", err)
			} else if tc.expectedErr != nil && (err == nil || err.Error() != tc.expectedErr.Error()) {
				t.Errorf("Expected error '%v', got '%v'", tc.expectedErr, err)
			} else if !reflect.DeepEqual(asset.Status, tc.expectedAsset.Status) {
				t.Errorf("Expected asset %+v, got %+v", tc.expectedAsset, asset)
			}
		})
	}
}

// The program need to be up for the test to pass
func TestUpdateAssets(t *testing.T) {
	// Set Gin to Test Mode
	gin.SetMode(gin.TestMode)

	// Example Scan and Accessible IP Ranges
	exampleScan := dbcon.Scan{
		StateID:     "12345",
		DateCreated: "2024-04-25T11:33:31Z", // Use RFC3339 format
		DateUpdated: "2024-04-25T11:33:37Z", // Use RFC3339 format
		State: map[string]dbcon.Asset{
			"asset1": {
				UID:            "001",
				Status:         "active",
				IPv4Addr:       "192.168.1.100",
				Subnet:         "192.168.1.0/24",
				OpenPorts:      []int{80, 443},
				ScanType:       "initial",
				LastDiscovered: "2021-09-01T15:04:05Z", // Use RFC3339 format
			},
		},
	}
	accessibleIPRanges := []string{"192.168.1.0/24", "10.0.0.0/8"}

	// Test case
	t.Run("Test UpdateAssets Function", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		url := "http://localhost:8080/updateNetscanAssets"
		c.Request, _ = http.NewRequest("POST", "/", nil)

		// Call the function we want to test
		updateAssets(exampleScan, accessibleIPRanges, c, url)

		// Add assertions for the expected behavior
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, but got %d", http.StatusOK, w.Code)
		}
	})
}
