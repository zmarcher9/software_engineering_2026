/**
 * I am creating a temporary stand-in data until Person 2's GET /transactions endpoint ships,
 * shaped to match the transactions table schema so swapping to real data later is a one-line change
 */
export const mockTransactions = [
  { id: '1', amount: 3200, transaction_type: 'income', category: 'Salary', transaction_date: '2026-07-01', merchant: 'Acme Corp', note: 'Monthly salary' },
  { id: '2', amount: 42.5, transaction_type: 'expense', category: 'Food', transaction_date: '2026-07-03', merchant: 'Trader Joes', note: 'Groceries' },
  { id: '3', amount: 15.0, transaction_type: 'expense', category: 'Transport', transaction_date: '2026-07-04', merchant: 'Uber', note: '' },
  { id: '4', amount: 120.0, transaction_type: 'expense', category: 'Utilities', transaction_date: '2026-07-05', merchant: 'ConEd', note: 'Electric bill' },
  { id: '5', amount: 60.0, transaction_type: 'expense', category: 'Shopping', transaction_date: '2026-07-06', merchant: 'Target', note: '' },
]