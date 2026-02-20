package main

import (
	"log"
	"os"

	"expensetracker/config"
	"expensetracker/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, assuming environment variables are set")
	}

	// Connect to Database
	// We'll wrap this or let it run when the MongoDB URI is defined
	config.ConnectDB()

	// Initialize Gin router
	r := gin.Default()

	// Configure CORS
	r.Use(cors.Default())

	// Basic route for testing
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "success",
			"message": "Expense Tracker API is running",
		})
	})

	// Setup routes
	routes.SetupAuthRoutes(r)
	routes.SetupGroupRoutes(r)
	routes.SetupExpenseRoutes(r)
	routes.SetupSettlementRoutes(r)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
