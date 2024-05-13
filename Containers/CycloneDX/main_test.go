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
		name            string
		assetID         string
		expectedCode    int
		expectedBody    string
		authenticated   bool
		isAdmin         bool
		canManageAssets bool
	}{
		{
			name:            "Successful Removal (admin)",
			assetID:         "existingAssetID",
			expectedCode:    http.StatusOK,
			authenticated:   true,
			isAdmin:         true,
			canManageAssets: true,
			// Update this to be a JSON response
			expectedBody: `{"message":"CycloneDX file removed."}`,
		},
		{
			name:            "Successful Removal (non-admin)",
			assetID:         "existingAssetID",
			expectedCode:    http.StatusOK,
			authenticated:   true,
			isAdmin:         false,
			canManageAssets: true,
			expectedBody:    `{"message":"CycloneDX file removed."}`,
		},
		{
			name:            "Failed Removal",
			assetID:         "nonExistingAssetID",
			expectedCode:    http.StatusInternalServerError,
			authenticated:   true,
			isAdmin:         true,
			canManageAssets: true,
			// Update this to be a JSON response
			expectedBody: `{"error":"Failed to remove SBOM from database."}`,
		},
		{
			name:            "User not authenticated",
			assetID:         "existingAssetID",
			expectedCode:    http.StatusUnauthorized,
			expectedBody:    `{"error":"Unauthorized"}`,
			authenticated:   false,
			isAdmin:         true,
			canManageAssets: true,
		},
		{
			name:            "User authenticated but cannot manage assets",
			assetID:         "existingAssetID",
			expectedCode:    http.StatusForbidden,
			expectedBody:    `{"error":"Invalid privileges for operation"}`,
			authenticated:   true,
			isAdmin:         false,
			canManageAssets: false,
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

			//create the authentication object

			auth := dbcon.AuthResponse{
				Authenticated:   tc.authenticated,
				Roles:           nil,
				IsAdmin:         tc.isAdmin,
				CanManageAssets: tc.canManageAssets,
			}

			// Call the function under test
			removeCycloneDX(mockDB, c, auth)

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
