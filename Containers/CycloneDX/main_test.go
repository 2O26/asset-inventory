package main

import (
	dbcon "assetinventory/cyclonedx/dbcon-cyclonedx"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/assert/v2"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestRemoveCycloneDX(t *testing.T) {
	// Asset ID
	// Mock the database helper
	mockDB := new(dbcon.MockDB)
	mockResult := &mongo.DeleteResult{DeletedCount: 1}

	// Correct the mock expectations here
	mockDB.On("DeleteOne", mock.Anything, bson.M{"_id": "existingAssetID"}).Return(mockResult, nil)

	// Define test cases
	tests := []struct {
		name         string
		assetID      string
		expectedCode int
		expectedBody string
	}{
		{
			name:         "Successful Removal",
			assetID:      "existingAssetID",
			expectedCode: http.StatusOK,
			// Update this to be a JSON response
			expectedBody: `{"message":"CycloneDX file removed."}`,
		},
		{
			name:         "Failed Removal",
			assetID:      "nonExistingAssetID",
			expectedCode: http.StatusInternalServerError,
			// Update this to be a JSON response
			expectedBody: `{"error":"Failed to remove SBOM from database."}`,
		},
	}

	// Run the tests
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Create a new recorder to record the response
			w := httptest.NewRecorder()                                                            // Create a ResponseRecorder (which satisfies http.ResponseWriter)
			c, _ := gin.CreateTestContext(w)                                                       // Create a fake gin context
			form := url.Values{}                                                                   // Create a new form
			form.Add("assetID", tc.assetID)                                                        // Add the asset ID to the form
			c.Request, _ = http.NewRequest(http.MethodPost, "/", strings.NewReader(form.Encode())) // Create a new POST request with the form
			c.Request.Header.Add("Content-Type", "application/x-www-form-urlencoded")              // Add the content type to the request
			if tc.name == "Failed Removal" {
				mockDB.On("DeleteOne", mock.Anything, bson.M{"_id": "nonExistingAssetID"}).Return(&mongo.DeleteResult{DeletedCount: 0}, nil)
			}
			// Call the function under test
			removeCycloneDX(mockDB, c)

			// Check the response code
			assert.Equal(t, tc.expectedCode, w.Code)

			// Check the response body
			if w.Body.String() != tc.expectedBody {
				t.Errorf("Expected body to be %s, got %s", tc.expectedBody, w.Body.String())
			}
			// Correct the assertion to check the DeleteOne call
			mockDB.AssertCalled(t, "DeleteOne", mock.Anything, bson.M{"_id": tc.assetID})
		})
	}
}
