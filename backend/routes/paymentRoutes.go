package routes

import (
	"expensetracker/controllers"
	"expensetracker/middleware"

	"github.com/gin-gonic/gin"
)

func SetupPaymentRoutes(r *gin.Engine) {
	api := r.Group("/api/payments")
	api.Use(middleware.AuthMiddleware())
	{
		api.POST("", controllers.InitiatePayment)
		api.POST("/verify", controllers.VerifyPayment)
		api.GET("/:groupId", controllers.GetGroupPayments)
	}
}
