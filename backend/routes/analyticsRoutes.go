package routes

import (
	"expensetracker/controllers"
	"expensetracker/middleware"

	"github.com/gin-gonic/gin"
)

func SetupAnalyticsRoutes(router *gin.Engine) {
	analytics := router.Group("/api/analytics")
	analytics.Use(middleware.AuthMiddleware())
	{
		analytics.GET("/dashboard", controllers.GetAnalyticsDashboard)
	}
}
