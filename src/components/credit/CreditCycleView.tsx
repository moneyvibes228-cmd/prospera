'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FileSearch, Users, Banknote, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { getCreditCycleHub, ETAPE_CYCLE_ORDER, type EtapeCyclePret } from '@/lib/credit-cycle-hub'
import { formatFcfa } from '@/lib/utils'
import { ModuleSyntheseIA } from '@/components/modules/ModuleSyntheseIA'
import { ModuleKpiGrid } from '@/components/modules/ModuleKpiGrid'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { cn } from '@/lib/utils'

const ETAPE_ICON: Record<EtapeCyclePret, React.ElementType> = {
  DEMANDE: FileSearch,
  ANALYSE: FileSearch,
  COMITE: Users,
  DECAISSEMENT: Banknote,
  ECHEANCIER: Calendar,
  CLOTURE: CheckCircle2,
}

/** Cycle crédit — version mock. Voir `CreditCycleViewWithApi`. */
export function CreditCycleView() {
  const hub = getCreditCycleHub()
  const kpis = hub.kpis
  const synthese = hub.synthese_ia
  const [selected, setSelected] = useState(hub.dossiers[0]?.id ?? '')

  const dossier = hub.dossiers.find((d) => d.id === selected) ?? hub.dossiers[0]

  return (
    <>
      <ModuleSyntheseIA texte={synthese} titre="Synthèse IA — Cycle de vie prêt" />
      <ModuleKpiGrid
        cols={6}
        items={[
          { label: 'Dossiers actifs', value: String(kpis.en_cours ?? hub.kpis.en_cours) },
          { label: 'Demandes/jour', value: String(kpis.demandes_jour ?? hub.kpis.demandes_jour), highlight: 'teal' },
          { label: 'Comité semaine', value: String(kpis.comite_semaine ?? hub.kpis.comite_semaine), highlight: 'blue' },
          { label: 'Décaiss. attente', value: String(kpis.decaissements_attente ?? hub.kpis.decaissements_attente), highlight: 'orange' },
          { label: 'Clôtures/mois', value: String(kpis.clotures_mois ?? hub.kpis.clotures_mois) },
          { label: 'Délai moyen', value: `${kpis.delai_moyen_jours ?? hub.kpis.delai_moyen_jours} j`, sub: 'obj. 9 j' },
        ]}
      />

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Parcours type — 6 étapes</h3>
          <div className="text-xs text-slate-500">
            Prochain comité : <strong>{hub.comite_prochain.date}</strong> — {hub.comite_prochain.dossiers} dossiers ({formatFcfa(hub.comite_prochain.montant_total_fcfa)})
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {ETAPE_CYCLE_ORDER.map((e, i) => {
            const def = hub.etapes_definition.find((d) => d.id === e)!
            const Icon = ETAPE_ICON[e]
            return (
              <div key={e} className="flex items-center">
                <div className="flex flex-col items-center px-2 py-2 min-w-[90px]">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 mt-1 text-center">{def.label}</span>
                </div>
                {i < ETAPE_CYCLE_ORDER.length - 1 && (
                  <div className="w-6 h-0.5 bg-slate-200 flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          {hub.dossiers.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelected(d.id)}
              className={cn(
                'w-full text-left bg-white rounded-xl border p-4 transition-colors cursor-pointer',
                selected === d.id ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200 hover:border-teal-300',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-teal-700">{d.ref}</span>
                {d.bloque && <AlertCircle size={14} className="text-red-600" />}
              </div>
              <div className="font-bold text-slate-900 text-sm mt-1">{d.client}</div>
              <div className="text-xs text-slate-500">{formatFcfa(d.montant_fcfa)} · {d.etape_courante}</div>
            </button>
          ))}
          <Link href="/credit/pipeline" className="block text-center text-sm text-teal-700 hover:underline py-2 cursor-pointer">
            Voir pipeline Kanban →
          </Link>
        </div>

        {dossier && (
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-slate-900">{dossier.ref} — {dossier.client}</h2>
              <AiBadge variant="small" confidence={dossier.score_ia} />
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{dossier.classe_bceao}</span>
            </div>
            {dossier.bloque && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2">
                <AlertCircle size={16} />
                Bloqué : {dossier.motif_blocage}
              </div>
            )}

            <div className="flex flex-wrap gap-1 mb-6">
              {ETAPE_CYCLE_ORDER.map((e) => {
                const done = dossier.etapes_completees.includes(e)
                const current = dossier.etape_courante === e
                return (
                  <span
                    key={e}
                    className={cn(
                      'text-[10px] font-bold px-2 py-1 rounded',
                      done && 'bg-emerald-100 text-emerald-800',
                      current && !done && 'bg-teal-600 text-white',
                      !done && !current && 'bg-slate-100 text-slate-400',
                    )}
                  >
                    {e}
                  </span>
                )
              })}
            </div>

            <p className="text-sm p-3 bg-teal-50 border border-teal-100 rounded-lg mb-4">
              <strong>Action IA :</strong> {dossier.prochaine_action_ia}
            </p>

            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Historique</h3>
            <div className="space-y-2">
              {dossier.historique.map((h, i) => (
                <div key={i} className="flex gap-3 text-sm border-l-2 border-teal-300 pl-3 py-1">
                  <div>
                    <span className="font-bold text-slate-800">{h.etape}</span>
                    <span className="text-slate-500"> · {h.date} · {h.acteur}</span>
                    {h.commentaire && <div className="text-slate-600 text-xs mt-0.5">{h.commentaire}</div>}
                    {h.duree_h != null && <div className="text-slate-400 text-xs">{h.duree_h}h</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
