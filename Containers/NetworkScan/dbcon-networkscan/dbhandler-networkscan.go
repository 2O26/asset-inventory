package dbcon_networkscan

import (
	"context"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDBHelper struct {
	Collection *mongo.Collection
}

// AddScan handles POST requests to add a new scan
type DatabaseHelper interface {
	InsertOne(ctx context.Context, document interface{}) (*mongo.InsertOneResult, error)
	FindOne(ctx context.Context, filter interface{}, opts ...*options.FindOneOptions) *mongo.SingleResult
	Find(ctx context.Context, filter interface{}) ([]bson.M, error)
	DeleteMany(ctx context.Context, filter interface{}) (*mongo.DeleteResult, error)
	UpdateOne(ctx context.Context, filter interface{}, update interface{}) (*mongo.UpdateResult, error)
	DeleteOne(ctx context.Context, filter interface{}) (*mongo.DeleteResult, error)
}

func (m *MongoDBHelper) InsertOne(ctx context.Context, document interface{}) (*mongo.InsertOneResult, error) {
	return m.Collection.InsertOne(ctx, document)
}
func (m *MongoDBHelper) FindOne(ctx context.Context, filter interface{}, opts ...*options.FindOneOptions) *mongo.SingleResult {
	return m.Collection.FindOne(ctx, filter, opts...)
}
func (m *MongoDBHelper) DeleteMany(ctx context.Context, filter interface{}) (*mongo.DeleteResult, error) {
	return m.Collection.DeleteMany(ctx, filter)
}

// Implementing the UpdateOne method for MongoDBHelper
func (m *MongoDBHelper) UpdateOne(ctx context.Context, filter interface{}, update interface{}) (*mongo.UpdateResult, error) {
	return m.Collection.UpdateOne(ctx, filter, update)
}

// Implementing the DeleteOne method for MongoDBHelper
func (m *MongoDBHelper) DeleteOne(ctx context.Context, filter interface{}) (*mongo.DeleteResult, error) {
	return m.Collection.DeleteOne(ctx, filter)
}
func (m *MongoDBHelper) Find(ctx context.Context, filter interface{}) ([]bson.M, error) {
	var results []bson.M
	cur, err := m.Collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var elem bson.M
		if err := cur.Decode(&elem); err != nil {
			return nil, err
		}
		results = append(results, elem)
	}
	if err := cur.Err(); err != nil {
		return nil, err
	}
	return results, nil
}

type MockDB struct {
	mock.Mock
}

func (m *MockDB) Find(ctx context.Context, filter interface{}) ([]bson.M, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).([]bson.M), args.Error(1)
}

func (m *MockDB) DeleteMany(ctx context.Context, filter interface{}) (*mongo.DeleteResult, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).(*mongo.DeleteResult), args.Error(1)
}
func (m *MockDB) InsertOne(ctx context.Context, document interface{}) (*mongo.InsertOneResult, error) {
	args := m.Called(ctx, document)
	return args.Get(0).(*mongo.InsertOneResult), args.Error(1)
}
func (m *MockDB) UpdateOne(ctx context.Context, filter interface{}, update interface{}) (*mongo.UpdateResult, error) {
	args := m.Called(ctx, filter, update)
	return args.Get(0).(*mongo.UpdateResult), args.Error(1)
}

// Add mock implementation for DeleteOne
func (m *MockDB) DeleteOne(ctx context.Context, filter interface{}) (*mongo.DeleteResult, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).(*mongo.DeleteResult), args.Error(1)
}
