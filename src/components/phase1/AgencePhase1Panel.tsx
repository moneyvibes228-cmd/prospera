'use client'
import { useState } from 'react'
import { Building2, Loader2, Target } from 'lucide-react'
import {
  useAgenceObjectifs,
  useCreateAgence,
  useSetAgenceObjectifs,
} from '@/hooks/usePhase1'
import type { AgenceApi, ObjectifAgenceMois } from '@/types/phase1'

const inputCls =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500'

interface Props {
  selected: AgenceApi | null
  onCreated?: () => void
}

export function AgencePhase1Panel({ selected, onCreated }: Props) {
  const createAgence = useCreateAgence()
  const setObjectifs = useSetAgenceObjectifs()
  const annee = new Date().getFullYear()
  const mois = new Date().getMonth() + 1
  const { data: objectifs } = useAgenceObjectifs(selected?.id ?? null, annee)

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    nom: '',
    ville: 'Lomé',
    zone: '',
    adresse: '',
    telephone: '',
  })

  const [objForm, setObjForm] = useState<ObjectifAgenceMois>({
    annee,
    mois,
    objectif_clients_mois: 40,
    objectif_collecte_fcfa: 15_000_000,
    objectif_prospects_mois: 25,
    objectif_visites_mois: 120,
    notes: '',
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await createAgence.mutateAsync({
      nom: form.nom,
      ville: form.ville,
      zone: form.zone || undefined,
      adresse: form.adresse || undefined,
      telephone: form.telephone || undefined,
    })
    setShowCreate(false)
    setForm({ nom: '', ville: 'Lomé', zone: '', adresse: '', telephone: '' })
    onCreated?.()
  }

  async function handleObjectifs(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    await setObjectifs.mutateAsync({ agenceId: selected.id, objectifs: [objForm] })
  }

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowCreate(v => !v)}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors"
        >
          <Building2 size={16} />
          Nouvelle agence
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-5 grid sm:grid-cols-2 gap-3 shadow-sm"
        >
          <h3 className="sm:col-span-2 text-sm font-bold text-slate-900">Créer une agence</h3>
          <Field label="Nom *">
            <input required className={inputCls} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
          </Field>
          <Field label="Ville *">
            <input required className={inputCls} value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} />
          </Field>
          <Field label="Zone">
            <input className={inputCls} value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} />
          </Field>
          <Field label="Téléphone">
            <input className={inputCls} value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
          </Field>
          <Field label="Adresse" className="sm:col-span-2">
            <input className={inputCls} value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} />
          </Field>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={createAgence.isPending}
              className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60 cursor-pointer"
            >
              {createAgence.isPending && <Loader2 size={14} className="animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      )}

      {selected && (
        <form
          onSubmit={handleObjectifs}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Objectifs {mois}/{annee} — {selected.nom}
            </h3>
          </div>
          {objectifs && objectifs.length > 0 && (
            <p className="text-xs text-slate-500 mb-3">
              Enregistré : collecte {objectifs[0].objectif_collecte_fcfa.toLocaleString('fr-FR')} FCFA ·{' '}
              {objectifs[0].objectif_visites_mois} visites
            </p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="Clients / mois">
              <input
                type="number"
                className={inputCls}
                value={objForm.objectif_clients_mois}
                onChange={e => setObjForm(o => ({ ...o, objectif_clients_mois: +e.target.value }))}
              />
            </Field>
            <Field label="Collecte FCFA">
              <input
                type="number"
                className={inputCls}
                value={objForm.objectif_collecte_fcfa}
                onChange={e => setObjForm(o => ({ ...o, objectif_collecte_fcfa: +e.target.value }))}
              />
            </Field>
            <Field label="Prospects">
              <input
                type="number"
                className={inputCls}
                value={objForm.objectif_prospects_mois}
                onChange={e => setObjForm(o => ({ ...o, objectif_prospects_mois: +e.target.value }))}
              />
            </Field>
            <Field label="Visites">
              <input
                type="number"
                className={inputCls}
                value={objForm.objectif_visites_mois}
                onChange={e => setObjForm(o => ({ ...o, objectif_visites_mois: +e.target.value }))}
              />
            </Field>
          </div>
          <button
            type="submit"
            disabled={setObjectifs.isPending}
            className="mt-3 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer disabled:opacity-60"
          >
            {setObjectifs.isPending && <Loader2 size={14} className="animate-spin" />}
            Enregistrer objectifs
          </button>
        </form>
      )}
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={className}>
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  )
}
