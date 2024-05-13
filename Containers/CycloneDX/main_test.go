package main

import (
	dbcon "assetinventory/cyclonedx/dbcon-cyclonedx"
	"bytes"
	"errors"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"net/url"
	"strings"
	"testing"
	"time"

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

func TestUploadCycloneDX(t *testing.T) {
	mockDB := new(dbcon.MockDB)
	defer mockDB.Mock.AssertExpectations(t)
	// Sample SBOM data and asset ID
	sbomData := []byte(`{
            "$schema": "http://cyclonedx.org/schema/bom-1.5.schema.json"
        }`)
	assetID := "sampleAssetID"
	expectedDoc := dbcon.CycloneDXDocument{
		ID:               assetID,
		SBOMData:         sbomData,
		MostRecentUpdate: time.Now(),
	}
	mockInsertResult := &mongo.InsertOneResult{InsertedID: "test-id"}
	mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(mockInsertResult, nil)
	mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(expectedDoc, mongo.ErrNoDocuments, nil))
	router := gin.New()
	//assuming the user can manage assets
	auth := dbcon.AuthResponse{
		Authenticated:   true,
		Roles:           nil,
		IsAdmin:         false,
		CanManageAssets: true,
	}

	router.POST("/uploadCycloneDX", func(c *gin.Context) {
		uploadCycloneDX(mockDB, c, auth)
	})

	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)

	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", `form-data; name="file"; filename="test.json"`)
	header.Set("Content-Type", "application/json")

	part, err := writer.CreatePart(header)
	if err != nil {
		t.Errorf("Failed to create form part: %v", err)
		return
	}

	_, err = part.Write([]byte(`{"metadata":{"component":{"name":"Test Component"}}}`))
	if err != nil {
		t.Errorf("Failed to write to form part: %v", err)
		return
	}

	err = writer.WriteField("assetID", "test-id")
	if err != nil {
		t.Errorf("Failed to write field 'assetID': %v", err)
		return
	}

	writer.Close()

	req, err := http.NewRequest("POST", "/uploadCycloneDX", body)
	if err != nil {
		t.Errorf("Failed to create request: %v", err)
		return
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected HTTP status 200, got %d. Response body: %s", w.Code, w.Body.String())
	}

	mockDB.Mock.AssertCalled(t, "InsertOne", mock.Anything, mock.Anything)
}

func TestUploadCycloneDX_InvalidAttempts(t *testing.T) {
	mockDB := new(dbcon.MockDB)
	defer mockDB.Mock.AssertExpectations(t)

	// Define subtests
	tests := []struct {
		name            string
		setupRequest    func() *http.Request
		mockSetup       func()
		expectedError   string
		expectedCode    int
		authenticated   bool
		isAdmin         bool
		canManageAssets bool
	}{
		{
			name: "Invalid file upload attempt",
			setupRequest: func() *http.Request {
				body := new(bytes.Buffer)
				writer := multipart.NewWriter(body)
				writer.Close()

				req, _ := http.NewRequest("POST", "/uploadCycloneDX", body)
				req.Header.Set("Content-Type", writer.FormDataContentType())
				return req
			},
			mockSetup: func() {
				// No need to setup the mock as the error is before DB interaction
			},
			expectedError:   "Invalid file upload attempt",
			expectedCode:    http.StatusBadRequest,
			authenticated:   true,
			isAdmin:         true,
			canManageAssets: true,
		},
		{
			name: "Only JSON or XML files are allowed",
			setupRequest: func() *http.Request {
				body := new(bytes.Buffer)
				writer := multipart.NewWriter(body)

				part, _ := writer.CreateFormFile("file", "test.txt")
				part.Write([]byte(`Not JSON or XML`))

				writer.WriteField("assetID", "test-id")
				writer.Close()

				req, _ := http.NewRequest("POST", "/uploadCycloneDX", body)
				req.Header.Set("Content-Type", writer.FormDataContentType())
				return req
			},
			mockSetup: func() {
				// No need to setup the mock as the error is before DB interaction
			},
			expectedError:   "Only JSON or XML files are allowed",
			expectedCode:    http.StatusBadRequest,
			authenticated:   true,
			isAdmin:         true,
			canManageAssets: true,
		},
		{
			name: "Failed to save SBOM to database",
			setupRequest: func() *http.Request {
				body := new(bytes.Buffer)
				writer := multipart.NewWriter(body)

				header := make(textproto.MIMEHeader)
				header.Set("Content-Disposition", `form-data; name="file"; filename=test.json`)
				header.Set("Content-Type", "application/json")
				part, err := writer.CreatePart(header)
				if err != nil {
					t.Errorf("Failed to create form part: %v", err)
					return nil
				}

				_, err = part.Write([]byte(`{"metadata":{"component":{"name":"Test Component"}}}`))
				if err != nil {
					t.Errorf("Failed to write to form part: %v", err)
					return nil
				}

				err = writer.WriteField("assetID", "test-id")
				if err != nil {
					t.Errorf("Failed to write field 'assetID': %v", err)
					return nil
				}

				writer.Close()

				req, err := http.NewRequest("POST", "/uploadCycloneDX", body)
				if err != nil {
					t.Errorf("Failed to create request: %v", err)
					return nil
				}
				req.Header.Set("Content-Type", writer.FormDataContentType())
				return req
			},
			mockSetup: func() {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(&mongo.SingleResult{}, errors.New("database error"))
			},
			expectedError:   "Failed to save SBOM to database",
			expectedCode:    http.StatusInternalServerError,
			authenticated:   true,
			isAdmin:         true,
			canManageAssets: true,
		},
		{
			name: "User not authenticated",
			setupRequest: func() *http.Request {
				body := new(bytes.Buffer)
				writer := multipart.NewWriter(body)
				writer.Close()

				req, _ := http.NewRequest("POST", "/uploadCycloneDX", body)
				req.Header.Set("Content-Type", writer.FormDataContentType())
				return req
			},
			mockSetup: func() {
				// No need to setup the mock as the error is before DB interaction
			},
			expectedCode:    http.StatusUnauthorized,
			expectedError:   "Unauthorized",
			authenticated:   false,
			isAdmin:         true,
			canManageAssets: true,
		},
		{
			name: "User authorized but cannot manage assets",
			setupRequest: func() *http.Request {
				body := new(bytes.Buffer)
				writer := multipart.NewWriter(body)
				writer.Close()

				req, _ := http.NewRequest("POST", "/uploadCycloneDX", body)
				req.Header.Set("Content-Type", writer.FormDataContentType())
				return req
			},
			mockSetup: func() {
				// No need to setup the mock as the error is before DB interaction
			},
			expectedCode:    http.StatusForbidden,
			expectedError:   "Invalid privileges for operation",
			authenticated:   true,
			isAdmin:         false,
			canManageAssets: false,
		},
		{
			name: "Failed to convert XML to JSON",
			setupRequest: func() *http.Request {
				body := new(bytes.Buffer)
				writer := multipart.NewWriter(body)

				header := make(textproto.MIMEHeader)
				header.Set("Content-Disposition", `form-data; name="file"; filename=test.xml`)
				header.Set("Content-Type", "text/xml")
				part, err := writer.CreatePart(header)
				if err != nil {
					t.Errorf("Failed to create form part: %v", err)
					return nil
				}

				_, err = part.Write([]byte(`{"metadata":{"component":{"name":"Test Component"}}}`))
				if err != nil {
					t.Errorf("Failed to write to form part: %v", err)
					return nil
				}

				err = writer.WriteField("assetID", "test-id")
				if err != nil {
					t.Errorf("Failed to write field 'assetID': %v", err)
					return nil
				}

				writer.Close()

				req, err := http.NewRequest("POST", "/uploadCycloneDX", body)
				if err != nil {
					t.Errorf("Failed to create request: %v", err)
					return nil
				}
				req.Header.Set("Content-Type", writer.FormDataContentType())
				return req
			},
			mockSetup: func() {

			},
			expectedError:   "Failed to convert XML to JSON",
			expectedCode:    http.StatusInternalServerError,
			authenticated:   true,
			isAdmin:         true,
			canManageAssets: false,
		},
	}

	// Run subtests
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			auth := dbcon.AuthResponse{
				Authenticated:   tc.authenticated,
				Roles:           nil,
				IsAdmin:         tc.isAdmin,
				CanManageAssets: tc.canManageAssets,
			}
			router := gin.New()
			router.POST("/uploadCycloneDX", func(c *gin.Context) {
				uploadCycloneDX(mockDB, c, auth)
			})
			tc.mockSetup()

			req := tc.setupRequest()
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Check status code
			if w.Code != tc.expectedCode {
				t.Errorf("%s: expected status code %d, but got %d", tc.name, tc.expectedCode, w.Code)
			}

			// Check error message
			responseBody := w.Body.String()
			if !strings.Contains(responseBody, tc.expectedError) {
				t.Errorf("%s: expected error message to contain %q, but got %s", tc.name, tc.expectedError, responseBody)
			}
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
