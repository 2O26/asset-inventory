package dbcon_cyclonedx

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestSaveCycloneDX(t *testing.T) {
	// Subtest for successful insertion
	t.Run("Success", func(t *testing.T) {
		// Create a mock database helper for testing
		mockDB := new(MockDB)

		// Mock behavior for InsertOne method
		mockDB.On("InsertOne", mock.Anything, mock.AnythingOfType("CycloneDXDocument")).Return(&mongo.InsertOneResult{}, nil)

		// Sample SBOM data and asset ID
		sbomData := []byte(`{
	  "$schema": "http://cyclonedx.org/schema/bom-1.5.schema.json"}`)
		assetID := "sampleAssetID"

		// Call the function being tested
		err := SaveCycloneDX(mockDB, sbomData, assetID)
		if err != nil {
			t.Errorf("SaveCycloneDX returned an unexpected error: %v", err)
		}

		// Assert that the InsertOne method was called with the expected arguments
		mockDB.AssertCalled(t, "InsertOne", context.Background(), mock.AnythingOfType("CycloneDXDocument"))

		// Assert that the InsertOne method was called exactly once
		mockDB.AssertNumberOfCalls(t, "InsertOne", 1)
	})

	// Subtest for insertion failure
	t.Run("Failure", func(t *testing.T) {
		// Create a mock database helper for testing
		mockDB := new(MockDB)

		// Mock behavior for InsertOne method returning an error
		expectedErr := errors.New("failed to save SBOM to MongoDB")
		mockDB.On("InsertOne", mock.Anything, mock.AnythingOfType("CycloneDXDocument")).Return(&mongo.InsertOneResult{}, expectedErr)

		// Sample SBOM data and asset ID
		sbomData := []byte("Sample SBOM data")
		assetID := "sampleAssetID"

		// Call the function being tested
		err := SaveCycloneDX(mockDB, sbomData, assetID)

		// Assert that SaveCycloneDX returns the expected error
		if err == nil || err.Error() != expectedErr.Error() {
			t.Errorf("SaveCycloneDX returned unexpected error: got %v, want %v", err, expectedErr)
		}

		// Assert that the InsertOne method was called with the expected arguments
		mockDB.AssertCalled(t, "InsertOne", context.Background(), mock.AnythingOfType("CycloneDXDocument"))
	})
}

func TestGetCycloneDXFile(t *testing.T) {
	// Create a mock database helper
	mockDB := new(MockDB)
	// sbomData := []byte(`{
	//   "$schema": "http://cyclonedx.org/schema/bom-1.5.schema.json"}`)
	recorder := httptest.NewRecorder()

	// Define test cases
	tests := []struct {
		name          string
		queryParam    string
		expectedCode  int
		expectedError string
		mockBehavior  func()
	}{
		// {
		// 	name:         "Success",
		// 	queryParam:   "sampleAssetID",
		// 	expectedCode: http.StatusOK,
		// 	mockBehavior: func() {
		// 		// Create a mock SingleResult with any non-nil value (e.g., a non-empty document)
		// 		mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(sbomData, nil, nil))
		// 	},
		// },
		{
			name:          "MissingAssetID",
			queryParam:    "",
			expectedCode:  http.StatusBadRequest,
			expectedError: "Asset ID is missing",
			mockBehavior: func() {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(&mongo.SingleResult{}, nil)
			},
		},
		{
			name:          "FileNotFound",
			queryParam:    "nonExistentAssetID",
			expectedCode:  http.StatusNotFound,
			expectedError: "CycloneDX file not found for asset ID: nonExistentAssetID",
			mockBehavior: func() {
				mockDB.On("FindOne", mock.Anything, mock.Anything).Return(nil, mongo.ErrNoDocuments)
			},
		},
	}

	// Iterate over test cases
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Reset the recorder before each test case
			recorder = httptest.NewRecorder()
			c, _ := gin.CreateTestContext(recorder)
			c.Request, _ = http.NewRequest(http.MethodGet, "/getCycloneDXFile?assetID="+tc.queryParam, nil)

			// Set up mock behavior
			tc.mockBehavior()

			// Call the function under test
			GetCycloneDXFile(mockDB, c)

			// Assert the HTTP status code
			if recorder.Code != tc.expectedCode {
				t.Errorf("unexpected status code: got %v, want %d", recorder, tc.expectedCode)
			}

			// Assert the response body
			if tc.expectedError != "" {
				expectedBody := `{"error":"` + tc.expectedError + `"}`
				if recorder.Body.String() != expectedBody {
					t.Errorf("unexpected response body: got %s, want %s", recorder.Body.String(), expectedBody)
				}
			}
		})
	}
}
