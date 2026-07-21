import { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function TransactionForm() {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    if (error) setError('')
    if (successMessage) setSuccessMessage('')
  }

  const validateForm = (amountValue, dateValue) => {
    const rawAmount = String(amountValue).trim()
    const amount = Number(rawAmount)

    if (!rawAmount || Number.isNaN(amount) || amount <= 0) {
      setError('Amount must be greater than zero.')
      return false
    }

    const selectedDate = new Date(dateValue)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate > today) {
      setError('Transaction date cannot be in the future.')
      return false
    }

    return true
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    setError('')
    setSuccessMessage('')

    const amountValue = event.currentTarget.elements.namedItem('amount')?.value ?? ''
    const categoryValue = event.currentTarget.elements.namedItem('category')?.value ?? formData.category
    const dateValue = event.currentTarget.elements.namedItem('date')?.value ?? formData.date
    const noteValue = event.currentTarget.elements.namedItem('note')?.value ?? formData.note

    const nextFormData = {
      amount: amountValue,
      category: categoryValue,
      date: dateValue,
      note: noteValue,
    }

    setFormData(nextFormData)

    if (!validateForm(nextFormData.amount, nextFormData.date)) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('flowfunds_token') || ''}`,
        },
        body: JSON.stringify({
          amount: Number(amountValue),
          category: categoryValue,
          transaction_date: dateValue,
          note: noteValue,
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to save transaction right now.')
      }

      setSuccessMessage(`Transaction saved for ${categoryValue}.`)
      setFormData({
        amount: '',
        category: categoryValue,
        date: new Date().toISOString().slice(0, 10),
        note: '',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <h2 className="text-lg font-semibold text-white">Quick add transaction</h2>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm text-slate-300">
          <span className="mb-2 block">Amount</span>
          <input
            type="number"
            name="amount"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            aria-label="Amount"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-emerald-500"
            placeholder="0.00"
          />
        </label>

        <label className="block text-sm text-slate-300">
          <span className="mb-2 block">Category</span>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            aria-label="Category"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-emerald-500"
          >
            <option>Food</option>
            <option>Transport</option>
            <option>Shopping</option>
            <option>Utilities</option>
            <option>Salary</option>
          </select>
        </label>

        <label className="block text-sm text-slate-300">
          <span className="mb-2 block">Date</span>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            aria-label="Date"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-emerald-500"
          />
        </label>

        <label className="block text-sm text-slate-300">
          <span className="mb-2 block">Note</span>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows="3"
            aria-label="Note"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-emerald-500"
            placeholder="Optional note"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Saving...' : 'Save transaction'}
        </button>
      </form>

      {error ? (
        <p className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      {successMessage ? (
        <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {successMessage}
        </p>
      ) : null}
    </section>
  )
}

export default TransactionForm
