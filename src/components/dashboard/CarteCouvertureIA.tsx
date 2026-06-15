'use client'
import { MapPin, Target, AlertTriangle, TrendingUp } from 'lucide-react'
import { AiBadge } from './AiBadge'
import { AgenceMap } from './AgenceMap'
import { CARTE_COUVERTURE_IA } from '@/lib/dg-vue360'

interface Props {
  selectedAgenceId: string | null
  titre: string
}

export function CarteCouvertureIA({ selectedAgenceId, titre }: Props) {
  const ia = CARTE_COUVERTURE_IA

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-teal-600 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Carte de couverture — {titre}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Générée {ia.date_generation}</p>
            </div>
            <AiBadge variant="small" label="Analyse territoriale" confidence={85} />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center px-3 py-1.5 bg-teal-50 border border-teal-100 rounded-lg">
              <div className="text-lg font-black text-teal-700">{ia.score_couverture}/100</div>
              <div className="text-[9px] text-teal-600 font-medium uppercase">Score couverture</div>
            </div>
            <div className="text-center px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg">
              <div className="text-lg font-black text-indigo-700">{ia.penetration_moyenne_pct}%</div>
              <div className="text-[9px] text-indigo-600 font-medium uppercase">Pénétration moy.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analyse IA */}
      <div className="px-5 py-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <Target size={12} className="text-teal-300" />
          <h4 className="text-xs font-bold text-teal-200 uppercase tracking-wider">{ia.titre}</h4>
        </div>
        <p className="text-sm text-slate-100 leading-relaxed mb-4">{ia.synthese}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ia.piliers.map((p, i) => (
            <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-[11px] font-bold text-teal-200 mb-1">{p.titre}</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{p.contenu}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lecture par agence */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Lecture IA par agence</div>
        <div className="flex flex-wrap gap-2">
          {ia.par_agence.map(a => (
            <div key={a.agence_id} className="flex-1 min-w-[140px] max-w-[200px] p-2.5 bg-white rounded-lg border border-slate-200">
              <div className="text-xs font-bold text-slate-800">{a.nom}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{a.clients} clients · Rayon {a.rayon_km} km</div>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-[10px] font-bold ${a.par > 10 ? 'text-red-600' : a.par > 8 ? 'text-orange-600' : 'text-green-600'}`}>PAR {a.par}%</span>
                <span className="text-[10px] text-slate-400">Pén. {a.penetration_pct}%</span>
              </div>
              <p className="text-[9px] text-teal-700 mt-1 leading-snug">{a.commentaire_ia}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4">
        <AgenceMap selectedAgenceId={selectedAgenceId} />
      </div>

      <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-amber-800">
          <AlertTriangle size={12} />
          <span><strong>{ia.zones_sous_couvertes}</strong> zones sous-couvertes identifiées</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <TrendingUp size={12} className="text-teal-600" />
          <span><strong>{ia.clients_cartographies}</strong> clients cartographiés</span>
        </div>
        <span className="text-slate-500">Potentiel estimé zones IA : <strong className="text-teal-700">~18M FCFA</strong> encours / 12 mois</span>
      </div>
    </div>
  )
}
