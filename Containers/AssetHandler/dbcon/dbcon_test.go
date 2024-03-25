package dbcon

import (
	"assetinventory/assethandler/jsonhandler"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var ( // Mock data
	existingAssetID_1 = "65f8671cfe55e5c76465d840"
	existingAssetID_2 = "65f8671cfe55e5c76465d848"
	existingAssetID_3 = "65f8671cfe55e5c76465d841"
	existingAssetID_4 = "65f8671cfe55e5c76465d842"
	existingAssetID_5 = "65f8671cfe55e5c76465d843"

	existingRelationID_1 = "65f8671cfe55e5c76465d845"
	existingRelationID_2 = "65f8671cfe55e5c76465d846"
	existingRelationID_3 = "65f8671cfe55e5c76465d847"
	existingRelationID_4 = "65f8671cfe55e5c76465d848"

	latestScan = jsonhandler.BackState{
		ID:               primitive.NewObjectID(),
		MostRecentUpdate: time.Now(),
		Assets: map[string]jsonhandler.Asset{
			existingAssetID_1: {
				Name:        "PC-A",
				Owner:       "UID_2332",
				Type:        []string{"PC", "Windows"},
				DateCreated: "2024-02-14 23:00:00",
				DateUpdated: "2024-02-14 23:00:30",
				Criticality: 2,
				Hostname:    "Desktop-123",
			},
			existingAssetID_2: {
				Name:        "Chromecast",
				Owner:       "UID_2332",
				Type:        []string{"IoT", "Media"},
				DateCreated: "2024-02-10 20:04:20",
				DateUpdated: "2024-02-14 23:00:30",
				Criticality: 1,
				Hostname:    "LivingRoom",
			},
			existingAssetID_3: {
				Name:        "Password Vault",
				Owner:       "UID_2332",
				Type:        []string{"Server", "Database"},
				DateCreated: "2024-02-14 23:00:00",
				DateUpdated: "2024-02-14 23:00:30",
				Criticality: 4,
				Hostname:    "Vault-123",
			},
			existingAssetID_4: {
				Name:        "Smart Thermostat",
				Owner:       "UID_2332",
				Type:        []string{"IoT", "HVAC"},
				DateCreated: "2024-03-01 12:15:00",
				DateUpdated: "2024-03-18 09:50:00",
				Criticality: 2,
				Hostname:    "Thermostat-1",
			},
			existingAssetID_5: {
				Name:        "Work Laptop",
				Owner:       "UID_6372",
				Type:        []string{"Laptop", "Windows"},
				DateCreated: "2024-02-25 08:30:00",
				DateUpdated: "2024-03-18 10:00:00",
				Criticality: 3,
				Hostname:    "Work-Laptop-56",
			},
		},
		Plugins: map[string]jsonhandler.Plugin{
			"ipScan": {
				PluginStateID: "20240214-1300A",
			},
			"macScan": {
				PluginStateID: "20240215-0800G",
			},
		},
		Relations: map[string]jsonhandler.Relation{
			existingRelationID_1: {
				From:        existingAssetID_1,
				To:          existingAssetID_2,
				Direction:   "uni",
				Owner:       "UID_2332",
				DateCreated: "2024-02-14 23:35:53",
			},
			existingRelationID_2: {
				From:        existingAssetID_2,
				To:          existingAssetID_3,
				Direction:   "bi",
				Owner:       "UID_6372",
				DateCreated: "2024-01-22 07:32:32",
			},
			existingRelationID_3: {
				From:        existingAssetID_1,
				To:          existingAssetID_4,
				Direction:   "uni",
				Owner:       "UID_2332",
				DateCreated: "2024-03-01 12:30:00",
			},
			existingRelationID_4: {
				From:        existingAssetID_5,
				To:          existingAssetID_4,
				Direction:   "uni",
				Owner:       "UID_6372",
				DateCreated: "2024-03-05 14:20:00",
			},
		},
	}
)

// TestAddScan - Test case for AddScan
func TestAddScan(t *testing.T) {
	mockDB := new(MockDB)
	router := gin.Default()
	newScanJSON, _ := json.Marshal(latestScan)

	// Setting up the mock expectation for InsertOne
	// mockDB.On("InsertOne", mock.AnythingOfType("*context.emptyCtx"), mock.AnythingOfType("jsonhandler.BackState")).Return(&mongo.InsertOneResult{InsertedID: latestScan.ID}, nil)
	mockDB.On("InsertOne", mock.Anything, mock.AnythingOfType("jsonhandler.BackState")).Return(&mongo.InsertOneResult{}, nil)
	// Register the route and handler
	router.POST("/AddScan", func(c *gin.Context) {
		AddScan(mockDB, c)
	})

	// Create a new HTTP POST request to the registered route with the newScan JSON as the body
	req, _ := http.NewRequest(http.MethodPost, "/AddScan", bytes.NewBuffer(newScanJSON))
	req.Header.Set("Content-Type", "application/json")

	// Record the response
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Check the response status code
	assert.Equal(t, http.StatusOK, w.Code, "Expected status OK")

	// Optionally, you can unmarshal and check the response body to ensure it includes the expected success message
	var responseBody map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &responseBody)
	assert.NoError(t, err, "Expected no error unmarshalling response body")
	assert.Equal(t, "Scan added successfully", responseBody["message"], "Expected success message in response")

	// Verifying that the mock assertions were met
	mockDB.AssertExpectations(t)
}

// // TestGetLatestScan - Test case for GetLatestScan
func TestGetLatestScan(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	mockDB := new(MockDB) // Assuming you have a mock that satisfies the DatabaseHelper interface
	latestScan := bson.D{}
	// Setting up the mock expectation
	// mockDB.On("FindOne", mock.AnythingOfType("*context.emptyCtx"), bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(latestScan, nil, nil))
	mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(latestScan, nil, nil))
	// Register the route and handler
	router.GET("/GetLatestScan", func(c *gin.Context) {
		GetLatestScan(mockDB, c)
	})

	// Create a new HTTP request to the registered route
	req, _ := http.NewRequest(http.MethodGet, "/GetLatestScan", bytes.NewBuffer(nil))

	// Record the response
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Check the response
	assert.Equal(t, http.StatusOK, w.Code, "Expected status OK")

	// Decode the response body to compare the data
	var responseScan jsonhandler.BackState
	err := json.Unmarshal(w.Body.Bytes(), &responseScan)
	assert.NoError(t, err, "Expected no error unmarshalling response")
	// assert.Equal(t, latestScan, responseScan, "Expected response to match the latest scan")
	mockDB.AssertExpectations(t)
}

func TestManageAssetsAndRelations(t *testing.T) {
	mockDB := new(MockDB)

	mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(latestScan, nil, nil))

	// Mock requests
	addAssetRequest := AssetRequest{
		AddAsset: []jsonhandler.Asset{
			{
				Name:        "New Asset",
				Owner:       "UID_1234",
				Type:        []string{"IoT", "Sensor"},
				Criticality: 3,
				Hostname:    "NewAsset-1",
			},
			{},
		},
	}

	removeAssetRequest := AssetRequest{
		RemoveAsset: []string{existingAssetID_1, "65f8671cfe55e5c76465d877", ""},
	}

	updateAssetRequest := AssetRequest{
		UpdatedAsset: map[string]jsonhandler.Asset{
			existingAssetID_2: {
				Name:        "Updated PC-A",
				Owner:       "UID_2332",
				Type:        []string{"PC", "Windows", "Office"},
				DateCreated: "2024-02-14 23:00:00",
				DateUpdated: "2024-03-25 10:00:00",
				Criticality: 3,
				Hostname:    "Desktop-123",
			},
			"65f8671cfe55e5c76465d65325": {
				Name:        "Updated PC-A",
				Owner:       "UID_2332",
				Type:        []string{"PC", "Windows", "Office"},
				DateCreated: "2024-02-14 23:00:00",
				DateUpdated: "2024-03-25 10:00:00",
				Criticality: 3,
				Hostname:    "Desktop-123",
			},
			"": {
				Name:        "Updated PC-A",
				Owner:       "UID_2332",
				Type:        []string{"PC", "Windows", "Office"},
				DateCreated: "2024-02-14 23:00:00",
				DateUpdated: "2024-03-25 10:00:00",
				Criticality: 3,
				Hostname:    "Desktop-123",
			},
		},
	}

	addRelationRequest := AssetRequest{
		AddRelations: []jsonhandler.Relation{
			{
				From:        existingAssetID_2,
				To:          existingAssetID_3,
				Direction:   "uni",
				Owner:       "UID_2332",
				DateCreated: "2024-03-25 11:00:00",
			},
			{
				From:        existingAssetID_3,
				To:          existingAssetID_4,
				Direction:   "uni",
				Owner:       "UID_2332",
				DateCreated: "2024-03-25 11:00:00",
			},
			{
				From:        "noExistingAssetID",
				To:          existingAssetID_4,
				Direction:   "uni",
				Owner:       "UID_2332",
				DateCreated: "2024-03-25 11:00:00",
			},
			{
				From:        existingAssetID_3,
				To:          "noExistingAssetID",
				Direction:   "uni",
				Owner:       "UID_2332",
				DateCreated: "2024-03-25 11:00:00",
			},
		},
	}

	removeRelationRequest := AssetRequest{
		RemoveRelations: []string{existingRelationID_1, "65f8671cfe55e5c76465d878", ""},
	}

	mockDB.On("UpdateOne", mock.Anything, mock.Anything, mock.Anything).Return(&mongo.UpdateResult{ModifiedCount: 1}, nil)

	// Test cases
	testCases := []struct {
		name     string
		request  AssetRequest
		messages []string
		errors   []string
	}{
		{
			name:     "Add Asset",
			request:  addAssetRequest,
			messages: []string{"Asset added successfully to the latest scan"},
		},
		{
			name:     "Remove Asset",
			request:  removeAssetRequest,
			messages: []string{"Asset and related relations removed successfully from the latest scan", "Cannot remove asset, Asset not found", "Asset ID is empty"},
		},
		{
			name:     "Update Asset",
			request:  updateAssetRequest,
			messages: []string{"Asset updated successfully in the latest scan", "Asset not found", "Asset ID is empty"},
		},
		{
			name:    "Add Relation",
			request: addRelationRequest,
			messages: []string{"No new relations were added as they already exist", "New relations added successfully to the latest scan",
				"Failed to add relation, Asset with ID noExistingAssetID (from relation) not found in the latest scan",
				"Failed to add relation, Asset with ID noExistingAssetID (to relation) not found in the latest scan"},
		},
		{
			name:     "Remove Relation",
			request:  removeRelationRequest,
			messages: []string{"Relations removed successfully from the latest scan", "Failed to remove relation, Relation not found in the latest scan", "Asset ID is empty"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			jsonData, _ := json.Marshal(tc.request)
			c.Request, _ = http.NewRequest("POST", "/assetHandler", bytes.NewBuffer(jsonData))

			ManageAssetsAndRelations(mockDB, c)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			messagesFromResponse, ok := response["messages"].([]interface{})
			assert.True(t, ok)
			result := make([]string, len(messagesFromResponse))
			for i, val := range messagesFromResponse {
				result[i] = val.(string)
			}
			assert.ElementsMatch(t, tc.messages, result)
			errorsFromResponse, ok := response["errors"].([]interface{})
			if response["errors"] == nil {
				ok = true
			}
			if ok {
				result := make([]string, len(errorsFromResponse))
				for i, val := range errorsFromResponse {
					result[i] = val.(string)
				}
				assert.ElementsMatch(t, tc.errors, result)
			} else {
				assert.Empty(t, tc.errors, "Expected no errors but test case has non-empty errors slice")
			}
			assert.True(t, ok)
			result = make([]string, len(errorsFromResponse))
			for i, val := range errorsFromResponse {
				result[i] = val.(string)
			}
			assert.ElementsMatch(t, tc.errors, result)
		})
	}
}
