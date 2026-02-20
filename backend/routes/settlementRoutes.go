package routes

import (
	"expensetracker/controllers"
	"expensetracker/middleware"

	"github.com/gin-gonic/gin"
)

func SetupSettlementRoutes(router *gin.Engine) {
	settlementRoutes := router.Group("/api/settlements")
	settlementRoutes.Use(middleware.AuthMiddleware())
	{
		settlementRoutes.GET("/:groupId", controllers.GetSettlements)
	}
}
