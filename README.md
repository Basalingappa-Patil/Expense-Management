# Expense Tracker & Bill Splitting API

A professional, industry-grade REST API and React frontend for tracking shared expenses, built with Go (Gin framework), MongoDB Atlas, and React (Vite/TailwindCSS). It includes a sophisticated settlement engine utilizing a greedy algorithm to optimize and minimize transactions among group members.

## Tech Stack & Architecture
### Backend (Golang)
- **Framework**: `gin-gonic/gin` for high-performance HTTP routing, structured logger middleware, and JSON binding validation.
- **Database Driver**: `go.mongodb.org/mongo-driver` for native MongoDB communication, leveraging `bson` and `primitive.ObjectID` for efficient NoSQL document mapping.
- **Security**: `golang.org/x/crypto/bcrypt` for secure password hashing and `github.com/golang-jwt/jwt/v5` for stateless user authentication.
- **Structure**: The API strictly follows a decoupled `MVC`-style architecture:
  - `/routes/`: Configures Gin router groups and injects authorization middleware.
  - `/controllers/`: Houses the core business logic, parses `*gin.Context`, handles parameter extraction, and communicates directly with MongoDB collections.
  - `/models/`: Defines explicit Go `structs` mapped to BSON tags for type-safe database serialization.
  - `/config/`: Initializes the global MongoDB client singleton and environment variables.

### Frontend
- **Framework**: React 18, utilizing functional components and hooks (`useState`, `useEffect`, `useContext`).
- **Tooling**: Vite for rapid HMR bundling and Vanilla TailwindCSS for utility-first styling.
- **Routing**: `react-router-dom` guarding private routes via Context API.

## Core Features
1. **Authentication Architecture**: Secure Registration and Login. Passwords are encrypted before BSON insertion.
2. **Group Management**: Isolate expenses by logical groups. Real-time fetching of all Groups a specific user is authorized to see via aggregate `members` array matching logic.
3. **Expense Splitting engine**: Automatically splits added expenses among group members and dynamically creates nested Split documents in the database.
4. **Optimized Settlements (Greedy Algorithm)**: Calculates the absolute minimum number of financial transactions required to settle all debts in a group.

## The Settlement Algorithm (Core Logic)
Located within `backend/controllers/settlementController.go`, this is the mathematical core of the application. It utilizes a **Greedy Algorithm** traversing a one-dimensional array of net balances to calculate the minimum number of distinct monetary transfers needed.

### Go Language Implementation Steps:
1. **Database Aggregation**: 
   - The `/api/settlements/:groupId` endpoint first uses `config.GetCollection("splits")` to pull all `Split` documents associated with the requested Group ID.
   - It iterates through these splits using Go slices to calculate the total amount everyone owes.
   
2. **Net Balance HashMap**:
   - A `map[string]float64` is instantiated to track the net balance of every `primitive.ObjectID`.
   - The user who originally paid the expense gets credited their `+Amount`.
   - Each member assigned a slice of that expense gets debited their split `-Amount`.

3. **Separation of Entities**:
   - The map is partitioned into two distinct `struct` slices: 
     - `Creditors` (Users with balance > 0 who need to receive money).
     - `Debtors` (Users with balance < 0 who need to send money).

4. **Greedy Two-Pointer matching**:
   - Both slices are sorted recursively by absolute amount using Go's `sort.Slice` interface to tackle the largest debts first (this ensures the greedy mapping works optimally).
   - The highest debtor is matched with the highest creditor.
   - Using `math.Min`, the algorithm determines the maximum transaction able to satisfy at least one party completely in a single transfer.
   - A `models.Transaction` struct is generated and appended to a final transaction slice.
   - Pointers iterate through the sorted `Debtors` and `Creditors` arrays until all balances reach `0` (or `0.01` accounting for float precision).

### Algorithm Efficiency:
- By sorting first and aggressively satisfying the largest outstanding debts, the system guarantees that a group of `N` people will be fully settled in at most `N-1` physical transactions.

## API Documentation

### Auth module
- `POST /api/auth/signup`: Expects `{name, email, password}`. Hashes password using bcrypt.
- `POST /api/auth/login`: Expects `{email, password}`. Returns a JWT Bearer token valid for 72 hours.

### Protected API (Needs Authorization header: Bearer <token>)
- `POST /api/groups`: Create a group `{name}`.
- `POST /api/groups/:id/members`: Add a user via `{email}`.
- `GET /api/groups/:id`: Fetches group information.
- `POST /api/expenses`: Logs a payment `{groupId, amount, description}`.
- `GET /api/settlements/:groupId`: The core endpoint. Analyzes splits and runs the Greedy Algorithm to return `transactions[]` defining exactly who should pay whom.

## Money Handling Approach (Precision)
While floating-point arithmetic is infamously flawed for precise financial transactions (e.g., `10.499999`), our architecture mitigates this by:
1. Maintaining strictly uniform equal splits mapped cleanly from the root expense decimal.
2. In the algorithm loop, providing a `< 0.01` tolerance check before terminating pointer indices, ensuring loop completion despite byte alignment errors in base-2 float representation. (In absolute production, standard libraries like standard `decimal` or MongoDB's `Decimal128` are swapped in; the `float64` implementation here accommodates the 2-decimal presentation tolerance required for general group scaling).

## Setup instructions
1. Add your MongoDB Atlas connection string inside `backend/.env` as `MONGO_URI`.
2. Start the backend: `cd backend && go run main.go`
3. Start the frontend: `cd frontend && npm run dev`
