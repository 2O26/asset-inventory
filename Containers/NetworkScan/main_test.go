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
			input:           "192.168.1.0/24",
			expectedNetwork: net.ParseIP("192.168.1.0"),
			expectedBroad:   net.ParseIP("192.168.1.255"),
			expectedSubnet:  &net.IPNet{IP: net.ParseIP("192.168.1.0"), Mask: net.IPv4Mask(255, 255, 255, 0)},
			expectErr:       false,
		},
		{
			name:            "Valid IPv6 CIDR",
			input:           "2001:db8::/64",
			expectedNetwork: net.ParseIP("2001:db8::"),
			expectedBroad:   net.ParseIP("2001:db8::ffff:ffff:ffff:ffff"),
			expectedSubnet:  &net.IPNet{IP: net.ParseIP("2001:db8::"), Mask: net.IPMask{0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0, 0, 0, 0, 0, 0, 0, 0}},
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
			input:    net.ParseIP("192.168.1.1"),
			expected: net.ParseIP("192.168.1.1"),
		},
		{
			name:     "Clone IPv6 address",
			input:    net.ParseIP("2001:db8::1"),
			expected: net.ParseIP("2001:db8::1"),
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
			target: "192.168.1.0/32",
			expected: dbcon.Scan{
				StateID:     "",
				DateCreated: time.Now().Format("2006-01-02 15:04:05"),
				DateUpdated: time.Now().Format("2006-01-02 15:04:05"),
				State:       make(map[string]dbcon.Asset),
			},
		},
		// {
		// 	name:   "Perform IPv6 scan",
		// 	target: "2001:db8::/64",
		// 	expected: dbcon.Scan{
		// 		StateID:     "",
		// 		DateCreated: time.Now().Format("2006-01-02 15:04:05"),
		// 		DateUpdated: time.Now().Format("2006-01-02 15:04:05"),
		// 		State:       make(map[string]dbcon.Asset),
		// 	},
		// },
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			scan, err := performAdvancedScan(tc.target)
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
			}

			if !reflect.DeepEqual(scan.StateID, tc.expected.StateID) {
				t.Errorf("StateID mismatch. Expected: %s, Got: %s", tc.expected.StateID, scan.StateID)
			}
			if !reflect.DeepEqual(scan.DateCreated, tc.expected.DateCreated) {
				t.Errorf("DateCreated mismatch. Expected: %s, Got: %s", tc.expected.DateCreated, scan.DateCreated)
			}
			if !reflect.DeepEqual(scan.DateUpdated, tc.expected.DateUpdated) {
				t.Errorf("DateUpdated mismatch. Expected: %s, Got: %s", tc.expected.DateUpdated, scan.DateUpdated)
			}
			if !reflect.DeepEqual(scan.State, tc.expected.State) {
				t.Errorf("State mismatch. Expected: %v, Got: %v", tc.expected.State, scan.State)
			}
		})
	}
}

func TestPostNetScan(t *testing.T) {
	testCases := []struct {
		name           string
		body           dbcon.ScanRequest
		expectedStatus int
		expectedError  string
	}{
		{
			name: "Valid extensive scan",
			body: dbcon.ScanRequest{
				CmdSelection: "extensive",
				IPRanges:     []string{"192.168.1.0/32"},
			},
			expectedStatus: http.StatusOK,
			expectedError:  "",
		},
		// {
		// 	name: "Valid simple scan",
		// 	body: dbcon.ScanRequest{
		// 		CmdSelection: "simple",
		// 		IPRanges:     []string{"10.0.0.0/8"},
		// 	},
		// 	expectedStatus: http.StatusOK,
		// 	expectedError:  "",
		// },
		{
			name: "Invalid request body",
			body: dbcon.ScanRequest{
				CmdSelection: "invalid",
				IPRanges:     []string{"192.168.1.0/32"},
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "No valid scan selection provided",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			bodyBytes, _ := json.Marshal(tc.body)
			req, _ := http.NewRequest(http.MethodPost, "/scan", bytes.NewBuffer(bodyBytes))
			c.Request = req

			mockDB := &dbcon.MockDB{}
			mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, nil, nil))
			mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, nil)
			postNetScan(mockDB, c)

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
			ip:        "192.168.1.100",
			target:    "192.168.1.0/24",
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

			deleteAsset(mockDB, c)

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

// func TestScanIP(t *testing.T) {
// 	testCases := []struct {
// 		name            string
// 		ip              net.IP
// 		target          string
// 		expectedAsset   dbcon.Asset
// 		expectedErr     error
// 		mockOpenPorts   []int
// 		mockCreateAsset func(status, ip, target, scanType string) (dbcon.Asset, error)
// 	}{
// 		// {
// 		// 	name:   "Open ports found",
// 		// 	ip:     net.ParseIP("192.168.1.100"),
// 		// 	target: "192.168.1.0/32",
// 		// 	expectedAsset: dbcon.Asset{
// 		// 		UID:       "mock_uid",
// 		// 		Status:    "up",
// 		// 		IPv4Addr:  "192.168.1.100",
// 		// 		Subnet:    "192.168.1.0/32",
// 		// 		OpenPorts: []int{80, 443},
// 		// 		ScanType:  "extensive",
// 		// 	},
// 		// 	expectedErr:   nil,
// 		// 	mockOpenPorts: []int{80, 443},
// 		// 	mockCreateAsset: func(status, ip, target, scanType string) (dbcon.Asset, error) {
// 		// 		return dbcon.Asset{
// 		// 			UID:      "mock_uid",
// 		// 			Status:   status,
// 		// 			IPv4Addr: ip,
// 		// 			Subnet:   target,
// 		// 			ScanType: scanType,
// 		// 		}, nil
// 		// 	},
// 		// },
// 		{
// 			name:            "No open ports",
// 			ip:              net.ParseIP("192.168.1.101"),
// 			target:          "192.168.1.0/32",
// 			expectedAsset:   dbcon.Asset{},
// 			expectedErr:     &net.AddrError{Err: "No open ports found on IP 192.168.1.101"},
// 			mockOpenPorts:   []int{},
// 			mockCreateAsset: nil,
// 		},
// 		// {
// 		// 	name:          "Create asset error",
// 		// 	ip:            net.ParseIP("192.168.1.102"),
// 		// 	target:        "192.168.1.0/32",
// 		// 	expectedAsset: dbcon.Asset{},
// 		// 	expectedErr:   &net.AddrError{Err: "Failed to create asset for IP 192.168.1.102: mock error", Addr: "192.168.1.102"},
// 		// 	mockOpenPorts: []int{22},
// 		// 	mockCreateAsset: func(status, ip, target, scanType string) (dbcon.Asset, error) {
// 		// 		return dbcon.Asset{}, errors.New("mock error")
// 		// 	},
// 		// },
// 	}

// 	for _, tc := range testCases {
// 		t.Run(tc.name, func(t *testing.T) {

// 			asset, err := scanIP(tc.ip, tc.target)
// 			if tc.expectedErr == nil && err != nil {
// 				t.Errorf("Unexpected error: %v", err)
// 			} else if tc.expectedErr != nil && (err == nil || err.Error() != tc.expectedErr.Error()) {
// 				t.Errorf("Expected error '%v', got '%v'", tc.expectedErr, err)
// 			} else if !reflect.DeepEqual(asset, tc.expectedAsset) {
// 				t.Errorf("Expected asset %+v, got %+v", tc.expectedAsset, asset)
// 			}
// 		})
// 	}
// }
