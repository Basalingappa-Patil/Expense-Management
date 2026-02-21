package routes

import (
	"expensetracker/controllers"
	"expensetracker/middleware"

	"github.com/gin-gonic/gin"
)

func SetupGroupRoutes(router *gin.Engine) {
	groupRoutes := router.Group("/api/groups")
	groupRoutes.Use(middleware.AuthMiddleware())
	{
		groupRoutes.POST("", controllers.CreateGroup)
		groupRoutes.POST("/:id/members", controllers.AddMember)
		groupRoutes.GET("/:id", controllers.GetGroupDetails)
		groupRoutes.GET("", controllers.GetUserGroups)
	}
}
