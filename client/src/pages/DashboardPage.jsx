import { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function DashboardPage({ user }) {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  })
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    if (fieldError) setFieldError('')
    if (statusMessage) setStatusMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFieldError('')
    setStatusMessage('')

    if (!formData.amount || Number(formData.amount) <= 0) {
      setFieldError('Amount must be greater than zero.')
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
          amount: Number(formData.amount),
          category: formData.category,
          transaction_date: formData.date,
          note: formData.note,
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to save transaction right now.')
      }

      setStatusMessage(`Transaction saved for ${formData.category}.`)
      setFormData({
        amount: '',
        category: formData.category,
        date: new Date().toISOString().slice(0, 10),
        note: '',
      })
    } catch (error) {
      setFieldError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-lg shadow-slate-950/20">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
          Overview
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Welcome back, {user?.email || 'friend'}.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          This protected dashboard is ready for your next step: transaction entry, budget tracking, and richer spending insights.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-white">Quick add transaction</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Amount</span>
              <input
                type="number"
                name="amount"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                required
                className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-slate-100 outline-none transition ${fieldError ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'}`}
                placeholder="0.00"
              />
            </label>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Category</span>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
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

          {fieldError ? (
            <p className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {fieldError}
            </p>
          ) : null}

          {statusMessage ? (
            <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {statusMessage}
            </p>
          ) : null}
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold text-white">Next up</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>• Connect this form to the FastAPI transactions endpoint.</li>
              <li>• Add validation and loading states for submit.</li>
              <li>• Show recent transactions and budget summaries.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold text-white">Status</h2>
            <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              Authentication flow is now wired to the backend and protected routes are active.
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default DashboardPage
