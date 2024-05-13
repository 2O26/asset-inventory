package dbcon_networkscan

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"reflect"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

var testScan1 = Scan{
	StateID:     "",
	DateCreated: time.Now().Format(time.RFC3339),
	DateUpdated: time.Now().Format(time.RFC3339),
	State: map[string]Asset{
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

func TestSetupDatabase(t *testing.T) {
	mockDB := new(MockDB)
	ctx := context.TODO()
	uri := "mongodb://localhost:27019/"
	dbName := "test_db"

	// Set up expectations for the mock
	mockDB.On("Connect", ctx, mock.Anything).Return(&mongo.Client{}, nil)

	// Call the SetupDatabase function with the mock
	_, err := mockDB.Connect(ctx, nil)
	assert.NoError(t, err)
	err = SetupDatabase(uri, dbName)
	if err != nil {
		t.Errorf("SetupDatabase failed: %v", err)
	}

	// Assert that the expectations were met and no error occurred
	assert.NoError(t, err)
	mockDB.AssertExpectations(t)
}

func TestDeleteAsset(t *testing.T) {

	testCases := []struct {
		name         string
		assetIDs     []string
		mockSetup    func(*MockDB)
		expectError  bool
		errorMessage string
	}{
		{
			name:     "Asset Deleted Successfully",
			assetIDs: []string{"47716233453240327"},
			mockSetup: func(db *MockDB) {
				db.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, nil, nil))
				db.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{InsertedID: "mockID"}, nil)
			},
			expectError: false,
		},
		{
			name:     "No scan fund",
			assetIDs: []string{"47716233453240327"},
			mockSetup: func(db *MockDB) {
				db.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, mongo.ErrNoDocuments, nil))
				// db.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{InsertedID: "mockID"}, nil)
			},
			expectError:  true,
			errorMessage: "no scans found",
		},
		{
			name:     "Error retrieving latest scan",
			assetIDs: []string{"47716233453240327"},
			mockSetup: func(db *MockDB) {
				db.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, errors.New("error while retrieving the latest scan"), nil))
			},
			expectError:  true,
			errorMessage: "error while retrieving the latest scan",
		},
		{
			name:     "Error inserting the updated scan",
			assetIDs: []string{"nonexistentID"},
			mockSetup: func(db *MockDB) {
				db.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, nil, nil))
				db.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, errors.New("error while inserting the updated scan"))
			},
			expectError:  true,
			errorMessage: "error while inserting the updated scan",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockDB := new(MockDB)
			tc.mockSetup(mockDB)

			err := DeleteAsset(mockDB, tc.assetIDs)

			if tc.expectError {
				assert.Error(t, err)
				assert.Equal(t, tc.errorMessage, err.Error())
			} else {
				assert.NoError(t, err)
			}

			mockDB.AssertExpectations(t)
		})
	}
}

func TestGetLatestScan(t *testing.T) {
	testCases := []struct {
		name         string
		auth         AuthResponse
		mockSetup    func(*MockDB)
		expectedCode int
		expectedBody interface{}
		expectedLog  string
	}{
		{
			name: "Unauthorized User",
			auth: AuthResponse{Authenticated: false},
			mockSetup: func(mockDB *MockDB) {
			},
			expectedCode: http.StatusUnauthorized,
			expectedBody: gin.H{"message": "User unauthorized", "success": false},
		},
		{
			name: "No Scans Found",
			auth: AuthResponse{Authenticated: true, IsAdmin: true},
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(Scan{}, mongo.ErrNoDocuments, nil))
			},
			expectedCode: http.StatusNotFound,
			expectedBody: gin.H{"error": "No scans found"},
		},
		{
			name: "Error Retrieving Scan",
			auth: AuthResponse{Authenticated: true, IsAdmin: true},
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(Scan{}, errors.New("Error while retrieving the latest scan"), nil))
			},
			expectedCode: http.StatusInternalServerError,
			expectedBody: gin.H{"error": "Error while retrieving the latest scan"},
		},
		{
			name: "Get Latest Scan as Admin",
			auth: AuthResponse{Authenticated: true, IsAdmin: true},
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, nil, nil))
			},
			expectedCode: http.StatusOK,
			expectedBody: testScan1,
		},
		{
			name: "Get Latest Scan as Non-Admin with Roles",
			auth: AuthResponse{Authenticated: true, IsAdmin: false, Roles: []string{"192.168.1.0/24"}},
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, nil, nil))
			},
			expectedCode: http.StatusOK,
			expectedBody: Scan{
				StateID:     testScan1.StateID,
				DateCreated: testScan1.DateCreated,
				DateUpdated: testScan1.DateUpdated,
				State: map[string]Asset{
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
					"47716234560536588": {
						IPv4Addr:  "192.168.1.59",
						OpenPorts: []int{},
						ScanType:  "simple",
						Status:    "down",
						Subnet:    "192.168.1.0/24",
						UID:       "47716234560536588",
					},
				},
			},
		},
		{
			name: "Get Latest Scan as Non-Admin with Roles",
			auth: AuthResponse{Authenticated: true, IsAdmin: false, Roles: []string{""}},
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, nil, nil))
			},
			expectedCode: http.StatusOK,
			expectedBody: Scan{
				StateID:     testScan1.StateID,
				DateCreated: testScan1.DateCreated,
				DateUpdated: testScan1.DateUpdated,
				State:       map[string]Asset{}},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockDB := new(MockDB)
			tc.mockSetup(mockDB)

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			// Capture logs
			var logBuffer bytes.Buffer
			log.SetOutput(&logBuffer)
			defer func() {
				log.SetOutput(os.Stderr)
			}()

			GetLatestScan(mockDB, c, tc.auth)

			assert.Equal(t, tc.expectedCode, w.Code)
			if tc.expectedCode == http.StatusOK {
				var actualBody Scan
				err := json.Unmarshal(w.Body.Bytes(), &actualBody)
				assert.NoError(t, err)
				assert.Equal(t, tc.expectedBody, actualBody)
			} else {
				var actualBody gin.H
				err := json.Unmarshal(w.Body.Bytes(), &actualBody)
				assert.NoError(t, err)
				assert.Equal(t, tc.expectedBody, actualBody)
			}

			if tc.expectedLog != "" {
				assert.Contains(t, logBuffer.String(), tc.expectedLog)
			}

			mockDB.AssertExpectations(t)
		})
	}
}
func TestCompareScanStates(t *testing.T) {
	testCases := []struct {
		name         string
		scan1        Scan
		scan2        Scan
		expectedScan Scan
	}{
		{
			name:         "Same Scan State",
			scan1:        testScan1,
			scan2:        testScan1,
			expectedScan: testScan1,
		},
		{
			name:  "Different Scan State",
			scan1: testScan1,
			scan2: Scan{
				StateID:     testScan1.StateID,
				DateCreated: testScan1.DateCreated,
				DateUpdated: testScan1.DateUpdated,
				State: map[string]Asset{
					"47716233453240327": {
						IPv4Addr:  "192.168.1.12",
						OpenPorts: []int{22},
						ScanType:  "simple",
						Status:    "up",
						Subnet:    "192.168.1.0/24",
						UID:       "47716233453240327",
					},
					"47716233537126407": {
						IPv4Addr:  "192.168.1.115",
						OpenPorts: []int{},
						ScanType:  "extensive",
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
					"47716234560536585": {
						IPv4Addr:  "192.168.1.54",
						OpenPorts: []int{},
						ScanType:  "simple",
						Status:    "up",
						Subnet:    "192.168.1.0/24",
						UID:       "47716234560536585",
					},
				},
			},
			expectedScan: Scan{
				StateID:     testScan1.StateID,
				DateCreated: testScan1.DateCreated,
				DateUpdated: testScan1.DateUpdated,
				State: map[string]Asset{
					"47716233453240327": {
						IPv4Addr:  "192.168.1.12",
						OpenPorts: []int{22}, // Ports preserved
						ScanType:  "simple",
						Status:    "up",
						Subnet:    "192.168.1.0/24",
						UID:       "47716233453240327",
					},
					"47716233537126407": {
						IPv4Addr:  "192.168.1.115",
						OpenPorts: []int{},
						ScanType:  "simple", // Marked as simple as current scan is simple
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
					"47716234560536585": {
						IPv4Addr:  "192.168.1.54",
						OpenPorts: []int{},
						ScanType:  "simple",
						Status:    "down", // not in current should be down
						Subnet:    "192.168.1.0/24",
						UID:       "47716234560536585",
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
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := compareScanStates(tc.scan1, tc.scan2)
			assert.Equal(t, tc.expectedScan, result)
		})
	}
}

func TestAddScan(t *testing.T) {

	testCases := []struct {
		name        string
		scan        Scan
		mockSetup   func(*MockDB)
		expectedErr string
		expectedRes Scan
	}{
		{
			name: "newScan",
			scan: testScan1,
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, nil, nil))
				mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, nil)
			},
			expectedErr: "",
			expectedRes: testScan1,
		},
		{
			name: "error inserting Scan",
			scan: testScan1,
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, nil, nil))
				mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, errors.New("Error inserting file"))
			},
			expectedErr: "could not insert scan: Error inserting file",
			expectedRes: Scan{},
		},

		{
			name: "firstScan",
			scan: testScan1,
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, mongo.ErrNoDocuments, nil))
				mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, nil)
			},
			expectedErr: "",
			expectedRes: testScan1,
		},
		{
			name: "secondScan",
			scan: Scan{},
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, mongo.ErrNoDocuments, nil))
				mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, errors.New("Error inserting file"))
			},
			expectedErr: "could not insert scan: Error inserting file",
			expectedRes: Scan{},
		},
		{
			name: "firstScan error",
			scan: Scan{},
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, errors.New("Error finding latestscan"), nil))
			},
			expectedErr: "failed to retrieve the latest scan: Error finding latestscan",
			expectedRes: Scan{},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockDB := new(MockDB)
			tc.mockSetup(mockDB)

			result, err := AddScan(mockDB, tc.scan)
			if !reflect.DeepEqual(result, tc.expectedRes) {
				t.Errorf("got : %v, want %v", result, tc.expectedRes)
			}
			if err != nil && err.Error() != tc.expectedErr {
				t.Errorf("got : %v, want %s", err, tc.expectedErr)
			}
			mockDB.AssertExpectations(t)
		})
	}
}

func TestAuthorizeUser(t *testing.T) {
	testCases := []struct {
		name                 string
		authHeader           string
		expectedAuthResponse AuthResponse
		expectedHTTPStatus   int
		expectedErrorMessage string
	}{
		{
			name:       "Missing Authorization Header",
			authHeader: "",
			expectedAuthResponse: AuthResponse{
				Authenticated:   false,
				Roles:           nil,
				IsAdmin:         false,
				CanManageAssets: false,
			},
			expectedHTTPStatus:   http.StatusUnauthorized,
			expectedErrorMessage: "User unauthorized",
		},
		// {
		// 	name:       "Valid Authorization Header",
		// 	authHeader: "Bearer valid_token",
		// 	expectedAuthResponse: AuthResponse{
		// 		Authenticated:   true,
		// 		Roles:           []string{"192.168.1.0/24", "10.0.0.0/32"},
		// 		IsAdmin:         true,
		// 		CanManageAssets: true,
		// 	},
		// 	expectedHTTPStatus:   http.StatusOK,
		// 	expectedErrorMessage: "",
		// },
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request, _ = http.NewRequest("GET", "/", nil)
			c.Request.Header.Set("Authorization", tc.authHeader)

			url := "http://localhost:3003/getRoles"
			auth := AuthorizeUser(c, url)

			assert.Equal(t, tc.expectedAuthResponse, auth)
			assert.Equal(t, tc.expectedHTTPStatus, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			if err != nil {
				t.Errorf("Failed to unmarshal response body: %v", err)
			}
			if tc.expectedErrorMessage != "" {
				assert.Equal(t, tc.expectedErrorMessage, response["message"])
			}
		})
	}
}
