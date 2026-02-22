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

type AnalyticsExpense struct {
	ID          string  `json:"id"`
	GroupID     string  `json:"groupId"`
	GroupName   string  `json:"groupName"`
	PaidBy      string  `json:"paidBy"`
	PaidByName  string  `json:"paidByName"`
	Amount      float64 `json:"amount"`
	Description string  `json:"description"`
	CreatedAt   string  `json:"createdAt"`
}

type AnalyticsPayment struct {
	ID            string  `json:"id"`
	GroupID       string  `json:"groupId"`
	GroupName     string  `json:"groupName"`
	PayerID       string  `json:"payerId"`
	PayerName     string  `json:"payerName"`
	ReceiverID    string  `json:"receiverId"`
	ReceiverName  string  `json:"receiverName"`
	Amount        float64 `json:"amount"`
	Status        string  `json:"status"`
	PaymentMethod string  `json:"paymentMethod"`
	Note          string  `json:"note"`
	CreatedAt     string  `json:"createdAt"`
}

func GetAnalyticsDashboard(c *gin.Context) {
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

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// 1. Fetch all groups the user belongs to
	groupCollection := config.GetCollection("groups")
	groupCursor, err := groupCollection.Find(ctx, bson.M{"members": userID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch groups"})
		return
	}
	defer groupCursor.Close(ctx)

	var groups []models.Group
	if err = groupCursor.All(ctx, &groups); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode groups"})
		return
	}

	// Build group ID list and name map
	var groupIDs []primitive.ObjectID
	groupNameMap := make(map[string]string)
	for _, g := range groups {
		groupIDs = append(groupIDs, g.ID)
		groupNameMap[g.ID.Hex()] = g.Name
	}

	if len(groupIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"expenses": []AnalyticsExpense{},
			"payments": []AnalyticsPayment{},
		})
		return
	}

	// Build user name lookup from all group members
	userNameMap := make(map[string]string)
	userCollection := config.GetCollection("users")
	for _, g := range groups {
		for _, memberID := range g.Members {
			hex := memberID.Hex()
			if _, found := userNameMap[hex]; !found {
				var u struct {
					Name string `bson:"name"`
				}
				err := userCollection.FindOne(ctx, bson.M{"_id": memberID}).Decode(&u)
				if err == nil {
					userNameMap[hex] = u.Name
				} else {
					userNameMap[hex] = hex[:6] + "..."
				}
			}
		}
	}

	// 2. Fetch all expenses across user's groups
	expenseCollection := config.GetCollection("expenses")
	expCursor, err := expenseCollection.Find(ctx, bson.M{"groupId": bson.M{"$in": groupIDs}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expenses"})
		return
	}
	defer expCursor.Close(ctx)

	var rawExpenses []models.Expense
	if err = expCursor.All(ctx, &rawExpenses); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode expenses"})
		return
	}

	analyticsExpenses := make([]AnalyticsExpense, 0, len(rawExpenses))
	for _, e := range rawExpenses {
		analyticsExpenses = append(analyticsExpenses, AnalyticsExpense{
			ID:          e.ID.Hex(),
			GroupID:     e.GroupID.Hex(),
			GroupName:   groupNameMap[e.GroupID.Hex()],
			PaidBy:      e.PaidBy.Hex(),
			PaidByName:  userNameMap[e.PaidBy.Hex()],
			Amount:      e.Amount,
			Description: e.Description,
			CreatedAt:   e.CreatedAt.Format(time.RFC3339),
		})
	}

	// 3. Fetch all payments across user's groups
	paymentCollection := config.GetCollection("payments")
	payCursor, err := paymentCollection.Find(ctx, bson.M{"groupId": bson.M{"$in": groupIDs}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments"})
		return
	}
	defer payCursor.Close(ctx)

	var rawPayments []models.Payment
	if err = payCursor.All(ctx, &rawPayments); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode payments"})
		return
	}

	analyticsPayments := make([]AnalyticsPayment, 0, len(rawPayments))
	for _, p := range rawPayments {
		analyticsPayments = append(analyticsPayments, AnalyticsPayment{
			ID:            p.ID.Hex(),
			GroupID:       p.GroupID.Hex(),
			GroupName:     groupNameMap[p.GroupID.Hex()],
			PayerID:       p.PayerID.Hex(),
			PayerName:     userNameMap[p.PayerID.Hex()],
			ReceiverID:    p.ReceiverID.Hex(),
			ReceiverName:  userNameMap[p.ReceiverID.Hex()],
			Amount:        p.Amount,
			Status:        p.Status,
			PaymentMethod: p.PaymentMethod,
			Note:          p.Note,
			CreatedAt:     p.CreatedAt.Format(time.RFC3339),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"expenses": analyticsExpenses,
		"payments": analyticsPayments,
	})
}
