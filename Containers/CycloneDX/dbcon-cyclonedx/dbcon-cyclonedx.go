package dbcon_cyclonedx

import (
	"context"
	"fmt"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
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

func SaveCycloneDX(db DatabaseHelper, sbomData []byte, assetID string) error {
	// Unmarshal the SBOM data into a CycloneDX BOM struct
	// Add the AssetID field to the BOM struct
	// bom.AssetID = assetID

	// Insert the BOM struct into MongoDB
	_, err = db.InsertOne(context.Background(), bom)
	if err != nil {
		return fmt.Errorf("failed to save SBOM to MongoDB: %w", err)
	}

	return nil
}
