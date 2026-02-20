package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Expense struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	GroupID     primitive.ObjectID `bson:"groupId" json:"groupId"`
	PaidBy      primitive.ObjectID `bson:"paidBy" json:"paidBy"`
	Amount      float64            `bson:"amount" json:"amount" validate:"required"`
	Description string             `bson:"description" json:"description" validate:"required"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
}

type Split struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ExpenseID primitive.ObjectID `bson:"expenseId" json:"expenseId"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	Amount    float64            `bson:"amount" json:"amount"`
}

// Balance struct for response mappings later
type NetBalance struct {
	UserID primitive.ObjectID `json:"userId"`
	Amount float64            `json:"amount"` // Positive means they get money, negative means they owe
}

type AddExpenseRequest struct {
	GroupID     string  `json:"groupId" binding:"required"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Description string  `json:"description" binding:"required"`
}
