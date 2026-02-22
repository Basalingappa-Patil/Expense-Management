package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Payment struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	GroupID       primitive.ObjectID `bson:"groupId" json:"groupId"`
	PayerID       primitive.ObjectID `bson:"payerId" json:"payerId"`
	ReceiverID    primitive.ObjectID `bson:"receiverId" json:"receiverId"` // Person who is owed money
	Amount        float64            `bson:"amount" json:"amount"`
	PaymentMethod string             `bson:"paymentMethod" json:"paymentMethod"` // "cash" or "upi"
	Note          string             `bson:"note" json:"note"`
	Status        string             `bson:"status" json:"status"` // "pending" or "verified"
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
}

type InitiatePaymentRequest struct {
	GroupID       string  `json:"groupId" binding:"required"`
	ReceiverID    string  `json:"receiverId" binding:"required"`
	Amount        float64 `json:"amount" binding:"required,gt=0"`
	PaymentMethod string  `json:"paymentMethod" binding:"required"`
	Note          string  `json:"note"`
}

type VerifyPaymentRequest struct {
	PaymentID string `json:"paymentId" binding:"required"`
}
