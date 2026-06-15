'use client'
import { useState } from 'react'
import { Users, TrendingUp, MapPin, MessageSquare, Clock, Phone, Mic, Wifi, WifiOff, FileText, Smartphone, Send, CheckCircle2, AlertTriangle as AlertIcon, Star } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { MOCK_GESTIONNAIRE, OBJECTIFS_GESTIONNAIRE } from '@/lib/mockDataByRole'
import { AiInsightPanel } from '../AiInsightPanel'
import { AiBadge } from '../AiBadge'
import { KpiCard } from '../KpiCard'
import { ObjectifsPanel } from '../ObjectifsPanel'
import { formatFcfa } from '@/lib/utils'

const SCORE_BG = (s: number) =>
  s < 30 ? 'bg-red-100 text-red-700' : s < 50 ? 'bg-orange-100 text-orange-700' : s < 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'

const DELTA_COLOR = (d: number) =>
  d > 0 ? 'text-green-600' : d < -10 ? 'text-red-600' : d < 0 ? 'text-orange-600' : 'text-slate-400'

const STATUT_COLOR: Record<string, string> = {
  DEFAUT:       'bg-red-100 text-red-700 border-red-200',
  RETARD:       'bg-orange-100 text-orange-700 border-orange-200',
  SURVEILLANCE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  EN_COURS:     'bg-green-100 text-green-700 border-green-200',
}

const ACTION_STYLE: Record<string, string> = {
  ESCALADE:         'text-red-700 font-bold',
  VISITE:           'text-orange-700 font-medium',
  APPEL:            'text-blue-700 font-medium',
  FERME:            'text-orange-600 font-medium',
  SURVEILLANCE:     'text-yellow-700',
  RESTRUCTURATION:  'text-red-700 font-bold',
  RENOUVELLEMENT:   'text-green-700 font-medium',
}

const PRIORITE_DOT: Record<string, string> = {
  HAUTE:   'bg-red-500',
  NORMALE: 'bg-orange-400',
  FAIBLE:  'bg-slate-400',
}

export function DashboardGestionnaire() {
  const d = MOCK_GESTIONNAIRE
  const [onglet, setOnglet] = useState<'risque' | 'tous'>('risque')
  const [voiceCrmOpen, setVoiceCrmOpen] = useState(false)
  const [offline, setOffline] = useState(false)

  const clients = onglet === 'risque'
    ? d.clients_portefeuille.filter(c => ['DEFAUT', 'RETARD', 'SURVEILLANCE'].includes(c.statut))
    : d.clients_portefeuille

  const collectePct = Math.round((d.kpis.collecte_mois / d.kpis.collecte_objectif) * 100)

  return (
    <div className="space-y-5">
      <ObjectifsPanel objectifs={OBJECTIFS_GESTIONNAIRE} prenom="Kofi" />


      {/* ── Bandeau IA matin ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-base">🧠</span>
            </div>
            <div>
              <div className="text-sm font-bold">Rapport IA matinal — {d.ia_rapport_journalier.genere_le.split(' à ')[0]}</div>
              <div className="text-xs text-indigo-200 mt-0.5">
                {d.kpis.clients_a_risque} clients à risque · {d.kpis.echeances_7j} échéances 7j · {d.kpis.messages_whatsapp_non_lus} messages WA non lus
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Simuler mode offline */}
            <button onClick={() => setOffline(o => !o)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${offline ? 'bg-orange-500 text-white' : 'bg-white/20 text-white'}`}>
              {offline ? <WifiOff size={11} /> : <Wifi size={11} />}
              {offline ? 'HORS LIGNE' : 'En ligne'}
            </button>
            {/* Voice to CRM */}
            <button onClick={() => setVoiceCrmOpen(true)}
              className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors">
              <Mic size={11} /> Voice-to-CRM
            </button>
          </div>
        </div>
        {offline && (
          <div className="mt-3 text-xs bg-orange-500/30 border border-orange-400/40 rounded-lg px-3 py-2">
            📵 Mode hors-ligne actif — toutes les données sont disponibles localement. Synchronisation automatique au retour du réseau.
          </div>
        )}
      </div>

      {/* Voice-to-CRM modal */}
      {voiceCrmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Mic size={18} className="text-indigo-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Voice-to-CRM IA</div>
                <AiBadge variant="small" label="Transcription automatique" pulse />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4">
              <div className="text-xs text-slate-400 mb-2">Dictez votre compte rendu de visite :</div>
              <div className="text-sm text-slate-700 italic">"Mme Ahoua intéressée par le crédit groupe, mari absent, à rappeler vendredi matin..."</div>
              <div className="mt-3 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="text-xs font-bold text-indigo-700 mb-1">✦ IA a extrait :</div>
                <div className="text-xs text-slate-600">• Statut : Intéressée · Produit : Crédit groupe</div>
                <div className="text-xs text-slate-600">• Note : Mari absent</div>
                <div className="text-xs text-slate-600">• Rappel programmé : Vendredi 21/05 matin</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setVoiceCrmOpen(false)} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
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
        <KpiCard title="Mon portefeuille" value={`${d.kpis.total_portefeuille} clients`}
          icon={Users} colorScheme="blue"
          subtext={`${d.kpis.clients_a_risque} en risque · PAR perso ${d.kpis.par_perso}%`} />
        <KpiCard title="Taux recouvrement" value={`${d.kpis.taux_recouvrement}%`}
          variation={1.4} variationLabel="vs mois préc."
          icon={TrendingUp} colorScheme="teal" subtext="Objectif mensuel : 96%" />
        <KpiCard title="Tournée IA aujourd'hui" value={`${d.kpis.visites_aujourd_hui}/${d.kpis.visites_planifiees}`}
          icon={MapPin} colorScheme="orange"
          subtext={`${d.kpis.visites_semaine} visites GPS ce mois · 100% tracées`} />
        <KpiCard title="WhatsApp / Alertes" value={`${d.kpis.messages_whatsapp_non_lus} msg`}
          icon={MessageSquare} colorScheme="red"
          subtext={`${d.kpis.alertes_actives} alertes IA actives`} />
      </div>

      {/* ── Insights IA ── */}
      <AiInsightPanel
        titre="Recommandations IA — Gestionnaire portefeuille"
        insights={d.ia_insights}
        collapsible />

      {/* ── Score IA détail + Collecte ── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Score détail */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-indigo-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AiBadge label="Scoring XGBoost" variant="small" />
            <h3 className="text-sm font-semibold text-slate-900">Exemple score — {d.ia_score_detail.client_exemple}</h3>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-black flex-shrink-0 ${SCORE_BG(d.ia_score_detail.score)}`}
              style={{ borderColor: d.ia_score_detail.score < 30 ? '#fca5a5' : d.ia_score_detail.score < 50 ? '#fed7aa' : '#fef08a' }}>
              {d.ia_score_detail.score}
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-500">Modèle XGBoost · 47 variables</div>
              <div className="text-xs text-red-600 font-semibold mt-0.5">Probabilité défaut J+14 : 88%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Mis à jour à chaque interaction</div>
            </div>
          </div>
          <div className="space-y-2">
            {d.ia_score_detail.facteurs.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${f.impact === 'POSITIF' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="flex-1 text-slate-600 truncate">{f.label}</span>
                <span className={`font-bold flex-shrink-0 ${f.impact === 'POSITIF' ? 'text-green-600' : 'text-red-600'}`}>{f.valeur}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Collecte + Historique */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Collecte vs objectif — 5 semaines</h3>
            <span className="text-xs font-bold text-teal-700">{collectePct}% de l'objectif atteint</span>
          </div>
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">{formatFcfa(d.kpis.collecte_mois)} encaissés</span>
              <span className="text-slate-400">objectif {formatFcfa(d.kpis.collecte_objectif)}</span>
            </div>
            <div className="bg-slate-100 rounded-full h-3">
              <div className="h-full rounded-full bg-teal-500" style={{ width: `${collectePct}%` }} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={d.historique_collecte} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="semaine" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatFcfa(Number(v))} />
              <ReferenceLine y={1_000_000} stroke="#94a3b8" strokeDasharray="4 2" />
              <Bar dataKey="collecte" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Collecte" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Alertes IA urgentes ── */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-slate-900">Alertes IA — 5 clients à risque</h3>
            <AiBadge variant="small" label="Anticipation 7-14j" confidence={88} />
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {d.alertes_urgentes.map(a => (
            <div key={a.id} className={`flex items-start gap-4 px-5 py-3 hover:bg-slate-50 transition-colors ${a.severity === 'CRITIQUE' ? 'bg-red-50/30' : ''}`}>
              <div className="flex-shrink-0 mt-0.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${SCORE_BG(a.score)}`}>{a.score}</div>
                <div className={`text-[9px] text-center mt-0.5 font-medium ${DELTA_COLOR(-(45 - a.retard))}`}>
                  {a.retard > 0 ? `J+${a.retard}` : 'OK'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{a.nom}</span>
                  <span className="text-xs text-slate-400">{a.groupe}</span>
                  <span className="text-xs font-bold text-slate-600">{formatFcfa(a.montant)}</span>
                </div>
                <p className={`text-xs mt-0.5 ${ACTION_STYLE[a.severity === 'CRITIQUE' ? 'ESCALADE' : 'APPEL']}`}>{a.action}</p>
              </div>
              <button className="flex-shrink-0 text-xs bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1">
                <Phone size={11} /> Contacter
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* ── Tournée IA ── */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Tournée IA optimisée</h3>
                <AiBadge variant="small" label="4 critères" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Priorité risque · Zone géo · Distance · Échéances — trajet réduit de 8.4→6.1km</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {d.tournee_du_jour.map((v, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITE_DOT[v.priorite]}`} />
                <div className="w-14 text-xs font-mono text-slate-400 flex-shrink-0">{v.heure}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 truncate">{v.nom}</span>
                    <span className="text-xs text-slate-400">{v.distance}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{v.zone} · {v.raison}</p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${v.priorite === 'HAUTE' ? 'bg-red-50 text-red-700 border-red-200' : v.priorite === 'NORMALE' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{v.priorite}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-4">
          {/* Échéances 7j */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-orange-500" />
              <h3 className="text-sm font-semibold text-slate-900">Échéances — 7 prochains jours</h3>
              <AiBadge variant="small" label="Proba. paiement" />
            </div>
            <div className="space-y-2">
              {d.echeances_7j.map((e, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-800 truncate">{e.nom}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">{e.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                        <div className="h-full rounded-full" style={{ width: `${e.probabilite}%`, backgroundColor: e.probabilite > 70 ? '#16a34a' : e.probabilite > 40 ? '#f97316' : '#dc2626' }} />
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: e.probabilite > 70 ? '#16a34a' : e.probabilite > 40 ? '#f97316' : '#dc2626' }}>{e.probabilite}%</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold text-slate-700">{formatFcfa(e.montant)}</div>
                    <div className="text-[10px] text-slate-400">{e.canal}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp non lus */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-green-600" />
              <h3 className="text-sm font-semibold text-slate-900">WhatsApp — messages récents</h3>
            </div>
            <div className="space-y-2">
              {d.whatsapp_messages.map((m, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-2 rounded-lg border ${!m.lu ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 ${!m.lu ? 'bg-green-600' : 'bg-slate-400'}`}>{m.nom[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-slate-800">{m.nom}</span>
                      {!m.lu && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                      <span className="text-[10px] text-slate-400 ml-auto">{m.heure}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">{m.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Table clients portefeuille ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Portefeuille clients — multi-agences</h3>
              <AiBadge variant="small" label="Score dynamique XGBoost" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Trié par score IA ascendant · Δ = variation depuis 7 jours</p>
          </div>
          <div className="flex gap-1.5">
            {(['risque', 'tous'] as const).map(t => (
              <button key={t} onClick={() => setOnglet(t)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${onglet === t ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {t === 'risque' ? `En risque (${d.clients_portefeuille.filter(c => ['DEFAUT','RETARD','SURVEILLANCE'].includes(c.statut)).length})` : `Tous (${d.clients_portefeuille.length})`}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium">Client / Groupe</th>
                <th className="text-left px-4 py-3 font-medium">Score IA / Δ</th>
                <th className="text-left px-4 py-3 font-medium">Agence</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-right px-4 py-3 font-medium">Montant</th>
                <th className="text-right px-4 py-3 font-medium">Retard</th>
                <th className="text-left px-4 py-3 font-medium">Action IA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clients.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-2.5">
                    <div className="font-medium text-slate-800">{c.nom}</div>
                    <div className="text-xs text-slate-400">{c.groupe} · {c.canal}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center justify-center w-9 h-7 rounded-lg text-xs font-bold ${SCORE_BG(c.score)}`}>{c.score}</span>
                      <span className={`text-xs font-bold ${DELTA_COLOR(c.delta_score)}`}>
                        {c.delta_score > 0 ? `+${c.delta_score}` : c.delta_score}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{c.agence}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUT_COLOR[c.statut]}`}>{c.statut.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-700">{formatFcfa(c.montant)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`font-bold text-xs ${c.retard > 30 ? 'text-red-600' : c.retard > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {c.retard > 0 ? `+${c.retard}j` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {c.ia_action && (
                      <span className={`text-xs ${ACTION_STYLE[c.ia_action] ?? 'text-slate-500'}`}>
                        {c.ia_action}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Rapport journalier automatique IA ── */}
      <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-indigo-50">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-indigo-800">Rapport de journée — IA auto ({d.ia_rapport_journalier.genere_le})</h3>
            <AiBadge variant="small" label="Généré automatiquement" pulse />
          </div>
          {d.ia_rapport_journalier.envoye_manager && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
              <CheckCircle2 size={10} /> Transmis au manager
            </span>
          )}
        </div>
        <div className="p-5 grid grid-cols-12 gap-4">
          {/* Métriques journée */}
          <div className="col-span-12 lg:col-span-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Visites réalisées', val: `${d.ia_rapport_journalier.visites_effectuees}/${d.ia_rapport_journalier.visites_planifiees}`, color: 'text-indigo-600', pct: d.ia_rapport_journalier.ratio_visites },
                { label: 'Collecte réalisée', val: formatFcfa(d.ia_rapport_journalier.collecte_realisee), color: 'text-teal-600', pct: Math.round((d.ia_rapport_journalier.collecte_realisee / 300_000) * 100) },
                { label: 'Nouveaux risques IA', val: d.ia_rapport_journalier.nouveaux_cas_risque, color: 'text-red-600', pct: null },
                { label: 'Score journée', val: `${d.ia_rapport_journalier.score_journee}/100`, color: d.ia_rapport_journalier.score_journee >= 80 ? 'text-green-600' : 'text-orange-600', pct: d.ia_rapport_journalier.score_journee },
              ].map(m => (
                <div key={m.label} className="p-2.5 bg-slate-50 rounded-lg text-center">
                  <div className={`text-lg font-bold ${m.color}`}>{m.val}</div>
                  {m.pct !== null && (
                    <div className="bg-slate-200 rounded-full h-1 mt-1"><div className="h-full rounded-full bg-indigo-400" style={{ width: `${Math.min(m.pct, 100)}%` }} /></div>
                  )}
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{m.label}</div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-700 border border-indigo-100">
              <div className="font-medium mb-1">📋 Synthèse IA</div>
              {d.ia_rapport_journalier.synthese_texte}
            </div>
          </div>
          {/* Priorités demain */}
          <div className="col-span-12 lg:col-span-8">
            <div className="flex items-center gap-2 mb-2">
              <Star size={12} className="text-orange-500" />
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Priorités IA — demain matin</h4>
            </div>
            <div className="space-y-2">
              {d.ia_rapport_journalier.demain_priorites.map((p, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${p.priorite === 'CRITIQUE' ? 'bg-red-50 border-red-100' : p.priorite === 'OPPORTUNITE' ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className={`w-14 text-center flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${p.priorite === 'CRITIQUE' ? 'bg-red-100 text-red-700' : p.priorite === 'OPPORTUNITE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {p.heure}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-800">{p.client}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{p.raison}</div>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold ${p.priorite === 'CRITIQUE' ? 'text-red-700' : 'text-green-700'}`}>{p.priorite}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Inbox WA Numéro Unique + Liens MoMo ── */}
      <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-green-50">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-green-700" />
            <h3 className="text-sm font-semibold text-green-800">Inbox WhatsApp — Numéro Prospera {d.wa_inbox_numero_unique.numero}</h3>
            <AiBadge variant="small" label="Inbox partagée" />
          </div>
          <span className="text-xs text-slate-500">{d.wa_inbox_numero_unique.messages.filter(m => !m.lu).length} non lus</span>
        </div>
        <div className="p-5 grid grid-cols-12 gap-4">
          {/* Messages */}
          <div className="col-span-12 lg:col-span-7 space-y-2">
            {d.wa_inbox_numero_unique.messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${!msg.lu ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${!msg.lu ? 'bg-green-200 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                  {msg.nom.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800">{msg.nom}</span>
                    <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${msg.type === 'PAIEMENT' ? 'bg-teal-100 text-teal-700' : msg.type === 'CONFIRMATION' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{msg.type}</span>
                    {!msg.lu && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">{msg.message}</p>
                </div>
                <div className="flex flex-col gap-1 items-end flex-shrink-0">
                  <span className="text-[10px] text-slate-400">{msg.heure}</span>
                  <button className="text-[10px] bg-teal-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5 hover:bg-teal-700">
                    <Send size={8} /> Répondre
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Liens MoMo */}
          <div className="col-span-12 lg:col-span-5">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone size={12} className="text-yellow-600" />
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Liens de paiement MoMo à envoyer</h4>
            </div>
            <div className="space-y-2">
              {d.wa_inbox_numero_unique.momo_liens.map((l, i) => (
                <div key={i} className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-800">{l.client}</span>
                    <span className="text-xs font-bold text-yellow-700">{formatFcfa(l.montant)}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 bg-white/80 px-2 py-1 rounded truncate mb-2">{l.lien_momo}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-orange-600">Expire : {l.expire}</span>
                    <button className="text-[10px] bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      <Smartphone size={8} /> Envoyer WA
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
