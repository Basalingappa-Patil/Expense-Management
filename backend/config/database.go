package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Client

func ConnectDB() {
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Println("MONGO_URI environment variable not set. Skipping DB connection.")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(mongoURI)

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Println("Failed to connect to MongoDB: ", err)
		return
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Println("Failed to ping MongoDB: ", err)
		return
	}

	fmt.Println("Connected to MongoDB Atlas!")
	DB = client
}

// GetCollection returns a mongo collection
func GetCollection(collectionName string) *mongo.Collection {
	if DB == nil {
		log.Println("Warning: Attempted to get collection but DB is nil")
		return nil
	}
	return DB.Database("expensetracker").Collection(collectionName)
}
