import TransactionForm from '../components/TransactionForm'

function DashboardPage({ user }) {
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
