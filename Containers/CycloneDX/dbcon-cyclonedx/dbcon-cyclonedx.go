package dbcon_cyclonedx

import (
	"context"
	"fmt"
	"log"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var client *mongo.Client
var dbName string

func SetupDatabase(uri string, databaseName string) error {
	ctx := context.TODO()
	clientOptions := options.Client().ApplyURI(uri)

	var err error
	client, err = mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal(err)
		return err
	}
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
		return err
	}

	dbName = databaseName
	return nil
}

func GetCollection(collectionName string) *mongo.Collection {
	return client.Database(dbName).Collection(collectionName)
}

// Assuming `db` is an interface to MongoDB with a method `InsertOne` that inserts a document.
func SaveCycloneDX(db DatabaseHelper, sbomData []byte, assetID string) error {
	// Create a document with SBOM data and AssetID
	doc := map[string]interface{}{
		assetID: sbomData,
	}

	// Insert the document into MongoDB
	_, err := db.InsertOne(context.Background(), doc)
	if err != nil {
		return fmt.Errorf("failed to save SBOM to MongoDB: %w", err)
	}

	return nil
}
