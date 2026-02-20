# Expense Tracker & Bill Splitting API

A professional, industry-grade REST API and React frontend for tracking shared expenses, built with Go (Gin framework), MongoDB Atlas, and React (Vite/TailwindCSS). It includes a sophisticated settlement engine utilizing a greedy algorithm to optimize and minimize transactions among group members.

## Tech Stack
- **Backend**: Go (Golang), Gin Framework
- **Database**: MongoDB Atlas (Official go.mongodb.org/mongo-driver)
- **Frontend**: React.js, Vite, TailwindCSS
- **Security**: JWT (JSON Web Tokens), bcrypt hashing

## Core Features
1. **Authentication Architecture**: Secure Registration and Login with encrypted passwords.
2. **Group Management**: Isolate expenses by logical groups (e.g., "Goa Trip").
3. **Expense Splitting engine**: Automatically splits added expenses among group members.
4. **Optimized Settlements (Greedy Algorithm)**: Calculates the absolute minimum number of financial transactions required to settle all debts in a group.

## The Settlement Algorithm (Core Logic)
To effectively figure out "who owes who" while minimizing total transactions, the application uses a algorithm mapping to a **Greedy strategy**. 

### How it works:
1. **Net Balance Calculation**: 
   - First, the algorithm traverses all expense documents in a group. 
   - It credits the user who paid (`+Amount`) and debits the users involved in the split (`-Amount`). 
   - We maintain a HashMap (key: `UserID`, value: `NetBalanceFloat`).
   
2. **Separation of Entities**:
   - Users with positive balances are **Creditors** (they need to be paid).
   - Users with negative balances are **Debtors** (they need to pay).

3. **Greedy Matching**:
   - The creditors array and debtors array are sorted in descending order of their absolute balance.
   - We pick the highest creditor and highest debtor.
   - The minimum of the two absolute amounts is determined. A `Settlement Transaction` is recorded for this amount from the Debtor to the Creditor.
   - We deduct this settled amount from both their outstanding balances.
   - The process repeats (using a two-pointer approach) until all balances reach `0` (or `0.01` accommodating float precision).

### Algorithm Efficiency:
- This approach effectively resolves `N` debts in at most `N-1` transactions, achieving optimal settlement density.

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
