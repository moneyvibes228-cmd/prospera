'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { saveSessionClient } from '@/lib/clients-session'
import { COLL_AGENT } from '@/lib/collecte-agent-hub'
import { useCreateProspect } from '@/hooks/usePhase1'

export default function NouveauClientPage() {
  const router = useRouter()
  const createProspect = useCreateProspect()
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    zone: COLL_AGENT.zone,
    activite: '',
    adresse: '',
    secteur_activite: 'COMMERCE',
    type_client: 'CLIENT' as 'CLIENT' | 'TONTINE' | 'PROSPECT',
  })
  const [error, setError] = useState('')
  const [apiOk, setApiOk] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim() || !form.telephone.trim()) {
      setError('Nom et téléphone sont obligatoires.')
      return
    }
    setError('')
    const parts = form.nom.trim().split(/\s+/)
    const prenom = form.prenom.trim() || parts[0] || ''
    const nom = form.prenom.trim() ? form.nom.trim() : parts.slice(1).join(' ') || parts[0] || form.nom

    try {
      const created = await createProspect.mutateAsync({
        nom,
        prenom,
        telephone: form.telephone,
        zone: form.zone,
        activite: form.activite || undefined,
        secteur_activite: form.secteur_activite,
      })
      setApiOk(true)
      const id = (created as { id?: string })?.id
      if (id) {
        router.push(`/clients/${id}`)
        return
      }
    } catch {
      // fallback session locale
    }

    const client = saveSessionClient({
      nom: form.nom,
      telephone: form.telephone,
      zone: form.zone,
      activite: form.activite,
      adresse: form.adresse,
      type_client: form.type_client,
    })
    router.push(`/clients/${client.id}`)
  }

  return (
    <PageWrapper title="Nouveau client" subtitle={`Enregistrement terrain — ${COLL_AGENT.nom}`}>
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Retour à la liste
      </Link>

      {apiOk && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-4">
          Prospect enregistré avec succès
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-lg bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-2">
          <UserPlus size={18} className="text-pink-600" />
          <h2 className="text-sm font-bold text-slate-900">Fiche client / prospect</h2>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        <Field label="Nom *">
          <input
            required
            value={form.nom}
            onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
            className={inputCls}
            placeholder="Ex. Mensah"
          />
        </Field>

        <Field label="Prénom">
          <input
            value={form.prenom}
            onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
            className={inputCls}
            placeholder="Ex. Akossiwa"
          />
        </Field>

        <Field label="Téléphone *">
          <input
            required
            type="tel"
            value={form.telephone}
            onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
            className={inputCls}
            placeholder="+228 90 00 00 00"
          />
        </Field>

        <Field label="Zone / quartier">
          <input
            value={form.zone}
            onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
            className={inputCls}
          />
        </Field>

        <Field label="Activité">
          <input
            value={form.activite}
            onChange={e => setForm(f => ({ ...f, activite: e.target.value }))}
            className={inputCls}
            placeholder="Ex. Commerce tissus"
          />
        </Field>

        <Field label="Secteur d'activité">
          <select
            value={form.secteur_activite}
            onChange={e => setForm(f => ({ ...f, secteur_activite: e.target.value }))}
            className={inputCls}
          >
            <option value="COMMERCE">Commerce</option>
            <option value="ARTISANAT">Artisanat</option>
            <option value="AGRICULTURE">Agriculture</option>
            <option value="SERVICES">Services</option>
          </select>
        </Field>

        <Field label="Adresse">
          <input
            value={form.adresse}
            onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
            className={inputCls}
            placeholder="Rue, repère..."
          />
        </Field>

        <Field label="Type (local)">
          <select
            value={form.type_client}
            onChange={e => setForm(f => ({ ...f, type_client: e.target.value as typeof form.type_client }))}
            className={inputCls}
          >
            <option value="CLIENT">Client collecte</option>
            <option value="TONTINE">Membre tontine</option>
            <option value="PROSPECT">Prospect</option>
          </select>
        </Field>

        <button
          type="submit"
          disabled={createProspect.isPending}
          className="w-full flex justify-center items-center gap-2 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors disabled:opacity-60"
        >
          {createProspect.isPending && <Loader2 size={14} className="animate-spin" />}
          Enregistrer
        </button>
      </form>
    </PageWrapper>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500'
