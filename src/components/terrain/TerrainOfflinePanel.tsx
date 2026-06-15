'use client'
import { useState } from 'react'
import { WifiOff, RefreshCw, Cloud, CloudOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { getTerrainOfflineHub } from '@/lib/terrain-offline-hub'
import { formatFcfa } from '@/lib/utils'
import { ModuleSyntheseIA } from '@/components/modules/ModuleSyntheseIA'
import { ModuleKpiGrid } from '@/components/modules/ModuleKpiGrid'
import { cn } from '@/lib/utils'

const SYNC_STYLE = {
  SYNC: 'bg-emerald-100 text-emerald-800',
  EN_ATTENTE: 'bg-amber-100 text-amber-800',
  CONFLIT: 'bg-red-100 text-red-800',
  ERREUR: 'bg-red-100 text-red-800',
}

const TYPE_LABEL = {
  VISITE: 'Visite',
  COLLECTE: 'Collecte',
  REMBOURSEMENT: 'Remboursement',
  NOUVEAU_CLIENT: 'Nouveau client',
  PHOTO_KYC: 'Photo KYC',
}

export function TerrainOfflinePanel() {
  const [hub, setHub] = useState(() => getTerrainOfflineHub())
  const [syncing, setSyncing] = useState(false)

  const handleSync = () => {
    setSyncing(true)
    setTimeout(() => {
      setHub((prev) => ({
        ...prev,
        mode_hors_ligne: false,
        derniere_sync: new Date().toLocaleString('fr-FR'),
        kpis: { ...prev.kpis, actions_en_attente: 0, visites_non_sync: 0, collecte_en_attente_fcfa: 0 },
        file_sync: prev.file_sync.map((a) => ({ ...a, statut: 'SYNC' as const })),
      }))
      setSyncing(false)
    }, 1500)
  }

  const toggleOffline = () => {
    setHub((prev) => ({ ...prev, mode_hors_ligne: !prev.mode_hors_ligne }))
  }

  return (
    <div className="mb-6">
      <ModuleSyntheseIA texte={hub.synthese_ia} variant="teal" titre="Synthèse IA — Mode hors-ligne" />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          type="button"
          onClick={toggleOffline}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer',
            hub.mode_hors_ligne ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
          )}
        >
          {hub.mode_hors_ligne ? <WifiOff size={18} /> : <Cloud size={18} />}
          {hub.mode_hors_ligne ? 'Mode hors-ligne actif' : 'Mode en ligne'}
        </button>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing || hub.kpis.actions_en_attente === 0}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Synchronisation…' : 'Synchroniser maintenant'}
        </button>
        <span className="text-xs text-slate-500">Dernière sync : {hub.derniere_sync}</span>
      </div>

      <ModuleKpiGrid
        cols={5}
        items={[
          { label: 'En attente', value: String(hub.kpis.actions_en_attente), highlight: hub.kpis.actions_en_attente > 0 ? 'orange' : 'teal' },
          { label: 'Visites non sync', value: String(hub.kpis.visites_non_sync) },
          { label: 'Collecte en file', value: formatFcfa(hub.kpis.collecte_en_attente_fcfa) },
          { label: 'Conflits', value: String(hub.kpis.conflits), highlight: hub.kpis.conflits > 0 ? 'red' : 'default' },
          { label: 'Stockage', value: `${hub.kpis.stockage_utilise_mo} Mo` },
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <CloudOff size={16} />
            File de synchronisation
          </h3>
          <div className="space-y-2">
            {hub.file_sync.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 text-sm truncate">{a.libelle}</div>
                  <div className="text-xs text-slate-500">{TYPE_LABEL[a.type]} · {a.created_at}{a.taille_ko ? ` · ${a.taille_ko} Ko` : ''}</div>
                </div>
                {a.montant_fcfa && <span className="text-sm font-bold text-teal-700">{formatFcfa(a.montant_fcfa)}</span>}
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded flex-shrink-0', SYNC_STYLE[a.statut])}>{a.statut}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Historique sync</h3>
            {hub.historique_sync.map((h, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 text-sm">
                {h.statut === 'OK' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-amber-600" />}
                <span className="text-slate-600">{h.date}</span>
                <span className="font-medium">{h.actions} actions</span>
                <span className="text-slate-400">{h.duree_sec}s</span>
              </div>
            ))}
          </div>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
            <h3 className="text-sm font-bold text-teal-900 mb-2">Conseils IA terrain</h3>
            <ul className="text-sm text-teal-950 space-y-1">
              {hub.conseils_ia.map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
