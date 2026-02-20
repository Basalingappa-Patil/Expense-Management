package services

import (
	"sort"
)

type UserBalance struct {
	UserID string
	Amount float64
}

type SettlementTransaction struct {
	FromUser string  `json:"fromUser"`
	ToUser   string  `json:"toUser"`
	Amount   float64 `json:"amount"`
}

// CalculateOptimalSettlements uses a greedy algorithm to minimize transactions
func CalculateOptimalSettlements(balances map[string]float64) []SettlementTransaction {
	var creditors []UserBalance
	var debtors []UserBalance

	// Separate into creditors (positive balance) and debtors (negative balance)
	for userID, amount := range balances {
		// handle float precision issues
		if amount > 0.01 {
			creditors = append(creditors, UserBalance{UserID: userID, Amount: amount})
		} else if amount < -0.01 {
			debtors = append(debtors, UserBalance{UserID: userID, Amount: -amount}) // Store as positive debt
		}
	}

	var settlements []SettlementTransaction

	// Sort lists to pair largest debtor with largest creditor
	// Note: While pure greedy doesn't theoretically need sorted lists, sorting often yields more intuitive real-world results
	sort.Slice(creditors, func(i, j int) bool { return creditors[i].Amount > creditors[j].Amount })
	sort.Slice(debtors, func(i, j int) bool { return debtors[i].Amount > debtors[j].Amount })

	i := 0 // debtor index
	j := 0 // creditor index

	for i < len(debtors) && j < len(creditors) {
		debt := debtors[i].Amount
		credit := creditors[j].Amount

		minAmount := min(debt, credit)

		// Record the transaction
		settlements = append(settlements, SettlementTransaction{
			FromUser: debtors[i].UserID,
			ToUser:   creditors[j].UserID,
			Amount:   minAmount,
		})

		// Adjust balances
		debtors[i].Amount -= minAmount
		creditors[j].Amount -= minAmount

		// Move indices if settled
		// 0.01 tolerance for float precision
		if debtors[i].Amount < 0.01 {
			i++
		}
		if creditors[j].Amount < 0.01 {
			j++
		}
	}

	return settlements
}

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}
