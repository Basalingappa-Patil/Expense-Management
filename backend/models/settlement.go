package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Settlement struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	GroupID   primitive.ObjectID `bson:"groupId" json:"groupId"`
	FromUser  primitive.ObjectID `bson:"fromUser" json:"fromUser"` // Debtor
	ToUser    primitive.ObjectID `bson:"toUser" json:"toUser"`     // Creditor
	Amount    float64            `bson:"amount" json:"amount"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}

type SettlementResponse struct {
	FromUser string  `json:"fromUser"`
	ToUser   string  `json:"toUser"`
	Amount   float64 `json:"amount"`
}
