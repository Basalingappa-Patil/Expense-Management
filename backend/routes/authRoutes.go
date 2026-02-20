package routes

import (
	"expensetracker/controllers"

	"github.com/gin-gonic/gin"
)

func SetupAuthRoutes(router *gin.Engine) {
	authGroup := router.Group("/api/auth")
	{
		authGroup.POST("/signup", controllers.Register)
		authGroup.POST("/login", controllers.Login)
	}
}
