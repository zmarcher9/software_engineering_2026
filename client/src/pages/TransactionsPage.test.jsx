import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionsPage from './TransactionsPage'

describe('TransactionsPage', () => {
  it('renders all mock transactions once loading finishes', async () => {
    render(<TransactionsPage />)

    // the loading skeleton shows first, so we wait for a real row to appear
    const merchantCell = await screen.findByText('Target')
    expect(merchantCell).toBeInTheDocument()

    // spot check a couple more rows to confirm the full mock list rendered
    expect(screen.getByText('Trader Joes')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('filters transactions down to the selected category', async () => {
    const user = userEvent.setup()
    render(<TransactionsPage />)

    await screen.findByText('Target')

    const categorySelect = screen.getByDisplayValue('All categories')
    await user.selectOptions(categorySelect, 'Food')

    // only the Food category row should remain
    expect(screen.getByText('Trader Joes')).toBeInTheDocument()
    expect(screen.queryByText('Target')).not.toBeInTheDocument()
  })
})