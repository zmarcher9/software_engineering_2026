import { useEffect, useState } from 'react'
import api from '../api'

function BudgetsPage() {
  const [budgets, setBudgets] = useState([])
  const [drafts, setDrafts] = useState({})
  const [error, setError] = useState('')

  async function loadBudgets() {
    try {
      const response = await api.get('/budgets')
      setBudgets(response.data)
      setDrafts(Object.fromEntries(response.data.map((item) => [item.category_id, item.limit_amount ?? ''])))
    } catch {
      setError('Unable to load budgets.')
    }
  }

  useEffect(() => {
    loadBudgets()
  }, [])

  async function saveBudget(categoryId) {
    const amount = Number(drafts[categoryId])
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a budget greater than $0.')
      return
    }
    setError('')
    await api.put(`/budgets/${categoryId}`, { limit_amount: amount })
    await loadBudgets()
  }

  async function removeBudget(categoryId) {
    setError('')
    await api.delete(`/budgets/${categoryId}`)
    await loadBudgets()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">Budgets</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">This month</h1>
        <p className="mt-2 text-sm text-slate-400">Set one spending limit for each category.</p>
      </div>

      {error ? <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {budgets.map((budget) => {
          const limit = Number(budget.limit_amount || 0)
          const spent = Number(budget.spent)
          const percentage = limit ? Math.min((spent / limit) * 100, 100) : 0
          return (
            <section key={budget.category_id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="font-semibold text-white">{budget.category}</h2>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={drafts[budget.category_id] ?? ''}
                  onChange={(event) => setDrafts((current) => ({ ...current, [budget.category_id]: event.target.value }))}
                  placeholder="Monthly limit"
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
                <button onClick={() => saveBudget(budget.category_id)} className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950">Save</button>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full ${percentage >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${percentage}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                <span>${spent.toFixed(2)} spent{limit ? ` of $${limit.toFixed(2)}` : ''}</span>
                {budget.limit_amount ? <button onClick={() => removeBudget(budget.category_id)} className="text-rose-300 hover:text-rose-200">Remove</button> : null}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default BudgetsPage
