package dbcon

import (
	"bytes"
	"encoding/json"
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

// TestAddScan - Test case for AddScan
func TestAddScan(t *testing.T) {
	mockDB := new(MockDB)
	mockDB.On("InsertOne", mock.Anything, mock.AnythingOfType("Scan")).Return(&mongo.InsertOneResult{}, nil)
	var jsonData = []byte(`{
		"mostRecentUpdate":"2024-01-02T15:04:05Z",
		"assets": {
			"AID_4123523": {
				"name": "PC-A",
				"owner": "UID_2332",
				"dateCreated": "2024-02-14 23:00:00",
				"dateUpdated": "2024-02-14 23:00:30",
				"criticality": 2
			},
			"AID_5784393": {
				"name": "Chromecast",
				"owner": "UID_2332",
				"dateCreated": "2024-02-10 20:04:20",
				"dateUpdated": "2024-02-14 23:00:30",
				"criticality": 1
			},
			"AID_9823482": {
				"name": "Password Vault",
				"owner": "UID_2332",
				"dateCreated": "2024-02-14 23:00:00",
				"dateUpdated": "2024-02-14 23:00:30",
				"criticality": 4
			}
		},
		"plugins": {
			"ipScan": {
				"pluginStateID": "20240214-1300A"
			},
			"macScan": {
				"pluginStateID": "20240215-0800G"
			}
		},
		"relations": {
			"RID_2613785": {
				"from": "ID_4123523",
				"to": "ID_5784393",
				"direction": "uni",
				"owner": "UID_2332",
				"dateCreated":"2024-02-14 23:35:53"
			},
			"RID_6492733": {
				"from": "ID_5784393",
				"to": "ID_9823482",
				"direction": "bi",
				"owner": "UID_6372",
				"dateCreated": "2024-01-22 07:32:32"
			}    
		}    
	}`)

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/AddScan", bytes.NewBuffer(jsonData))

	AddScan(mockDB, c)

	assert.Equal(t, http.StatusOK, w.Code)
}

// TestGetLatestScan - Test case for GetLatestScan
func TestGetLatestScan(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.Default()

	mockDb := &MockDB{}

	router.GET("/latestScan", func(c *gin.Context) {
		GetLatestScan(mockDb, c)
	})

	req, _ := http.NewRequest("GET", "/latestScan", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status code %d, got %d", http.StatusOK, w.Code)
	}

	var response map[string]Scan
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if response["latestScan"].MostRecentUpdate != time.Date(2024, 2, 28, 14, 3, 58, 169000000, time.UTC) {
		t.Errorf("Expected latest scan ID to be 'mockID', got '%s'", response["latestScan"].ID)
	}

	// Additional assertions for other fields of Scan can be added here
}

// TestAddAsset - Test case for AddAsset
func TestAddAsset(t *testing.T) {
	mockDB := new(MockDB)
	mockDB.On("InsertOne", mock.Anything, mock.AnythingOfType("Asset")).Return(&mongo.InsertOneResult{}, nil)

	var asset = []byte(`{
        "name": "PC-B",
        "owner": "UID_2332",
        "dateCreated": "2024-02-14 23:00:00",
        "dateUpdated": "2024-02-14 23:00:30",
        "criticality": 5
    }`)

	gin.SetMode(gin.TestMode)                                                   // Test mode to prevent logging
	w := httptest.NewRecorder()                                                 // Response Recorder to capture HTTP response
	c, _ := gin.CreateTestContext(w)                                            // Simulate incoming HTTP request
	c.Request, _ = http.NewRequest("POST", "/AddAsset", bytes.NewBuffer(asset)) // Simulate POST request

	AddAsset(mockDB, c) // Call AddAsset

	assert.Equal(t, http.StatusOK, w.Code) // Assert OK response

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response) // Parse response

	assert.NoError(t, err)                                           // Assert no error from parsing
	assert.Equal(t, "Asset added successfully", response["message"]) // Assert response "Asset added successfully"
}

func TestUpdateAsset(t *testing.T) {
	mockDB := new(MockDB)
	testAssetID := "65e9d9426765de1c93176cae"

	objID, err := primitive.ObjectIDFromHex(testAssetID)
	if err != nil {
		t.Fatalf("Failed to convert hex string to ObjectID: %v", err)
	}

	mockAsset := bson.M{
		"_id":         objID,
		"name":        "Server X20000",
		"owner":       "IT Department",
		"type":        []string{"Hardware", "Server", "Rack Mounted"},
		"dateCreated": "2024-03-07 10:00:00",
		"dateUpdated": "2024-03-07 10:00:00",
		"criticality": 10,
		"hostname":    "server-x20000.example.com",
	}

	mockDB.On("FindOne", mock.Anything, bson.M{"_id": objID}).Return(mongo.NewSingleResultFromDocument(mockAsset, nil, nil))

	mockDB.On("UpdateOne", mock.Anything, bson.M{"_id": objID}, mock.Anything).Return(&mongo.UpdateResult{ModifiedCount: 1}, nil)

	// Prepare the JSON payload for the update request.
	var updateAssetData = []byte(fmt.Sprintf(`{
        "id": "%s",
        "name": "Server X20001",
        "owner": "IT Department",
        "type": ["Hardware", "Server", "Rack Mounted"],
        "dateCreated": "2024-03-07 10:00:00",
        "dateUpdated": "2024-03-07 11:00:00",
        "criticality": 10,
        "hostname": "server-x20001.example.com"
    }`, testAssetID))

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/UpdateAsset", bytes.NewBuffer(updateAssetData))

	UpdateAsset(mockDB, c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Asset updated successfully", response["message"])
}

// TestDeleteAsset
func TestDeleteAsset(t *testing.T) {
	mockDB := new(MockDB)
	testAssetID := "65e9d9426765de1c93176cae"

	// Convert string to ObjectID
	objID, err := primitive.ObjectIDFromHex(testAssetID)
	if err != nil {
		t.Fatalf("Failed to convert hex string to ObjectID: %v", err)
	}

	// Mock asset
	mockAsset := bson.M{
		"_id":         objID,
		"name":        "Server X20000",
		"owner":       "IT Department",
		"type":        []string{"Hardware", "Server", "Rack Mounted"},
		"dateCreated": "2024-03-07 10:00:00",
		"dateUpdated": "2024-03-07 10:00:00",
		"criticality": 10,
		"hostname":    "server-x20000.example.com",
	}

	mockDB.On("FindOne", mock.Anything, bson.M{"_id": objID}).Return(mongo.NewSingleResultFromDocument(mockAsset, nil, nil))
	mockDB.On("DeleteOne", mock.Anything, bson.M{"_id": objID}).Return(&mongo.DeleteResult{DeletedCount: 1}, nil)

	// Prepare the JSON payload for the DELETE request, including the ID of the asset to be deleted.
	var deleteAssetData = []byte(fmt.Sprintf(`{"id": "%s"}`, testAssetID))

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/DeleteAsset", bytes.NewBuffer(deleteAssetData))

	DeleteAsset(mockDB, c)

	// Check if the HTTP status code is OK
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response) // Parse the HTTP response
	assert.NoError(t, err)                          // Check there's no error

	assert.Equal(t, "Asset deleted successfully", response["message"])
}
