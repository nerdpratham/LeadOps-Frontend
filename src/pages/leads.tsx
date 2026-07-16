import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Lead } from '../lib/api'

// Fixed status options.
const STATUSES = ['Submitted', 'In Process', 'Dead'] as const

const STATUS_STYLES: Record<string, string> = {
  Submitted: 'bg-sky-100 text-sky-700 border-sky-200',
  'In Process': 'bg-amber-100 text-amber-700 border-amber-200',
  Dead: 'bg-rose-100 text-rose-700 border-rose-200',
}
const statusStyle = (name: string | null | undefined) => STATUS_STYLES[name ?? ''] ?? 'bg-gray-100 text-gray-600 border-gray-200'
const fmt = (ts: string) => new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
const userLabel = (u?: { userName: string | null; email: string } | null) => (u ? u.userName || u.email : '—')

const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-300'
const emptyForm = { plantName: '', city: '', contactName: '', verticalName: '', sectorName: '', assignedToName: '', remark: '', statusName: 'Submitted' }

export default function Leads({ isAdmin = false }: { isAdmin?: boolean }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({ ...emptyForm })
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

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

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function createLead(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!form.plantName.trim()) { setFormError('Plant is required.'); return }
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

  async function changeStatus(id: string, statusName: string) {
    setSavingId(id)
    try {
      const { lead } = await api<{ lead: Lead }>(`/leads/${id}`, { method: 'PATCH', auth: true, body: { statusName } })
      setLeads(prev => prev.map(l => (l.id === id ? lead : l)))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update status.')
    } finally {
      setSavingId(null)
    }
  }

  async function removeLead(id: string) {
    setSavingId(id)
    try {
      await api(`/leads/${id}`, { method: 'DELETE', auth: true })
      setLeads(prev => prev.filter(l => l.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete lead.')
    } finally {
      setSavingId(null)
    }
  }

  const field = (label: string, key: keyof typeof form, placeholder: string, span = '') => (
    <label className={`flex flex-col gap-1 text-xs font-medium text-gray-600 ${span}`}>
      {label}
      <input value={form[key]} onChange={set(key)} placeholder={placeholder} className={inputCls} />
    </label>
  )

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">Leads</h2>
        <p className="text-sm text-gray-500">Type in the lead details — matching plants, contacts, verticals and sectors are reused or created automatically. Available to all team members.</p>
      </div>

      {/* create form */}
      <form onSubmit={createLead} className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-gray-900">New lead</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {field('Plant *', 'plantName', 'e.g. Bhilai Steel Plant')}
          {field('City', 'city', 'e.g. Bhilai')}
          {field('Contact', 'contactName', 'Contact person name')}
          {field('Vertical', 'verticalName', 'e.g. AI Automation')}
          {field('Sector', 'sectorName', 'e.g. Steel')}
          {field('Assign to', 'assignedToName', 'Employee name or email')}
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Status
            <select value={form.statusName} onChange={set('statusName')} className={inputCls}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          {field('Remark', 'remark', 'Optional note', 'sm:col-span-2 lg:col-span-2')}
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

        {error && <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : leads.length === 0 && !error ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">No leads yet. Create one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3 font-semibold">Plant / Contact</th>
                  <th className="px-3 py-3 font-semibold">Vertical / Sector</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Assigned</th>
                  <th className="px-3 py-3 font-semibold">Updated</th>
                  {isAdmin && <th className="px-3 py-3 font-semibold"></th>}
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900">{lead.plant?.plantName ?? '—'}</p>
                      <p className="text-xs text-gray-500">{lead.contact?.contactPersonName ?? 'No contact'}{lead.plant?.location ? ` · ${lead.plant.location.city}` : ''}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">
                      <p>{lead.vertical?.verticalName ?? '—'}</p>
                      <p className="text-gray-400">{lead.sector?.sectorName ?? '—'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={lead.status?.statusName ?? 'Submitted'}
                        disabled={savingId === lead.id}
                        onChange={e => changeStatus(lead.id, e.target.value)}
                        className={`rounded-lg border px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60 ${statusStyle(lead.status?.statusName)}`}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">{userLabel(lead.assignedToUser)}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{fmt(lead.updatedAt)}</td>
                    {isAdmin && (
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => removeLead(lead.id)} disabled={savingId === lead.id} className="text-xs font-medium text-red-400 hover:text-red-600 disabled:opacity-50">Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
