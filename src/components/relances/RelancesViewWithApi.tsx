'use client'

import { useState } from 'react'
import { MessageCircle, Phone, Mail, MapPin, Send, GitBranch, Handshake, Paperclip } from 'lucide-react'
import type { StatutWorkflow, CanalRelance } from '@/lib/relances-hub'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useRelancesHubStrict } from '@/hooks/usePhasesAdStrict'
import { useAuth } from '@/contexts/AuthContext'
import {
  ApiErrorState,
  ApiLoadingState,
  ApiPageShell,
} from '@/components/api-ui'
import { formatFcfa } from '@/lib/utils'
import { ModuleSyntheseIA } from '@/components/modules/ModuleSyntheseIA'
import { ModuleKpiGrid } from '@/components/modules/ModuleKpiGrid'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { cn } from '@/lib/utils'

const CANAL_ICON: Record<CanalRelance, React.ElementType> = {
  WHATSAPP: MessageCircle,
  SMS: Mail,
  APPEL: Phone,
  VISITE: MapPin,
}

const CANAL_COLOR: Record<CanalRelance, string> = {
  WHATSAPP: 'bg-green-100 text-green-800',
  SMS: 'bg-blue-100 text-blue-800',
  APPEL: 'bg-purple-100 text-purple-800',
  VISITE: 'bg-orange-100 text-orange-800',
}

const STATUT_COLOR: Record<string, string> = {
  PLANIFIE: 'bg-slate-100 text-slate-700',
  ENVOYE: 'bg-blue-100 text-blue-800',
  REPONDU: 'bg-emerald-100 text-emerald-800',
  ECHEC: 'bg-red-100 text-red-800',
  PROMESSE: 'bg-amber-100 text-amber-800',
}

const WORKFLOW_STYLE: Record<StatutWorkflow, string> = {
  NOUVEAU: 'bg-slate-100 text-slate-700',
  RELANCE_1: 'bg-blue-100 text-blue-800',
  RELANCE_2: 'bg-indigo-100 text-indigo-800',
  ESCALADE: 'bg-red-100 text-red-800',
  CONTENTIEUX: 'bg-red-200 text-red-900',
  CLOTURE: 'bg-emerald-100 text-emerald-800',
}

const PROMESSE_STYLE = {
  ACTIVE: 'bg-amber-100 text-amber-800',
  TENUE: 'bg-emerald-100 text-emerald-800',
  NON_TENUE: 'bg-red-100 text-red-800',
  PARTIELLE: 'bg-orange-100 text-orange-800',
}

export function RelancesViewWithApi() {
  const { user } = useAuth()
  const hidePreuves = user?.role === 'GESTIONNAIRE_PORTEFEUILLE'
  const { hub, state, error, reload } = useRelancesHubStrict()
  const [section, setSection] = useState<'relances' | 'workflows' | 'promesses' | 'preuves'>('relances')
  const [canalFilter, setCanalFilter] = useState<CanalRelance | 'ALL'>('ALL')

  const sectionTabs = [
    { id: 'relances' as const, label: 'Relances', icon: Send },
    { id: 'workflows' as const, label: 'Workflows', icon: GitBranch },
    { id: 'promesses' as const, label: 'Promesses', icon: Handshake },
    ...(hidePreuves ? [] : [{ id: 'preuves' as const, label: 'Preuves', icon: Paperclip }]),
  ]

  if (state === 'loading') {
    return (
      <ApiPageShell title="Relances intelligentes" endpoint="GET /operations/relances">
        <ApiLoadingState label="Chargement relances…" />
      </ApiPageShell>
    )
  }

  if (state === 'error' || !hub) {
    return (
      <ApiPageShell title="Relances intelligentes" endpoint="GET /operations/relances" onRefresh={() => void reload()}>
        <ApiErrorState message={error ?? 'Erreur relances'} onRetry={() => void reload()} />
      </ApiPageShell>
    )
  }

  const k = hub.kpis
  const filtered =
    canalFilter === 'ALL'
      ? hub.relances
      : hub.relances.filter(
          (r) => r.canal_recommande === canalFilter || r.canal_utilise === canalFilter,
        )

  const chartCanaux = hub.stats_canaux.map((s) => ({
    canal: s.canal,
    taux_reponse_pct: s.taux_pct,
    reponses: s.reponses,
  }))

  return (
    <ApiPageShell
      title="Relances intelligentes"
      subtitle="Orchestration multi-canal, workflows et promesses — données backend."
      endpoint="GET /operations/relances"
      onRefresh={() => void reload()}
    >
      <ModuleSyntheseIA texte={hub.synthese_ia} titre="Synthèse IA — Relances intelligentes" />
      <ModuleKpiGrid
        cols={6}
        items={[
          { label: 'Relances jour', value: String(k.relances_jour) },
          { label: 'Taux réponse', value: `${k.taux_reponse_pct}%`, highlight: 'teal' },
          { label: 'Récupéré', value: formatFcfa(k.montant_recupere_fcfa), highlight: 'teal' },
          { label: 'Promesses', value: String(k.promesses_jour), highlight: 'blue' },
          { label: 'Échecs envoi', value: String(k.echecs_envoi), highlight: 'red' },
          { label: 'Économie IA', value: formatFcfa(k.economie_ia_fcfa), sub: 'vs manuel' },
        ]}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {sectionTabs.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors duration-200',
              section === s.id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <s.icon size={16} />
            {s.label}
          </button>
        ))}
      </div>

      {section === 'workflows' && (
        <div className="space-y-3">
          {hub.workflows.map((w) => (
            <div key={w.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-bold text-slate-900">{w.client}</span>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded', WORKFLOW_STYLE[w.etape])}>
                  {w.etape}
                </span>
                <span className="text-xs text-slate-500">J+{w.jours_retard} · {w.agent}</span>
              </div>
              <p className="text-sm text-teal-800 bg-teal-50 p-2 rounded border border-teal-100">{w.action_ia}</p>
              <div className="text-xs text-slate-500 mt-2">Prochaine échéance : {w.prochaine_echeance}</div>
            </div>
          ))}
        </div>
      )}

      {section === 'promesses' && (
        <div className="grid md:grid-cols-2 gap-4">
          {hub.promesses.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900">{p.client}</span>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded', PROMESSE_STYLE[p.statut])}>
                  {p.statut}
                </span>
                <AiBadge variant="small" confidence={p.score_tenue_ia} label="Tenue IA" />
              </div>
              <div className="text-2xl font-black text-teal-700 mt-2">{formatFcfa(p.montant_fcfa)}</div>
              <div className="text-xs text-slate-500 mt-1">
                Promesse {p.date_promesse} → échéance {p.date_echeance} · {p.canal}
              </div>
              <div className="text-xs text-slate-600 mt-1">{p.agent}</div>
            </div>
          ))}
        </div>
      )}

      {section === 'preuves' && (
        <>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm mb-4">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Performance par canal</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartCanaux}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="canal" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="taux_reponse_pct" name="Taux réponse %" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reponses" name="Réponses" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Fichier / Réf.</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">IA</th>
                </tr>
              </thead>
              <tbody>
                {hub.preuves.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{p.client}</td>
                    <td className="px-4 py-3">{p.type}</td>
                    <td className="px-4 py-3 text-slate-600">{p.date}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.fichier ?? p.reference ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'text-xs font-bold px-2 py-0.5 rounded',
                          p.verifie_ia ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100',
                        )}
                      >
                        {p.verifie_ia ? 'Vérifié IA' : 'Manuel'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {section === 'relances' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {(['ALL', 'WHATSAPP', 'SMS', 'APPEL', 'VISITE'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCanalFilter(c)}
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-colors duration-200',
                  canalFilter === c ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {c === 'ALL' ? 'Tous' : c}
              </button>
            ))}
          </div>
          <div className="grid gap-3">
            {filtered.map((r) => {
              const Icon = CANAL_ICON[r.canal_recommande]
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:border-teal-200 transition-colors duration-200"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{r.client}</span>
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded', STATUT_COLOR[r.statut])}>
                          {r.statut}
                        </span>
                        <AiBadge variant="small" confidence={r.score_ia} />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {r.agence} · {r.agent} · J+{r.jours_retard} · {formatFcfa(r.montant_fcfa)}
                      </div>
                    </div>
                    <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold', CANAL_COLOR[r.canal_recommande])}>
                      <Icon size={14} />
                      {r.canal_recommande}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    {r.message_ia}
                  </p>
                </div>
              )
            })}
          </div>
        </>
      )}
    </ApiPageShell>
  )
}
