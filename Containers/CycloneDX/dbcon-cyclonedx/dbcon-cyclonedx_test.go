package dbcon_cyclonedx

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
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
func TestSaveCycloneDX(t *testing.T) {
	// Sample SBOM data and asset ID
	sbomData := []byte(`{
            "$schema": "http://cyclonedx.org/schema/bom-1.5.schema.json"
        }`)
	assetID := "sampleAssetID"

	// Create an expected CycloneDXDocument instance
	expectedDoc := CycloneDXDocument{
		ID:               assetID,
		SBOMData:         sbomData,
		MostRecentUpdate: time.Now(),
	}
	t.Run("ExistingDocument", func(t *testing.T) {
		// Create a mock database helper for testing
		mockDB := new(MockDB)

		mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(expectedDoc, nil, nil))
		// Mock behavior for ReplaceOne method
		mockDB.On("ReplaceOne", mock.Anything, mock.Anything, mock.Anything).Return(&mongo.UpdateResult{}, nil)

		// Call the function being tested
		err := SaveCycloneDX(mockDB, sbomData, assetID)
		if err != nil {
			t.Errorf("SaveCycloneDX returned an unexpected error: %v", err)
		}
		mockDB.AssertNumberOfCalls(t, "ReplaceOne", 1)
	})

	// Subtest for insertion failure
	t.Run("Error finding file", func(t *testing.T) {
		// Create a mock database helper for testing
		mockDB := new(MockDB)

		// Mock behavior for FindOne method returning no existing document
		mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(expectedDoc, errors.New("Error finding file"), nil))

		// Mock behavior for InsertOne method returning an erro

		// Call the function being tested
		err := SaveCycloneDX(mockDB, sbomData, assetID)

		// Assert that SaveCycloneDX returns the expected error
		if err.Error() != "Error finding file" {
			t.Errorf("SaveCycloneDX returned an unexpected error: %v", err)
		}
	})
	t.Run("Error inserting file", func(t *testing.T) {
		// Create a mock database helper for testing
		mockDB := new(MockDB)

		// Mock behavior for FindOne method returning no existing document
		mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(expectedDoc, mongo.ErrNoDocuments, nil))

		// Mock behavior for InsertOne method
		mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, nil)

		// Call the function being tested
		err := SaveCycloneDX(mockDB, sbomData, assetID)
		assert.NoError(t, err)
		// // Assert that SaveCycloneDX returns the expected error
		// if err != nil {
		// 	t.Errorf("SaveCycloneDX returned an unexpected error: %v", err)
		// }
		mockDB.AssertNumberOfCalls(t, "InsertOne", 1)
	})
	t.Run("Inserting new file", func(t *testing.T) {
		// Create a mock database helper for testing
		mockDB := new(MockDB)

		// Mock behavior for FindOne method returning no existing document
		mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(expectedDoc, mongo.ErrNoDocuments, nil))

		// Mock behavior for InsertOne method
		mockDB.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, errors.New("Error inserting file"))

		// Call the function being tested
		err := SaveCycloneDX(mockDB, sbomData, assetID)

		// Assert that SaveCycloneDX returns the expected error
		assert.Error(t, err)
	})
	t.Run("Error replacing file", func(t *testing.T) {
		// Create a mock database helper for testing
		mockDB := new(MockDB)

		mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(expectedDoc, nil, nil))
		// Mock behavior for ReplaceOne method
		mockDB.On("ReplaceOne", mock.Anything, mock.Anything, mock.Anything).Return(&mongo.UpdateResult{}, errors.New("Error replacing file"))

		// Call the function being tested
		err := SaveCycloneDX(mockDB, sbomData, assetID)
		assert.Error(t, err)
		mockDB.AssertNumberOfCalls(t, "ReplaceOne", 1)
	})
}
func TestRemoveCycloneDX(t *testing.T) {
	// Subtest for successful removal
	t.Run("Success", func(t *testing.T) {
		// Create a mock database helper for testing
		mockDB := new(MockDB)

		// Asset ID
		assetID := "sampleAssetID"

		// Mock behavior for DeleteOne method
		mockResult := &mongo.DeleteResult{DeletedCount: 1}
		mockDB.On("DeleteOne", mock.Anything, bson.M{"_id": assetID}).Return(mockResult, nil)

		// Call the function being tested
		err := RemoveCycloneDX(mockDB, assetID)
		if err != nil {
			t.Errorf("RemoveCycloneDX returned an unexpected error: %v", err)
		}

		// Assert that the DeleteOne method was called with the expected arguments
		mockDB.AssertCalled(t, "DeleteOne", context.Background(), bson.M{"_id": assetID})

		// Assert that the DeleteOne method was called exactly once
		mockDB.AssertNumberOfCalls(t, "DeleteOne", 1)
	})

	// Subtest for removal failure (database error)
	t.Run("DatabaseError", func(t *testing.T) {
		// Create a mock database helper for testing
		mockDB := new(MockDB)

		// Asset ID
		assetID := "sampleAssetID"

		// Mock behavior for DeleteOne method returning an error
		expectedErr := errors.New("failed to remove SBOM from MongoDB")
		mockDB.On("DeleteOne", mock.Anything, bson.M{"_id": assetID}).Return(&mongo.DeleteResult{}, expectedErr)

		// Call the function being tested
		err := RemoveCycloneDX(mockDB, assetID)

		// Assert that RemoveCycloneDX returns the expected error
		if err.Error() != expectedErr.Error() {
			t.Errorf("RemoveCycloneDX returned unexpected error: got %v, want %v", err, expectedErr)
		}

		// Assert that the DeleteOne method was called with the expected arguments
		mockDB.AssertCalled(t, "DeleteOne", context.Background(), bson.M{"_id": assetID})
	})

	// Subtest for removal failure (no documents deleted)
	t.Run("NoDocumentsDeleted", func(t *testing.T) {
		// Create a mock database helper for testing
		mockDB := new(MockDB)

		// Asset ID
		assetID := "sampleAssetID"

		// Mock behavior for DeleteOne method returning a result with DeletedCount = 0
		mockResult := &mongo.DeleteResult{DeletedCount: 0}
		mockDB.On("DeleteOne", mock.Anything, bson.M{"_id": assetID}).Return(mockResult, nil)

		// Call the function being tested
		err := RemoveCycloneDX(mockDB, assetID)

		// Assert that RemoveCycloneDX returns the expected error
		if err.Error() != "no files deleted" {
			t.Errorf("RemoveCycloneDX returned unexpected error: got %v, want %s", err, "no files deleted")
		}

		// Assert that the DeleteOne method was called with the expected arguments
		mockDB.AssertCalled(t, "DeleteOne", context.Background(), bson.M{"_id": assetID})
	})
}
func TestGetCycloneDXFile(t *testing.T) {
	// Create a mock database helper
	mockDB := new(MockDB)
	assetID := "sampleAssetID"
	sbomData := []byte(`{
	  "$schema": "http://cyclonedx.org/schema/bom-1.5.schema.json"}`)
	expectedDoc := CycloneDXDocument{
		ID:               assetID,
		SBOMData:         sbomData,
		MostRecentUpdate: time.Now(),
	}
	expectedDoc2 := bson.M{
		"_id":              1,
		"sbomData":         "invalid data",
		"mostRecentUpdate": time.Now()}
	recorder := httptest.NewRecorder()

	// Define test cases
	tests := []struct {
		name          string
		queryParam    string
		expectedCode  int
		expectedError string
	}{
		{
			name:         "Success",
			queryParam:   "sampleAssetID",
			expectedCode: http.StatusOK,
		},
		{
			name:          "MissingAssetID",
			queryParam:    "",
			expectedCode:  http.StatusBadRequest,
			expectedError: "Asset ID is missing",
		},
		{
			name:          "FileNotFound",
			queryParam:    "nonExistentAssetID",
			expectedCode:  http.StatusNotFound,
			expectedError: "CycloneDX file not found for asset ID: nonExistentAssetID",
		},
		{
			name:          "ErrorFindingFile",
			queryParam:    "sampleAssetID",
			expectedCode:  http.StatusInternalServerError,
			expectedError: "failed to find CycloneDX file in database: error finding file",
		},
		{
			name:          "ErrorDecodingDocument",
			queryParam:    "sampleAssetID",
			expectedCode:  http.StatusInternalServerError,
			expectedError: "failed to decode CycloneDX file data: error decoding key _id: cannot decode 32-bit integer into a string type",
		},
	}

	// Iterate over test cases
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Reset the recorder before each test case
			recorder = httptest.NewRecorder()
			c, _ := gin.CreateTestContext(recorder)
			c.Request, _ = http.NewRequest(http.MethodGet, "/getCycloneDXFile?assetID="+tc.queryParam, nil)
			if tc.name == "Success" {
				mockDB := new(MockDB)
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(expectedDoc, nil, nil))
				GetCycloneDXFile(mockDB, c)
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
			}
			if tc.name == "MissingAssetID" {
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(&mongo.SingleResult{}, nil)
				GetCycloneDXFile(mockDB, c)
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
			}
			if tc.name == "FileNotFound" {
				mockDB.On("FindOne", mock.Anything, mock.Anything).Return(nil, mongo.ErrNoDocuments)
				GetCycloneDXFile(mockDB, c)
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
			}
			if tc.name == "ErrorFindingFile" {
				mockDB := new(MockDB)
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(expectedDoc, errors.New("error finding file"), nil))
				GetCycloneDXFile(mockDB, c)
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
			}
			if tc.name == "ErrorDecodingDocument" {
				mockDB := new(MockDB)
				mockDB.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(expectedDoc2, nil, nil))
				GetCycloneDXFile(mockDB, c)
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
			}
		})
	}
}
