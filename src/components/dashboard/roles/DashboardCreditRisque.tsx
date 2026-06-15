'use client'
import { useState } from 'react'
import { FileText, TrendingDown, AlertTriangle, Smartphone, CheckCircle2, Users, Award, ArrowRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { MOCK_CREDIT_RISQUE, OBJECTIFS_CREDIT_RISQUE } from '@/lib/mockDataByRole'
import { AGENCES } from '@/lib/agences'
import { AiInsightPanel } from '../AiInsightPanel'
import { AiBadge } from '../AiBadge'
import { KpiCard } from '../KpiCard'
import { formatFcfa } from '@/lib/utils'
import { ObjectifsPanel } from '../ObjectifsPanel'

const STAGE_LABELS: Record<string, string> = {
  PROSPECTION:'Prosp.', DEMANDE:'Demande', EVALUATION:'Éval.',
  APPROBATION:'Appro.', DECAISSEMENT:'Décais.', REMBOURSEMENT:'Remb.', CLOTURE:'Clôture',
}

const STAGE_BADGE: Record<string, string> = {
  APPROBATION:  'bg-yellow-100 text-yellow-700',
  EVALUATION:   'bg-orange-100 text-orange-700',
  DEMANDE:      'bg-blue-100 text-blue-700',
  DECAISSEMENT: 'bg-purple-100 text-purple-700',
}

export function DashboardCreditRisque() {
  const d = MOCK_CREDIT_RISQUE
  const [vue, setVue] = useState<'credit' | 'risque' | 'agences'>('credit')

  return (
    <div className="space-y-5">
      <ObjectifsPanel objectifs={OBJECTIFS_CREDIT_RISQUE} prenom="Kafui" />


      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="PAR > 30j global" value={`${d.kpis.par_30j}%`}
          variation={d.kpis.par_30j_variation} variationLabel="vs mois préc."
          icon={TrendingDown} colorScheme="red" invertVariation />
        <KpiCard title="Pipeline actif" value={d.kpis.dossiers_actifs}
          icon={FileText} colorScheme="blue"
          subtext={`${d.kpis.en_evaluation} éval. · ${d.kpis.en_approbation} appro. · ${d.kpis.a_debloquer_urgent} urgents`} />
        <KpiCard title="Décaissé ce mois" value={formatFcfa(d.kpis.montant_decaisse_mois)}
          icon={Smartphone} colorScheme="teal"
          subtext={`${d.kpis.decaissements_ce_mois} dossiers · taux appro ${d.kpis.taux_approbation}%`} />
        <KpiCard title="Signaux faibles IA" value={d.kpis.signaux_faibles}
          icon={AlertTriangle} colorScheme="orange"
          subtext={`Anticipation défaut 7-14j · score moyen ${d.kpis.score_moyen_portefeuille}`} />
      </div>

      {/* ── PAR 30/60/90 ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'PAR >30j', val: d.kpis.par_30j, seuil: 10, objectif: 8 },
          { label: 'PAR >60j', val: d.kpis.par_60j, seuil: 6,  objectif: 4 },
          { label: 'PAR >90j', val: d.kpis.par_90j, seuil: 3,  objectif: 2 },
        ].map(item => {
          const color = item.val > item.seuil ? '#dc2626' : item.val > item.objectif ? '#f97316' : '#16a34a'
          return (
            <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex justify-between text-xs mb-1 text-slate-500">
                <span>{item.label}</span>
                <div className="flex items-center gap-1">
                  <AiBadge variant="small" label="temps réel" />
                </div>
              </div>
              <div className="text-3xl font-black" style={{ color }}>{item.val}%</div>
              <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                <span>Seuil BCEAO {'<'}{item.seuil}%</span>
                <span className="mx-1">·</span>
                <span>Objectif {'<'}{item.objectif}%</span>
              </div>
              <div className="bg-slate-100 rounded-full h-2 mt-1.5">
                <div className="h-full rounded-full" style={{ width: `${Math.min((item.val / item.seuil) * 100, 100)}%`, backgroundColor: color }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Navigation crédit / risque / agences ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex gap-1.5">
            {[
              { id: 'credit', label: '💳 Pipeline Crédit', color: 'bg-indigo-600' },
              { id: 'risque', label: '📊 Analyse Risque IA', color: 'bg-red-600' },
              { id: 'agences', label: '🏢 PAR par agence', color: 'bg-teal-600' },
            ].map(t => (
              <button key={t.id} onClick={() => setVue(t.id as typeof vue)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${vue === t.id ? `${t.color} text-white` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── PIPELINE CRÉDIT ── */}
        {vue === 'credit' && (
          <div className="p-5 space-y-5">
            {/* Pipeline kanban */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pipeline 7 étapes — Vue Kanban</h3>
                <AiBadge variant="small" label="IA recommande déblocage" />
              </div>
              <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
                {d.pipeline.map((stage, i) => (
                  <div key={stage.stage} className="relative text-center p-3 rounded-xl border" style={{ borderColor: stage.color + '30', backgroundColor: stage.color + '10' }}>
                    <div className="text-2xl font-bold" style={{ color: stage.color }}>{stage.count}</div>
                    <div className="text-xs text-slate-600 mt-1 font-medium">{STAGE_LABELS[stage.stage]}</div>
                    {stage.montant > 0 && <div className="text-[10px] text-slate-400 mt-0.5">{(stage.montant / 1000).toFixed(0)}k</div>}
                    {stage.bloquees > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow">{stage.bloquees}</div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertTriangle size={11} /> Badges rouges = dossiers bloqués nécessitant une action immédiate
              </p>
            </div>

            {/* Dossiers requièrent action */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Dossiers prioritaires — recommandation IA</h3>
              <div className="space-y-2">
                {d.dossiers_requierent_action.map(dos => (
                  <div key={dos.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${dos.score === 0 ? 'bg-slate-200 text-slate-500' : dos.score < 50 ? 'bg-red-100 text-red-700' : dos.score < 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {dos.score === 0 ? '?' : dos.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{dos.nom}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STAGE_BADGE[dos.stage] ?? 'bg-slate-100 text-slate-500'}`}>{dos.stage}</span>
                        <span className="text-xs text-slate-400">Att. {dos.jours_attente}j · {dos.agent}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{formatFcfa(dos.montant)} · {dos.groupe}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <AiBadge variant="inline" label="IA" />
                        <p className="text-xs font-medium" style={{ color: dos.action.includes('ALERTE') ? '#dc2626' : dos.action.includes('Approuver') ? '#16a34a' : '#f97316' }}>
                          {dos.action}
                        </p>
                      </div>
                    </div>
                    <button className="flex-shrink-0 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                      Traiter
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Scoring IA détaillé */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recommandation IA — dossiers en évaluation</h3>
                <AiBadge variant="small" label="XGBoost" confidence={89} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {d.ia_scoring_detail.map((s, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${s.score >= 60 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${s.score >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.score}</div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{s.dossier}</div>
                        <div className={`text-xs font-bold ${s.score >= 60 ? 'text-green-700' : 'text-red-700'}`}>{s.recommandation}</div>
                      </div>
                    </div>
                    {s.montant_suggere > 0 && (
                      <div className="text-xs text-teal-700 font-medium mb-2">{formatFcfa(s.montant_suggere)} sur {s.duree_suggeree} mois</div>
                    )}
                    <div className="space-y-1">
                      {s.facteurs_positifs.map((f, j) => (
                        <div key={j} className="flex items-center gap-1.5 text-xs">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                          <span className="text-slate-600">{f}</span>
                        </div>
                      ))}
                      {s.facteurs_negatifs.map((f, j) => (
                        <div key={j} className="flex items-center gap-1.5 text-xs">
                          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                          <span className="text-slate-600">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Décaissements du jour */}
            {d.decaissements_du_jour.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {d.decaissements_du_jour.map((dec, i) => (
                  <div key={i} className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={14} className="text-purple-600" />
                      <span className="text-sm font-semibold text-slate-800">{dec.nom}</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">{formatFcfa(dec.montant)}</div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-slate-500">{dec.canal} · {dec.heure}</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${dec.statut === 'CONFIRME' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{dec.statut}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">{dec.contrat}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYSE RISQUE ── */}
        {vue === 'risque' && (
          <div className="p-5 space-y-5">
            {/* Prévisions défauts IA */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prévision défauts — moteur IA Prospera</h3>
                <AiBadge variant="small" label="Anticipation 7-30j" pulse />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {d.ia_prevision_defauts.map(p => (
                  <div key={p.horizon} className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="text-xs font-semibold text-red-700 mb-1">Dans {p.horizon}</div>
                    <div className="text-3xl font-black text-red-800">{p.defauts_prevus}</div>
                    <div className="text-xs text-red-600 font-medium">défauts probables</div>
                    <div className="text-xs text-slate-600 mt-1">{formatFcfa(p.montant_risque)} à risque</div>
                    <div className="flex items-center gap-1 mt-2">
                      <AiBadge variant="small" confidence={p.confidence} />
                    </div>
                    <div className="mt-2">
                      {p.clients.map((c, i) => (
                        <div key={i} className="text-[10px] text-slate-500">• {c}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PAR historique + forecast */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Évolution PAR + prévisions 3 mois</h3>
                <AiBadge variant="small" label="Prévisions IA" confidence={84} />
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={[
                  ...d.par_historique,
                  ...d.ia_par_forecast.map(f => ({ semaine: f.mois, par_30j: f.par_prevu, par_60j: null, par_90j: null, prevu: true }))
                ]} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPar30" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="semaine" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v) => `${Number(v)}%`} />
                  <Legend />
                  <ReferenceLine y={10} stroke="#dc2626" strokeDasharray="4 2" label={{ value: 'Seuil BCEAO', position: 'right', fontSize: 9 }} />
                  <Area type="monotone" dataKey="par_30j" name="PAR >30j" stroke="#dc2626" fill="url(#gradPar30)" strokeWidth={2} />
                  <Area type="monotone" dataKey="par_60j" name="PAR >60j" stroke="#f97316" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {d.ia_par_forecast.map(f => (
                  <div key={f.mois} className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                    <div className="text-xs font-semibold text-indigo-700">{f.mois} (IA)</div>
                    <div className="text-lg font-bold text-indigo-800">{f.par_prevu}%</div>
                    <div className="text-[10px] text-indigo-400">Objectif {f.par_objectif}% · Conf. {f.confidence}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signaux faibles */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Signaux faibles comportementaux — IA active 24h/24</h3>
                <AiBadge variant="small" label="Anticipation 14j" pulse />
              </div>
              <div className="space-y-2">
                {d.signaux_faibles_ia.map((s, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${s.urgent ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{s.nom}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${s.urgent ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                          {s.urgent ? '🚨 URGENT' : '👁 SURVEILLANCE'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{s.signal}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <AiBadge variant="inline" label="IA recommande" />
                        <p className="text-xs text-teal-700 font-medium">{s.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400">Score avant</div>
                        <div className="text-sm font-bold text-slate-600">{s.score_avant}</div>
                      </div>
                      <div className="text-red-500 font-bold text-sm">{s.delta}</div>
                      <div>
                        <div className="text-[10px] text-slate-400">Score après</div>
                        <div className="text-sm font-bold text-red-600">{s.score_apres}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribution scores */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Distribution scores XGBoost</h3>
                <div className="space-y-2">
                  {d.distribution_scores.map(s => (
                    <div key={s.tranche}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="font-medium" style={{ color: s.color }}>{s.tranche} — {s.label}</span>
                        <span className="text-slate-700 font-bold">{s.count}</span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-2">
                        <div className="h-full rounded-full" style={{ width: `${(s.count / 52) * 100}%`, backgroundColor: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">PAR par agence</h3>
                <div className="space-y-2">
                  {d.par_par_zone.map(z => (
                    <div key={z.zone} className="p-2.5 bg-slate-50 rounded-lg">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-800">{z.zone}</span>
                        <span className={`font-bold ${z.par > 10 ? 'text-red-600' : z.par > 8 ? 'text-orange-600' : 'text-green-600'}`}>{z.par}%</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{z.emprunteurs} emp. · {formatFcfa(z.encours)}</div>
                      <div className="bg-slate-200 rounded-full h-1.5 mt-1">
                        <div className="h-full rounded-full" style={{ width: `${Math.min((z.par / 15) * 100, 100)}%`, backgroundColor: z.par > 10 ? '#dc2626' : z.par > 8 ? '#f97316' : '#16a34a' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PAR PAR AGENCE ── */}
        {vue === 'agences' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Performance crédit — toutes agences</h3>
              <AiBadge variant="small" label="Alertes BCEAO auto" />
            </div>
            <div className="space-y-3">
              {AGENCES.map(a => {
                const parColor = a.par_courant > 10 ? '#dc2626' : a.par_courant > 8 ? '#f97316' : '#16a34a'
                const collectePct = Math.round((a.collecte_mois / a.collecte_objectif) * 100)
                return (
                  <div key={a.id} className={`p-4 rounded-xl border ${a.par_courant > 10 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'} shadow-sm`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: a.color + '20', color: a.color }}>
                        {a.initiales}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{a.nom}</span>
                          {a.statut === 'PILOTE' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">PILOTE</span>}
                          {a.par_courant > 10 && <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-bold">⚠ SEUIL BCEAO</span>}
                        </div>
                        <div className="text-xs text-slate-400">{a.ville} · {a.responsable} · {a.emprunteurs_actifs} emprunteurs</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-black" style={{ color: parColor }}>{a.par_courant}%</div>
                        <div className="text-[10px] text-slate-400">PAR &gt;30j</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Remboursement', val: a.taux_remboursement, unit: '%', good: a.taux_remboursement >= 90 },
                        { label: 'Collecte mois', val: formatFcfa(a.collecte_mois), unit: '', good: collectePct >= 85 },
                        { label: 'Obj. collecte', val: `${collectePct}%`, unit: '', good: collectePct >= 85 },
                        { label: 'Encours', val: formatFcfa(a.encours_fcfa), unit: '', good: true },
                      ].map(m => (
                        <div key={m.label} className="text-center p-2 bg-white/70 rounded-lg">
                          <div className={`text-sm font-bold ${m.good ? 'text-green-700' : 'text-red-600'}`}>{m.val}{m.unit}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Gap Analysis Agents ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-700">Performance Gap Analysis — Agents terrain</h3>
            <AiBadge variant="small" label="Coaching IA" />
          </div>
          <span className="text-xs text-slate-400">Comparatif vs meilleur agent</span>
        </div>
        <div className="p-4 space-y-2">
          {d.gap_analysis_agents.map((ag, i) => {
            const isTop = ag.badge === 'MEILLEUR'
            const isAlert = ag.badge === 'ALERTE'
            return (
              <div key={ag.agent} className={`p-3.5 rounded-xl border ${isAlert ? 'bg-red-50 border-red-100' : isTop ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${isAlert ? 'bg-red-100 text-red-700' : isTop ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                    #{ag.rang}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{ag.agent}</span>
                      {isTop && <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><Award size={9} /> TOP</span>}
                      {isAlert && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">⚠ COACHING URGENT</span>}
                      <span className="text-[10px] text-slate-400">{ag.clients} clients · {ag.visites_hebdo} vis./sem.</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5">
                      <div className="text-center">
                        <div className={`text-sm font-bold ${ag.taux_remb >= 95 ? 'text-green-600' : ag.taux_remb >= 85 ? 'text-orange-500' : 'text-red-600'}`}>{ag.taux_remb}%</div>
                        <div className="text-[10px] text-slate-400">Remb.</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-sm font-bold ${ag.par <= 6 ? 'text-green-600' : ag.par <= 10 ? 'text-orange-500' : 'text-red-600'}`}>{ag.par}%</div>
                        <div className="text-[10px] text-slate-400">PAR</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-sm font-bold ${ag.score_qualite >= 90 ? 'text-green-600' : ag.score_qualite >= 75 ? 'text-slate-600' : 'text-red-600'}`}>{ag.score_qualite}</div>
                        <div className="text-[10px] text-slate-400">Score</div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-slate-200 rounded-full h-1.5">
                          <div className="h-full rounded-full transition-all" style={{ width: `${ag.score_qualite}%`, backgroundColor: isAlert ? '#dc2626' : isTop ? '#16a34a' : '#f97316' }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <AiBadge variant="inline" label="IA" />
                      <span className={`text-xs ${isAlert ? 'text-red-600 font-medium' : 'text-slate-500'}`}>{ag.ia_insight}</span>
                    </div>
                  </div>
                  {!isTop && (
                    <button className="flex-shrink-0 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors">
                      Plan <ArrowRight size={11} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Insights IA crédit/risque ── */}
      <AiInsightPanel
        titre="Insights IA — Crédit & Risque Prospera AI"
        insights={d.ia_insights_credit}
        collapsible />

    </div>
  )
}
