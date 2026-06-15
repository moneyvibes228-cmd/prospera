'use client'
import { useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { useAssignZone } from '@/hooks/usePhase1'
import type { AgentZoneApi } from '@/types/phase1'

const inputCls =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30'

interface Props {
  agent: AgentZoneApi | null
}

/** Affectation simplifiée : point + rayon (centre_lat/lng) — polygone GeoJSON en phase 2 UI */
export function ZoneAssignPanel({ agent }: Props) {
  const assign = useAssignZone()
  const z = agent?.zone_affectee

  const [form, setForm] = useState({
    libelle: z?.libelle ?? '',
    centre_lat: z?.centre_lat ?? 6.1374,
    centre_lng: z?.centre_lng ?? 1.2123,
    couleur: z?.couleur ?? '#0d9488',
    description: z?.description ?? '',
  })

  if (!agent) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-sm text-slate-500 text-center">
        Sélectionnez un agent sur la carte
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await assign.mutateAsync({
      agentId: agent!.id,
      data: {
        libelle: form.libelle,
        centre_lat: form.centre_lat,
        centre_lng: form.centre_lng,
        couleur: form.couleur,
        description: form.description || undefined,
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
      <div className="flex items-center gap-2">
        <MapPin size={16} className="text-fuchsia-600" />
        <h3 className="text-sm font-bold text-slate-900">
          Zone — {agent.prenom} {agent.nom}
        </h3>
      </div>
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Libellé *</span>
        <input
          required
          className={inputCls}
          value={form.libelle}
          onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Latitude</span>
          <input
            type="number"
            step="0.0001"
            className={inputCls}
            value={form.centre_lat}
            onChange={e => setForm(f => ({ ...f, centre_lat: +e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Longitude</span>
          <input
            type="number"
            step="0.0001"
            className={inputCls}
            value={form.centre_lng}
            onChange={e => setForm(f => ({ ...f, centre_lng: +e.target.value }))}
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Couleur</span>
        <input
          type="color"
          className="h-10 w-full rounded border border-slate-200 cursor-pointer"
          value={form.couleur}
          onChange={e => setForm(f => ({ ...f, couleur: e.target.value }))}
        />
      </label>
      <button
        type="submit"
        disabled={assign.isPending}
        className="w-full flex justify-center items-center gap-2 bg-fuchsia-700 hover:bg-fuchsia-800 text-white text-sm font-medium py-2.5 rounded-lg cursor-pointer disabled:opacity-60"
      >
        {assign.isPending && <Loader2 size={14} className="animate-spin" />}
        Enregistrer la zone
      </button>
    </form>
  )
}
