import { NavLink, Outlet } from 'react-router-dom'

function Layout({ onLogout, user }) {
  const navLinkClassName = ({ isActive }) =>
    `block rounded-lg px-3 py-2 text-sm transition ${isActive ? 'bg-slate-800 font-medium text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-800 bg-slate-900/80 p-6 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="space-y-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
                FlowFunds
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Finance Hub</h2>
              <p className="mt-2 text-sm text-slate-400">
                {user?.email || 'Signed in'}
              </p>
            </div>

            <nav className="space-y-2 text-sm text-slate-300">
              <NavLink to="/dashboard" className={navLinkClassName}>
                Dashboard
              </NavLink>
              <NavLink to="/dashboard" className={navLinkClassName}>
                Transactions
              </NavLink>
              <NavLink to="/dashboard" className={navLinkClassName}>
                Budgets
              </NavLink>
            </nav>

            <button
              type="button"
              onClick={onLogout}
              className="w-full rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 sm:p-8 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
