# System Architecture & Design Document
## Expense Tracker with Bill Splitting

### 1. High-Level Architecture
The system adopts an industry-standard decoupled structure, isolating the User Interface (React) from the Business Logic and Persistence layers (Go backend).

**User Client** -> REST API (JSON) -> **Go Backend (Gin Router)** -> Driver Model -> **MongoDB Atlas**

### 2. Database Schema Modeling (MongoDB)
MongoDB Atlas is chosen for its JSON-like document structures which map natively to our API responses.

- **Users** (`_id`, `name`, `email`, `password` (hashed), `groups (Array of ObjectIds)`)
- **Groups** (`_id`, `name`, `createdBy`, `members (Array of ObjectIds)`)
- **Expenses** (`_id`, `groupId`, `paidBy`, `amount`, `description`)
  - Expenses are the immutable record of "Payment Events".
- **Splits** (`_id`, `expenseId`, `userId`, `amount`)
  - A 1-to-many model where one mapped Expense creates multiple Split documents determining raw "debt assignments".

### 3. Application Security (Auth Layer)
1. **Password Encryption**: Handled during creation via `golang.org/x/crypto/bcrypt`. Costs default to 10 rounds ensuring computational resistance against rainbow tables.
2. **Stateless Authentication**: Uses `JWT` (JSON Web Tokens). Upon valid login comparison, the backend signs a payload with HSM256 containing `user_id`. The client stores this and appends it to subsequent request headers.
3. **Gin Middleware**: An `AuthMiddleware` decorator sits in front of all group/expense routes, intercepting requests to validate the signature of the Bearer Token before passing Context to the controller.

### 4. Implementation Phasing Strategy Used
The project was rolled out in vertical slices:
- **Phase A**: Scaffolding and Infrastructure (Go Mod, MongoDB conn ping)
- **Phase B**: Core Identity (User models, Signup, Bcrypt, Login, JWT auth middleware)
- **Phase C**: Collaboration (Group creation, Member addition via correlated Email lookups)
- **Phase D**: Financial Logging (Registering expenses and dynamically generating proportional split documents)
- **Phase E**: Intelligence layer (The Setllement greedy algorithm, aggregating Map-Reduces of splits into clean instructions)
- **Phase F**: Interface layer (Vite-React implementation leveraging Tailwind for rich aesthetics, hooking Axios instances up to our REST boundaries).

### Summary
The system accurately satisfies the requirement of a sophisticated Expense capability with industry-grade implementation patterns including tokenization, functional layering in Go, algorithm-first business logic, and component-driven UI design.
