import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { AuthUser, Lead } from '../lib/api'
import Leads from './leads'
import Catalog from './catalog'
import Reports from './reports'

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Turn an email into a display name: "jane.doe@x.com" -> "Jane Doe". */
function displayName(email: string): string {
  const raw = email.split('@')[0].replace(/[._-]+/g, ' ').trim()
  return raw.replace(/\b\w/g, c => c.toUpperCase()) || 'User'
}

function initials(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U'
}

// ─── icons (inline, stroke-based to match the login page) ───────────────────────

type IconProps = { className?: string }
const Icon = ({ d, className = 'h-5 w-5' }: { d: string } & IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const icons = {
  dashboard: 'M4 5a1 1 0 011-1h5v7H4V5zm0 9h6v6H5a1 1 0 01-1-1v-5zm10-10h5a1 1 0 011 1v5h-6V4zm0 9h6v6a1 1 0 01-1 1h-5v-7z',
  leadGen: 'M12 3v3m0 12v3m9-9h-3M6 12H3m14.5-5.5L15 9m-6 6l-2.5 2.5m11 0L15 15m-6-6L6.5 6.5M12 8a4 4 0 100 8 4 4 0 000-8z',
  leads: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-2a3 3 0 10-2.5-4.5',
  campaigns: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
  reports: 'M9 17v-6m3 6V7m3 10v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z',
  tasks: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  team: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  signout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  setup: 'M4 7l8-4 8 4-8 4-8-4zm0 5l8 4 8-4M4 17l8 4 8-4',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
}

// ─── module cards shown in the main area ────────────────────────────────────────

// `action` = the clear call-to-action label. `glow` = the hover border/shadow tint.
type Module = { key: string; title: string; desc: string; icon: string; action: string; accent: string; glow: string }

const CORE_MODULES: Module[] = [
  { key: 'lead-gen', title: 'Lead Generation', desc: 'Discover, capture and qualify new prospects.', icon: icons.leadGen, action: 'Open', accent: 'from-rose-400 to-orange-400', glow: 'rgba(251,146,60,0.45)' },
  { key: 'leads', title: 'My Leads', desc: 'Track and nurture your assigned leads.', icon: icons.leads, action: 'Open', accent: 'from-sky-400 to-indigo-400', glow: 'rgba(56,189,248,0.45)' },
  { key: 'campaigns', title: 'Campaigns', desc: 'Launch and monitor outreach campaigns.', icon: icons.campaigns, action: 'Explore', accent: 'from-violet-400 to-fuchsia-400', glow: 'rgba(167,139,250,0.45)' },
  { key: 'reports', title: 'Reports', desc: 'Pipeline, conversion and activity analytics.', icon: icons.reports, action: 'View', accent: 'from-emerald-400 to-teal-400', glow: 'rgba(52,211,153,0.45)' },
  { key: 'tasks', title: 'Tasks', desc: 'Your follow-ups and to-dos in one place.', icon: icons.tasks, action: 'Open', accent: 'from-amber-400 to-orange-400', glow: 'rgba(251,191,36,0.45)' },
]

const ADMIN_MODULES: Module[] = [
  { key: 'team', title: 'Team Management', desc: 'Manage members, roles and permissions.', icon: icons.team, action: 'Manage', accent: 'from-rose-400 to-pink-400', glow: 'rgba(251,113,133,0.45)' },
  { key: 'settings', title: 'Workspace Settings', desc: 'Configure your organization workspace.', icon: icons.settings, action: 'Configure', accent: 'from-slate-400 to-gray-500', glow: 'rgba(148,163,184,0.5)' },
]

// ─── stat-tile micro-visualizations ────────────────────────────────────────────

// Thin upward line (2px, rounded ends) with a small end marker. Emerald = growth.
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <div className="h-6 w-[72px]" />
  const w = 72, h = 24
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const y = (v: number) => h - ((v - min) / range) * h
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * w).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={y(data[data.length - 1])} r="2.5" fill="#10b981" />
    </svg>
  )
}

// Circular progress ring for a percentage. Track + orange arc.
function Ring({ pct }: { pct: number }) {
  const r = 15, c = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(pct, 100)) / 100) * c
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#eef2f7" strokeWidth="4" />
      <circle cx="20" cy="20" r={r} fill="none" stroke="#f97316" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`} transform="rotate(-90 20 20)" />
    </svg>
  )
}

// Proportional status dots (In Process / Submitted / Dead). Each dot carries a
// title so its status is available without relying on color alone.
function StatusDots({ counts }: { counts: { submitted: number; inProcess: number; dead: number } }) {
  const groups = [
    { title: 'In Process', n: counts.inProcess, color: '#f59e0b' },
    { title: 'Submitted', n: counts.submitted, color: '#0ea5e9' },
    { title: 'Dead', n: counts.dead, color: '#f43f5e' },
  ]
  const dots = groups.flatMap(g => Array.from({ length: g.n }, () => ({ title: g.title, color: g.color })))
  const shown = dots.slice(0, 14)
  return (
    <div className="flex flex-wrap items-center gap-1">
      {dots.length === 0 && <span className="text-[10px] text-gray-300">no leads</span>}
      {shown.map((d, i) => (
        <span key={i} title={d.title} className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
      ))}
      {dots.length > shown.length && <span className="text-[10px] font-medium text-gray-400">+{dots.length - shown.length}</span>}
    </div>
  )
}

// ─── component ──────────────────────────────────────────────────────────────────

export default function Dashboard({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
  const role = user.role ?? 'employee'
  const name = displayName(user.email)
  const isAdmin = role === 'admin'

  const modules = isAdmin ? [...CORE_MODULES, ...ADMIN_MODULES] : CORE_MODULES

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    { key: 'lead-gen', label: 'Lead Generation', icon: icons.leadGen },
    { key: 'leads', label: 'My Leads', icon: icons.leads },
    { key: 'setup', label: 'Setup', icon: icons.setup },
    { key: 'campaigns', label: 'Campaigns', icon: icons.campaigns },
    { key: 'reports', label: 'Reports', icon: icons.reports },
    ...(isAdmin ? [{ key: 'team', label: 'Team', icon: icons.team }, { key: 'settings', label: 'Settings', icon: icons.settings }] : []),
  ]

  // Remember the current tab across page refreshes.
  const [active, setActive] = useState(() => localStorage.getItem('leadops_tab') ?? 'dashboard')
  useEffect(() => { localStorage.setItem('leadops_tab', active) }, [active])
  const [demoNote, setDemoNote] = useState<string | null>(null)

  // Live lead stats for the tiles. Refreshed each time the dashboard is shown.
  const [stats, setStats] = useState({
    total: 0, active: 0, conversion: 0, converted: 0, weekAdded: 0,
    spark: [] as number[],
    counts: { submitted: 0, inProcess: 0, dead: 0 },
    loaded: false,
  })
  useEffect(() => {
    if (active !== 'dashboard') return
    api<{ leads: Lead[] }>('/leads', { auth: true })
      .then(({ leads }) => {
        const total = leads.length
        const byName = (n: string) => leads.filter(l => l.status?.statusName === n).length
        const inProcess = byName('In Process')
        // "Converted" = progressed beyond the initial stage (In Progress or a Won/completed category).
        const converted = leads.filter(l => {
          const c = l.status?.statusCategory
          return c === 'In Progress' || c === 'Closed Won'
        }).length
        // Cumulative leads created over the last 7 days → a naturally upward line.
        const now = new Date()
        const spark = Array.from({ length: 7 }, (_, i) => {
          const end = new Date(now)
          end.setDate(now.getDate() - (6 - i))
          end.setHours(23, 59, 59, 999)
          return leads.filter(l => new Date(l.createdAt) <= end).length
        })
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        const weekAdded = leads.filter(l => new Date(l.createdAt) >= weekAgo).length
        setStats({
          total, active: inProcess,
          conversion: total ? Math.round((converted / total) * 1000) / 10 : 0,
          converted, weekAdded,
          spark,
          counts: { submitted: byName('Submitted'), inProcess, dead: byName('Dead') },
          loaded: true,
        })
      })
      .catch(() => setStats(s => ({ ...s, loaded: true })))
  }, [active])

  // These keys render real views; everything else is a demo placeholder.
  const REAL_VIEWS = new Set(['dashboard', 'lead-gen', 'leads', 'setup', 'reports'])

  function openModule(m: { key: string; label?: string; title?: string }) {
    setActive(m.key)
    setDemoNote(REAL_VIEWS.has(m.key) ? null : `“${m.label ?? m.title}” is a demo module — coming soon.`)
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
        {/* logo */}
        <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-orange-400 text-white font-bold">L</div>
          <span className="text-lg font-bold tracking-tight">LeadOps</span>
        </div>

        {/* user profile */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-orange-400 text-white font-semibold">
              {initials(name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
              <span
                className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize
                  ${isAdmin ? 'bg-orange-100 text-orange-600' : 'bg-sky-100 text-sky-600'}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isAdmin ? 'bg-orange-500' : 'bg-sky-500'}`} />
                {role}
              </span>
            </div>
          </div>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Menu</p>
          <ul className="flex flex-col gap-1">
            {navItems.map(item => (
              <li key={item.key}>
                <button
                  onClick={() => openModule(item)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition
                    ${active === item.key
                      ? 'bg-gradient-to-r from-rose-50 to-orange-50 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <Icon d={item.icon} className={`h-5 w-5 ${active === item.key ? 'text-orange-500' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* sign out */}
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <Icon d={icons.signout} className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* top bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur">
          <div>
            <h1 className="text-lg font-bold">Welcome back, {name.split(' ')[0]} 👋</h1>
            <p className="text-xs text-gray-500">Here's what's happening in your workspace today.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon d={icons.search} className="h-4 w-4" />
              </span>
              <input
                placeholder="Search…"
                className="w-56 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <button className="relative rounded-xl border border-gray-200 bg-white p-2 text-gray-500 transition hover:bg-gray-50">
              <Icon d={icons.bell} className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>
            {/* mobile sign out (sidebar hidden on small screens) */}
            <button onClick={onSignOut} className="md:hidden rounded-xl border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50">
              <Icon d={icons.signout} className="h-5 w-5" />
            </button>
          </div>
        </header>

        {active === 'lead-gen' || active === 'leads' ? (
          <Leads isAdmin={isAdmin} />
        ) : active === 'setup' ? (
          <Catalog />
        ) : active === 'reports' ? (
          <Reports />
        ) : (
        <div className="mx-auto max-w-6xl px-6 py-6">
          {demoNote && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm text-orange-700">
              <span>{demoNote}</span>
              <button onClick={() => setDemoNote(null)} className="text-orange-400 hover:text-orange-600">✕</button>
            </div>
          )}

          {/* stat tiles */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Total Leads — upward sparkline */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Total Leads</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.loaded ? stats.total.toLocaleString() : '—'}</p>
                  <p className={`mt-0.5 text-[11px] font-medium ${stats.loaded && stats.weekAdded > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {stats.loaded ? (stats.weekAdded > 0 ? `+${stats.weekAdded} this week` : 'No new this week') : ' '}
                  </p>
                </div>
                <Sparkline data={stats.spark} />
              </div>
            </div>

            {/* Conversion Rate — circular progress ring */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Conversion Rate</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.loaded ? `${stats.conversion}%` : '—'}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                    {stats.loaded ? `${stats.converted} of ${stats.total} converted` : ' '}
                  </p>
                </div>
                <Ring pct={stats.loaded ? stats.conversion : 0} />
              </div>
            </div>

            {/* Active Campaigns — status dots */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Active Campaigns</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.loaded ? String(stats.active) : '—'}</p>
              <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                {stats.loaded ? (stats.total ? `${Math.round((stats.active / stats.total) * 100)}% of pipeline` : 'No leads yet') : ' '}
              </p>
              <div className="mt-2 h-4">{stats.loaded && <StatusDots counts={stats.counts} />}</div>
            </div>

            {/* Revenue — muted placeholder (no revenue source wired yet) */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Revenue (MTD)</p>
              <p className="mt-1 text-2xl font-bold text-gray-300">—</p>
              <p className="mt-0.5 text-[11px] font-medium text-gray-400">Connect revenue tracking</p>
            </div>
          </div>

          {/* modules */}
          <div className="mt-8 mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Modules</h2>
            <span className="text-xs text-gray-400">Demo — select any card</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(m => (
              <button
                key={m.key}
                onClick={() => openModule(m)}
                style={{ '--glow': m.glow } as React.CSSProperties}
                className="group flex flex-col items-start rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all duration-200
                  hover:-translate-y-1 hover:border-[color:var(--glow)] hover:shadow-[0_16px_36px_-12px_var(--glow)]"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${m.accent} text-white`}>
                  <Icon d={m.icon} className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-gray-900">{m.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{m.desc}</p>
                {/* clear action label */}
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-orange-500">
                  {m.action}
                  <svg className="h-3.5 w-3.5 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
        )}
      </main>
    </div>
  )
}
