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

func CreateGroup(c *gin.Context) {
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

	var req models.CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := config.GetCollection("groups")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	newGroup := models.Group{
		ID:        primitive.NewObjectID(),
		Name:      req.Name,
		CreatedBy: userID,
		Members:   []primitive.ObjectID{userID}, // Creator is automatically a member
		CreatedAt: time.Now(),
	}

	_, err = collection.InsertOne(ctx, newGroup)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create group"})
		return
	}

	// Also add group ID to User's groups array
	userCollection := config.GetCollection("users")
	_, err = userCollection.UpdateOne(
		ctx,
		bson.M{"_id": userID},
		bson.M{"$push": bson.M{"groups": newGroup.ID}},
	)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Group created successfully",
		"group":   newGroup,
	})
}

func AddMember(c *gin.Context) {
	groupIDStr := c.Param("id")
	groupID, err := primitive.ObjectIDFromHex(groupIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	var req models.AddMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find the user to add by email
	userCollection := config.GetCollection("users")
	var userToAdd models.User
	err = userCollection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&userToAdd)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User with this email not found"})
		return
	}

	// Add user to Group's members array
	groupCollection := config.GetCollection("groups")

	// Check if already a member
	var group models.Group
	err = groupCollection.FindOne(ctx, bson.M{"_id": groupID}).Decode(&group)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	for _, memberID := range group.Members {
		if memberID == userToAdd.ID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "User is already a member of this group"})
			return
		}
	}

	_, err = groupCollection.UpdateOne(
		ctx,
		bson.M{"_id": groupID},
		bson.M{"$push": bson.M{"members": userToAdd.ID}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add member to group"})
		return
	}

	// Add group ID to User's groups array
	_, err = userCollection.UpdateOne(
		ctx,
		bson.M{"_id": userToAdd.ID},
		bson.M{"$push": bson.M{"groups": groupID}},
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "User added to group successfully",
	})
}

func GetGroupDetails(c *gin.Context) {
	groupIDStr := c.Param("id")
	groupID, err := primitive.ObjectIDFromHex(groupIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	groupCollection := config.GetCollection("groups")
	var group models.Group
	err = groupCollection.FindOne(ctx, bson.M{"_id": groupID}).Decode(&group)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	// Populate Members
	userCollection := config.GetCollection("users")
	var populatedMembers []models.User

	if len(group.Members) > 0 {
		cursor, err := userCollection.Find(ctx, bson.M{"_id": bson.M{"$in": group.Members}})
		if err == nil {
			cursor.All(ctx, &populatedMembers)
		}
		cursor.Close(ctx)
	}

	// Remove passwords from response
	for i := range populatedMembers {
		populatedMembers[i].Password = ""
	}

	// Return a custom map so we can inject populated members
	response := gin.H{
		"id":        group.ID,
		"name":      group.Name,
		"createdBy": group.CreatedBy,
		"members":   populatedMembers,
		"createdAt": group.CreatedAt,
	}

	c.JSON(http.StatusOK, response)
}

func GetUserGroups(c *gin.Context) {
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

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	groupCollection := config.GetCollection("groups")

	// Find all groups where the user is in the Members array
	cursor, err := groupCollection.Find(ctx, bson.M{"members": userID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch groups"})
		return
	}
	defer cursor.Close(ctx)

	var groups []models.Group
	if err = cursor.All(ctx, &groups); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode groups"})
		return
	}

	// Always return an array, even if empty
	if groups == nil {
		groups = []models.Group{}
	}

	c.JSON(http.StatusOK, groups)
}
