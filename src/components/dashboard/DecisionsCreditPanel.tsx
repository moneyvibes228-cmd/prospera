'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts'
import { FileText, CheckCircle2, XCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import { DOSSIERS_CREDIT_STATS } from '@/lib/mockMicrofinance'
import { formatFcfa } from '@/lib/utils'
import { AiBadge } from './AiBadge'

const SEVERITY_BG: Record<string, string> = {
  CRITIQUE: 'bg-red-50 border-red-100 text-red-700',
  HAUTE:    'bg-orange-50 border-orange-100 text-orange-700',
  NORMALE:  'bg-slate-50 border-slate-100 text-slate-700',
}

export function DecisionsCreditPanel() {
  const d = DOSSIERS_CREDIT_STATS

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Décisions crédit — {d.mois_courant}</h3>
          <AiBadge variant="small" label="Délai moyen 4.2j" />
        </div>
        <div className="text-xs text-slate-500">
          {d.total_soumis_mois} dossiers soumis · taux approbation <strong className="text-green-700">{d.taux_approbation_pct}%</strong>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* KPIs décisions */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-green-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 size={12} className="text-green-600" />
              <div className="text-xs text-green-700 font-medium">Approuvés</div>
            </div>
            <div className="text-2xl font-black text-green-800">{d.approuves}</div>
            <div className="text-[10px] text-green-600">{d.taux_approbation_pct}%</div>
          </div>
          <div className="p-3 bg-red-50 rounded-xl border border-red-100">
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle size={12} className="text-red-600" />
              <div className="text-xs text-red-700 font-medium">Refusés</div>
            </div>
            <div className="text-2xl font-black text-red-800">{d.refuses}</div>
            <div className="text-[10px] text-red-600">{d.taux_rejet_pct}%</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText size={12} className="text-orange-600" />
              <div className="text-xs text-orange-700 font-medium">En attente</div>
            </div>
            <div className="text-2xl font-black text-orange-800">{d.en_attente}</div>
            <div className="text-[10px] text-orange-600">à traiter</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-1.5 mb-1">
              <RefreshCw size={12} className="text-blue-600" />
              <div className="text-xs text-blue-700 font-medium">Restructurés</div>
            </div>
            <div className="text-2xl font-black text-blue-800">{d.restructures}</div>
            <div className="text-[10px] text-blue-600">étalements</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={12} className="text-slate-600" />
              <div className="text-xs text-slate-700 font-medium">Contentieux</div>
            </div>
            <div className="text-2xl font-black text-slate-800">{d.contentieux}</div>
            <div className="text-[10px] text-slate-600">recouvrement légal</div>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
            <div className="text-xs text-teal-700 font-medium">Délai moyen</div>
            <div className="text-2xl font-black text-teal-800">{d.delai_moyen_traitement_jours}j</div>
            <div className="text-[10px] text-teal-600">obj. {d.delai_objectif_jours}j</div>
          </div>
        </div>

        {/* Par tranche de montant — portefeuille actif (≠ flux décisions du mois) */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Répartition par tranche de montant</h4>
            <span className="text-xs text-slate-500">
              Portefeuille actif — <strong className="text-slate-800">{d.portefeuille_actif} prêts</strong>
              {' · '}
              <strong className="text-slate-800">{formatFcfa(d.encours_portefeuille_fcfa)}</strong> encours
            </span>
          </div>
          <div className="space-y-2">
            {d.par_tranche_montant.map(t => (
              <div key={t.tranche} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-sm font-bold text-slate-800">{t.tranche}</span>
                    <span className="text-xs text-slate-500">{t.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-600"><strong className="text-slate-800">{t.count}</strong> dossiers</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-bold text-slate-800">{formatFcfa(t.encours)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="text-center p-1.5 bg-white rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-400">Approbation</div>
                    <div className={`text-sm font-bold ${t.taux_approbation >= 70 ? 'text-green-600' : t.taux_approbation >= 50 ? 'text-orange-600' : 'text-red-600'}`}>{t.taux_approbation}%</div>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-400">PAR 30j</div>
                    <div className={`text-sm font-bold ${t.taux_par > 10 ? 'text-red-600' : t.taux_par > 8 ? 'text-orange-600' : 'text-green-600'}`}>{t.taux_par}%</div>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-400">Ticket moy.</div>
                    <div className="text-sm font-bold text-slate-700">{formatFcfa(t.encours / t.count)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Motifs de rejet + Évolution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
              <XCircle size={11} className="text-red-500" /> Top motifs de rejet
            </h4>
            <div className="space-y-1.5">
              {d.motifs_rejet.map((m, i) => (
                <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg border ${SEVERITY_BG[m.severity]}`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[10px] font-bold w-5 text-center">#{i + 1}</span>
                    <span className="text-xs font-medium truncate">{m.motif}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className="text-xs font-bold">{m.count}</span>
                    <span className="text-[10px] opacity-70">({m.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
              <RefreshCw size={11} className="text-blue-500" /> Motifs de restructuration
            </h4>
            <div className="space-y-1.5">
              {d.motifs_restructuration.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-blue-700 w-5 text-center">#{i + 1}</span>
                    <span className="text-xs font-medium text-blue-700 truncate">{m.motif}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className="text-xs font-bold text-blue-800">{m.count}</span>
                    <span className="text-[10px] text-blue-500">({m.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Évolution sur 6 mois */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Évolution décisions — 6 derniers mois</h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={d.evolution_decisions_6mois} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="soumis"     name="Soumis"    stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="approuves" name="Approuvés" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="refuses"    name="Refusés"  stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
