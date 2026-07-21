import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TransactionForm from './TransactionForm'

const mockFetch = vi.fn()

describe('TransactionForm', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem('flowfunds_token', 'test-jwt-token')
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    window.localStorage.clear()
    mockFetch.mockReset()
    vi.unstubAllGlobals()
  })

  it('renders the amount, category, date, note, and submit controls', () => {
    render(<TransactionForm />)

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/note/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save transaction/i })).toBeInTheDocument()
  })

  it('displays an error and does not call fetch for zero or negative amount', async () => {
    const user = userEvent.setup()
    render(<TransactionForm />)

    await user.type(screen.getByLabelText(/amount/i), '-1')
    await user.click(screen.getByRole('button', { name: /save transaction/i }))

    expect(screen.getByText(/amount must be greater than zero/i)).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('displays an error and does not call fetch for a future transaction date', async () => {
    const user = userEvent.setup()
    render(<TransactionForm />)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const futureDate = tomorrow.toISOString().slice(0, 10)

    await user.clear(screen.getByLabelText(/amount/i))
    await user.type(screen.getByLabelText(/amount/i), '10')
    await user.clear(screen.getByLabelText(/date/i))
    await user.type(screen.getByLabelText(/date/i), futureDate)
    await user.click(screen.getByRole('button', { name: /save transaction/i }))

    expect(screen.getByText(/transaction date cannot be in the future/i)).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('submits a valid transaction with the expected request details', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({ ok: true })

    render(<TransactionForm />)

    await user.clear(screen.getByLabelText(/amount/i))
    await user.type(screen.getByLabelText(/amount/i), '42.5')
    await user.selectOptions(screen.getByLabelText(/category/i), 'Shopping')
    await user.clear(screen.getByLabelText(/date/i))
    await user.type(screen.getByLabelText(/date/i), '2026-07-15')
    await user.type(screen.getByLabelText(/note/i), 'Groceries')
    await user.click(screen.getByRole('button', { name: /save transaction/i }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/transactions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-jwt-token',
        }),
        body: JSON.stringify({
          amount: 42.5,
          category: 'Shopping',
          transaction_date: '2026-07-15',
          note: 'Groceries',
        }),
      }),
    )
  })

  it('displays a success message and resets the form after a successful response', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({ ok: true })

    render(<TransactionForm />)

    await user.clear(screen.getByLabelText(/amount/i))
    await user.type(screen.getByLabelText(/amount/i), '10')
    await user.type(screen.getByLabelText(/note/i), 'Coffee')
    await user.click(screen.getByRole('button', { name: /save transaction/i }))

    expect(await screen.findByText(/transaction saved for/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toHaveValue(null)
    expect(screen.getByLabelText(/note/i)).toHaveValue('')
  })

  it('displays an error message when the backend response is not ok', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({ ok: false })

    render(<TransactionForm />)

    await user.clear(screen.getByLabelText(/amount/i))
    await user.type(screen.getByLabelText(/amount/i), '10')
    await user.click(screen.getByRole('button', { name: /save transaction/i }))

    expect(await screen.findByText(/unable to save transaction right now/i)).toBeInTheDocument()
  })

  it('disables the submit button and shows a loading label while the request is pending', async () => {
    const user = userEvent.setup()
    let resolvePromise
    mockFetch.mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve
    }))

    render(<TransactionForm />)

    await user.clear(screen.getByLabelText(/amount/i))
    await user.type(screen.getByLabelText(/amount/i), '10')
    await user.click(screen.getByRole('button', { name: /save transaction/i }))

    const button = screen.getByRole('button', { name: /saving/i })
    expect(button).toBeDisabled()

    resolvePromise({ ok: true })
    await waitFor(() => expect(screen.getByText(/transaction saved for/i)).toBeInTheDocument())
  })
})
