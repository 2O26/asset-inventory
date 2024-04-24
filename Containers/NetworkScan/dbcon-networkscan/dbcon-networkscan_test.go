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

// func TestDeleteAsset(t *testing.T) {
// 	mockDB := new(MockDB)
// 	ctx := context.TODO()

// 	// Correcting the mock setup for FindOne to use the right options type
// 	findOneOptions := options.FindOne().SetSort(bson.D{{Key: "dateupdated", Value: -1}})
// 	mockDB.On("FindOne", ctx, bson.D{}, findOneOptions).Return(mock.Anything, nil).Once()

// 	// Simulate a scenario where the FindOne method successfully retrieves a scan
// 	sampleScan := Scan{
// 		StateID: "scanExample",
// 		State: map[string]Asset{
// 			"asset1": {UID: "asset1"},
// 			"asset2": {UID: "asset2"},
// 			"asset3": {UID: "asset3"}, // This asset should remain after others are deleted
// 		},
// 	}
// 	mockDB.On("FindOne", ctx, bson.D{}, findOneOptions).Return(sampleScan, nil)

// 	// Simulating the InsertOne call which should happen after deletion
// 	mockDB.On("InsertOne", ctx, mock.AnythingOfType("Scan")).Return(nil).Once()

// 	assetIDs := []string{"asset1", "asset2"}
// 	err := DeleteAsset(mockDB, assetIDs)
// 	assert.NoError(t, err)

// 	// Assertions to check if the unwanted assets were deleted
// 	_, ok1 := sampleScan.State["asset1"]
// 	_, ok2 := sampleScan.State["asset2"]
// 	assert.False(t, ok1)
// 	assert.False(t, ok2)
// 	assert.Contains(t, sampleScan.State, "asset3")

// 	// Assert all expectations were met
// 	mockDB.AssertExpectations(t)
// }
