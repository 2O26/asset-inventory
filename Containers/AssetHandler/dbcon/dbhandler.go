package dbcon

import (
	"context"
	"time"

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

func (mdh *MockDB) FindOne(ctx context.Context, filter interface{}, opts ...*options.FindOneOptions) *mongo.SingleResult {
	scan := Scan{
		MostRecentUpdate: time.Date(2024, 2, 28, 14, 3, 58, 169000000, time.UTC),
		Assets: map[string]Asset{
			"AID_4123523": {
				Name:        "PC-A",
				Owner:       "UID_2332",
				DateCreated: "2024-02-14 23:00:00",
				DateUpdated: "2024-02-14 23:00:30",
				Criticality: 2,
			},
			"AID_5784393": {
				Name:        "Chromecast",
				Owner:       "UID_2332",
				DateCreated: "2024-02-10 20:04:20",
				DateUpdated: "2024-02-14 23:00:30",
				Criticality: 1,
			},
			"AID_9823482": {
				Name:        "Password Vault",
				Owner:       "UID_2332",
				DateCreated: "2024-02-14 23:00:00",
				DateUpdated: "2024-02-14 23:00:30",
				Criticality: 4,
			},
		},
		Plugins: map[string]PluginState{
			"ipScan": {
				StateID: "20240214-1300A",
			},
			"macScan": {
				StateID: "20240215-0800G",
			},
		},
		Relations: map[string]Relation{
			"RID_2613785": {
				From:        "ID_4123523",
				To:          "ID_5784393",
				Direction:   "uni",
				Owner:       "UID_2332",
				DateCreated: "2024-02-14 23:35:53",
			},
			"RID_6492733": {
				From:        "ID_5784393",
				To:          "ID_9823482",
				Direction:   "bi",
				Owner:       "UID_6372",
				DateCreated: "2024-01-22 07:32:32",
			},
		},
	}

	bsonDoc, err := bson.Marshal(scan)
	if err != nil {
		panic("Failed to marshal mock scan data: " + err.Error())
	}
	var doc bson.D
	err = bson.Unmarshal(bsonDoc, &doc)
	if err != nil {
		panic("Failed to unmarshal mock scan data: " + err.Error())
	}

	return mongo.NewSingleResultFromDocument(doc, nil, nil)

}
