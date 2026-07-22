/**
 * this will now shows quick-glance summary cards (balance, income, expenses) computed from
 * transaction data, plus the existing quick-add form and status panel
 */
import { useEffect, useMemo, useState } from 'react'
import TransactionForm from '../components/TransactionForm'
import api from '../api'
import { mockTransactions } from '../mockData'

// flip this to false once Person 2's GET /transactions endpoint is live
const USE_MOCK_DATA = true

function SummaryCard({ label, value, tone }) {
  // tone controls the accent color so income/expense/balance are visually distinct
  const toneClasses = {
    neutral: 'text-white',
    positive: 'text-emerald-400',
    negative: 'text-rose-400',
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClasses[tone] || toneClasses.neutral}`}>
        ${value.toFixed(2)}
      </p>
    </div>
  )
}

function SummaryCardSkeleton() {
  return <div className="h-[92px] animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50" />
}

function DashboardPage({ user }) {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadTransactions() {
      setIsLoading(true)
      setError('')
      try {
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 500))
          setTransactions(mockTransactions)
        } else {
          const response = await api.get('/transactions')
          setTransactions(response.data)
        }
      } catch (err) {
        setError('Unable to load summary data right now.')
      } finally {
        setIsLoading(false)
      }
    }
    loadTransactions()
  }, [])

  // totals are derived from raw transactions rather than stored separately,
  // so they always stay in sync with whatever data is currently loaded
  const { totalIncome, totalExpenses, totalBalance } = useMemo(() => {
    const income = transactions
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      totalIncome: income,
      totalExpenses: expenses,
      totalBalance: income - expenses,
    }
  }, [transactions])

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

      {error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          <>
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </>
        ) : (
          <>
            <SummaryCard label="Total balance" value={totalBalance} tone={totalBalance >= 0 ? 'positive' : 'negative'} />
            <SummaryCard label="Income" value={totalIncome} tone="positive" />
            <SummaryCard label="Expenses" value={totalExpenses} tone="negative" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <TransactionForm />

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
