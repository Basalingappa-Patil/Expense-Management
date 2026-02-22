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

func InitiatePayment(c *gin.Context) {
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

	var req models.InitiatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	groupID, err := primitive.ObjectIDFromHex(req.GroupID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	receiverID, err := primitive.ObjectIDFromHex(req.ReceiverID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid receiver ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	paymentCollection := config.GetCollection("payments")
	newPayment := models.Payment{
		ID:            primitive.NewObjectID(),
		GroupID:       groupID,
		PayerID:       userID,
		ReceiverID:    receiverID,
		Amount:        req.Amount,
		PaymentMethod: req.PaymentMethod,
		Note:          req.Note,
		Status:        "pending",
		CreatedAt:     time.Now(),
	}

	_, err = paymentCollection.InsertOne(ctx, newPayment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initiate payment"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Payment initiated successfully",
		"payment": newPayment,
	})
}

func VerifyPayment(c *gin.Context) {
	// Only the receiver (Group Creator usually) should verify
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

	var req models.VerifyPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	paymentID, err := primitive.ObjectIDFromHex(req.PaymentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	paymentCollection := config.GetCollection("payments")
	var payment models.Payment
	err = paymentCollection.FindOne(ctx, bson.M{"_id": paymentID}).Decode(&payment)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	if payment.ReceiverID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to verify this payment"})
		return
	}

	if payment.Status == "verified" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment is already verified"})
		return
	}

	// Update the payment status
	_, err = paymentCollection.UpdateOne(
		ctx,
		bson.M{"_id": paymentID},
		bson.M{"$set": bson.M{"status": "verified"}},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify payment"})
		return
	}

	payment.Status = "verified"

	c.JSON(http.StatusOK, gin.H{
		"message": "Payment verified successfully",
		"payment": payment,
	})
}

func GetGroupPayments(c *gin.Context) {
	groupIDStr := c.Param("groupId")
	groupID, err := primitive.ObjectIDFromHex(groupIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	// Verify user is member of group
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

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

	paymentCollection := config.GetCollection("payments")
	cursor, err := paymentCollection.Find(ctx, bson.M{"groupId": groupID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments"})
		return
	}
	defer cursor.Close(ctx)

	var payments []models.Payment
	if err = cursor.All(ctx, &payments); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode payments"})
		return
	}

	if payments == nil {
		payments = []models.Payment{}
	}

	c.JSON(http.StatusOK, payments)
}
