import { useState } from "react";
import TransactionForm from "./components/TransactionForm";

function App() {
  const [currentPage, setCurrentPage] = useState("landing");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button
            onClick={() => setCurrentPage("landing")}
            className="text-xl font-semibold tracking-tight text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            FlowFunds
          </button>
          <nav className="flex gap-6 text-sm text-slate-400">
            <button
              onClick={() => setCurrentPage("landing")}
              className="hover:text-slate-200 transition-colors"
            >
              Features
            </button>
            <a href="#" className="hover:text-slate-200 transition-colors">
              Log in
            </a>
            <a
              href="#"
              className="rounded-md bg-emerald-500 px-3 py-1.5 font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              Sign up
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-20">
        {currentPage === "landing" ? (
          <>
            <section className="text-center">
              <p className="mb-4 text-sm font-medium uppercase tracking-widest text-emerald-400">
                Personal finance, simplified
              </p>
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
                Know where your money goes.
                <br />
                <span className="text-emerald-400">Get alerts before it&apos;s gone.</span>
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400">
                Log transactions, set category budgets, and see spending forecasts
                so you never get surprised at the end of the month.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentPage("transactions")}
                  className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  Get started free
                </button>
                <a
                  href="#"
                  className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
                >
                  See how it works
                </a>
              </div>
            </section>

            <section className="mt-24 grid gap-6 sm:grid-cols-3">
              {[
                {
                  title: "Track spending",
                  description: "Log transactions by category and date in seconds.",
                },
                {
                  title: "Budget alerts",
                  description: "Get notified at 80% and 100% of your category limits.",
                },
                {
                  title: "Forecast ahead",
                  description: "See projected end-of-month spend before you overshoot.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-6"
                >
                  <h2 className="mb-2 text-lg font-semibold text-white">
                    {feature.title}
                  </h2>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              ))}
            </section>
          </>
        ) : (
          <div>
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white">Transactions</h1>
              <button
                onClick={() => setCurrentPage("landing")}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
            <TransactionForm />
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        FlowFunds &mdash; Spring 2026
      </footer>
    </div>
  );
}

export default App;
