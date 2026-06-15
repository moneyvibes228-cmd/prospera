'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  Shield, AlertTriangle, Search, FileText, Eye, Activity,
  Building2, Wallet, Clock, Target,
  Sparkles, Users, Lock, BarChart3, Terminal, BookOpen,
  TrendingUp, TrendingDown, Calendar, CheckCircle2, XCircle, AlertCircle,
  ChevronRight, ChevronDown,
} from 'lucide-react'
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { MOCK_AUDIT_HOME, RAPPORT_IA_AUDITEUR } from '@/lib/mockMicrofinance'
import { RapportIAGlobal } from '@/components/dashboard/RapportIAGlobal'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { formatFcfa } from '@/lib/utils'

// ── Style maps ────────────────────────────────────────────────────────────────
const GRAVITE_STYLE: Record<string, { badge: string; row: string }> = {
  CRITIQUE: { badge: 'bg-red-100 text-red-800 border-red-300',    row: 'bg-red-50/60' },
  HAUTE:    { badge: 'bg-orange-100 text-orange-800 border-orange-200', row: 'bg-orange-50/40' },
  MOYENNE:  { badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', row: '' },
}

const RISQUE_AGENCE: Record<string, { bg: string; text: string; dot: string }> = {
  CRITIQUE: { bg: 'bg-red-50',    text: 'text-red-800',    dot: 'bg-red-600' },
  ELEVE:    { bg: 'bg-orange-50', text: 'text-orange-800', dot: 'bg-orange-500' },
  MODERE:   { bg: 'bg-yellow-50', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  FAIBLE:   { bg: 'bg-green-50',  text: 'text-green-800',  dot: 'bg-green-500'  },
}
const TONE_DOT: Record<string, string> = {
  critique:  'bg-red-700',
  negatif:   'bg-red-500',
  attention: 'bg-orange-500',
  positif:   'bg-green-500',
  info:      'bg-blue-400',
}
const TONE_BG: Record<string, string> = {
  critique:  'bg-red-100   border-red-400',
  negatif:   'bg-red-50    border-red-200',
  attention: 'bg-orange-50 border-orange-200',
  positif:   'bg-green-50  border-green-200',
  info:      'bg-blue-50   border-blue-200',
}


function KpiAlert({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${color}`}>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide mt-0.5">{label}</div>
      {sub && <div className="text-[10px] opacity-70 mt-0.5">{sub}</div>}
    </div>
  )
}

// =============================================================================
//   TABS
// =============================================================================

export function AuditTabAnomalies({ d }: { d: typeof MOCK_AUDIT_HOME }) {
  const [filtre, setFiltre] = useState<'TOUS' | 'CRITIQUE' | 'HAUTE' | 'MOYENNE'>('TOUS')
  const anomalies = filtre === 'TOUS' ? d.anomalies : d.anomalies.filter(a => a.gravite === filtre)

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {(['TOUS', 'CRITIQUE', 'HAUTE', 'MOYENNE'] as const).map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filtre === f ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
            }`}>
            {f} {f !== 'TOUS' && <span className="ml-1 opacity-70">({d.anomalies.filter(a => a.gravite === f).length})</span>}
          </button>
        ))}
      </div>

      {/* Liste anomalies */}
      <div className="space-y-2">
        {anomalies.map((a) => {
          const s = GRAVITE_STYLE[a.gravite] ?? GRAVITE_STYLE.MOYENNE
          return (
            <div key={a.id} className={`rounded-xl border border-slate-200 p-4 ${s.row}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-2.5 flex-1">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${a.gravite === 'CRITIQUE' ? 'text-red-600' : a.gravite === 'HAUTE' ? 'text-orange-500' : 'text-yellow-500'}`} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{a.type}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${s.badge}`}>{a.gravite}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{a.id}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{a.agent}</span>
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{a.agence}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.date}</span>
                      {a.montant > 0 && <span className="font-semibold text-slate-700">{formatFcfa(a.montant)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${a.statut === 'EN_COURS' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {a.statut.replace('_', ' ')}
                  </span>
                  {a.statut === 'EN_COURS' && (
                    <button className="text-xs bg-amber-700 hover:bg-amber-800 text-white px-2.5 py-1 rounded-lg font-semibold transition-colors">
                      Investiguer
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed ml-6.5 pl-1">{a.detail}</p>
            </div>
          )
        })}
      </div>

      {/* Détection comportementale */}
      <div className="bg-slate-900 rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-bold text-amber-400">Détection comportementale IA</h4>
          <AiBadge variant="small" label="Temps réel" pulse />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Activités inhabituelles */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Activités inhabituelles</div>
            <div className="space-y-2">
              {d.detection_comportementale.activites_inhabituelles.map((a, i) => (
                <div key={i} className={`rounded-lg p-2.5 text-xs border ${a.risque === 'CRITIQUE' ? 'bg-red-900/50 border-red-700' : 'bg-orange-900/30 border-orange-700'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-amber-300">{a.utilisateur}</span>
                    <span className={`text-[9px] font-bold px-1 rounded ${a.risque === 'CRITIQUE' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'}`}>{a.risque}</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">{a.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pics transactions */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pics transactions suspects</div>
            <div className="space-y-2">
              {d.detection_comportementale.pics_transactions.map((p, i) => (
                <div key={i} className={`rounded-lg p-2.5 text-xs border ${p.alerte ? 'bg-orange-900/40 border-orange-700' : 'bg-slate-800 border-slate-700'}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-amber-300 font-medium">{p.agence}</span>
                    {p.alerte && <span className="text-[9px] bg-orange-600 text-white px-1 rounded font-bold">ALERTE</span>}
                  </div>
                  <div className="text-slate-300 text-[11px]">{p.date} · {p.heure}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-400">Normal : {p.normal}</span>
                    <span className="text-orange-400 font-bold">Réel : {p.volume}</span>
                    <span className="text-red-400 font-bold">×{(p.volume / p.normal).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opérations hors-horaires */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Opérations hors-horaires</div>
            <div className="space-y-2">
              {d.detection_comportementale.ops_hors_horaires.map((o, i) => (
                <div key={i} className="bg-red-900/40 border border-red-700 rounded-lg p-2.5 text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-red-300 font-bold">{o.heure}</span>
                    <span className="font-mono text-amber-300">{o.user}</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">{o.action}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">{o.agence} {o.montant > 0 && `· ${formatFcfa(o.montant)}`}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuditTabControleCredit({ d }: { d: typeof MOCK_AUDIT_HOME }) {
  const cc = d.controle_credit
  return (
    <div className="space-y-5">
      {/* Dossiers incomplets */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-red-600" /> Dossiers incomplets / non conformes ({cc.dossiers_incomplets.length})
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Dossier</th>
                <th className="text-left px-3 py-2 font-medium">Client</th>
                <th className="text-right px-3 py-2 font-medium">Montant</th>
                <th className="text-left px-3 py-2 font-medium">Problème détecté</th>
                <th className="text-left px-3 py-2 font-medium">Agent</th>
                <th className="text-center px-3 py-2 font-medium">Risque</th>
                <th className="text-left px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cc.dossiers_incomplets.map((dos, i) => {
                const r = GRAVITE_STYLE[dos.risque] ?? GRAVITE_STYLE.MOYENNE
                return (
                  <tr key={i} className={`hover:bg-slate-50 ${r.row}`}>
                    <td className="px-3 py-2.5 font-mono text-indigo-600 font-bold">{dos.id}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{dos.client}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-700">{formatFcfa(dos.montant)}</td>
                    <td className="px-3 py-2.5 text-orange-700 font-medium">{dos.probleme}</td>
                    <td className="px-3 py-2.5 text-slate-600">{dos.agent}</td>
                    <td className="px-3 py-2.5 text-center"><span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${r.badge}`}>{dos.risque}</span></td>
                    <td className="px-3 py-2.5"><button className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 rounded px-2 py-0.5 font-semibold hover:bg-amber-200 transition-colors">Bloquer</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Retards suspects */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-orange-600" /> Retards avec anomalie historique
          </h4>
          <div className="space-y-2">
            {cc.retards_suspects.map((r, i) => (
              <div key={i} className={`rounded-xl border p-3 ${r.risque === 'CRITIQUE' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900">{r.client}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${GRAVITE_STYLE[r.risque]?.badge ?? ''}`}>{r.risque}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 mb-1.5">
                  <span>{r.retard_jours} jours de retard</span>
                  <span className="font-semibold text-slate-800">{formatFcfa(r.montant)}</span>
                </div>
                <p className="text-[11px] text-red-800 font-medium bg-red-100 rounded px-2 py-1">⚠ {r.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Concentration portefeuille */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-red-600" /> Concentration portefeuille — seuil BCEAO 25%
          </h4>
          <div className="space-y-2">
            {cc.concentration_portefeuille.map((c, i) => (
              <div key={i} className={`rounded-xl p-3 border ${c.statut === 'DEPASSEMENT' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-slate-900">{c.agent}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${c.statut === 'DEPASSEMENT' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-green-100 text-green-800 border-green-200'}`}>
                    {c.statut}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${c.top2_pct > c.seuil_bceao ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(c.top2_pct * 2.5, 100)}%` }} />
                  </div>
                  <span className={`text-sm font-black ${c.top2_pct > c.seuil_bceao ? 'text-red-700' : 'text-green-700'}`}>{c.top2_pct}%</span>
                  <span className="text-[10px] text-slate-500">/ seuil {c.seuil_bceao}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validation irrégulière */}
      <div className="bg-red-50 rounded-xl border border-red-200 p-4">
        <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-red-600" /> Validations irrégulières détectées
        </h4>
        {cc.validation_irreguliere.map((v, i) => (
          <div key={i} className="bg-white rounded-lg border border-red-200 p-3 text-xs">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono font-bold text-indigo-600">{v.dossier}</span>
              <span className="font-bold text-slate-800">{v.valideur}</span>
              <span className="font-semibold text-slate-700">{formatFcfa(v.montant)}</span>
            </div>
            <p className="text-red-800 font-medium">⚠ {v.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AuditTabAgences({ d }: { d: typeof MOCK_AUDIT_HOME }) {
  const radarData = d.audit_agences.map(a => ({
    agence: a.agence.split(' ')[0],
    conformite: a.conformite_pct,
    risque: 100 - (a.anomalies * 6),
    incidents: Math.max(0, 100 - a.incidents_mois * 2.5),
  }))

  return (
    <div className="space-y-5">
      {/* Grille agences */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {d.audit_agences.map((a, i) => {
          const s = RISQUE_AGENCE[a.risque] ?? RISQUE_AGENCE.FAIBLE
          return (
            <div key={i} className={`rounded-xl border p-4 ${s.bg} border-slate-200`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{a.agence}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className={`text-[10px] font-bold ${s.text}`}>{a.risque}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">{a.conformite_pct}%</div>
                  <div className="text-[10px] text-slate-500">conformité</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/70 rounded-lg p-2">
                  <div className={`text-base font-black ${a.anomalies >= 5 ? 'text-red-700' : a.anomalies >= 3 ? 'text-orange-700' : 'text-green-700'}`}>{a.anomalies}</div>
                  <div className="text-[9px] text-slate-500 uppercase">Anomalies</div>
                </div>
                <div className="bg-white/70 rounded-lg p-2">
                  <div className={`text-base font-black ${a.incidents_mois >= 10 ? 'text-red-700' : a.incidents_mois >= 5 ? 'text-orange-700' : 'text-green-700'}`}>{a.incidents_mois}</div>
                  <div className="text-[9px] text-slate-500 uppercase">Incidents</div>
                </div>
                <div className="bg-white/70 rounded-lg p-2">
                  <span className={`text-[9px] font-black px-1 py-0.5 rounded ${a.statut_audit === 'CRITIQUE' ? 'bg-red-600 text-white' : a.statut_audit === 'ALERTE' ? 'bg-orange-500 text-white' : a.statut_audit === 'SURVEILLE' ? 'bg-yellow-500 text-white' : 'bg-green-600 text-white'}`}>
                    {a.statut_audit}
                  </span>
                  <div className="text-[9px] text-slate-500 uppercase mt-0.5">Statut</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Radar conformité */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Analyse radar — conformité réseau</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="agence" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="Conformité" dataKey="conformite" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
              <Radar name="Risque maîtrisé" dataKey="risque" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            <div className="text-xs text-slate-600 font-medium mb-3">Comparaison par indicateur :</div>
            {d.audit_agences.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${RISQUE_AGENCE[a.risque]?.dot}`} />
                <span className="w-28 font-medium text-slate-800 truncate">{a.agence}</span>
                <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${a.conformite_pct >= 95 ? 'bg-green-500' : a.conformite_pct >= 85 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${a.conformite_pct}%` }} />
                </div>
                <span className={`w-8 font-black text-right ${a.conformite_pct >= 95 ? 'text-green-700' : a.conformite_pct >= 85 ? 'text-yellow-700' : 'text-red-700'}`}>{a.conformite_pct}%</span>
                <span className="text-slate-400 text-[10px] w-16 text-right">{a.anomalies} anom.</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuditTabCaisse({ d }: { d: typeof MOCK_AUDIT_HOME }) {
  const cc = d.caisse_comptabilite
  return (
    <div className="space-y-5">
      {/* Écarts caisse */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-red-600" /> Écarts de caisse non résolus
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cc.ecarts_caisse.map((e, i) => (
            <div key={i} className={`rounded-xl border p-4 ${e.type === 'DEFICIT' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-900">{e.agence}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${e.type === 'DEFICIT' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-orange-100 text-orange-800 border-orange-200'}`}>
                  {e.type}
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mb-1">{formatFcfa(e.montant)}</div>
              <div className="text-xs text-slate-600">{e.date} · {e.responsable}</div>
              <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded ${e.statut === 'NON_RESOLU' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {e.statut.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats comptables */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-orange-700">{cc.transactions_manuelles_mois}</div>
          <div className="text-[10px] text-orange-600 font-semibold uppercase">Transactions manuelles / mois</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-red-700">{cc.ecritures_modifiees_mois}</div>
          <div className="text-[10px] text-red-600 font-semibold uppercase">Écritures modifiées</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-yellow-700">{cc.suspens_comptables.length}</div>
          <div className="text-[10px] text-yellow-600 font-semibold uppercase">Suspens comptables</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-slate-700">{cc.ajustements_inhabituels.length}</div>
          <div className="text-[10px] text-slate-600 font-semibold uppercase">Ajustements inhabituels</div>
        </div>
      </div>

      {/* Suspens */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Suspens comptables</h4>
        <div className="space-y-2">
          {cc.suspens_comptables.map((s, i) => (
            <div key={i} className={`rounded-xl border p-3 flex items-center gap-3 ${s.statut === 'CRITIQUE' ? 'bg-red-50 border-red-200' : s.statut === 'ANOMALIE' ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
              <span className="font-mono text-xs font-bold text-indigo-600 w-36">{s.compte}</span>
              <span className="font-semibold text-slate-900 text-sm flex-1">{formatFcfa(s.solde)}</span>
              <span className={`text-[10px] font-bold ${s.age_jours > 30 ? 'text-red-700' : 'text-slate-500'}`}>{s.age_jours}j</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${s.statut === 'CRITIQUE' ? 'bg-red-100 text-red-800 border-red-300' : s.statut === 'ANOMALIE' ? 'bg-orange-100 text-orange-800 border-orange-200' : s.statut === 'A_JUSTIFIER' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-green-100 text-green-800 border-green-200'}`}>{s.statut}</span>
              <span className="text-xs text-slate-500 hidden lg:block max-w-48 truncate">{s.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ajustements inhabituels */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Ajustements inhabituels</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Date / Heure</th>
                <th className="text-left px-3 py-2 font-medium">Compte</th>
                <th className="text-right px-3 py-2 font-medium">Montant</th>
                <th className="text-left px-3 py-2 font-medium">Utilisateur</th>
                <th className="text-left px-3 py-2 font-medium">Justificatif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cc.ajustements_inhabituels.map((a, i) => (
                <tr key={i} className={`${a.justif === 'Aucune' ? 'bg-red-50/50' : ''}`}>
                  <td className="px-3 py-2.5 font-mono text-slate-600">{a.date} {a.heure}</td>
                  <td className="px-3 py-2.5 font-mono text-indigo-600">{a.compte}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{formatFcfa(a.montant)}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{a.user}</td>
                  <td className={`px-3 py-2.5 font-bold ${a.justif === 'Aucune' ? 'text-red-700' : 'text-green-700'}`}>{a.justif}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function AuditTabTracabilite({ d }: { d: typeof MOCK_AUDIT_HOME }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-600" />
          Journal d'audit complet — qui a fait quoi, quand et depuis où
          <AiBadge variant="small" label="Infalsifiable" />
        </h4>
        <ExportButton filename="journal-audit" size="sm" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Horodatage</th>
                <th className="text-left px-4 py-2.5 font-medium">Utilisateur</th>
                <th className="text-left px-4 py-2.5 font-medium">Action effectuée</th>
                <th className="text-left px-4 py-2.5 font-medium">Entité</th>
                <th className="text-left px-4 py-2.5 font-medium">Poste / IP</th>
                <th className="text-center px-4 py-2.5 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {d.tracabilite.map((t, i) => (
                <tr key={i} className={`hover:bg-slate-50 transition-colors ${t.anomalie ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-2.5 font-mono text-slate-500 text-[10px]">{t.heure}</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-indigo-600">{t.user}</td>
                  <td className="px-4 py-2.5 text-slate-800 font-medium">{t.action}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{t.entite}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">{t.poste} · {t.ip}</td>
                  <td className="px-4 py-2.5 text-center">
                    {t.anomalie
                      ? <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">⚠ ANOMALIE</span>
                      : <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">✓ OK</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <Lock className="w-3 h-3" />
        Journal cryptographiquement signé — toute modification est détectée et signalée automatiquement.
      </p>
    </div>
  )
}

// =============================================================================
//   TAB CONFORMITE BCEAO
// =============================================================================
export function AuditTabConformiteBCEAO({ d }: { d: typeof MOCK_AUDIT_HOME }) {
  const bceao = d.conformite_bceao
  const [openIA, setOpenIA] = useState(true)

  const STATUT_STYLE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    CONFORME:     { bg: 'bg-green-50 border-green-200',  text: 'text-green-800',  icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> },
    ATTENTION:    { bg: 'bg-yellow-50 border-yellow-200',text: 'text-yellow-800', icon: <AlertCircle  className="w-3.5 h-3.5 text-yellow-600" /> },
    NON_CONFORME: { bg: 'bg-red-50 border-red-200',      text: 'text-red-800',    icon: <XCircle      className="w-3.5 h-3.5 text-red-600"   /> },
  }

  const ECHEANCE_STYLE: Record<string, string> = {
    EN_COURS:   'bg-red-100 text-red-800 border-red-300',
    A_PREPARER: 'bg-orange-100 text-orange-800 border-orange-200',
    PLANIFIE:   'bg-blue-100 text-blue-800 border-blue-200',
  }

  const nonConformes = bceao.ratios_reglementaires.filter(r => r.statut === 'NON_CONFORME').length
  const attentions   = bceao.ratios_reglementaires.filter(r => r.statut === 'ATTENTION').length

  return (
    <div className="space-y-5">

      {/* Score global + IA BCEAO */}
      <div className="bg-gradient-to-br from-amber-900 via-red-900 to-slate-900 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-amber-300" />
              <h3 className="font-bold text-base">Conformité Réglementaire BCEAO</h3>
              <AiBadge variant="small" pulse label="Évaluation IA" />
            </div>
            <p className="text-xs text-slate-300">Évaluation au {bceao.date_evaluation} · Prochain rapport BCEAO dans <span className="font-black text-amber-300">{bceao.jours_avant_rapport} jours</span></p>
          </div>
          <div className="text-center shrink-0">
            <div className={`text-4xl font-black ${bceao.score_global >= 90 ? 'text-green-400' : bceao.score_global >= 75 ? 'text-amber-400' : 'text-red-400'}`}>{bceao.score_global}<span className="text-xl text-slate-400">/100</span></div>
            <div className={`text-xs font-bold mt-0.5 ${bceao.score_global >= 90 ? 'text-green-400' : bceao.score_global >= 75 ? 'text-amber-400' : 'text-red-400'}`}>{bceao.niveau}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div className="bg-white/10 rounded-xl p-2.5">
            <div className="text-xl font-black text-red-400">{nonConformes}</div>
            <div className="text-[10px] text-slate-300 uppercase">Non conformes</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <div className="text-xl font-black text-amber-400">{attentions}</div>
            <div className="text-[10px] text-slate-300 uppercase">À surveiller</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <div className="text-xl font-black text-green-400">{bceao.ratios_reglementaires.filter(r => r.statut === 'CONFORME').length}</div>
            <div className="text-[10px] text-slate-300 uppercase">Conformes</div>
          </div>
        </div>

        <button onClick={() => setOpenIA(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-xs font-semibold text-amber-200">
          <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Analyse IA BCEAO complète</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${openIA ? 'rotate-180' : ''}`} />
        </button>
        {openIA && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-slate-200 italic border-l-2 border-amber-400 pl-3 leading-relaxed">{bceao.synthese_ia_bceao}</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-3">
              {bceao.points_ia_bceao.map((p: any, i: number) => (
                <div key={i} className={`rounded-xl border p-3 ${TONE_BG[p.tone] ?? 'bg-white/10 border-white/20'}`}>
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${TONE_DOT[p.tone]}`} />
                    <span className="text-xs text-slate-800 leading-snug">{p.texte}</span>
                  </div>
                  {p.action && <div className="ml-4 mt-1 text-[11px] font-semibold text-amber-800 bg-amber-50/80 rounded px-2 py-0.5 border border-amber-200">→ {p.action}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tableau des ratios réglementaires */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-600" />
          <h4 className="text-sm font-bold text-slate-900">Ratios Réglementaires BCEAO</h4>
          <AiBadge variant="small" label="Calcul automatique" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Indicateur</th>
                <th className="text-right px-4 py-3 font-medium">Valeur actuelle</th>
                <th className="text-center px-4 py-3 font-medium">Seuil BCEAO</th>
                <th className="text-center px-4 py-3 font-medium">Statut</th>
                <th className="text-right px-4 py-3 font-medium">Écart</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bceao.ratios_reglementaires.map((r, i) => {
                const s = STATUT_STYLE[r.statut]
                return (
                  <tr key={i} className={`hover:bg-slate-50 ${r.statut === 'NON_CONFORME' ? 'bg-red-50/30' : r.statut === 'ATTENTION' ? 'bg-yellow-50/30' : ''}`}>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.indicateur}</td>
                    <td className="px-4 py-3 text-right font-black text-lg text-slate-900">{r.valeur}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-600">{r.seuil}</td>
                    <td className="px-4 py-3 text-center">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold ${s.bg} ${s.text}`}>
                        {s.icon}
                        {r.statut.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className={`flex items-center justify-end gap-1 font-bold text-sm ${r.delta > 0 && r.statut === 'CONFORME' ? 'text-green-600' : r.delta < 0 && r.statut !== 'CONFORME' ? 'text-red-600' : r.delta > 0 && r.statut === 'NON_CONFORME' ? 'text-red-600' : 'text-green-600'}`}>
                        {r.delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {r.delta > 0 ? '+' : ''}{r.delta}{r.unite}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px] hidden lg:table-cell">{r.description}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Classification CBI + Provisions */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-600" />
            <h4 className="text-sm font-bold text-slate-900">Classes CBI v5 — Provisions Réglementaires</h4>
            <AiBadge variant="small" label="Calcul BCEAO automatique" />
          </div>
          <div className={`px-3 py-1 rounded-lg border text-xs font-bold ${bceao.ecart_provision_total > 0 ? 'bg-red-100 text-red-800 border-red-300' : 'bg-green-100 text-green-800 border-green-200'}`}>
            Écart total : {(bceao.ecart_provision_total / 1_000_000).toFixed(2)}M FCFA
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Classe CBI</th>
                <th className="text-right px-4 py-3 font-medium">Dossiers</th>
                <th className="text-right px-4 py-3 font-medium">Encours</th>
                <th className="text-right px-4 py-3 font-medium">% Ptf</th>
                <th className="text-right px-4 py-3 font-medium">Taux prov. requis</th>
                <th className="text-right px-4 py-3 font-medium">Provision requise</th>
                <th className="text-right px-4 py-3 font-medium">Provision constituée</th>
                <th className="text-right px-4 py-3 font-medium">Écart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bceao.classes_cbi.map((c, i) => {
                const COLOR_MAP: Record<string, string> = { PERFORMANT: 'text-green-700', SOUS_SURVEILLANCE: 'text-orange-700', DOUTEUX: 'text-red-600', COMPROMIS: 'text-red-800', PERTE: 'text-slate-900' }
                const ROW_MAP: Record<string, string>   = { PERFORMANT: '', SOUS_SURVEILLANCE: 'bg-orange-50/20', DOUTEUX: 'bg-red-50/20', COMPROMIS: 'bg-red-50/40', PERTE: 'bg-red-100/40' }
                const formatM = (v: number) => v === 0 ? '—' : `${(v / 1_000_000).toFixed(3)}M`
                return (
                  <tr key={i} className={`hover:bg-slate-50 ${ROW_MAP[c.code]}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${c.code === 'PERFORMANT' ? 'bg-green-500' : c.code === 'SOUS_SURVEILLANCE' ? 'bg-orange-500' : c.code === 'DOUTEUX' ? 'bg-red-500' : c.code === 'COMPROMIS' ? 'bg-red-800' : 'bg-slate-800'}`} />
                        <span className={`font-bold ${COLOR_MAP[c.code]}`}>{c.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{c.count}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatM(c.encours)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${c.pct_portefeuille > 5 && c.code !== 'PERFORMANT' ? 'text-red-700' : 'text-slate-700'}`}>{c.pct_portefeuille}%</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{c.taux_provision_requis}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatM(c.provision_requise)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${c.ecart > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatM(c.provision_constituee)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.ecart > 0
                        ? <span className="text-red-700 font-black">-{formatM(c.ecart)}</span>
                        : <span className="text-green-600 font-bold">✓</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300">
                <td colSpan={5} className="px-4 py-3 font-bold text-slate-800 text-xs uppercase">Total provisions</td>
                <td className="px-4 py-3 text-right font-black text-slate-900">{(bceao.total_provision_requise / 1_000_000).toFixed(3)}M</td>
                <td className="px-4 py-3 text-right font-black text-slate-900">{(bceao.total_provision_constituee / 1_000_000).toFixed(3)}M</td>
                <td className="px-4 py-3 text-right font-black text-red-700">-{(bceao.ecart_provision_total / 1_000_000).toFixed(3)}M</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Calendrier des rapports BCEAO */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <h4 className="text-sm font-bold text-slate-900">Calendrier Réglementaire BCEAO</h4>
          <AiBadge variant="small" label="Alertes automatiques" />
        </div>
        <div className="divide-y divide-slate-50">
          {bceao.calendrier_rapports.map((r, i) => (
            <div key={i} className={`px-5 py-4 flex items-start justify-between gap-4 ${r.statut === 'EN_COURS' ? 'bg-red-50/30' : ''}`}>
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${r.statut === 'EN_COURS' ? 'bg-red-500 animate-pulse' : r.statut === 'A_PREPARER' ? 'bg-orange-500' : 'bg-blue-400'}`} />
                <div>
                  <div className="text-sm font-semibold text-slate-900">{r.rapport}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Indicateurs à mettre à jour : {r.indicateurs_a_update.join(' · ')}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${ECHEANCE_STYLE[r.statut]}`}>
                  {r.echeance}
                </div>
                <div className={`text-xs font-bold mt-1 ${r.jours_restants <= 10 ? 'text-red-600' : r.jours_restants <= 30 ? 'text-orange-600' : 'text-slate-500'}`}>
                  dans {r.jours_restants} jours
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historique conformité */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <h4 className="text-sm font-bold text-slate-900">Évolution Score Conformité BCEAO</h4>
          <AiBadge variant="small" label="Tendance positive" confidence={78} />
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={bceao.historique_conformite} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
            <YAxis domain={[60, 100]} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: any) => [`${v}/100`, 'Score']} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="score" name="Score BCEAO" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-5 gap-2 mt-3">
          {bceao.historique_conformite.map((h, i) => (
            <div key={i} className={`text-center p-2 rounded-lg text-xs border ${h.statut === 'NON_CONFORME' ? 'bg-red-50 border-red-200' : h.statut === 'ATTENTION' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <div className="font-bold text-slate-700">{h.mois}</div>
              <div className={`font-black text-base ${h.statut === 'NON_CONFORME' ? 'text-red-700' : h.statut === 'ATTENTION' ? 'text-yellow-700' : 'text-green-700'}`}>{h.score}</div>
              <div className="text-[9px] text-slate-500">PAR {h.par}%</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// =============================================================================
//   COMPOSANT PRINCIPAL — Dashboard hub
// =============================================================================

const DETAIL_PAGE_ICONS: Record<string, typeof AlertTriangle> = {
  '/audit/anomalies': AlertTriangle,
  '/audit/credit': Search,
  '/audit/agences': Building2,
  '/audit/caisse': Wallet,
  '/audit/tracabilite': Eye,
  '/audit/bceao': BookOpen,
}

export function DashboardAuditeur() {
  const d = MOCK_AUDIT_HOME

  return (
    <div className="space-y-5">

      <RapportIAGlobal
        rapport={RAPPORT_IA_AUDITEUR}
        accentColor="orange"
        analyseLabel="Audit Interne"
      />

      {/* KPIs */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-700" />
            Indicateurs audit du jour
          </h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
              d.kpis.niveau_risque_global === 'CRITIQUE' ? 'bg-red-100 text-red-800 border-red-300'
                : d.kpis.niveau_risque_global === 'ELEVE' ? 'bg-orange-100 text-orange-800 border-orange-200'
                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
            }`}>
              Risque global : {d.kpis.niveau_risque_global}
            </span>
            <ExportButton filename="rapport-audit" size="sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <KpiAlert label="Anomalies actives"   value={d.kpis.anomalies_actives}   sub={`${d.kpis.anomalies_critiques} critiques`}   color="bg-red-50 border border-red-300 text-red-800" />
          <KpiAlert label="Trans. suspectes"    value={d.kpis.transactions_suspectes}                                                  color="bg-orange-50 border border-orange-200 text-orange-800" />
          <KpiAlert label="Alertes fraude"      value={d.kpis.alertes_fraude}                                                          color="bg-red-50 border border-red-200 text-red-700" />
          <KpiAlert label="Écarts caisse"       value={d.kpis.ecarts_caisse}        sub="non résolus"                                  color="bg-orange-50 border border-orange-200 text-orange-800" />
          <KpiAlert label="Dossiers incomplets" value={d.kpis.dossiers_incomplets}                                                     color="bg-yellow-50 border border-yellow-200 text-yellow-800" />
          <KpiAlert label="Ops hors-horaires"   value={d.kpis.ops_hors_horaires}                                                      color="bg-amber-50 border border-amber-200 text-amber-800" />
          <KpiAlert label="Violations procéd."  value={d.kpis.violations_procedures}                                                   color="bg-slate-100 border border-slate-300 text-slate-700" />
          <KpiAlert label="Conformité GPS"      value={`${d.kpis.conformite_pct}%`} sub="+3pts M-1"                                   color="bg-green-50 border border-green-200 text-green-800" />
        </div>
      </section>

      {/* Accès pages détail */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-amber-700" />
          <h2 className="text-sm font-bold text-slate-900">Investigations & contrôles détaillés</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {d.detail_pages.map((p) => {
            const Icon = DETAIL_PAGE_ICONS[p.href] ?? AlertTriangle
            return (
            <Link
              key={p.href}
              href={p.href}
              className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-amber-300 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors duration-200">
                  <Icon className="w-4 h-4 text-amber-800" />
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${p.badgeStyle}`}>{p.badge}</span>
              </div>
              <div className="text-sm font-bold text-slate-900 mb-1">{p.label}</div>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{p.desc}</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 group-hover:text-amber-950">
                Ouvrir le détail <ChevronRight size={12} />
              </span>
            </Link>
            )
          })}
        </div>
      </section>

    </div>
  )
}
