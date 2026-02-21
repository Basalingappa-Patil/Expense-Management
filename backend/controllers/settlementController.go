package controllers

import (
	"context"
	"net/http"
	"time"

	"expensetracker/config"
	"expensetracker/models"
	"expensetracker/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetSettlements(c *gin.Context) {
	groupIDStr := c.Param("groupId")
	groupID, err := primitive.ObjectIDFromHex(groupIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Calculate balances per user for this group
	balances := make(map[string]float64) // UserID (hex string) -> Balance

	expenseCollection := config.GetCollection("expenses")
	cursor, err := expenseCollection.Find(ctx, bson.M{"groupId": groupID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expenses"})
		return
	}
	defer cursor.Close(ctx)

	var expenses []models.Expense
	if err = cursor.All(ctx, &expenses); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode expenses"})
		return
	}

	splitCollection := config.GetCollection("splits")

	// Pre-calculate: Positive balance = paid more than owed (Creditor). Negative balance = owed more than paid (Debtor).
	for _, exp := range expenses {
		payerIDHex := exp.PaidBy.Hex()
		balances[payerIDHex] += exp.Amount

		// Subtract their splits
		splitCursor, err := splitCollection.Find(ctx, bson.M{"expenseId": exp.ID})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch splits"})
			return
		}

		var splits []models.Split
		if err = splitCursor.All(ctx, &splits); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode splits"})
			return
		}

		for _, split := range splits {
			splitUserIDHex := split.UserID.Hex()
			balances[splitUserIDHex] -= split.Amount
		}
		splitCursor.Close(ctx)
	}

	// 2. Fetch Verified Payments and Adjust Balances
	paymentCollection := config.GetCollection("payments")
	paymentCursor, err := paymentCollection.Find(ctx, bson.M{"groupId": groupID, "status": "verified"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments"})
		return
	}
	defer paymentCursor.Close(ctx)

	var payments []models.Payment
	if err = paymentCursor.All(ctx, &payments); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode payments"})
		return
	}

	for _, payment := range payments {
		payerIDHex := payment.PayerID.Hex()
		receiverIDHex := payment.ReceiverID.Hex()

		// Payer paid money, so their balance goes up (they owe less or are owed more)
		balances[payerIDHex] += payment.Amount
		// Receiver got money, so their balance goes down (they are owed less)
		balances[receiverIDHex] -= payment.Amount
	}

	// 3. Pass balances to Settlement Service (Greedy Algorithm)
	transactions := services.CalculateOptimalSettlements(balances)

	c.JSON(http.StatusOK, gin.H{
		"message":      "Optimal settlements calculated",
		"transactions": transactions,
		"balances":     balances,
	})
}
