import { Fragment, useEffect, useState } from 'react'
import { api, LEAD_STATUSES } from '../lib/api'
import type { Lead, LeadStatus } from '../lib/api'

const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: 'bg-sky-100 text-sky-700 border-sky-200',
  CONTACTED: 'bg-violet-100 text-violet-700 border-violet-200',
  QUALIFIED: 'bg-amber-100 text-amber-700 border-amber-200',
  PROPOSAL: 'bg-orange-100 text-orange-700 border-orange-200',
  WON: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  LOST: 'bg-rose-100 text-rose-700 border-rose-200',
}

function fmt(ts: string): string {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const emptyForm = { name: '', company: '', email: '', phone: '', source: '', notes: '' }

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({ ...emptyForm })
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [savingId, setSavingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const { leads } = await api<{ leads: Lead[] }>('/leads', { auth: true })
      setLeads(leads)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leads.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createLead(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!form.name.trim()) { setFormError('Name is required.'); return }
    setCreating(true)
    try {
      const { lead } = await api<{ lead: Lead }>('/leads', { method: 'POST', auth: true, body: form })
      setLeads(prev => [lead, ...prev])
      setForm({ ...emptyForm })
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not create lead.')
    } finally {
      setCreating(false)
    }
  }

  async function changeStatus(id: string, status: LeadStatus) {
    setSavingId(id)
    try {
      const { lead } = await api<{ lead: Lead }>(`/leads/${id}/status`, { method: 'PATCH', auth: true, body: { status } })
      // Update in place, keep any already-loaded activity history from the response.
      setLeads(prev => prev.map(l => (l.id === id ? { ...l, ...lead } : l)))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update status.')
    } finally {
      setSavingId(null)
    }
  }

  async function toggleHistory(id: string) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    // Fetch full history (the list endpoint doesn't include activities).
    try {
      const { lead } = await api<{ lead: Lead }>(`/leads/${id}`, { auth: true })
      setLeads(prev => prev.map(l => (l.id === id ? { ...l, ...lead } : l)))
    } catch { /* leave whatever we have */ }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">Lead Generation</h2>
        <p className="text-sm text-gray-500">Capture new leads and update their status — changes are saved to the database with timestamps.</p>
      </div>

      {/* create form */}
      <form onSubmit={createLead} className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-gray-900">Add a lead</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input value={form.name} onChange={set('name')} placeholder="Name *" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-300" />
          <input value={form.company} onChange={set('company')} placeholder="Company" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-300" />
          <input value={form.email} onChange={set('email')} placeholder="Email" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-300" />
          <input value={form.phone} onChange={set('phone')} placeholder="Phone" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-300" />
          <input value={form.source} onChange={set('source')} placeholder="Source (e.g. Website, Referral)" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-300" />
          <input value={form.notes} onChange={set('notes')} placeholder="Notes" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-300" />
        </div>
        {formError && <p className="mt-2 text-xs text-red-500">{formError}</p>}
        <div className="mt-3">
          <button type="submit" disabled={creating} className="rounded-xl bg-gradient-to-r from-rose-400 to-orange-400 px-5 py-2 text-sm font-semibold text-white transition hover:from-rose-500 hover:to-orange-500 disabled:opacity-60">
            {creating ? 'Saving…' : 'Add Lead'}
          </button>
        </div>
      </form>

      {/* list */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h3 className="text-sm font-bold text-gray-900">Leads {leads.length > 0 && <span className="text-gray-400">({leads.length})</span>}</h3>
          <button onClick={load} className="text-xs font-medium text-orange-500 hover:text-orange-600">Refresh</button>
        </div>

        {error && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">Loading leads…</p>
        ) : leads.length === 0 && !error ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">No leads yet. Add your first one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3 font-semibold">Lead</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Created</th>
                  <th className="px-3 py-3 font-semibold">Last updated</th>
                  <th className="px-3 py-3 font-semibold">History</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <Fragment key={lead.id}>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-900">{lead.name}</p>
                        <p className="text-xs text-gray-500">{[lead.company, lead.email, lead.phone].filter(Boolean).join(' · ') || '—'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={lead.status}
                          disabled={savingId === lead.id}
                          onChange={e => changeStatus(lead.id, e.target.value as LeadStatus)}
                          className={`rounded-lg border px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60 ${STATUS_STYLES[lead.status]}`}
                        >
                          {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">{fmt(lead.createdAt)}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{fmt(lead.updatedAt)}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => toggleHistory(lead.id)} className="text-xs font-medium text-orange-500 hover:text-orange-600">
                          {expanded === lead.id ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>
                    {expanded === lead.id && (
                      <tr className="bg-gray-50/60">
                        <td colSpan={5} className="px-5 py-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Status history</p>
                          {lead.activities && lead.activities.length > 0 ? (
                            <ul className="flex flex-col gap-1.5">
                              {lead.activities.map(a => (
                                <li key={a.id} className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="text-gray-400">{fmt(a.createdAt)}</span>
                                  <span>—</span>
                                  {a.fromStatus ? <span>{a.fromStatus} → <strong>{a.toStatus}</strong></span> : <span>Created as <strong>{a.toStatus}</strong></span>}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-400">No history.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
