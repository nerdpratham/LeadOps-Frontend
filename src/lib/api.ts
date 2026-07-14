export type Role = 'admin' | 'employee'
export type AuthUser = { id: string; email: string; role?: Role }
export type AuthResponse = { accessToken: string; user: AuthUser }

export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export type LeadActivity = {
  id: string
  fromStatus: LeadStatus | null
  toStatus: LeadStatus
  note: string | null
  createdAt: string
}

export type Lead = {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  source: string | null
  notes: string | null
  status: LeadStatus
  createdAt: string
  updatedAt: string
  activities?: LeadActivity[]
}

// Base URL of the backend. Override with VITE_API_URL in a .env file if needed.
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const TOKEN_KEY = 'leadops_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Thin fetch wrapper. Sends/receives JSON, attaches the bearer token when present,
 * and throws an Error carrying the backend's `error` message on any non-2xx response.
 */
export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, auth = false } = options

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    // Network error / server not running
    throw new Error('Cannot reach the server. Please try again.')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? 'Something went wrong. Please try again.')
  }
  return data as T
}
