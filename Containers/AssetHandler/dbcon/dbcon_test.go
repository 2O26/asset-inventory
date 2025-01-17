package dbcon

import (
	"assetinventory/assethandler/jsonhandler"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
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
				IP:          "Desktop-123",
			},
			existingAssetID_2: {
				Name:        "Chromecast",
				Owner:       "UID_2332",
				Type:        []string{"IoT", "Media"},
				DateCreated: "2024-02-10 20:04:20",
				DateUpdated: "2024-02-14 23:00:30",
				Criticality: 1,
				IP:          "LivingRoom",
			},
			existingAssetID_3: {
				Name:        "Password Vault",
				Owner:       "UID_2332",
				Type:        []string{"Server", "Database"},
				DateCreated: "2024-02-14 23:00:00",
				DateUpdated: "2024-02-14 23:00:30",
				Criticality: 4,
				IP:          "Vault-123",
			},
			existingAssetID_4: {
				Name:        "Smart Thermostat",
				Owner:       "UID_2332",
				Type:        []string{"IoT", "HVAC"},
				DateCreated: "2024-03-01 12:15:00",
				DateUpdated: "2024-03-18 09:50:00",
				Criticality: 2,
				IP:          "Thermostat-1",
			},
			existingAssetID_5: {
				Name:        "Work Laptop",
				Owner:       "UID_6372",
				Type:        []string{"Laptop", "Windows"},
				DateCreated: "2024-02-25 08:30:00",
				DateUpdated: "2024-03-18 10:00:00",
				Criticality: 3,
				IP:          "Work-Laptop-56",
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

func TestSetupDatabase(t *testing.T) {
	mockDB := new(MockDB)
	ctx := context.TODO()
	uri := "mongodb://localhost:27017/"
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
func TestAddScan(t *testing.T) {
	mockDB := new(MockDB)
	// mockDB.On("InsertOne", mock.Anything, mock.AnythingOfType("jsonhandler.BackState")).Return(&mongo.InsertOneResult{}, nil)
	// Mock requests
	addScan, _ := json.Marshal(latestScan)
	invalidScan, _ := json.Marshal(`{}`)
	// Test cases
	testCases := []struct {
		name    string
		request []byte
	}{
		{
			name:    "Add Scan",
			request: addScan,
		},
		{
			name:    "Invalid Scan",
			request: invalidScan,
		},
		{
			name:    "Error Inserting Scan",
			request: addScan,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			// c.Request, _ = http.NewRequest("POST", "/AddScan", bytes.NewBuffer(tc.request)) // Use tc.request directly

			// AddScan(mockDB, c)

			// var response map[string]interface{}
			// err := json.Unmarshal(w.Body.Bytes(), &response)
			// assert.NoError(t, err)
			if tc.name == "Add Scan" {
				mockDB.On("InsertOne", mock.Anything, mock.AnythingOfType("jsonhandler.BackState")).Return(&mongo.InsertOneResult{}, nil)
				c.Request, _ = http.NewRequest("POST", "/AddScan", bytes.NewBuffer(tc.request)) // Use tc.request directly

				AddScan(mockDB, c)

				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				Msg, ok := response["message"].(string)
				assert.True(t, ok)
				assert.Equal(t, "Scan added successfully", Msg)
				assert.Equal(t, http.StatusOK, w.Code)
			}
			if tc.name == "Invalid Scan" {
				mockDB.On("InsertOne", mock.Anything, mock.AnythingOfType("jsonhandler.BackState")).Return(&mongo.InsertOneResult{}, nil)
				c.Request, _ = http.NewRequest("POST", "/AddScan", bytes.NewBuffer(tc.request)) // Use tc.request directly

				AddScan(mockDB, c)

				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				errMsg, ok := response["error"].(string)
				assert.True(t, ok)
				assert.Equal(t, "json: cannot unmarshal string into Go value of type jsonhandler.BackState", errMsg)
				assert.Equal(t, http.StatusBadRequest, w.Code)
			}
			// if tc.name == "Error Inserting Scan" {
			// 	mockErr := errors.New("error while updating the db")
			// 	mockDB.On("InsertOne", mock.Anything, mock.AnythingOfType("jsonhandler.BackState")).Return(mockErr, nil)
			// 	c.Request, _ = http.NewRequest("POST", "/AddScan", bytes.NewBuffer(tc.request)) // Use tc.request directly

			// 	AddScan(mockDB, c)

			// 	var response map[string]interface{}
			// 	err := json.Unmarshal(w.Body.Bytes(), &response)
			// 	assert.NoError(t, err)
			// 	errMsg, ok := response["error"].(string)
			// 	assert.True(t, ok)
			// 	assert.Equal(t, "Error while inserting new scan", errMsg)
			// 	assert.Equal(t, http.StatusInternalServerError, w.Code)
			// }
		})
	}
}

// // TestGetLatestScan - Test case for GetLatestScan

func TestGetLatestScan(t *testing.T) {
	testCases := []struct {
		name string
	}{
		{
			name: "Get Scan",
		},
		{
			name: "No Scan",
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if tc.name == "Get Scan" {
				mockDB := new(MockDB)
				mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(latestScan, nil, nil))
				_, err := GetLatestScan(mockDB)
				assert.NoError(t, err)
				// Ensure the mock expectations were met
				mockDB.AssertExpectations(t)
			}
			if tc.name == "No Scan" {
				mockDB := new(MockDB)
				mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(latestScan, errors.New("error"), nil))
				// mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(nil, nil, nil))
				_, err := GetLatestScan(mockDB)
				fmt.Println(err)
				assert.Error(t, err)
				// Ensure the mock expectations were met
				mockDB.AssertExpectations(t)
			}
		})
	}

}

func TestIsValidName(t *testing.T) {
	tests := []struct {
		target string
		result bool
	}{
		{"PC-A", true},
		{"domain.com", true},
		{"Johans Laptop", true},
		{"@me", false},
		{":)", false},
		{`PC-A"; DROPT TABLE USERS; --`, false},
	}

	for _, test := range tests {
		valid := isValidName(test.target)
		if valid != test.result {
			t.Errorf("Host Namet: %s is %t it should be %t", test.target, valid, test.result)
		}
	}

}

func TestIsValidOwner(t *testing.T) {
	tests := []struct {
		target string
		result bool
	}{
		{"Victor Vidin", true},
		{"Henrik Goransson", true},
		{"Karl-Fredrik af Chapman", true},
		{"IT Departementet", true},
		{"Knowit", true},
		{"me :)", false},
		{`Kalle"; DROP TABLE users; --`, false},
		{"hej, jag har stulit dina uppgifter!", false},
		{"F#ck U!", false},
	}

	for _, test := range tests {
		valid := isValidOwner(test.target)
		if valid != test.result {
			t.Errorf("Owner Name: %s is %t it should be %t", test.target, valid, test.result)
		}
	}
}

func TestIsValidType(t *testing.T) {
	tests := []struct {
		target []string
		result bool
	}{
		{[]string{"hardware", "Server", "Rack mounted"}, true},
		{[]string{"Windows", " Laptop"}, true},
		{[]string{"Linux", "Virtual Machine", "Computer"}, true},
		{[]string{"me -.9, lol"}, false},
		{[]string{"12", "34", "1234"}, false},
		{[]string{`Laptop, Windows"; DROP TABLE users; --'`}, false},
	}

	for _, test := range tests {
		valid := isValidType(test.target)
		if valid != test.result {
			t.Errorf("The Type: %s is %t it should be %t", test.target, valid, test.result)
		}
	}
}

func TestManageAssetsAndRelations(t *testing.T) {
	mockDB := new(MockDB)
	mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(latestScan, nil, nil))
	mockDB.On("UpdateOne", mock.Anything, mock.Anything, mock.Anything).Return(&mongo.UpdateResult{ModifiedCount: 1}, nil)
	mockDB.On("InsertOne", mock.Anything, mock.AnythingOfType("jsonhandler.BackState")).Return(&mongo.InsertOneResult{}, nil)
	mockDBTimline := new(MockDB)
	mockDBTimline.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, nil)
	// Mock requests
	addAssetRequest := AssetRequest{
		AddAsset: []jsonhandler.Asset{
			{
				Name:        "NewAsset",
				Owner:       "UID",
				Type:        []string{"IoT", "Sensor"},
				Criticality: 3,
				IP:          "NewAsset1",
			},
		},
	}
	illegalCharactersAddAssetRequest := AssetRequest{
		AddAsset: []jsonhandler.Asset{
			{
				Name:        "New--_Asset",
				Owner:       "UID  1122",
				Type:        []string{"IoT ", "Sensor"},
				Criticality: 3,
				IP:          "NewAsset-_1",
			},
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
				IP:          "Desktop-123",
			},
			"65f8671cfe55e5c76465d65325": {
				Name:        "Updated PC-A",
				Owner:       "UID_2332",
				Type:        []string{"PC", "Windows", "Office"},
				DateCreated: "2024-02-14 23:00:00",
				DateUpdated: "2024-03-25 10:00:00",
				Criticality: 3,
				IP:          "Desktop-123",
			},
			"": {
				Name:        "Updated PC-A",
				Owner:       "UID_2332",
				Type:        []string{"PC", "Windows", "Office"},
				DateCreated: "2024-02-14 23:00:00",
				DateUpdated: "2024-03-25 10:00:00",
				Criticality: 3,
				IP:          "Desktop-123",
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
	emptyRequest := AssetRequest{
		AddAsset: []jsonhandler.Asset{},
	}

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
			name:    "Illegal Characters",
			request: illegalCharactersAddAssetRequest,
			errors:  []string{"Failed to add new assets: User input contains illegal characters!"},
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
		{
			name:     "empty request",
			request:  emptyRequest, // Empty request since the error occurs before any operations
			messages: []string{},
			errors:   []string{},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			jsonData, _ := json.Marshal(tc.request)
			c.Request, _ = http.NewRequest("POST", "/assetHandler", bytes.NewBuffer(jsonData))

			ManageAssetsAndRelations(mockDB, mockDBTimline, c)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			messagesFromResponse, ok := response["messages"].([]interface{})
			if response["messages"] == nil {
				ok = true
			}
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
			assert.True(t, ok)
			result = make([]string, len(errorsFromResponse))
			for i, val := range errorsFromResponse {
				result[i] = val.(string)
			}
			assert.ElementsMatch(t, tc.errors, result)

		})
	}
}

func TestManageAssetsAndRelations_invaledRequest(t *testing.T) {
	mockDB := new(MockDB)
	// Setting up the mock expectation for FindOne
	mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(latestScan, nil, nil))
	mockErr := errors.New("error while updating the db")
	// Simulate an error while updating the db
	mockDB.On("UpdateOne", mock.Anything, mock.Anything, mock.Anything).Return(&mongo.UpdateResult{}, mockErr)
	mockDBTimline := new(MockDB)
	mockDBTimline.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, errors.New("error while inserting to the db"))

	invalidRequest := `{
        "AddAsset": [{
            "Name": "NewAsset",
            "Owner": "UID",
            "Type": ["IoT", "Sensor"],
            "Criticality": "this should be an integer", // Intentionally incorrect type
            "IP": "NewAsset-1"
        }]
    }`
	addAssetRequest := AssetRequest{
		AddAsset: []jsonhandler.Asset{
			{
				Name:        "NewAsset",
				Owner:       "UID",
				Type:        []string{"IoT"},
				Criticality: 3,
				IP:          "NewAsset1",
			},
		},
	}
	removeAssetRequest := AssetRequest{
		RemoveAsset: []string{existingAssetID_1},
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
				IP:          "Desktop-123",
			},
		},
	}

	addRelationRequest := AssetRequest{
		AddRelations: []jsonhandler.Relation{
			{
				From:        existingAssetID_1,
				To:          existingAssetID_5,
				Direction:   "uni",
				Owner:       "UID",
				DateCreated: "2024-03-25 11:00:00",
			}},
	}

	removeRelationRequest := AssetRequest{
		RemoveRelations: []string{existingRelationID_4},
	}

	// Test cases
	testCases := []struct {
		name     string
		payload  string
		request  AssetRequest
		messages []string
		errors   []string
	}{
		{
			name:     "Invalid request data",
			payload:  invalidRequest, // Invalid request data
			messages: []string{},
			errors:   []string{},
		},
		{
			name:     "Add Asset",
			request:  addAssetRequest,
			messages: []string{},
			errors:   []string{"Failed to add new assets: error while updating the db"},
		},
		{
			name:     "Update Asset",
			request:  updateAssetRequest,
			messages: []string{},
			errors:   []string{"Failed to update assets: error while updating the db"},
		},
		{
			name:     "Remove Asset",
			request:  removeAssetRequest,
			messages: []string{},
			errors:   []string{"Failed to remove assets and related relations: error while updating the db"},
		},
		{
			name:     "Add Relation",
			request:  addRelationRequest,
			messages: []string{},
			errors:   []string{"Failed to add new relations: error while updating the db"},
		},
		{
			name:     "Remove Relation",
			request:  removeRelationRequest,
			messages: []string{},
			errors:   []string{"Failed to remove relation: error while updating the db"},
		},
	}

	for _, tc := range testCases {
		// Run sub-test
		t.Run(tc.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)        // Set Gin to Test Mode
			w := httptest.NewRecorder()      // Create a new ResponseRecorder
			c, _ := gin.CreateTestContext(w) // Create a new context with the ResponseRecorder

			if tc.name == "Invalid request data" { // If the test case is for invalid request data
				jsonData, _ := json.Marshal(tc.payload)
				c.Request, _ = http.NewRequest("POST", "/assetHandler", bytes.NewBuffer(jsonData))

				ManageAssetsAndRelations(mockDB, mockDBTimline, c)

				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				// Check for the expected error message
				errMsg, ok := response["error"].(string)
				assert.True(t, ok)
				assert.Equal(t, "Invalid request data: json: cannot unmarshal string into Go value of type dbcon.AssetRequest", errMsg) // Assert that the response error message is as expected
				// Assert that the response status code is 400 Bad Request
				assert.Equal(t, http.StatusBadRequest, w.Code) // Assert that the response status code is as expected
			} else { // If the test case is for valid request data
				jsonData, _ := json.Marshal(tc.request)
				c.Request, _ = http.NewRequest("POST", "/assetHandler", bytes.NewBuffer(jsonData))

				ManageAssetsAndRelations(mockDB, mockDBTimline, c)

				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				messagesFromResponse, ok := response["messages"].([]interface{}) // Get the messages from the response
				if response["messages"] == nil {
					ok = true
				}
				assert.True(t, ok) // Assert that the messages are as expected
				result := make([]string, len(messagesFromResponse))
				for i, val := range messagesFromResponse {
					result[i] = val.(string)
				}
				assert.ElementsMatch(t, tc.messages, result)
				errorsFromResponse, ok := response["errors"].([]interface{}) // Get the errors from the response
				if response["errors"] == nil {
					ok = true
				}
				assert.True(t, ok)
				result = make([]string, len(errorsFromResponse))
				for i, val := range errorsFromResponse { // Loop through the errors
					result[i] = val.(string) // Add the error to the slice
				}
				assert.ElementsMatch(t, tc.errors, result) // Assert that the errors are as expected
			}

		})
	}
}

func TestGetTimelineData(t *testing.T) {
	testCases := []struct {
		name     string
		assetID  string
		results  []bson.M
		err      error
		expected []bson.M
		status   int
	}{
		{
			name:    "test case 1",
			assetID: "46330870528737286",
			results: []bson.M{
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"addedrelations": primitive.A{
							bson.M{"from": "46330870528737286", "to": "46330870528802822"},
							bson.M{"from": "46331125206941706", "to": "46330870528737286"},
							bson.M{"from": "46330870528731186", "to": "46330870528802822"},
						},
						"removedrelations": primitive.A{
							bson.M{"from": "46330870528737286", "to": "46330870528802833"},
							bson.M{"from": "46331125206941706", "to": "46330870028737286"},
						},
						"updatedassets": bson.M{

							"46330870528737286": bson.M{
								"criticality": bson.M{
									"after":  1,
									"before": 2,
								},
							},

							"46330870529937286": bson.M{},
						},
					},
					"timestamp": primitive.DateTime(1681736000000),
				},
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"removedrelations": []interface{}{
							map[string]interface{}{"from": "46330870528737286", "to": "46330870528802822"},
							map[string]interface{}{"from": "46331125206941706", "to": "46330870528737286"},
							map[string]interface{}{"from": "46330870528733386", "to": "46330870528802822"},
						},
						"removedassets": primitive.A{
							"46330870528737286",
							"46330870998737286",
						},
						"addedassets": primitive.A{
							"46330870528737286",
							"46330870528223336",
						},
					},
					"timestamp": primitive.DateTime(1681736000000),
				}},
			err: nil,

			status: http.StatusOK,
		},
		{
			name:    "test case 2",
			assetID: "NonExistentID",
			results: []bson.M{ /* populate with results not containing the assetID */ },
			status:  http.StatusOK,
		},
		{
			name:    "test case 3",
			assetID: "46330870528737286",
			results: []bson.M{
				{"_id": "661e5c9d850b67e8699da766",
					"change":    []interface{}{},
					"timestamp": primitive.DateTime(1681736000000)},
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"addedrelations":   nil,
						"removedrelations": nil,
					},
					"timestamp": primitive.DateTime(1681736000000),
				},
			},
			status: http.StatusOK,
		},
		{
			name:    "test case 4",
			assetID: "46330870528737286",
			results: []bson.M{
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"updatedassets": []interface{}{
							map[string]interface{}{
								"46330870528737286": map[string]interface{}{
									"criticality": map[string]interface{}{
										"after":  1,
										"before": 2,
									},
								},
							},
						},
						"addedassets":      []interface{}{},
						"removedassets":    []interface{}{},
						"addedrelations":   []interface{}{},
						"removedrelations": []interface{}{},
					},
					"timestamp": primitive.DateTime(1681736000000),
				},
			},
			status: http.StatusOK,
		},
		{
			name:    "test case 5",
			assetID: "46330870528737286",
			results: []bson.M{
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.A{
						"addedassets"},
					"timestamp": primitive.DateTime(1681736000000),
				}},
			status: http.StatusOK,
		},
		{
			name:    "test case 6",
			assetID: "46330870528737286",
			results: []bson.M{
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"addedrelations": primitive.A{
							map[string]interface{}{"from": "46330870528737286", "to": "46330870528802822"},
						},
						"removedrelations": primitive.A{
							map[string]interface{}{"from": "46330870528737286", "to": "46330870528802822"},
						},
					},
					"timestamp": primitive.DateTime(1681736000000),
				},
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"addedassets": primitive.A{
							"46330870528737286",
						}},
					"timestamp": primitive.DateTime(1681736000000),
				},
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"addedassets": primitive.A{
							"46330870528737286",
						}},
					"timestamp": primitive.DateTime(1681736000000),
				},
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"addedassets": primitive.A{
							"46330870528737286",
						}},
					"timestamp": primitive.DateTime(1681736000000),
				},
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"addedassets": primitive.A{
							"46330870528737286",
						}},
					"timestamp": primitive.DateTime(1681736000000),
				},
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"addedassets": primitive.A{
							"46330870528737286",
						}},
					"timestamp": primitive.DateTime(1681736000000),
				},
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"addedassets": primitive.A{
							"46330870528737286",
						}},
					"timestamp": primitive.DateTime(1681736000000),
				},
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"addedassets": primitive.A{
							"46330870528737286",
						}},
					"timestamp": primitive.DateTime(1681736000000),
				},
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"addedassets": primitive.A{
							"46330870528737286",
						}},
					"timestamp": primitive.DateTime(1681736000000),
				},
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"addedassets": primitive.A{
							"46330870528737286",
						}},
					"timestamp": primitive.DateTime(1681736000000),
				},
				{
					"_id": "661e5c9d850b67e8699da766",
					"change": bson.M{
						"addedassets": primitive.A{
							"46330870528737286",
						}},
					"timestamp": primitive.DateTime(1681736000000),
				}},
			status: http.StatusOK,
		},
		{
			name:    "test case 7",
			assetID: "46330870528737286",
			results: nil,
			err:     errors.New("error while fetching data"),
			status:  http.StatusInternalServerError,
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if tc.name == "test case 7" {
				mockDB := &MockDB{}
				mockDB.On("Find", mock.Anything, mock.Anything).Return(tc.results, tc.err)
				w := httptest.NewRecorder()
				c, _ := gin.CreateTestContext(w)
				c.Request, _ = http.NewRequest("GET", "/GetTimelineData?assetID="+tc.assetID, nil)

				GetTimelineData(mockDB, c)

				assert.Equal(t, tc.status, w.Code)
				if tc.err == nil {
					var results []bson.M
					err := json.Unmarshal(w.Body.Bytes(), &results)
					assert.Error(t, err)

				}
			} else {
				mockDB := &MockDB{}
				mockDB.On("Find", mock.Anything, mock.Anything).Return(tc.results, tc.err)

				w := httptest.NewRecorder()
				c, _ := gin.CreateTestContext(w)
				c.Request, _ = http.NewRequest("GET", "/GetTimelineData?assetID="+tc.assetID, nil)

				GetTimelineData(mockDB, c)

				assert.Equal(t, tc.status, w.Code)

				if tc.err == nil {
					var results []bson.M
					err := json.Unmarshal(w.Body.Bytes(), &results)
					assert.NoError(t, err)

				}

			}
		})
	}
}
