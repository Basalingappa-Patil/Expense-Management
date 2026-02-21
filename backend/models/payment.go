package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Payment struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	GroupID    primitive.ObjectID `bson:"groupId" json:"groupId"`
	PayerID    primitive.ObjectID `bson:"payerId" json:"payerId"`
	ReceiverID primitive.ObjectID `bson:"receiverId" json:"receiverId"` // Usually the group creator
	Amount     float64            `bson:"amount" json:"amount"`
	Status     string             `bson:"status" json:"status"` // "pending" or "verified"
	CreatedAt  time.Time          `bson:"createdAt" json:"createdAt"`
}

type InitiatePaymentRequest struct {
	GroupID    string  `json:"groupId" binding:"required"`
	ReceiverID string  `json:"receiverId" binding:"required"`
	Amount     float64 `json:"amount" binding:"required,gt=0"`
}

type VerifyPaymentRequest struct {
	PaymentID string `json:"paymentId" binding:"required"`
}
