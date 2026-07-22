/**
 * this shows the full transaction list with sorting and category filtering,
 * plus loading skeletons and an empty state while data is fetched
 */
import { useEffect, useMemo, useState } from 'react'
import api from '../api'
import { mockTransactions } from '../mockData'

// flip this to false once Person 2's GET /transactions endpoint is live
const USE_MOCK_DATA = true

function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    async function loadTransactions() {
      setIsLoading(true)
      setError('')
      try {
        if (USE_MOCK_DATA) {
          // simulates network delay so the loading skeleton is actually visible during dev
          await new Promise((resolve) => setTimeout(resolve, 500))
          setTransactions(mockTransactions)
        } else {
          const response = await api.get('/transactions')
          setTransactions(response.data)
        }
      } catch (err) {
        setError('Unable to load transactions right now.')
      } finally {
        setIsLoading(false)
      }
    }
    loadTransactions()
  }, [])

  // unique category list pulled from the data itself, so the filter dropdown
  // stays correct even as categories change
  const categories = useMemo(() => {
    const unique = new Set(transactions.map((t) => t.category))
    return ['all', ...unique]
  }, [transactions])

  const visibleTransactions = useMemo(() => {
    let result = [...transactions]

    if (filterCategory !== 'all') {
      result = result.filter((t) => t.category === filterCategory)
    }

    result.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.transaction_date) - new Date(a.transaction_date)
      if (sortBy === 'date-asc') return new Date(a.transaction_date) - new Date(b.transaction_date)
      if (sortBy === 'amount-desc') return b.amount - a.amount
      if (sortBy === 'amount-asc') return a.amount - b.amount
      return 0
    })

    return result
  }, [transactions, sortBy, filterCategory])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-white">Transactions</h1>

        <div className="flex gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Amount: high to low</option>
            <option value="amount-asc">Amount: low to high</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {/* skeleton rows, pulse animation gives a "loading" feel without a spinner */}
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-16 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-300">
          {error}
        </div>
      ) : visibleTransactions.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-10 text-center text-slate-400">
          No transactions yet. Add one to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40">
              {visibleTransactions.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-slate-300">{t.transaction_date}</td>
                  <td className="px-4 py-3 text-slate-300">{t.category}</td>
                  <td className="px-4 py-3 text-slate-300">{t.merchant || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{t.note || '—'}</td>
                  <td className={`px-4 py-3 text-right font-medium ${t.transaction_type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {t.transaction_type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default TransactionsPage