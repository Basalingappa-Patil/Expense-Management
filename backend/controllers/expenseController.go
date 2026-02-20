package controllers

import (
	"context"
	"net/http"
	"time"

	"expensetracker/config"
	"expensetracker/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func AddExpense(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req models.AddExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	groupID, err := primitive.ObjectIDFromHex(req.GroupID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Verify group exists and user is a member
	groupCollection := config.GetCollection("groups")
	var group models.Group
	err = groupCollection.FindOne(ctx, bson.M{"_id": groupID}).Decode(&group)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	isMember := false
	for _, memberID := range group.Members {
		if memberID == userID {
			isMember = true
			break
		}
	}
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this group"})
		return
	}

	// Insert Expense
	expenseCollection := config.GetCollection("expenses")
	newExpense := models.Expense{
		ID:          primitive.NewObjectID(),
		GroupID:     groupID,
		PaidBy:      userID,
		Amount:      req.Amount,
		Description: req.Description,
		CreatedAt:   time.Now(),
	}

	_, err = expenseCollection.InsertOne(ctx, newExpense)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add expense"})
		return
	}

	// Handle Splits (Equal Split for simplicity based on project details)
	numMembers := float64(len(group.Members))
	splitAmount := req.Amount / numMembers

	splitCollection := config.GetCollection("splits")
	var splits []interface{}

	for _, memberID := range group.Members {
		split := models.Split{
			ID:        primitive.NewObjectID(),
			ExpenseID: newExpense.ID,
			UserID:    memberID,
			Amount:    splitAmount,
		}
		splits = append(splits, split)
	}

	_, err = splitCollection.InsertMany(ctx, splits)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate splits"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Expense added and split successfully",
		"expense": newExpense,
		"splits":  splits,
	})
}
