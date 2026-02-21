package main

import (
	"log"
	"os"
	"strings"

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

	// Connect to Database if valid URI is present
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI != "" && !strings.Contains(mongoURI, "<username>:<password>") {
		config.ConnectDB()
	} else {
		log.Println("⚠️ WARNING: Invalid or default MONGO_URI in .env")
		log.Println("⚠️ Database is NOT connected. APIs will return 500 errors.")
		log.Println("⚠️ Please update backend/.env with your real MongoDB Atlas connection string.")
	}

	// Initialize Gin router
	r := gin.Default()

	// Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(corsConfig))

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
	routes.SetupPaymentRoutes(r)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
