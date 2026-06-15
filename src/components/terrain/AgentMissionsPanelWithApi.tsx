'use client'

import Link from 'next/link'
import { MapPin, RefreshCw, Target } from 'lucide-react'
import { useAgentMissionsStrict } from '@/hooks/useAgentMissionsStrict'
import {
  ApiEmptyState,
  ApiErrorState,
  ApiLoadingState,
  ApiSection,
} from '@/components/api-ui'
import { formatFcfa } from '@/lib/utils'

function listKey(prefix: string, parts: (string | number | undefined | null)[], index: number): string {
  const stable = parts.filter((p) => p != null && p !== '').join('-')
  return stable ? `${prefix}-${stable}` : `${prefix}-${index}`
}

export function AgentMissionsPanelWithApi() {
  const { data, state, error, reload } = useAgentMissionsStrict()

  if (state === 'loading') return <ApiLoadingState label="Chargement missions recouvrement…" />
  if (state === 'error') {
    return (
      <ApiErrorState
        message={error ?? 'Erreur missions agent'}
        onRetry={() => void reload()}
      />
    )
  }

  const hasContent =
    (data?.missions_clients?.length ?? 0) > 0 ||
    (data?.promesses_a_suivre?.length ?? 0) > 0 ||
    (data?.activite_recente?.length ?? 0) > 0

  return (
    <ApiSection
      title="Missions recouvrement"
    >
      <div className="flex items-center justify-end -mt-2 mb-3">
        <button
          type="button"
          onClick={() => void reload()}
          className="text-xs font-semibold text-slate-600 inline-flex items-center gap-1 cursor-pointer hover:text-teal-700 transition-colors duration-200"
        >
          <RefreshCw size={12} /> Actualiser
        </button>
      </div>

      {!hasContent ? (
        <ApiEmptyState title="Aucune mission" description="Le backend n'a renvoyé aucune mission pour aujourd'hui." />
      ) : (
        <div className="space-y-4">
          {data?.missions_clients && data.missions_clients.length > 0 && (
            <div className="rounded-xl border border-red-200/80 bg-red-50/30 p-4 space-y-2">
              <p className="text-[10px] font-bold text-red-700 uppercase flex items-center gap-1">
                <Target size={12} /> Clients en retard
              </p>
              {data.missions_clients.map((m, mi) => (
                <div
                  key={listKey('mission', [m.client_id, m.client_nom], mi)}
                  className="text-xs border-b border-red-100 pb-2 last:border-0"
                >
                  <p className="font-bold text-slate-900">{m.client_nom}</p>
                  {m.dossiers.map((d, di) => (
                    <Link
                      key={listKey('dossier', [d.id, d.reference, m.client_id], di)}
                      href={`/credit/dossiers-with-api/${d.id}`}
                      className="block text-teal-700 hover:text-teal-900 mt-0.5 cursor-pointer transition-colors duration-200"
                    >
                      {d.reference} — retard {d.jours_retard} j
                      {d.montant_retard != null && ` · ${formatFcfa(d.montant_retard)}`}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}

          {data?.promesses_a_suivre && data.promesses_a_suivre.length > 0 && (
            <div className="rounded-xl border border-violet-200/80 bg-violet-50/50 p-4 space-y-2">
              <p className="text-[10px] font-bold text-violet-800 uppercase">Promesses à suivre</p>
              {data.promesses_a_suivre.map((p, i) => (
                <div
                  key={listKey('promesse', [p.id, p.dossier_id, p.client_nom, p.date_promesse], i)}
                  className="text-xs text-violet-900"
                >
                  <p className="font-bold">
                    {p.client_nom ?? 'Client'} — {formatFcfa(p.montant_promis)} le {p.date_promesse}
                  </p>
                  {p.dossier_id && (
                    <Link
                      href={`/credit/dossiers-with-api/${p.dossier_id}`}
                      className="text-violet-700 hover:text-violet-900 cursor-pointer"
                    >
                      {p.reference ?? p.dossier_id}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {data?.activite_recente && data.activite_recente.length > 0 && (
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-2 shadow-sm">
              <p className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                <MapPin size={12} /> Activité récente
              </p>
              {data.activite_recente.map((v, i) => (
                <div key={listKey('activite', [v.id, v.client_nom, v.date], i)} className="text-xs text-slate-700">
                  <span className="font-bold">{v.date ?? '—'}</span> — {v.client_nom ?? v.objet_visite ?? 'Activité'}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ApiSection>
  )
}
