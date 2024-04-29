package dbcon_networkscan

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

var testScan1 = Scan{
	StateID:     "",
	DateCreated: "2024-04-25 11:33:31",
	DateUpdated: "2024-04-25 11:33:36",
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

// func TestSetupDatabase(t *testing.T) {
// 	mockDB := new(MockDB)
// 	ctx := context.TODO()
// 	uri := "mongodb://localhost:27019/"
// 	dbName := "test_db"

// 	// Set up expectations for the mock
// 	mockDB.On("Connect", ctx, mock.Anything).Return(&mongo.Client{}, nil)

// 	// Call the SetupDatabase function with the mock
// 	_, err := mockDB.Connect(ctx, nil)
// 	assert.NoError(t, err)
// 	err = SetupDatabase(uri, dbName)
// 	if err != nil {
// 		t.Errorf("SetupDatabase failed: %v", err)
// 	}

// 	// Assert that the expectations were met and no error occurred
// 	assert.NoError(t, err)
// 	mockDB.AssertExpectations(t)
// }

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
		mockSetup    func(*MockDB)
		expectedCode int
		expectedBody interface{}
	}{
		{
			name: "Get Latest Scan",
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, nil, nil))
			},
			expectedCode: http.StatusOK,
			expectedBody: testScan1,
		},
		{
			name: "No Scan",
			mockSetup: func(db *MockDB) {
				db.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, mongo.ErrNoDocuments, nil))
			},
			expectedCode: http.StatusNotFound,
			expectedBody: gin.H{"error": "No scans found"},
		},
		{
			name: "No Scan",
			mockSetup: func(db *MockDB) {
				db.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, errors.New("Error while retrieving the latest scan"), nil))
			},
			expectedCode: http.StatusInternalServerError,
			expectedBody: gin.H{"error": "Error while retrieving the latest scan"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockDB := new(MockDB)
			tc.mockSetup(mockDB)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			GetLatestScan(mockDB, c)

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
	}{
		{
			name: "newScan",
			scan: testScan1,
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, nil, nil))
				mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, nil)
			},
			expectedErr: "",
		},
		{
			name: "error inserting Scan",
			scan: testScan1,
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, nil, nil))
				mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, errors.New("Error inserting file"))
			},
			expectedErr: "could not insert scan: Error inserting file",
		},

		{
			name: "firstScan",
			scan: Scan{},
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, mongo.ErrNoDocuments, nil))
				mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, nil)
			},
			expectedErr: "",
		},
		{
			name: "firstScan",
			scan: Scan{},
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, mongo.ErrNoDocuments, nil))
				mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, errors.New("Error inserting file"))
			},
			expectedErr: "could not insert scan: Error inserting file",
		},
		{
			name: "firstScan",
			scan: Scan{},
			mockSetup: func(mockDB *MockDB) {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan1, errors.New("Error finding latestscan"), nil))
			},
			expectedErr: "failed to retrieve the latest scan: Error finding latestscan",
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockDB := new(MockDB)
			tc.mockSetup(mockDB)

			err := AddScan(mockDB, tc.scan)
			if err != nil && err.Error() != tc.expectedErr {
				t.Errorf("got : %v, want %s", err, tc.expectedErr)
			}
			mockDB.AssertExpectations(t)
		})
	}
}

// func TestAddScanNoPreviousScans(t *testing.T) {
// 	mockDB := new(MockDB)
// 	scan := Scan{StateID: "newScan", DateUpdated: ""}
// 	result := mongo.InsertOneResult{InsertedID: "newID"}

// 	mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(nil, mongo.ErrNoDocuments))
// 	mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&result, nil)

// 	AddScan(mockDB, scan)

// 	mockDB.AssertCalled(t, "InsertOne", mock.Anything, mock.Anything)
// }

// // TestAddScanFindError tests error handling when the FindOne operation fails
// func TestAddScanFindError(t *testing.T) {
// 	mockDB := new(MockDB)
// 	scan := Scan{StateID: "errorScan", DateUpdated: ""}

// 	mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(nil, mongo.ErrClientDisconnected))
// 	mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(nil, nil) // This should not be called

// 	AddScan(mockDB, scan)

// 	mockDB.AssertNotCalled(t, "InsertOne", mock.Anything, mock.Anything)
// }
