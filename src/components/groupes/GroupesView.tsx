'use client'
import { useState } from 'react'
import { UsersRound, Calendar, Handshake } from 'lucide-react'
import { getGroupesHub } from '@/lib/groupes-hub'
import { formatFcfa } from '@/lib/utils'
import { ModuleSyntheseIA } from '@/components/modules/ModuleSyntheseIA'
import { ModuleKpiGrid } from '@/components/modules/ModuleKpiGrid'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { cn } from '@/lib/utils'

const TYPE_STYLE = {
  TONTINE: 'bg-pink-100 text-pink-800',
  SOLIDARITE: 'bg-teal-100 text-teal-800',
  GARANTIE_CROISEE: 'bg-indigo-100 text-indigo-800',
}

export function GroupesView() {
  const hub = getGroupesHub()
  const [selected, setSelected] = useState(hub.groupes[0]?.id ?? '')

  const groupe = hub.groupes.find((g) => g.id === selected) ?? hub.groupes[0]

  return (
    <>
      <ModuleSyntheseIA texte={hub.synthese_ia} titre="Synthèse IA — Groupes & solidarité" />
      <ModuleKpiGrid
        cols={6}
        items={[
          { label: 'Groupes actifs', value: String(hub.kpis.groupes_actifs), highlight: 'teal' },
          { label: 'Membres', value: String(hub.kpis.membres_total) },
          { label: 'Encours groupe', value: formatFcfa(hub.kpis.encours_groupe_fcfa) },
          { label: 'Cotisation', value: `${hub.kpis.taux_cotisation_pct}%`, highlight: 'teal' },
          { label: 'Réunions/sem.', value: String(hub.kpis.reunions_semaine) },
          { label: 'Défauts', value: String(hub.kpis.defauts_groupe), highlight: 'red' },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {hub.groupes.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelected(g.id)}
              className={cn(
                'w-full text-left bg-white rounded-xl border p-4 transition-colors duration-200 cursor-pointer',
                selected === g.id ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200 hover:border-teal-300',
              )}
            >
              <div className="flex items-center gap-2">
                <UsersRound size={18} className="text-teal-600" />
                <span className="font-bold text-slate-900">{g.nom}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{g.id} · {g.membres_count} membres</div>
              <span className={cn('inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded', TYPE_STYLE[g.type])}>{g.type.replace('_', ' ')}</span>
            </button>
          ))}
        </div>

        {groupe && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-slate-900">{groupe.nom}</h2>
                <AiBadge variant="small" label="Cohésion" confidence={groupe.score_cohesion_ia} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-slate-500">Crédit groupe</span><div className="font-bold">{formatFcfa(groupe.encours_credit_fcfa)}</div></div>
                <div><span className="text-slate-500">Épargne</span><div className="font-bold text-teal-700">{formatFcfa(groupe.encours_epargne_fcfa)}</div></div>
                <div><span className="text-slate-500">Cycle</span><div className="font-bold">{groupe.cycle_actuel}</div></div>
                <div><span className="text-slate-500">Prochaine réunion</span><div className="font-bold">{groupe.prochaine_reunion}</div></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Handshake size={16} />
                Membres
              </h3>
              <div className="space-y-2">
                {groupe.membres.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{m.nom}</div>
                      <div className="text-xs text-slate-500">{m.role} · Cotisation {formatFcfa(m.cotisation_fcfa)}</div>
                    </div>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded', m.statut_paiement === 'A_JOUR' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')}>{m.statut_paiement}</span>
                    <AiBadge variant="small" confidence={m.score_ia} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Calendar size={16} />
          Réunions à venir
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {hub.reunions_a_venir.map((r) => (
            <div key={r.id} className="border border-slate-200 rounded-lg p-4 cursor-pointer hover:border-teal-300 transition-colors">
              <div className="font-medium text-slate-900">{r.date}</div>
              <div className="text-xs text-slate-500">{r.lieu}</div>
              <ul className="mt-2 text-xs text-slate-600 space-y-1">
                {r.decisions.map((d, i) => (
                  <li key={i}>• {d}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
