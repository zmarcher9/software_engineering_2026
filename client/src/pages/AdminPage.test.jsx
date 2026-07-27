import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AdminPage from './AdminPage'

// AdminPage falls back to in-memory mock data whenever VITE_USE_MOCK_DATA
// isn't explicitly "false" (the same convention DashboardPage/TransactionsPage
// use), so this exercises the real render path without a backend or a
// Supabase-authenticated admin session.
describe('AdminPage', () => {
  it('renders every mock account with its role and aggregate stats', async () => {
    render(<AdminPage />)

    await waitFor(() => {
      expect(screen.getByText('admin@flowfunds.local')).toBeInTheDocument()
    })

    expect(screen.getByText('demo@flowfunds.local')).toBeInTheDocument()
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0)
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('$3200.00')).toBeInTheDocument()
    expect(screen.getByText('$237.50')).toBeInTheDocument()
  })

  it('shows accurate totals across all accounts', async () => {
    render(<AdminPage />)

    await waitFor(() => {
      expect(screen.getByText('Accounts')).toBeInTheDocument()
    })

    // two mock users, transaction_count 12 + 7 = 19
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('19')).toBeInTheDocument()
  })
})
