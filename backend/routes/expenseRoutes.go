package routes

import (
	"expensetracker/controllers"
	"expensetracker/middleware"

	"github.com/gin-gonic/gin"
)

func SetupExpenseRoutes(router *gin.Engine) {
	expenseRoutes := router.Group("/api/expenses")
	expenseRoutes.Use(middleware.AuthMiddleware())
	{
		expenseRoutes.POST("/", controllers.AddExpense)
		expenseRoutes.GET("/:groupId", controllers.GetGroupExpenses)
	}
}
