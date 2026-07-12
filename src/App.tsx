import { useEffect, useState } from 'react'
import Login from './pages/login'
import { api, getToken, clearToken } from './lib/api'

type AuthUser = { id: string; email: string }

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [restoring, setRestoring] = useState(true)

  // On load, if we already hold a token, validate it and restore the session.
  useEffect(() => {
    if (!getToken()) {
      setRestoring(false)
      return
    }
    api<{ user: AuthUser }>('/auth/me', { auth: true })
      .then(res => setUser(res.user))
      .catch(() => clearToken())
      .finally(() => setRestoring(false))
  }, [])

  function handleSignOut() {
    clearToken()
    setUser(null)
  }

  if (restoring) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
    )
  }

  if (user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-4">
        <div className="rounded-2xl border border-gray-100 bg-white px-8 py-10 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-gray-900">You're signed in 🎉</h1>
          <p className="mt-2 text-sm text-gray-500">
            Logged in as <span className="font-semibold text-gray-700">{user.email}</span>
          </p>
          <button
            onClick={handleSignOut}
            className="mt-6 rounded-xl bg-gradient-to-r from-rose-400 to-orange-400 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-rose-500 hover:to-orange-500"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return <Login onAuthed={setUser} />
}
