package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Group struct {
	ID        primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Name      string               `bson:"name" json:"name" validate:"required"`
	CreatedBy primitive.ObjectID   `bson:"createdBy" json:"createdBy"`
	Members   []primitive.ObjectID `bson:"members" json:"members"`
	CreatedAt time.Time            `bson:"createdAt" json:"createdAt"`
}

type CreateGroupRequest struct {
	Name string `json:"name" binding:"required"`
}

type AddMemberRequest struct {
	Email string `json:"email" binding:"required,email"`
}
