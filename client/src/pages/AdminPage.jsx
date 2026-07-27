/**
 * Read-only admin view: every FlowFunds account with per-user aggregate
 * stats (transaction count, income/expenses, categories). Only reachable by
 * a user whose users.is_admin flag is true -- enforced twice, once by
 * ProtectedRoute hiding the route client-side, and again by the backend's
 * get_current_admin_user dependency + the categories/transactions
 * admin-select-all RLS policies, which is the check that actually matters.
 */
import { useEffect, useState } from 'react'
import api from '../api'

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

const mockUsers = [
  {
    id: 'mock-admin',
    email: 'admin@flowfunds.local',
    is_admin: true,
    created_at: '2026-07-01T00:00:00Z',
    category_count: 5,
    transaction_count: 12,
    total_income: '3200.00',
    total_expenses: '842.15',
  },
  {
    id: 'mock-user',
    email: 'demo@flowfunds.local',
    is_admin: false,
    created_at: '2026-07-05T00:00:00Z',
    category_count: 5,
    transaction_count: 7,
    total_income: '0.00',
    total_expenses: '237.50',
  },
]

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`
}

function AdminPage() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true)
      setError('')
      try {
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 400))
          setUsers(mockUsers)
        } else {
          const response = await api.get('/admin/users')
          setUsers(response.data)
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setError('Your account does not have admin privileges.')
        } else {
          setError('Unable to load the admin view right now.')
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadUsers()
  }, [])

  const totalUsers = users.length
  const totalTransactions = users.reduce((sum, u) => sum + u.transaction_count, 0)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Every account, at a glance</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Read-only. This view only exists for users whose profile has{' '}
          <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">is_admin = true</code>{' '}
          -- everyone else's transactions and categories stay row-level-security scoped
          to the person who owns them.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-300">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-sm text-slate-400">Accounts</p>
              <p className="mt-2 text-2xl font-semibold text-white">{totalUsers}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-sm text-slate-400">Transactions logged (all users)</p>
              <p className="mt-2 text-2xl font-semibold text-white">{totalTransactions}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Categories</th>
                  <th className="px-4 py-3 text-right">Transactions</th>
                  <th className="px-4 py-3 text-right">Income</th>
                  <th className="px-4 py-3 text-right">Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-slate-200">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.is_admin
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {u.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{u.category_count}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{u.transaction_count}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-400">
                      {formatCurrency(u.total_income)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-200">
                      {formatCurrency(u.total_expenses)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminPage
