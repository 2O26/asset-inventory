package dbcon_networkscan

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestSetupDatabase(t *testing.T) {
	mockDB := new(MockDB)
	ctx := context.TODO()
	uri := "mongodb://localhost:27019/"
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

func TestDeleteAsset(t *testing.T) {
	testScan := Scan{
		StateID:     "",
		DateCreated: "2024-04-25 11:33:31",
		DateUpdated: "2024-04-25 11:33:36",
		State: map[string]Asset{
			"47716233453240327": {
				IPv4Addr:  "192.168.1.12",
				OpenPorts: []int{},
				ScanType:  "simple",
				Status:    "up",
				Subnet:    "192.168.1.0/24",
				UID:       "47716233453240327",
			},
			"47716233537126407": {
				IPv4Addr:  "192.168.1.115",
				OpenPorts: []int{},
				ScanType:  "simple",
				Status:    "up",
				Subnet:    "192.168.1.0/24",
				UID:       "47716233537126407",
			},
			"47716234560536583": {
				IPv4Addr:  "192.168.1.58",
				OpenPorts: []int{},
				ScanType:  "simple",
				Status:    "up",
				Subnet:    "192.168.1.0/24",
				UID:       "47716234560536583",
			},
		},
	}

	testCases := []struct {
		name         string
		assetIDs     []string
		mockSetup    func(*MockDB)
		expectError  bool
		errorMessage string
	}{
		{
			name:     "Asset Not Found",
			assetIDs: []string{"nonexistentID"},
			mockSetup: func(db *MockDB) {
				db.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan, nil, nil))
				db.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{}, nil)
			},
			expectError: false,
		},
		{
			name:     "Asset Deleted Successfully",
			assetIDs: []string{"47716233453240327"},
			mockSetup: func(db *MockDB) {
				db.On("FindOne", mock.Anything, mock.Anything, mock.Anything).Return(mongo.NewSingleResultFromDocument(testScan, nil, nil))
				db.On("InsertOne", mock.Anything, mock.Anything).Return(&mongo.InsertOneResult{InsertedID: "mockID"}, nil)
			},
			expectError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockDB := new(MockDB)
			tc.mockSetup(mockDB)

			err := DeleteAsset(mockDB, tc.assetIDs)

			if tc.expectError {
				assert.Error(t, err)
				assert.Equal(t, tc.errorMessage, err.Error())
			} else {
				assert.NoError(t, err)
			}

			mockDB.AssertExpectations(t)
		})
	}
}
