import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function AuthPage({ onAuthSuccess, initialMode = 'login' }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState(initialMode)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setMode(initialMode)
    setError('')
    setFieldErrors({})
  }, [initialMode])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    if (error) setError('')
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setFieldErrors({})
    navigate(nextMode === 'login' ? '/login' : '/signup')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setFieldErrors({})

    const trimmedEmail = formData.email.trim().toLowerCase()
    const nextFieldErrors = {}

    if (!trimmedEmail) {
      nextFieldErrors.email = 'Email is required.'
    }

    if (formData.password.length < 8) {
      nextFieldErrors.password = 'Password must be at least 8 characters.'
    }

    if (mode === 'signup') {
      if (!/\d/.test(formData.password)) {
        nextFieldErrors.password = 'Password must include at least one number.'
      }
      if (!/[A-Za-z]/.test(formData.password)) {
        nextFieldErrors.password = 'Password must include at least one letter.'
      }
      if (formData.password !== formData.confirmPassword) {
        nextFieldErrors.confirmPassword = 'Passwords do not match.'
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setError('Please fix the highlighted fields before submitting.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: formData.password,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.detail || 'Authentication failed')
      }

      onAuthSuccess(payload.access_token, { email: trimmedEmail })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
            FlowFunds
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'login'
              ? 'Sign in to manage your finances.'
              : 'Join the app and start organizing your money.'}
          </p>
        </div>

        <div className="mb-6 flex rounded-lg border border-slate-800 p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${mode === 'login' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${mode === 'signup' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
          >
            Sign up
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-slate-100 outline-none transition ${fieldErrors.email ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'}`}
              placeholder="you@example.com"
            />
            {fieldErrors.email ? <p className="mt-2 text-sm text-rose-300">{fieldErrors.email}</p> : null}
          </label>

          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Password</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-slate-100 outline-none transition ${fieldErrors.password ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'}`}
              placeholder="At least 8 characters"
            />
            {fieldErrors.password ? <p className="mt-2 text-sm text-rose-300">{fieldErrors.password}</p> : null}
          </label>

          {mode === 'signup' && (
            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Confirm password</span>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-slate-100 outline-none transition ${fieldErrors.confirmPassword ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'}`}
                placeholder="Repeat your password"
              />
              {fieldErrors.confirmPassword ? <p className="mt-2 text-sm text-rose-300">{fieldErrors.confirmPassword}</p> : null}
            </label>
          )}

          {error ? <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AuthPage
