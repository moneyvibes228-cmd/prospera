'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, TrendingUp, Flame, RefreshCcw, Award, Trophy, ChevronRight,
} from 'lucide-react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { PIPELINE_COMMERCIAL } from '@/lib/mockMicrofinance'
import {
  COMMERCIAL_DC_TOTAUX,
  EVOLUTION_ACQUISITION_12_MOIS,
  PRODUITS_TOP_VENTES,
  totauxProduitsCredit,
} from '@/lib/commercial-dc-hub'
import { PERFORMANCE_AGENCES_COMMERCIAL, getClientInactifByNom } from '@/lib/dc-vue360'
import { AiBadge } from '../AiBadge'
import { KpiCardWithSparkline } from '../KpiCardWithSparkline'
import { formatFcfa } from '@/lib/utils'

const TENDANCE_STYLE: Record<string, string> = {
  HAUSSE: 'text-green-600',
  STABLE: 'text-slate-500',
  BAISSE: 'text-red-600',
}

export function OngletCommercialDC() {
  const router = useRouter()
  const [vueComp, setVueComp] = useState<'AGENCE' | 'REGION' | 'SUPERVISEUR'>('AGENCE')
  const { funnel, prospects_chauds, clients_inactifs_a_reactiver,
          taux_conversion_global_pct, duree_cycle_moyen_jours, valeur_pipeline_actif,
          valeur_signee_mois, objectif_signature_mois, atteinte_objectif_pct } = PIPELINE_COMMERCIAL
  const produits_top_ventes = PRODUITS_TOP_VENTES
  const evolution_acquisition_12_mois = EVOLUTION_ACQUISITION_12_MOIS
  const totauxCredit = totauxProduitsCredit()

  const maxFunnel = funnel[0].count

  const handleClientInactifClick = (nomClient: string) => {
    const fiche = getClientInactifByNom(nomClient)
    if (fiche) router.push(`/dashboard/commercial/clients/${fiche.id}`)
  }

  return (
    <div className="space-y-5">

      {/* ── KPIs Commercial (4 cards) ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-700">KPIs Commercial & Acquisition</h2>
          <AiBadge variant="small" label="Pilotage DC" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCardWithSparkline
            title="Nouveaux clients mois"
            value={COMMERCIAL_DC_TOTAUX.nouveaux_clients}
            unit="clients"
            variation={12.0}
            variationLabel="vs avril"
            sparkline={[19, 22, 24, 26, 25, 22, 24, 26, COMMERCIAL_DC_TOTAUX.nouveaux_clients]}
            colorScheme="green"
            badge="Acquisition"
          />
          <KpiCardWithSparkline
            title="Leads générés"
            value={COMMERCIAL_DC_TOTAUX.leads}
            unit="leads"
            variation={10.5}
            variationLabel={`Conv. ${COMMERCIAL_DC_TOTAUX.taux_conversion_pct}%`}
            sparkline={[56, 64, 68, 71, 75, 76, 68, 71, COMMERCIAL_DC_TOTAUX.leads]}
            colorScheme="orange"
            badge="Funnel"
          />
          <KpiCardWithSparkline
            title="Pipeline valorisé"
            value={valeur_pipeline_actif}
            unit="FCFA"
            variation={8.4}
            variationLabel={`Cycle moy. ${duree_cycle_moyen_jours}j`}
            sparkline={[28, 30, 31, 32, 33, 34, 34.8, 35.2, 35.6]}
            colorScheme="blue"
            badge="Pipeline"
            format="fcfa"
          />
          <KpiCardWithSparkline
            title="Objectif mois"
            value={`${atteinte_objectif_pct}%`}
            variation={-25.3}
            variationLabel={`${formatFcfa(valeur_signee_mois)} / ${formatFcfa(objectif_signature_mois)}`}
            sparkline={[62, 68, 71, 73, 74, 74.5, 74.5, 74.7, 74.7]}
            colorScheme="red"
            badge="Performance"
          />
        </div>
      </div>

      {/* FUNNEL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShoppingCart size={15} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900">Funnel commercial</h3>
            <AiBadge variant="small" label={`Conversion globale ${taux_conversion_global_pct}%`} />
          </div>
          <span className="text-xs text-slate-400">Cycle moyen {duree_cycle_moyen_jours}j</span>
        </div>
        <div className="p-5">
          <div className="space-y-2">
            {funnel.map((step, i) => {
              const widthPct = (step.count / maxFunnel) * 100
              const colors = ['#3b82f6', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#16a34a']
              return (
                <div key={step.etape} className="flex items-center gap-3">
                  <div className="w-32 flex-shrink-0">
                    <div className="text-xs font-bold text-slate-700">{step.etape}</div>
                    <div className="text-[10px] text-slate-400">Étape {i + 1}</div>
                  </div>
                  <div className="flex-1 relative">
                    <div className="bg-slate-100 rounded-lg h-12 overflow-hidden">
                      <div className="h-full rounded-lg flex items-center justify-between px-3 text-white transition-all"
                           style={{ width: `${widthPct}%`, backgroundColor: colors[i] }}>
                        <div>
                          <div className="text-lg font-black">{step.count}</div>
                          <div className="text-[10px] opacity-90">{formatFcfa(step.valeur_potentielle)}</div>
                        </div>
                        {i > 0 && (
                          <div className="text-right">
                            <div className="text-xs font-bold">{step.conversion_vs_prev}%</div>
                            <div className="text-[9px] opacity-80">vs étape préc.</div>
                          </div>
                        )}
                      </div>
                    </div>
                    {i < funnel.length - 1 && (
                      <div className="absolute -bottom-1 right-2 text-[9px] text-red-500 font-bold bg-white px-1 rounded">
                        -{funnel[i + 1].drop_pct}% drop
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* PROSPECTS CHAUDS — pleine largeur */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={15} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-slate-900">Prospects chauds — Top 8</h3>
            <AiBadge variant="small" label="Scoring IA" />
          </div>
          <span className="text-xs text-slate-400">{prospects_chauds.length} prospects</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                <th className="text-left px-3 py-3 font-bold">Prospect</th>
                <th className="text-left px-3 py-3 font-bold">Besoin</th>
                <th className="text-right px-3 py-3 font-bold">Montant</th>
                <th className="text-center px-3 py-3 font-bold">Score IA</th>
                <th className="text-left px-3 py-3 font-bold">Prochaine action</th>
                <th className="text-left px-3 py-3 font-bold">Agent · Délai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {prospects_chauds.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-slate-800 text-xs">{p.nom}</div>
                    <div className="text-[10px] text-slate-400">{p.id} · {p.agence}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-700">{p.besoin}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold text-slate-800">{formatFcfa(p.montant)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      p.score_ia >= 80 ? 'bg-red-100 text-red-700' :
                      p.score_ia >= 75 ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{p.score_ia}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-teal-700 font-semibold">{p.prochaine_action}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-[11px] text-slate-700">{p.agent}</div>
                    <div className="text-[10px] text-orange-600 font-bold">⏱ {p.delai}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CLIENTS INACTIFS — cliquables */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCcw size={15} className="text-purple-600" />
            <h3 className="text-sm font-semibold text-slate-900">Clients inactifs à réactiver</h3>
            <AiBadge variant="small" label="Cliquez pour fiche client" />
          </div>
          <span className="text-xs text-slate-400">Potentiel reconquête {formatFcfa(clients_inactifs_a_reactiver.reduce((s, c) => s + c.encours_passe, 0))}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-bold">Client</th>
                <th className="text-left px-3 py-3 font-bold">Agence · Agent</th>
                <th className="text-left px-3 py-3 font-bold">Dernière activité</th>
                <th className="text-right px-3 py-3 font-bold">Encours passé</th>
                <th className="text-center px-3 py-3 font-bold">Proba IA</th>
                <th className="text-left px-3 py-3 font-bold">Canal recommandé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clients_inactifs_a_reactiver.map((c, i) => {
                const fiche = getClientInactifByNom(c.client)
                const hasFiche = !!fiche
                return (
                  <tr
                    key={i}
                    onClick={() => hasFiche && handleClientInactifClick(c.client)}
                    className={`transition-colors ${hasFiche ? 'hover:bg-purple-50 cursor-pointer' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 text-xs">{c.client}</span>
                        {hasFiche && <ChevronRight size={14} className="text-purple-400" />}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">
                      {fiche ? (
                        <>
                          <div>{fiche.agence}</div>
                          <div className="text-[10px] text-slate-400">{fiche.agent}</div>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{c.derniere_activite}</td>
                    <td className="px-3 py-2.5 text-right text-xs font-bold text-slate-700">{formatFcfa(c.encours_passe)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-14 bg-slate-100 rounded-full h-1.5">
                          <div className="h-full rounded-full bg-purple-500" style={{ width: `${c.probabilite_reactivation}%` }} />
                        </div>
                        <span className="text-xs font-bold text-purple-700">{c.probabilite_reactivation}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-teal-700 font-semibold">→ {c.canal_recommande}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRODUITS + ÉVOLUTION */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Trophy size={15} className="text-amber-600" />
              <h3 className="text-sm font-semibold text-slate-900">Top produits vendus</h3>
            </div>
            <span className="text-[10px] text-slate-500">
              Crédit : {totauxCredit.ventes} contrats · {formatFcfa(totauxCredit.montant)}
            </span>
          </div>
          <div className="p-4 space-y-2.5">
            {produits_top_ventes.map((p, i) => {
              const maxMontant = Math.max(...produits_top_ventes.map(x => x.montant))
              const widthPct = (p.montant / maxMontant) * 100
              return (
                <div key={p.produit}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${
                        i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>{i + 1}</div>
                      <span className="text-xs font-semibold text-slate-700">{p.produit}</span>
                      {p.type === 'EPARGNE' && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-purple-100 text-purple-700">Épargne</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800">{p.ventes_mois}</span>
                      <span className={`text-[10px] ml-2 font-bold ${p.croissance_mom_pct > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {p.croissance_mom_pct > 0 ? '+' : ''}{p.croissance_mom_pct}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: `${widthPct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 w-20 text-right">{formatFcfa(p.montant)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Marge {p.marge_pct}%</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-green-600" />
              <h3 className="text-sm font-semibold text-slate-900">Évolution acquisition — 12 mois</h3>
            </div>
            <AiBadge variant="small" label="Tendance positive" />
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={evolution_acquisition_12_mois} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="leads" name="Leads" fill="#fb923c" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="left" dataKey="nouveaux_clients" name="Clients acquis" fill="#16a34a" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="taux_conversion" name="Conv. (%)" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* PERFORMANCE COMMERCIALE — tableau enrichi */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Award size={15} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900">Performance commerciale — Vue comparative</h3>
            <AiBadge variant="small" label="Détail par agence" />
          </div>
          <div className="flex gap-1">
            {(['AGENCE', 'REGION', 'SUPERVISEUR'] as const).map(v => (
              <button key={v} onClick={() => setVueComp(v)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors ${
                  vueComp === v ? 'bg-teal-100 text-teal-700' : 'text-slate-500 hover:bg-slate-100'
                }`}>{v}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          {vueComp === 'AGENCE' && (
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-bold sticky left-0 bg-slate-50">Agence</th>
                  <th className="text-right px-2 py-3 font-bold">Emp.</th>
                  <th className="text-right px-2 py-3 font-bold">Nouv.</th>
                  <th className="text-right px-2 py-3 font-bold">Leads</th>
                  <th className="text-right px-2 py-3 font-bold">Conv.</th>
                  <th className="text-right px-2 py-3 font-bold">Encours</th>
                  <th className="text-right px-2 py-3 font-bold">Collecte</th>
                  <th className="text-right px-2 py-3 font-bold">% obj.</th>
                  <th className="text-right px-2 py-3 font-bold">Pipeline</th>
                  <th className="text-right px-2 py-3 font-bold">Sign.</th>
                  <th className="text-right px-2 py-3 font-bold">Cycle</th>
                  <th className="text-right px-2 py-3 font-bold">Remb.</th>
                  <th className="text-right px-2 py-3 font-bold">Score</th>
                  <th className="text-center px-2 py-3 font-bold">Tend.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {PERFORMANCE_AGENCES_COMMERCIAL.map(a => {
                  const collectePct = Math.round((a.collecte_mois / a.collecte_objectif) * 100)
                  const signPct = Math.round((a.signatures_mois / a.objectif_signatures) * 100)
                  return (
                    <tr key={a.agence_id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 sticky left-0 bg-white">
                        <div className="text-xs font-semibold text-slate-800">{a.agence}</div>
                        <div className="text-[10px] text-slate-400">{a.responsable}</div>
                      </td>
                      <td className="px-2 py-2.5 text-right text-xs">{a.emprunteurs}</td>
                      <td className="px-2 py-2.5 text-right text-xs font-bold text-green-700">+{a.nouveaux_mois}</td>
                      <td className="px-2 py-2.5 text-right text-xs">{a.leads_mois}</td>
                      <td className="px-2 py-2.5 text-right text-xs font-bold text-blue-700">{a.conv_leads_pct}%</td>
                      <td className="px-2 py-2.5 text-right text-xs font-bold">{formatFcfa(a.encours)}</td>
                      <td className="px-2 py-2.5 text-right text-xs text-teal-700 font-semibold">{formatFcfa(a.collecte_mois)}</td>
                      <td className="px-2 py-2.5 text-right">
                        <span className={`text-xs font-bold ${collectePct >= 90 ? 'text-green-600' : collectePct >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                          {collectePct}%
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right text-xs">{formatFcfa(a.pipeline_valeur)}</td>
                      <td className="px-2 py-2.5 text-right">
                        <div className="text-xs font-bold">{a.signatures_mois}/{a.objectif_signatures}</div>
                        <div className={`text-[9px] font-bold ${signPct >= 80 ? 'text-green-600' : 'text-orange-600'}`}>{signPct}%</div>
                      </td>
                      <td className="px-2 py-2.5 text-right text-xs text-slate-600">{a.cycle_moyen_jours}j</td>
                      <td className="px-2 py-2.5 text-right text-xs">{a.taux_remboursement}%</td>
                      <td className="px-2 py-2.5 text-right">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          a.score_commercial >= 85 ? 'bg-green-100 text-green-700' :
                          a.score_commercial >= 70 ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>{a.score_commercial}</span>
                      </td>
                      <td className={`px-2 py-2.5 text-center text-[10px] font-bold ${TENDANCE_STYLE[a.tendance]}`}>
                        {a.tendance === 'HAUSSE' ? '↑' : a.tendance === 'BAISSE' ? '↓' : '→'}
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-teal-50/60 font-bold border-t border-teal-100">
                  <td className="px-4 py-2.5 sticky left-0 bg-teal-50/60 text-xs text-teal-900">Réseau (5 agences)</td>
                  <td className="px-2 py-2.5 text-right text-xs">—</td>
                  <td className="px-2 py-2.5 text-right text-xs text-green-800">+{COMMERCIAL_DC_TOTAUX.nouveaux_clients}</td>
                  <td className="px-2 py-2.5 text-right text-xs">{COMMERCIAL_DC_TOTAUX.leads}</td>
                  <td className="px-2 py-2.5 text-right text-xs text-blue-800">{COMMERCIAL_DC_TOTAUX.taux_conversion_pct}%</td>
                  <td className="px-2 py-2.5 text-right text-xs" colSpan={9}>
                    Signatures crédit : {COMMERCIAL_DC_TOTAUX.signatures} · {formatFcfa(COMMERCIAL_DC_TOTAUX.valeur_signee_fcfa)} débloqués
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {vueComp === 'REGION' && (
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { region: 'Région Maritime',  agences: ['Lomé Centre', 'Bè Kpota', 'Tsévié'],     clients: 138, encours: 42_400_000, collecte: 38_200_000, conv: 36 },
                { region: 'Région Plateaux',  agences: ['Tabligbo', 'Kpalimé'],                   clients: 50,  encours: 18_780_000, collecte: 16_400_000, conv: 32 },
                { region: 'Région Savanes',   agences: ['(en projet)'],                            clients: 0,   encours: 0,           collecte: 0,           conv: 0  },
              ].map(r => (
                <div key={r.region} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-800">{r.region}</h4>
                    <span className="text-[10px] text-slate-500">{r.agences.length} agences</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500">Clients :</span> <span className="font-bold">{r.clients}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Encours :</span> <span className="font-bold">{formatFcfa(r.encours)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Collecte :</span> <span className="font-bold text-teal-700">{formatFcfa(r.collecte)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Conv. :</span> <span className="font-bold text-blue-700">{r.conv}%</span></div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-400">
                    {r.agences.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {vueComp === 'SUPERVISEUR' && (
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { sup: 'Akossiwa Mensah', zone: 'Maritime',  agents: 5, encours_gere: 24_400_000, conversion: 38, score: 92, badge: 'OR' },
                  { sup: 'Komla Adjovi',     zone: 'Plateaux',  agents: 3, encours_gere: 14_800_000, conversion: 34, score: 84, badge: 'ARGENT' },
                  { sup: 'Yawa Dossou',      zone: 'Maritime',  agents: 4, encours_gere: 18_600_000, conversion: 28, score: 71, badge: 'BRONZE' },
                  { sup: 'Edem Kpadé',       zone: 'Centre',    agents: 2, encours_gere: 3_400_000,  conversion: 22, score: 58, badge: '' },
                ].map(s => (
                  <div key={s.sup} className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                          {s.sup.split(' ').map(p => p[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{s.sup}</div>
                          <div className="text-[10px] text-slate-400">Zone {s.zone} · {s.agents} agents</div>
                        </div>
                      </div>
                      {s.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          s.badge === 'OR' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                          s.badge === 'ARGENT' ? 'bg-slate-200 text-slate-600 border-slate-300' :
                          'bg-orange-100 text-orange-700 border-orange-300'
                        }`}>{s.badge}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase">Encours</div>
                        <div className="font-bold text-slate-800">{formatFcfa(s.encours_gere)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase">Conv. leads</div>
                        <div className="font-bold text-blue-700">{s.conversion}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase">Score</div>
                        <div className={`font-bold ${s.score >= 85 ? 'text-green-600' : s.score >= 70 ? 'text-orange-600' : 'text-red-600'}`}>{s.score}/100</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
