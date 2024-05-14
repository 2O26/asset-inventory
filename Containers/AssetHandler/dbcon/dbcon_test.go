package dbcon

import (

	"assetinventory/assethandler/jsonhandler"
	"bytes"
	"context"
	"encoding/json"
	"errors"
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

	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
)
// Mock global variables for testing
var mockClient *mongo.Client
var mockDBName string = "testDB"

// Mock implementation of GetCollection for testing
func MockGetCollection(collectionName string) *mongo.Collection {
    // For testing purposes, just return a dummy collection
    return mockClient.Database(mockDBName).Collection(collectionName)
}
func SetdbScan(){
	ctx := context.TODO()
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017/")

	var err error
	client, err = mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal(err)
	}
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	dbName = "scan"
}

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
/*
// TestGetLatestScan - Test case for GetLatestScan
func TestGetLatestScan(t *testing.T) {
	mockDB := new(MockDB) // Assuming you have a mock that satisfies the DatabaseHelper interface
	latestScan, _ := json.Marshal(latestScan)
	// Setting up the mock expectation
	// mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(latestScan, nil, nil))
	noScan, _ := json.Marshal(`{}`)
	testCases := []struct {
		name    string
		request []byte
	}{
		{
			name:    "Get Scan",
			request: latestScan,
		},
		{
			name:    "No Scan",
			request: noScan,
		},
		{
			name:    "Error no Scan fund",
			request: noScan,
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			if tc.name == "Get Scan" {
				mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(latestScan, nil, nil))
				c.Request, _ = http.NewRequest("GET", "/GetLatestScan", bytes.NewBuffer(tc.request)) // Use tc.request directly

				GetLatestScan(mockDB, c)

				var responseScan jsonhandler.BackState
				err := json.Unmarshal(w.Body.Bytes(), &responseScan)
				assert.NoError(t, err, "Expected no error unmarshalling the response")

				// Ensure the mock expectations were met
				mockDB.AssertExpectations(t)
			}
			if tc.name == "No Scan" {
				mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(nil, nil, nil))
				c.Request, _ = http.NewRequest("GET", "/GetLatestScan", bytes.NewBuffer(tc.request)) // Use tc.request directly

				GetLatestScan(mockDB, c)

				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				// Check for the expected error message
				errMsg, ok := response["error"].(string)
				assert.True(t, ok)
				assert.Equal(t, "Error while retrieving the latest scan", errMsg) // Assert that the response error message is as expected
				// Assert that the response status code is 500 Bad Request
				assert.Equal(t, http.StatusInternalServerError, w.Code) // Assert that the response status code is as expected
			}
			// if tc.name == "Error no Scan fund" {
			// 	mockErr := errors.New("error while finding the document")
			// 	// Simulate an error while finding the document
			// 	mockDB.On("FindOne", mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(nil, nil, mockErr))

			// 	// mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(nil, mongo.ErrNoDocuments)

			// 	c.Request, _ = http.NewRequest("GET", "/GetLatestScan", bytes.NewBuffer(tc.request)) // Use tc.request directly

			// 	GetLatestScan(mockDB, c)

			// 	var response map[string]interface{}
			// 	err := json.Unmarshal(w.Body.Bytes(), &response)
			// 	assert.NoError(t, err)
			// 	// Check for the expected error message
			// 	errMsg, ok := response["error"].(string)
			// 	assert.True(t, ok)
			// 	assert.Equal(t, "No scans found", errMsg) // Assert that the response error message is as expected
			// 	// Assert that the response status code is 400 Bad Request
			// 	assert.Equal(t, http.StatusNotFound, w.Code) // Assert that the response status code is as expected
			// }
		})
	}
}*/

func TestAddPluginData(t *testing.T){
	//AddPluginData(pluginState jsonhandler.PluginState, plugin jsonhandler.Plugin)

	jsonhandler.Plugin{
		"ipScan": {
			PluginStateID: "20240214-1300A",
		},
	}

}

func TestAddAssets(t *testing.T){
	//AddAssets(req AssetRequest, assetIDS []string) string 

	//Tests todo:
	// "Failed to add new assets: " + err.Error()

	SetupDatabase("mongodb://localhost:27017/","TestDB" )
	testRequest := AssetRequest{
		AddAsset: []jsonhandler.Asset{
			{
				Name:        "NewAsset",
				Owner:       "UID",
				Type:        []string{"IoT"},
				Criticality: 3,
				Hostname:    "NewAsset1",
			},
		},
	}
	testIDS := []string{"Asset1"}

	expectedOutput := "No new assets to add"
	testOutput := AddAssets(AssetRequest{}, testIDS)
	if testOutput != expectedOutput{
		t.Errorf("Expected status code '%s' but got '%s'", expectedOutput, testOutput)
	}
	
	expectedOutput = "New assets added successfully to the latest scan"
	testOutput = AddAssets(testRequest, testIDS)
	if testOutput != expectedOutput{
		t.Errorf("Expected status code '%s' but got '%s'", expectedOutput, testOutput)
	}

	expectedOutput = "No new assets to add, all assets already exist"
	testOutput = AddAssets(testRequest, testIDS)
	if testOutput != expectedOutput{
		t.Errorf("Expected status code '%s' but got '%s'", expectedOutput, testOutput)
	}
	defer client.Disconnect(context.Background())
}

func TestGetCollection(t *testing.T){
	//mockClient := &mongo.Client{}
	mockCollection := "mockCollection"
	
	SetdbScan()

	testCollection := GetCollection(mockCollection)

	assert.NotNil(t, testCollection, "Collection should not be nil")

	assert.Equal(t, mockCollection, testCollection.Name(), "Collection name should match")
}

func TestAddRelations(t *testing.T){

	testRequest := AssetRequest{
		AddRelations: []jsonhandler.Relation{
			{
				From:			existingAssetID_1,
				To:				existingAssetID_4,
				Direction:		"uni",
				Owner:			"Him",
				DateCreated:	"2024-03-01 12:30:00",
			},
		},
	}
	testRequest2 := AssetRequest{
		AddRelations: []jsonhandler.Relation{
			{
				From:			existingAssetID_1,
				To:				existingAssetID_5,
				Direction:		"uni",
				Owner:			"Him",
				DateCreated:	"2024-03-01 12:30:00",
			},
		},
	}
	testRequest3 := AssetRequest{}

	testIDS := []string{"Relation1"}
	expectedOutput := "Failed to retrieve the latest scan: error while retrieving the latest scan: mongo: no documents in result"
	testOutput := AddRelations(testRequest, testIDS)

	if testOutput != expectedOutput{
		t.Errorf("Expected status code '%s' but got '%s'", expectedOutput, testOutput)
	}

	//SetdbScan()
	SetupDatabase("mongodb://localhost:27017/","TestDB" )

	testDB := client.Database("TestDB")
	testCollection := *testDB.Collection("scans")

	_ , err := testCollection.InsertOne(context.TODO(), latestScan)
	if err != nil {
        log.Fatal(err)
    }

	expectedOutput = "New relations added successfully to the latest scan"
	testOutput = AddRelations(testRequest, testIDS)

	if testOutput != expectedOutput{
		t.Errorf("Expected status code '%s' but got '%s'", expectedOutput, testOutput)
	}

	expectedOutput = "No new relations to add, all relations already exist"
	testOutput = AddRelations(testRequest, testIDS)
	
	if testOutput != expectedOutput{
		t.Errorf("Expected status code '%s' but got '%s'", expectedOutput, testOutput)
	}

	expectedOutput = "No new relations to add"
	testOutput = AddRelations(testRequest3, testIDS)
	
	if testOutput != expectedOutput{
		t.Errorf("Expected status code '%s' but got '%s'", expectedOutput, testOutput)
	}
	defer client.Disconnect(context.Background())
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
	// Mock requests
	addAssetRequest := AssetRequest{
		AddAsset: []jsonhandler.Asset{
			{
				Name:        "NewAsset",
				Owner:       "UID",
				Type:        []string{"IoT", "Sensor"},
				Criticality: 3,
				Hostname:    "NewAsset1",
			},
		},
	}
	illegalCharachtersAddAssetRequest := AssetRequest{
		AddAsset: []jsonhandler.Asset{
			{
				Name:        "New--_Asset",
				Owner:       "UID  1122",
				Type:        []string{"IoT ", "Sensor"},
				Criticality: 3,
				Hostname:    "NewAsset-_1",
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
			name:    "Illegal Charachters",
			request: illegalCharachtersAddAssetRequest,
			errors:  []string{"Failed to add new assets: User input contains illegal charachters!"},
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

			ManageAssetsAndRelations(mockDB, c)

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

func TestManageAssetsAndRelations_getLatestScan(t *testing.T) {
	mockDB := new(MockDB)
	mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(nil, nil, nil))
	// Mock requests
	invalidRequest := AssetRequest{
		AddAsset: []jsonhandler.Asset{
			{
				Name:        "New Asset",
				Owner:       "UID_1234",
				Type:        []string{"IoT", "Sensor"},
				Criticality: 1, // Assuming Criticality is expected to be an int, this string will cause a mismatch.
				Hostname:    "NewAsset-1",
			},
		},
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
			request:  invalidRequest,
			messages: []string{"Asset added successfully to the latest scan"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			jsonData, _ := json.Marshal(tc.request)
			c.Request, _ = http.NewRequest("POST", "/assetHandler", bytes.NewBuffer(jsonData))

			// ManageAssetsAndRelations(mockDB, c)
			GetLatestScan(mockDB, c)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			mockDB.On("FindOne", mock.Anything, bson.D{}, mock.Anything).Return(mongo.NewSingleResultFromDocument(nil, nil, nil))
			ManageAssetsAndRelations(mockDB, c)
			errMsg, ok := response["error"].(string)
			assert.True(t, ok)
			assert.Equal(t, "Error while retrieving the latest scan", errMsg)
			// Assert that the response status code is 500 Internal Server Error
			assert.Equal(t, http.StatusInternalServerError, w.Code)

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

	// Mock requests

	invalidRequest := `{
        "AddAsset": [{
            "Name": "NewAsset",
            "Owner": "UID",
            "Type": ["IoT", "Sensor"],
            "Criticality": "this should be an integer", // Intentionally incorrect type
            "Hostname": "NewAsset-1"
        }]
    }`
	addAssetRequest := AssetRequest{
		AddAsset: []jsonhandler.Asset{
			{
				Name:        "NewAsset",
				Owner:       "UID",
				Type:        []string{"IoT"},
				Criticality: 3,
				Hostname:    "NewAsset1",
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
				Hostname:    "Desktop-123",
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

				ManageAssetsAndRelations(mockDB, c)

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

				ManageAssetsAndRelations(mockDB, c)

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
