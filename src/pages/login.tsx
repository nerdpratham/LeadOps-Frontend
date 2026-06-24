import { useState } from 'react'
import Input from '../components/Input'
import Button from '../components/Button'

// ─── icons ────────────────────────────────────────────────────────────────────

function MailIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

// ─── types ────────────────────────────────────────────────────────────────────

type Credentials = { email: string; password: string }
type FieldErrors = Partial<Record<keyof Credentials, string>>

// ─── component ────────────────────────────────────────────────────────────────

export default function Login() {
  const [credentials, setCredentials] = useState<Credentials>({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  function updateField(field: keyof Credentials) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setCredentials(prev => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  function validate(): boolean {
    const next: FieldErrors = {}
    if (!credentials.email) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) next.email = 'Enter a valid email.'
    if (!credentials.password) next.password = 'Password is required.'
    else if (credentials.password.length < 6) next.password = 'Must be at least 6 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      // TODO: replace with API call
      // const response = await api.post('/auth/login', { ...credentials, rememberMe })
      // navigate('/dashboard')
      await new Promise(r => setTimeout(r, 1200))
    } catch {
      // TODO: map API error to field errors
      // setErrors({ email: 'Invalid email or password.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="h-screen flex items-center justify-center px-4 py-4 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: "url('/login_cover3.png')" }}
    >
      {/* Outer frame — white border with padding creating the separation effect */}
      <div className="w-full max-w-5xl bg-white/60 backdrop-blur-2xl rounded-4xl p-3 max-h-[calc(100vh-2rem)] flex flex-col gap-3
        border border-white/60
        shadow-[0_32px_80px_rgba(0,0,0,0.35),0_8px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.05)]">
        <div className="flex gap-3 flex-1 min-h-0">

        {/* ── Left panel ─────────────────────────────────────────────────── */}
        <div className="hidden md:flex relative w-[45%] flex-col bg-gradient-to-br from-violet-500 via-fuchsia-400 to-purple-700 p-10 overflow-hidden rounded-[1.4rem]">
          {/* side image — covers the full panel */}
          <img
            src="/login_side.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          {/* bottom gradient — just enough to make text readable */}
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/55 to-transparent z-10 pointer-events-none rounded-b-[1.4rem]" />

          {/* bottom tagline */}
          <div className="relative z-20 mt-auto">
            <h3 className="text-white text-xl font-bold leading-snug drop-shadow-md">LeadOps Control Center</h3>
            <p className="mt-2 text-white/80 text-sm leading-relaxed drop-shadow-sm">
              Turn incoming opportunities into visible execution.
            </p>
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────────────────── */}
        <div className="flex-1 bg-white px-8 sm:px-10 py-6 flex flex-col justify-between overflow-y-auto rounded-[1.4rem]">
          <div>
            {/* heading */}
            <div className="mb-5 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
              <p className="mt-1 text-sm text-gray-500">Sign in to access your LeadOps dashboard</p>
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={credentials.email}
                onChange={updateField('email')}
                error={errors.email}
                leftIcon={<MailIcon />}
              />

              <Input
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                value={credentials.password}
                onChange={updateField('password')}
                error={errors.password}
                leftIcon={<LockIcon />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="cursor-pointer text-gray-400 hover:text-gray-600 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                }
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-gray-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-rose-400"
                  />
                  Remember me
                </label>
                <a href="#" className="font-medium text-rose-500 hover:text-rose-600 transition">
                  Forgot Password?
                </a>
              </div>

              <Button type="submit" variant="gradient" loading={loading} className="mt-0.5 py-2.5">
                Sign In
              </Button>
            </form>

            {/* divider */}
            <div className="my-3 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">Or Continue With</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google */}
            <Button variant="outline" type="button">
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </span>
            </Button>
          </div>

          {/* footer */}
          <p className="mt-4 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <a href="#" className="font-semibold text-rose-500 hover:text-rose-600 transition">
              Sign up
            </a>
          </p>
        </div>

        </div>{/* end flex gap-3 row */}
      </div>{/* end outer frame */}
    </div>
  )
}
