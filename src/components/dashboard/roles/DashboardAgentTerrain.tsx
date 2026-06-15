'use client'
import { useState } from 'react'
import { MapPin, FileText, AlertTriangle, CheckCircle, Clock, Upload, Mic, Phone, Navigation, Users } from 'lucide-react'
import { MOCK_AGENT_TERRAIN, OBJECTIFS_AGENT_TERRAIN } from '@/lib/mockDataByRole'
import { AiBadge } from '../AiBadge'
import { AiInsightPanel } from '../AiInsightPanel'
import { KpiCard } from '../KpiCard'
import { ObjectifsPanel } from '../ObjectifsPanel'
import { formatFcfa } from '@/lib/utils'

const STATUT_TOURNEE: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  FAIT:     { label: 'Fait',     color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  EN_COURS: { label: 'En cours', color: 'bg-blue-100 text-blue-700 animate-pulse', icon: Clock },
  PLANIFIE: { label: 'Planifié', color: 'bg-slate-100 text-slate-500',  icon: Clock },
}

const STATUT_DOCS: Record<string, string> = {
  SCAN_FAIT:  'bg-blue-100 text-blue-700',
  EN_COURS:   'bg-orange-100 text-orange-700',
  A_FAIRE:    'bg-red-100 text-red-600',
  REMIS:      'bg-green-100 text-green-700',
}

const STATUT_PROSPECT: Record<string, string> = {
  A_VISITER:     'bg-slate-100 text-slate-600',
  DOCS_COLLECTES:'bg-blue-100 text-blue-700',
  A_QUALIFIER:   'bg-orange-100 text-orange-700',
  SOUMIS_AGENCE: 'bg-green-100 text-green-700',
}

export function DashboardAgentTerrain() {
  const d = MOCK_AGENT_TERRAIN
  const [onglet, setOnglet] = useState<'tournee' | 'impayés' | 'prospects' | 'docs'>('tournee')
  const [voiceCrmOpen, setVoiceCrmOpen] = useState(false)

  const collectePct = Math.round((d.kpis.cash_collecte_aujourd_hui / d.kpis.cash_objectif_jour) * 100)
  const visitePct   = Math.round((d.kpis.visites_aujourd_hui / d.kpis.visites_planifiees) * 100)

  return (
    <div className="space-y-5">
      <ObjectifsPanel objectifs={OBJECTIFS_AGENT_TERRAIN} prenom="Kossi" />

      {/* ── Bandeau terrain ── */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Navigation size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold">Agent Terrain — {d.kpis.zone}</div>
              <div className="text-xs text-green-200 mt-0.5">
                Agence {d.kpis.agence_rattachement} · {d.kpis.clients_zone} clients en zone · 🔥 {d.kpis.streak_jours}j consécutifs
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setVoiceCrmOpen(true)}
              className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors">
              <Mic size={11} /> Voice-CRM
            </button>
            <button className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors">
              <Upload size={11} /> Docs
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            { label: 'Visites',  val: `${d.kpis.visites_aujourd_hui}/${d.kpis.visites_planifiees}`, pct: visitePct,   color: '#86efac' },
            { label: 'Cash collecté', val: formatFcfa(d.kpis.cash_collecte_aujourd_hui), pct: collectePct, color: '#86efac' },
            { label: 'Impayés zone',  val: `${d.kpis.impayés_zone} clients`, pct: null, color: '#fca5a5' },
          ].map(m => (
            <div key={m.label} className="bg-white/10 rounded-xl p-2.5">
              <div className="text-base font-bold">{m.val}</div>
              {m.pct !== null && (
                <div className="h-1 bg-white/20 rounded-full mt-1.5">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(m.pct, 100)}%`, backgroundColor: m.color }} />
                </div>
              )}
              <div className="text-[10px] text-green-200 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice-to-CRM */}
      {voiceCrmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Mic size={18} className="text-green-700" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Dictée compte-rendu terrain</div>
                <AiBadge variant="small" label="Transcription auto IA" pulse />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4">
              <div className="text-xs text-slate-400 mb-2">Ex : "Yawa Komla — veut crédit 500k pour motopompe. Mari agriculteur. 3 référents. À rappeler lundi matin."</div>
              <div className="text-sm text-slate-700 italic">"Visite Togbui Séwou — mauvaise récolte mais bonne volonté. Demande 2 semaines de délai. Fils peut garantir..."</div>
              <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-100">
                <div className="text-xs font-bold text-green-700 mb-1">✦ IA a extrait :</div>
                <div className="text-xs text-slate-600">• Client : Togbui Séwou · Statut : Retard justifié</div>
                <div className="text-xs text-slate-600">• Motif : Mauvaise récolte</div>
                <div className="text-xs text-slate-600">• Garantie proposée : Fils du client</div>
                <div className="text-xs text-slate-600">• Action : Report 15j demandé</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setVoiceCrmOpen(false)} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
                Confirmer & sauvegarder
              </button>
              <button onClick={() => setVoiceCrmOpen(false)} className="px-4 bg-slate-100 text-slate-600 rounded-xl text-sm hover:bg-slate-200 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Clients en zone" value={d.kpis.clients_zone}
          icon={Users} colorScheme="teal"
          subtext={`Agence ${d.kpis.agence_rattachement}`} />
        <KpiCard title="Visites today" value={`${d.kpis.visites_aujourd_hui}/${d.kpis.visites_planifiees}`}
          icon={MapPin} colorScheme="blue"
          subtext={`${visitePct}% objectif journalier`} />
        <KpiCard title="Prospects ce mois" value={d.kpis.prospects_ce_mois}
          icon={FileText} colorScheme="orange"
          subtext={`${d.kpis.dossiers_remontes_mois} dossiers remontés`} />
        <KpiCard title="Impayés à visiter" value={d.kpis.impayés_zone}
          icon={AlertTriangle} colorScheme="red"
          subtext="Visites prioritaires IA" />
      </div>

      {/* ── Onglets ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          {([
            { id: 'tournee',  label: '🗺️ Tournée IA',     count: d.kpis.visites_planifiees },
            { id: 'impayés',  label: '⚠️ Impayés zone',   count: d.kpis.impayés_zone },
            { id: 'prospects',label: '👤 Mes prospects',   count: d.prospects_pipeline.length },
            { id: 'docs',     label: '📄 Documents',       count: d.documents_a_remettre.filter(d => !d.remis_agence).length },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setOnglet(t.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${onglet === t.id ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {t.label}
              {t.count > 0 && (
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${onglet === t.id ? 'bg-white text-green-700' : 'bg-red-500 text-white'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── TOURNÉE ── */}
        {onglet === 'tournee' && (
          <div className="p-5 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan de tournée IA optimisé — Aujourd'hui</h3>
              <AiBadge variant="small" label="Itinéraire optimisé" />
            </div>
            {d.tournee_du_jour.map((v, i) => {
              const stl = STATUT_TOURNEE[v.statut]
              const Icon = stl.icon
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${v.statut === 'FAIT' ? 'bg-green-50/50 border-green-100' : v.statut === 'EN_COURS' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="w-14 text-xs font-mono text-slate-400 flex-shrink-0 pt-0.5">{v.heure}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{v.nom}</span>
                      <span className="text-xs text-slate-400">{v.activite}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${stl.color}`}>{stl.label}</span>
                      {!v.gps && v.statut !== 'PLANIFIE' && <span className="text-[10px] text-orange-600 font-medium">GPS non validé</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{v.zone} — {v.motif}</p>
                    {v.cash_collecte > 0 && (
                      <div className="mt-1 text-xs font-bold text-green-700">💰 {formatFcfa(v.cash_collecte)} collecté</div>
                    )}
                  </div>
                  {v.statut === 'PLANIFIE' && (
                    <button className="flex-shrink-0 text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors">
                      <Navigation size={10} /> Y aller
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── IMPAYÉS ── */}
        {onglet === 'impayés' && (
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Clients en retard — ma zone</h3>
              <AiBadge variant="small" label="Actions recommandées IA" />
            </div>
            {d.clients_en_retard.map(c => (
              <div key={c.id} className={`p-4 rounded-xl border ${c.urgent ? 'bg-red-50 border-red-100' : 'bg-orange-50/50 border-orange-100'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${c.score < 50 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {c.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{c.nom}</span>
                      <span className="text-xs text-slate-400">{c.activite}</span>
                      <span className="text-xs font-bold text-red-600">J+{c.retard}</span>
                      {c.urgent && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">URGENT</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Échéance due : <span className="font-medium text-slate-700">{formatFcfa(c.montant)}</span> · Motif probable : {c.motif_probale}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <AiBadge variant="inline" label="IA" />
                      <span className="text-xs text-slate-600 font-medium">{c.action_ia}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button className="text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors">
                      <Phone size={10} /> Appeler
                    </button>
                    <button className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg font-medium transition-colors">
                      Signaler
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PROSPECTS ── */}
        {onglet === 'prospects' && (
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pipeline prospects — ma zone</h3>
                <AiBadge variant="small" label="Score conversion IA" />
              </div>
              <button className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-700 flex items-center gap-1">
                <FileText size={11} /> + Nouveau
              </button>
            </div>
            {d.prospects_pipeline.map((p, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${p.ia_score >= 70 ? 'bg-green-100 text-green-700' : p.ia_score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>
                    {p.ia_score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{p.nom}</span>
                      <span className="text-xs text-slate-400">{p.activite}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUT_PROSPECT[p.statut]}`}>{p.statut.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Crédit estimé : <span className="font-medium text-slate-700">{formatFcfa(p.montant_estime)}</span></p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.notes}</p>
                  </div>
                  <button className="flex-shrink-0 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors">
                    Avancer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {onglet === 'docs' && (
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Documents à scanner / remettre à l'agence</h3>
              <AiBadge variant="small" label="Checklist IA" />
            </div>
            {d.documents_a_remettre.map((doc, i) => (
              <div key={i} className={`p-4 rounded-xl border ${doc.remis_agence ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.remis_agence ? 'bg-green-100' : 'bg-slate-200'}`}>
                    <FileText size={14} className={doc.remis_agence ? 'text-green-600' : 'text-slate-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{doc.client}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUT_DOCS[doc.statut]}`}>{doc.statut.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.type}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <AiBadge variant="inline" label="IA" />
                      <span className={`text-xs ${doc.remis_agence ? 'text-green-700' : 'text-slate-600'}`}>{doc.ia_note}</span>
                    </div>
                  </div>
                  {!doc.remis_agence && (
                    <button className="flex-shrink-0 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors">
                      <Upload size={10} /> Scanner
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Rapport soir */}
            <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-green-700" />
                <span className="text-sm font-semibold text-green-800">Rapport de terrain — soir ({d.rapport_soir.genere})</span>
                {d.rapport_soir.transmission_agence && (
                  <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded font-bold ml-auto">✓ Transmis</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Cash collecté', val: formatFcfa(d.rapport_soir.cash_collecte), color: 'text-green-700' },
                  { label: 'Visites', val: `${d.rapport_soir.nb_visites}/${d.rapport_soir.nb_planifie}`, color: 'text-blue-700' },
                  { label: 'Score journée', val: `${d.rapport_soir.score_journee}/100`, color: d.rapport_soir.score_journee >= 80 ? 'text-green-700' : 'text-orange-700' },
                ].map(m => (
                  <div key={m.label} className="text-center p-2 bg-white rounded-lg">
                    <div className={`text-base font-bold ${m.color}`}>{m.val}</div>
                    <div className="text-[10px] text-slate-400">{m.label}</div>
                  </div>
                ))}
              </div>
              <div className="p-2.5 bg-white/70 rounded-lg text-xs text-slate-600 italic">
                📋 {d.rapport_soir.observations}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Insights IA ── */}
      <AiInsightPanel
        titre="Insights IA — Agent terrain Prospera"
        insights={d.ia_insights}
        collapsible />
    </div>
  )
}
