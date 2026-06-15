'use client'
import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useCreateUserApi } from '@/hooks/usePhase1'
import { FRONT_ROLE_TO_API } from '@/lib/api-role-map'
import { ROLE_LABELS } from '@/lib/auth'
import type { UserRole } from '@/types'
import type { AgenceApi } from '@/types/phase1'

const inputCls =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30'

const ROLES_CREATABLE_DG: UserRole[] = [
  'GESTIONNAIRE',
  'RESPONSABLE_COMMERCIAL',
  'RESPONSABLE_CREDIT',
  'GESTIONNAIRE_PORTEFEUILLE',
]

const ROLES_CREATABLE_RA: UserRole[] = ['AGENT_TERRAIN', 'CREDIT', 'COMPTABLE', 'COLLECTRICE', 'COMMERCIAL']

interface Props {
  open: boolean
  onClose: () => void
  creatorRole: UserRole
  agences?: AgenceApi[]
  defaultAgenceId?: string
}

export function UserCreateModal({
  open,
  onClose,
  creatorRole,
  agences = [],
  defaultAgenceId,
}: Props) {
  const createUser = useCreateUserApi()
  const roles =
    creatorRole === 'MANAGER' ? ROLES_CREATABLE_DG : ROLES_CREATABLE_RA

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: 'password123',
    role: roles[0] as UserRole,
    agenceId: defaultAgenceId ?? '',
  })
  const [error, setError] = useState('')

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const apiRole = FRONT_ROLE_TO_API[form.role]
    if (!apiRole) {
      setError('Rôle non pris en charge pour la création.')
      return
    }
    try {
      await createUser.mutateAsync({
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        telephone: form.telephone || undefined,
        password: form.password,
        role: apiRole,
        agenceId: creatorRole === 'MANAGER' ? form.agenceId || undefined : undefined,
      })
      onClose()
    } catch {
      setError('Échec de la création — vérifiez les droits ou réessayez.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Nouvel utilisateur</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *">
              <input required className={inputCls} value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
            </Field>
            <Field label="Nom *">
              <input required className={inputCls} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            </Field>
          </div>
          <Field label="Email *">
            <input required type="email" className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Téléphone">
            <input className={inputCls} value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
          </Field>
          <Field label="Mot de passe *">
            <input required type="password" className={inputCls} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </Field>
          <Field label="Rôle *">
            <select
              className={inputCls}
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
            >
              {roles.map(r => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
          {creatorRole === 'MANAGER' && agences.length > 0 && (
            <Field label="Agence">
              <select
                className={inputCls}
                value={form.agenceId}
                onChange={e => setForm(f => ({ ...f, agenceId: e.target.value }))}
              >
                <option value="">— Siège / sans agence —</option>
                {agences.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nom}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <button
            type="submit"
            disabled={createUser.isPending}
            className="w-full flex justify-center items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2.5 rounded-lg cursor-pointer disabled:opacity-60"
          >
            {createUser.isPending && <Loader2 size={14} className="animate-spin" />}
            Créer
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  )
}
