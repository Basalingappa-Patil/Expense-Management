package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID        primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Name      string               `bson:"name" json:"name" validate:"required"`
	Email     string               `bson:"email" json:"email" validate:"required,email"`
	Password  string               `bson:"password" json:"password" validate:"required"`
	Groups    []primitive.ObjectID `bson:"groups" json:"groups"`
	CreatedAt time.Time            `bson:"createdAt" json:"createdAt"`
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}
