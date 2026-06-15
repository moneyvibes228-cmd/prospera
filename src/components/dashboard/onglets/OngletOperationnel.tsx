'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity, ShieldOff, AlertOctagon, FileEdit,
  Smartphone, Server, ChevronRight,
} from 'lucide-react'
import { CONTROLE_INTERNE } from '@/lib/mockMicrofinance'
import { getModificationIdByIndex } from '@/lib/operationnel-vue360'
import { TransactionsStats } from '../TransactionsStats'
import { AnalyseComportementAgencesIA } from '../AnalyseComportementAgencesIA'
import { ComptesDormantsPanel } from '../ComptesDormantsPanel'
import { EpargneStats } from '../EpargneStats'
import { AiBadge } from '../AiBadge'
import { KpiCardWithSparkline } from '../KpiCardWithSparkline'
import { formatFcfa } from '@/lib/utils'

const STATUT_TX_BADGE: Record<string, string> = {
  EN_INVESTIGATION: 'bg-orange-100 text-orange-700',
  RESOLUE:          'bg-green-100 text-green-700',
  BLOQUEE:          'bg-red-100 text-red-700',
  APPROUVE_DEROG:   'bg-blue-100 text-blue-700',
  EN_REVUE:         'bg-yellow-100 text-yellow-700',
}

const CRITICITE_COLOR: Record<string, string> = {
  CRITIQUE: 'bg-red-50 border-red-200 text-red-700',
  HAUTE:    'bg-orange-50 border-orange-200 text-orange-700',
  MOYENNE:  'bg-yellow-50 border-yellow-200 text-yellow-700',
}

export function OngletOperationnel() {
  const router = useRouter()
  const [filtreTxStatut, setFiltreTxStatut] = useState<string | null>(null)
  const { transactions_suspectes, transactions_suspectes_total, transactions_suspectes_montant,
          tentatives_fraude, total_tentatives_neutralisees, total_tentatives_actives,
          depassements_plafond, modifications_sensibles,
          disponibilite_systeme } = CONTROLE_INTERNE

  const txAffichees = filtreTxStatut
    ? transactions_suspectes.filter(t => t.statut === filtreTxStatut)
    : transactions_suspectes

  return (
    <div className="space-y-5">

      {/* ── KPIs Opérationnels ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-700">KPIs Opérationnels & Contrôle interne</h2>
          <AiBadge variant="small" label="DO + Audit" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCardWithSparkline
            title="Disponibilité système"
            value={`${disponibilite_systeme.uptime_pct_mois}%`}
            variation={0.4}
            variationLabel={`${disponibilite_systeme.incidents_majeurs + disponibilite_systeme.incidents_mineurs} incidents`}
            sparkline={[99.1, 99.2, 99.3, 99.4, 99.4, 99.3, 99.4, 99.5, 99.4]}
            colorScheme="green"
            badge="Uptime"
          />
          <KpiCardWithSparkline
            title="Temps réponse moyen"
            value={disponibilite_systeme.temps_reponse_moyen_ms}
            unit="ms"
            variation={-8.2}
            variationLabel="vs avril"
            sparkline={[380, 360, 350, 340, 335, 328, 325, 322, 320]}
            colorScheme="blue"
            invertVariation
            badge="Performance"
          />
          <KpiCardWithSparkline
            title="Tx suspectes"
            value={transactions_suspectes_total}
            unit={`· ${formatFcfa(transactions_suspectes_montant)}`}
            variation={-33.3}
            variationLabel="vs avril (18→12)"
            sparkline={[22, 20, 18, 16, 15, 14, 13, 12, 12]}
            colorScheme="orange"
            invertVariation
            badge="Fraude"
          />
          <KpiCardWithSparkline
            title="Tentatives fraude"
            value={`${total_tentatives_neutralisees + total_tentatives_actives}`}
            unit={`(${total_tentatives_neutralisees} neutralisées)`}
            variation={-12.5}
            variationLabel={`${total_tentatives_actives} actives`}
            sparkline={[14, 13, 12, 11, 11, 10, 10, 10, 10]}
            colorScheme="red"
            invertVariation
            badge="Sécurité"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          ACTIVITÉ RÉSEAU — Transactions
         ═══════════════════════════════════════════════════ */}
      <TransactionsStats />

      <AnalyseComportementAgencesIA />

      {/* ═══════════════════════════════════════════════════
          TRANSACTIONS SUSPECTES — Audit interne
         ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldOff size={15} className="text-red-600" />
            <h3 className="text-sm font-semibold text-slate-900">Transactions suspectes</h3>
            <AiBadge variant="small" label="Cliquez pour fiche détail" />
          </div>
          <div className="flex gap-1">
            {['EN_INVESTIGATION', 'RESOLUE', 'BLOQUEE'].map(s => (
              <button key={s}
                onClick={() => setFiltreTxStatut(prev => prev === s ? null : s)}
                className={`text-[10px] font-bold px-2 py-1 rounded ${
                  filtreTxStatut === s ? STATUT_TX_BADGE[s] : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>{s.replaceAll('_', ' ')}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-bold">ID · Date</th>
                <th className="text-left px-3 py-3 font-bold">Client</th>
                <th className="text-right px-3 py-3 font-bold">Montant</th>
                <th className="text-left px-3 py-3 font-bold">Motif</th>
                <th className="text-center px-3 py-3 font-bold">Score</th>
                <th className="text-center px-3 py-3 font-bold">Statut</th>
                <th className="text-left px-3 py-3 font-bold">Agent · Agence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {txAffichees.map(t => (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/dashboard/operationnel/transactions/${t.id}`)}
                  className="hover:bg-red-50 cursor-pointer transition-colors group"
                >
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-1">
                      <div className="text-xs font-mono font-semibold text-slate-800 group-hover:text-red-800">{t.id}</div>
                      <ChevronRight size={12} className="text-slate-300 group-hover:text-red-500 opacity-0 group-hover:opacity-100" />
                    </div>
                    <div className="text-[10px] text-slate-400">{t.date}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-700">{t.client}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold text-red-700">{formatFcfa(t.montant)}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{t.motif}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      t.score_fraude >= 80 ? 'bg-red-100 text-red-700' :
                      t.score_fraude >= 70 ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{t.score_fraude}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUT_TX_BADGE[t.statut]}`}>
                      {t.statut.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-[11px] text-slate-700">{t.agent}</div>
                    <div className="text-[10px] text-slate-400">{t.agence}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          TENTATIVES FRAUDE + DÉPASSEMENTS PLAFOND
         ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-orange-200 shadow-sm">
          <div className="px-5 py-4 border-b border-orange-100 flex items-center gap-2 bg-orange-50">
            <AlertOctagon size={15} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-orange-900">Tentatives de fraude</h3>
            <AiBadge variant="small" label={`${total_tentatives_neutralisees} neutralisées`} />
          </div>
          <div className="divide-y divide-slate-50">
            {tentatives_fraude.map((t, i) => {
              const neutralisationPct = t.count > 0 ? (t.neutralisees / t.count) * 100 : 0
              return (
                <div key={i} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{t.type}</span>
                    <span className="text-xs font-bold text-orange-700">{t.count}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mb-1.5">Dernière : {t.derniere_date}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className={`h-full rounded-full ${neutralisationPct === 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                           style={{ width: `${neutralisationPct}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold ${neutralisationPct === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                      {t.neutralisees}/{t.count} neutralisées
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <AlertOctagon size={15} className="text-red-600" />
            <h3 className="text-sm font-semibold text-slate-900">Dépassements de plafond</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-bold">Client</th>
                  <th className="text-right px-3 py-3 font-bold">Demande</th>
                  <th className="text-right px-3 py-3 font-bold">Plafond</th>
                  <th className="text-right px-3 py-3 font-bold">Dépassement</th>
                  <th className="text-center px-3 py-3 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {depassements_plafond.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5">
                      <div className="text-xs font-semibold text-slate-800">{d.client}</div>
                      <div className="text-[10px] text-slate-400">{d.agent} · {d.date}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs font-bold text-slate-800">{formatFcfa(d.montant)}</td>
                    <td className="px-3 py-2.5 text-right text-xs text-slate-500">{formatFcfa(d.plafond)}</td>
                    <td className="px-3 py-2.5 text-right text-xs font-bold text-orange-700">+{formatFcfa(d.depassement)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUT_TX_BADGE[d.statut]}`}>
                        {d.statut.replaceAll('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════
          COMPTES DORMANTS + MODIFICATIONS SENSIBLES
         ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-12 lg:col-span-5">
          <ComptesDormantsPanel />
        </div>

        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileEdit size={15} className="text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Audit trail — Modifications sensibles</h3>
            <AiBadge variant="small" label="Cliquez pour détail" />
          </div>
          <div className="divide-y divide-slate-50 max-h-[460px] overflow-auto">
            {modifications_sensibles.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => router.push(`/dashboard/operationnel/modifications/${getModificationIdByIndex(i)}`)}
                className={`w-full p-3.5 hover:bg-slate-100 text-left transition-colors group ${!m.justifie ? 'bg-red-50/30' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-400">{m.date}</span>
                  <span className="text-[11px] font-bold text-slate-700">{m.user}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-auto ${
                    m.criticite === 'CRITIQUE' ? 'bg-red-100 text-red-700' :
                    m.criticite === 'HAUTE' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{m.criticite}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    m.justifie ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>{m.justifie ? '✓ Justifié' : '✗ À vérifier'}</span>
                </div>
                <p className="text-xs text-slate-800 font-semibold">{m.action}</p>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                  <span><span className="text-red-600">{m.avant}</span> → <span className="text-green-600">{m.apres}</span></span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600 shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════
          ÉPARGNE COMPLÈTE
         ═══════════════════════════════════════════════════ */}
      <EpargneStats />

      {/* ═══════════════════════════════════════════════════
          INCIDENTS SYSTÈME
         ═══════════════════════════════════════════════════ */}
      {disponibilite_systeme.pannes_mobile_money.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Server size={15} className="text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Incidents Mobile Money — Surveillance</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {disponibilite_systeme.pannes_mobile_money.map((p, i) => (
              <div key={i} className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone size={12} className="text-orange-600" />
                  <span className="text-xs font-bold text-orange-800">{p.operateur}</span>
                </div>
                <div className="text-[11px] text-slate-600">Date : {p.date}</div>
                <div className="text-[11px] text-slate-600">Durée : {p.duree_min} min</div>
                <div className="text-[11px] font-bold text-orange-700 mt-1">Impact : {p.impact}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
