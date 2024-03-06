package dbcon

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/mongo"
)

// MockDB - Mock implementering av DatabaseHelper

// TestAddScan - Testfall för AddScan
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
