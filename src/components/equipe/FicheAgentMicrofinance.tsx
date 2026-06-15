'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  ArrowLeft, MapPin, Target, Flame, User, Phone, Mail, Calendar,
  History, Footprints, Wallet, Users, Navigation, Clock, CheckCircle2,
  AlertTriangle, ExternalLink, Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { FicheAgentMicrofinance, VisiteTerrain, ClientPortefeuille } from '@/lib/fiche-agent-microfinance'
import { formatFcfa, cn } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'

const AgentZoneMap = dynamic(() => import('@/components/equipe/AgentZoneMap'), { ssr: false })

const TABS_TERRAIN = [
  { id: 'synthese', label: 'Synthèse' },
  { id: 'journal', label: 'Journal terrain' },
  { id: 'visites', label: 'Visites' },
  { id: 'recouvrement', label: 'Recouvrement' },
  { id: 'zones', label: 'Zones' },
  { id: 'portefeuille', label: 'Portefeuille' },
] as const

const TABS_RA = [
  { id: 'synthese', label: 'Synthèse' },
  { id: 'equipe', label: 'Équipe terrain' },
  { id: 'portefeuille', label: 'Portefeuille agence' },
] as const

type TabIdTerrain = (typeof TABS_TERRAIN)[number]['id']
type TabIdRA = (typeof TABS_RA)[number]['id']
type TabId = TabIdTerrain | TabIdRA

const BADGE_STYLE: Record<string, string> = {
  OR: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  ARGENT: 'bg-slate-200 text-slate-600 border-slate-300',
  BRONZE: 'bg-orange-100 text-orange-700 border-orange-300',
}

const STATUT_CLIENT: Record<ClientPortefeuille['statut'], string> = {
  PERFORMANT: 'bg-emerald-100 text-emerald-800',
  SURVEILLANCE: 'bg-amber-100 text-amber-800',
  RETARD: 'bg-orange-100 text-orange-800',
  DEFAUT: 'bg-red-100 text-red-800',
}

const PORTEFEUILLE_PAGE_SIZE = 25
const RECOUVREMENT_PAGE_SIZE = 25

interface Props {
  agent: FicheAgentMicrofinance
}

export function FicheAgentMicrofinanceView({ agent }: Props) {
  const router = useRouter()
  const isRA = agent.est_responsable_agence === true
  const isGP = agent.est_gestionnaire_portefeuille === true
  const tabs = isRA ? TABS_RA : isGP
    ? [
        { id: 'synthese' as const, label: 'Synthèse' },
        { id: 'recouvrement' as const, label: 'Relances & échéances' },
        { id: 'portefeuille' as const, label: 'Portefeuille' },
      ]
    : TABS_TERRAIN
  const [tab, setTab] = useState<TabId>('synthese')
  const initiales = agent.nom.split(' ').map(n => n[0]).join('').slice(0, 2)
  const encoursAgence = agent.zones.reduce((s, z) => s + z.encours_fcfa, 0)

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 cursor-pointer">
        <ArrowLeft size={16} /> Retour
      </button>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 rounded-2xl p-5 md:p-6 text-white shadow-lg">
        <div className="flex flex-wrap gap-4 items-start">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/30 border border-teal-400/30 flex items-center justify-center text-xl font-black">
            #{agent.rang}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-black">{agent.nom}</h1>
              {agent.badge && (
                <span className={cn('text-xs px-2 py-0.5 rounded border font-bold', BADGE_STYLE[agent.badge])}>{agent.badge}</span>
              )}
              <span className="text-xs font-mono text-slate-400">{agent.matricule}</span>
            </div>
            <p className="text-slate-300 text-sm">{agent.role} · {agent.agence}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Mail size={12} /> {agent.email}</span>
              <span className="flex items-center gap-1"><Phone size={12} /> {agent.telephone}</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> Depuis {agent.date_embauche}</span>
            </div>
            {agent.streak_jours > 0 && !isRA && (
              <p className="text-xs text-orange-300 font-medium mt-2 flex items-center gap-1">
                <Flame size={12} /> {agent.streak_jours} jours consécutifs d&apos;activité terrain
              </p>
            )}
            {isRA && agent.equipe_terrain && (
              <p className="text-xs text-teal-300 font-medium mt-2">
                {agent.equipe_terrain.filter(m => m.role === 'Commercial').length} commerciaux zones · {agent.equipe_terrain.filter(m => m.role === 'GP').length} GP · {agent.clients_portefeuille} clients agence
              </p>
            )}
            {isGP && (
              <p className="text-xs text-teal-300 font-medium mt-2">
                {agent.clients_portefeuille} clients agence — mêmes dossiers que les commerciaux, vue crédit (échéances, relances, fidélisation)
              </p>
            )}
            {!isRA && !isGP && (
              <p className="text-xs text-teal-300 font-medium mt-2">
                {agent.clients_portefeuille} clients agence — mêmes dossiers que le GP, vue terrain (zones, visites, prospection)
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-4xl font-black text-teal-300">{agent.score}<span className="text-lg text-slate-400">/100</span></div>
            <div className="text-xs text-slate-400">Score IA performance</div>
            <div className="mt-2"><AiBadge variant="small" label="Prospera AI" /></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-5 pt-5 border-t border-white/10">
          {isRA ? (
            <>
              <HeroKpi label="Portefeuille agence" value={`${agent.clients_portefeuille} clients`} />
              <HeroKpi label="À risque" value={String(agent.clients_a_risque)} alert={agent.clients_a_risque > 5} />
              <HeroKpi label="PAR agence" value={`${agent.par} %`} alert={agent.par > 10} />
              <HeroKpi label="Recouvrement" value={`${agent.recouvrement} %`} />
              <HeroKpi label="Agents terrain" value={`${agent.equipe_terrain?.filter(m => m.role === 'Commercial').length ?? 0} com.`} />
              <HeroKpi label="Encours agence" value={formatFcfa(encoursAgence)} />
            </>
          ) : (
            <>
              <HeroKpi label="Portefeuille" value={`${agent.clients_portefeuille} clients`} />
              <HeroKpi label="À risque" value={String(agent.clients_a_risque)} alert={agent.clients_a_risque > 5} />
              <HeroKpi label="PAR zone" value={`${agent.par} %`} alert={agent.par > 10} />
              <HeroKpi label="Recouvrement" value={`${agent.recouvrement} %`} />
              <HeroKpi label="GPS conforme" value={`${agent.gps_conformite_pct} %`} />
              <HeroKpi label="Dernière visite" value={agent.derniere_visite} />
            </>
          )}
        </div>
      </div>

      {/* Tournée du jour — agents terrain uniquement */}
      {!isRA && !isGP && agent.tournée_aujourdhui.length > 0 && (() => {
        const etapesClient = agent.tournée_aujourdhui.filter(t => t.client !== '—')
        const faitClient = etapesClient.filter(t => t.statut === 'FAIT').length
        return (
        <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-teal-50 border-b border-teal-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-teal-900">
              <Navigation size={16} /> Tournée du jour — 28/05/2026
            </div>
            <span className="text-xs text-teal-700">
              {faitClient}/{etapesClient.length} visites client · {agent.tournée_aujourdhui.filter(t => t.statut === 'FAIT').length}/{agent.tournée_aujourdhui.length} étapes
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {agent.tournée_aujourdhui.map((t, i) => (
              <div key={i} className={cn('flex items-center gap-4 px-4 py-2.5 text-sm', t.statut === 'FAIT' && 'bg-emerald-50/50')}>
                <span className="font-mono text-xs text-slate-500 w-12 shrink-0">{t.heure}</span>
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0',
                  t.statut === 'FAIT' ? 'bg-emerald-100 text-emerald-800' :
                  t.statut === 'REPORTE' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600',
                )}>{t.statut}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-800">{t.client}</span>
                  <span className="text-slate-500 text-xs ml-2">{t.type}</span>
                </div>
                <span className="text-xs text-slate-500 truncate max-w-[180px] hidden md:block">{t.adresse}</span>
              </div>
            ))}
          </div>
        </div>
        )
      })()}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-px">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors cursor-pointer',
              tab === t.id ? 'bg-white border border-slate-200 border-b-white text-teal-700 -mb-px' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {t.label}
            {t.id === 'visites' && !isRA && !isGP && (
              <span className="ml-1.5 text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full">{agent.realise.visites}/{agent.objectifs.visites}</span>
            )}
            {t.id === 'equipe' && isRA && agent.equipe_terrain && (
              <span className="ml-1.5 text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full">{agent.equipe_terrain.length}</span>
            )}
            {t.id === 'portefeuille' && (
              <span className="ml-1.5 text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full">{agent.clients_portefeuille}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'synthese' && <TabSynthese agent={agent} isRA={isRA} isGP={isGP} />}
      {tab === 'equipe' && isRA && <TabEquipeTerrain agent={agent} />}
      {tab === 'journal' && !isRA && !isGP && <TabJournal agent={agent} />}
      {tab === 'visites' && !isRA && !isGP && <TabVisites agent={agent} />}
      {tab === 'recouvrement' && !isRA && <TabRecouvrement agent={agent} isGP={isGP} />}
      {tab === 'zones' && !isRA && !isGP && <TabZones agent={agent} />}
      {tab === 'portefeuille' && (isRA ? <TabPortefeuilleAgence agent={agent} /> : <TabPortefeuille agent={agent} isGP={isGP} />)}
    </div>
  )
}

function TabSynthese({ agent, isRA, isGP }: { agent: FicheAgentMicrofinance; isRA: boolean; isGP?: boolean }) {
  return (
    <div className="grid lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 space-y-4">
        <Card title="Analyse IA performance" icon={<Sparkles size={15} className="text-teal-600" />}>
          <p className="text-sm text-slate-700 leading-relaxed">{agent.ia_analyse}</p>
        </Card>
        <Card title={isRA ? 'Objectifs agence vs réalisé' : isGP ? 'Indicateurs GP — suivi portefeuille' : 'Objectifs du mois vs réalisé'} icon={<Target size={15} />}>
          <div className="grid sm:grid-cols-2 gap-3">
            {!isRA && !isGP && (
              <ObjectifBar label="Visites terrain" realise={agent.realise.visites} objectif={agent.objectifs.visites} format="number" />
            )}
            {isGP && (
              <ObjectifBar label="Relances / mois" realise={agent.realise.visites} objectif={agent.objectifs.visites} format="number" />
            )}
            <ObjectifBar label="Collecte" realise={agent.realise.collecte} objectif={agent.objectifs.collecte} format="fcfa" />
            <ObjectifBar label="Recouvrement" realise={agent.realise.recouvrement} objectif={agent.objectifs.recouvrement} format="pct" />
            <ObjectifBar label="Nouveaux clients" realise={agent.realise.nouveaux_clients} objectif={agent.objectifs.nouveaux_clients} format="number" />
            <ObjectifBar label="Décaissements" realise={agent.realise.decaissements} objectif={agent.objectifs.decaissements} format="number" />
          </div>
        </Card>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <h3 className="text-xs font-bold text-green-800 uppercase mb-2 flex items-center gap-1"><CheckCircle2 size={12} /> Points forts</h3>
            <ul className="space-y-1">{agent.points_forts.map((p, i) => <li key={i} className="text-sm text-green-900">· {p}</li>)}</ul>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
            <h3 className="text-xs font-bold text-orange-800 uppercase mb-2 flex items-center gap-1"><AlertTriangle size={12} /> Points d&apos;attention</h3>
            <ul className="space-y-1">{agent.points_attention.map((p, i) => <li key={i} className="text-sm text-orange-900">· {p}</li>)}</ul>
          </div>
        </div>
      </div>
      <div className="lg:col-span-5 space-y-4">
        <Card title="Évolution 6 mois" icon={<Target size={15} />}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={agent.historique_6m}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1_000_000).toFixed(1)}M`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" domain={[50, 100]} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="collecte" name="Collecte" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="recouvrement" name="Remb. %" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        {agent.tournees.length > 0 && (
          <Card title="Performance journalière (4 jours)" icon={<Footprints size={15} />}>
            {agent.tournees.map(t => (
              <div key={t.date} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
                <div>
                  <div className="font-medium">{t.date}</div>
                  <div className="text-xs text-slate-500">{t.checkin}{t.checkout ? ` → ${t.checkout}` : ' · en cours'} · {t.km_parcourus} km</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-teal-700">{formatFcfa(t.collecte_jour_fcfa)}</div>
                  <div className="text-xs text-slate-500">{t.visites_realisees}/{t.visites_prevues} visites</div>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  )
}

function TabJournal({ agent }: { agent: FicheAgentMicrofinance }) {
  const CAT_COLOR: Record<string, string> = {
    VISITE: 'bg-blue-100 text-blue-800',
    PAIEMENT: 'bg-emerald-100 text-emerald-800',
    RECOUVREMENT: 'bg-orange-100 text-orange-800',
    DECAISSEMENT: 'bg-purple-100 text-purple-800',
    PROSPECTION: 'bg-cyan-100 text-cyan-800',
    ADMIN: 'bg-slate-100 text-slate-700',
    GPS: 'bg-teal-100 text-teal-800',
  }

  return (
    <Card title={`Journal d'activité terrain (${agent.journal.length} entrées)`} icon={<History size={15} />}>
      {agent.journal.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">Aucune activité enregistrée</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-bold">Date</th>
                <th className="px-3 py-2 font-bold">Heure</th>
                <th className="px-3 py-2 font-bold">Catégorie</th>
                <th className="px-3 py-2 font-bold">Action</th>
                <th className="px-3 py-2 font-bold">Client</th>
                <th className="px-3 py-2 font-bold text-right">Montant</th>
                <th className="px-3 py-2 font-bold text-center">GPS</th>
                <th className="px-3 py-2 font-bold">Détail</th>
              </tr>
            </thead>
            <tbody>
              {agent.journal.map(j => (
                <tr key={j.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5 whitespace-nowrap">{j.date}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{j.heure}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', CAT_COLOR[j.categorie] ?? 'bg-slate-100')}>{j.categorie}</span>
                  </td>
                  <td className="px-3 py-2.5 font-medium">{j.libelle}</td>
                  <td className="px-3 py-2.5 text-xs">{j.client ?? '—'}</td>
                  <td className="px-3 py-2.5 text-right font-bold tabular-nums">{j.montant_fcfa ? formatFcfa(j.montant_fcfa) : '—'}</td>
                  <td className="px-3 py-2.5 text-center">{j.gps_ok === true ? '✓' : j.gps_ok === false ? '✗' : '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 max-w-[200px] truncate">{j.detail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function TabVisites({ agent }: { agent: FicheAgentMicrofinance }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(agent.visites_terrain.length / RECOUVREMENT_PAGE_SIZE))
  const paginated = agent.visites_terrain.slice((page - 1) * RECOUVREMENT_PAGE_SIZE, page * RECOUVREMENT_PAGE_SIZE)
  const start = agent.visites_terrain.length === 0 ? 0 : (page - 1) * RECOUVREMENT_PAGE_SIZE + 1
  const end = Math.min(page * RECOUVREMENT_PAGE_SIZE, agent.visites_terrain.length)

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <FinBox label="Visites ce mois" value={`${agent.realise.visites} / ${agent.objectifs.visites}`} />
        <FinBox label="Enregistrées" value={String(agent.visites_terrain.length)} />
        <FinBox label="GPS conforme" value={`${agent.gps_conformite_pct} %`} />
      </div>
      <Card title={`Historique visites terrain (${agent.realise.visites} / ${agent.objectifs.visites} ce mois)`} icon={<Footprints size={15} />}>
      {agent.visites_terrain.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">Aucune visite enregistrée</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-bold">Date / Heure</th>
                <th className="px-3 py-2 font-bold">Client</th>
                <th className="px-3 py-2 font-bold">Type</th>
                <th className="px-3 py-2 font-bold">Adresse</th>
                <th className="px-3 py-2 font-bold text-center">GPS écart</th>
                <th className="px-3 py-2 font-bold">Résultat</th>
                <th className="px-3 py-2 font-bold text-right">Recouvré</th>
                <th className="px-3 py-2 font-bold text-center">Durée</th>
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {paginated.map(v => (
                <VisiteRow key={v.id} visite={v} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {agent.visites_terrain.length > RECOUVREMENT_PAGE_SIZE && (
        <div className="flex items-center justify-between px-1 pt-3 mt-1 border-t border-slate-100 text-xs text-slate-600">
          <span>{start}–{end} sur {agent.visites_terrain.length} visites</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 font-medium">{page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
      </Card>
    </div>
  )
}

function VisiteRow({ visite: v }: { visite: VisiteTerrain }) {
  return (
    <tr className={cn('border-t border-slate-100 hover:bg-slate-50', !v.gps_conforme && 'bg-red-50/30')}>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="font-medium">{v.date}</div>
        <div className="text-xs text-slate-500 font-mono">{v.heure}</div>
      </td>
      <td className="px-3 py-2.5">
        <div className="font-medium text-slate-900">{v.client}</div>
        {v.client_id && <div className="text-[10px] font-mono text-slate-400">{v.client_id}</div>}
      </td>
      <td className="px-3 py-2.5 text-xs">{v.type.replace('_', ' ')}</td>
      <td className="px-3 py-2.5 text-xs text-slate-600 max-w-[160px] truncate" title={v.adresse}>{v.adresse}</td>
      <td className={cn('px-3 py-2.5 text-center text-xs font-bold', v.ecart_m <= 50 ? 'text-emerald-600' : v.ecart_m <= 100 ? 'text-amber-600' : 'text-red-600')}>
        {v.ecart_m} m
      </td>
      <td className="px-3 py-2.5">
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded',
          v.resultat === 'POSITIVE' ? 'bg-emerald-100 text-emerald-800' :
          v.resultat === 'NEGATIVE' ? 'bg-red-100 text-red-800' :
          v.resultat === 'PROMESSE_PAIEMENT' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100',
        )}>{v.resultat.replace('_', ' ')}</span>
      </td>
      <td className="px-3 py-2.5 text-right font-bold tabular-nums text-emerald-700">
        {v.montant_recouvre_fcfa ? formatFcfa(v.montant_recouvre_fcfa) : '—'}
      </td>
      <td className="px-3 py-2.5 text-center text-xs">{v.duree_min} min</td>
      <td className="px-3 py-2.5">
        {v.client_id && (
          <Link href={`/dashboard/credit/clients/${v.client_id}`} className="text-teal-600 hover:text-teal-800" title="Fiche client">
            <ExternalLink size={14} />
          </Link>
        )}
      </td>
    </tr>
  )
}

function TabRecouvrement({ agent, isGP }: { agent: FicheAgentMicrofinance; isGP?: boolean }) {
  const [page, setPage] = useState(1)
  const totalRecouvre = agent.recouvrements.reduce((s, r) => s + r.montant_recouvre_fcfa, 0)
  const actionsMois = agent.recouvrements.length
  const objectifActions = agent.objectifs.visites
  const totalPages = Math.max(1, Math.ceil(agent.recouvrements.length / RECOUVREMENT_PAGE_SIZE))
  const paginated = agent.recouvrements.slice((page - 1) * RECOUVREMENT_PAGE_SIZE, page * RECOUVREMENT_PAGE_SIZE)
  const start = agent.recouvrements.length === 0 ? 0 : (page - 1) * RECOUVREMENT_PAGE_SIZE + 1
  const end = Math.min(page * RECOUVREMENT_PAGE_SIZE, agent.recouvrements.length)

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <FinBox
          label={isGP ? 'Relances ce mois' : 'Actions recouvrement (mois)'}
          value={`${actionsMois} / ${objectifActions}`}
        />
        <FinBox label="Montant recouvré" value={formatFcfa(totalRecouvre)} highlight={totalRecouvre > 0} />
        <FinBox label="Taux recouvrement mois" value={`${agent.recouvrement} %`} />
      </div>
      <Card title="Historique recouvrement" icon={<Wallet size={15} />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-bold">Date</th>
                <th className="px-3 py-2 font-bold">Client</th>
                <th className="px-3 py-2 font-bold">Type</th>
                <th className="px-3 py-2 font-bold">Canal</th>
                <th className="px-3 py-2 font-bold text-right">Dû</th>
                <th className="px-3 py-2 font-bold text-right">Recouvré</th>
                <th className="px-3 py-2 font-bold text-center">Retard</th>
                <th className="px-3 py-2 font-bold">Résultat</th>
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {paginated.map(r => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div>{r.date}</div>
                    <div className="text-xs font-mono text-slate-500">{r.heure}</div>
                  </td>
                  <td className="px-3 py-2.5 font-medium">{r.client}</td>
                  <td className="px-3 py-2.5 text-xs">{r.type.replace('_', ' ')}</td>
                  <td className="px-3 py-2.5 text-xs">{r.canal}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatFcfa(r.montant_du_fcfa)}</td>
                  <td className={cn('px-3 py-2.5 text-right font-bold tabular-nums', r.montant_recouvre_fcfa > 0 ? 'text-emerald-700' : 'text-slate-400')}>
                    {r.montant_recouvre_fcfa > 0 ? formatFcfa(r.montant_recouvre_fcfa) : '—'}
                  </td>
                  <td className={cn('px-3 py-2.5 text-center font-bold text-xs', r.jours_retard > 0 ? 'text-red-600' : 'text-emerald-600')}>
                    {r.jours_retard > 0 ? `J+${r.jours_retard}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[180px]">
                    {r.resultat}
                    {r.prochaine_action && <div className="text-teal-700 font-medium mt-0.5">→ {r.prochaine_action}</div>}
                  </td>
                  <td className="px-3 py-2.5">
                    {r.client_id && (
                      <Link href={`/dashboard/credit/clients/${r.client_id}`} className="text-teal-600"><ExternalLink size={14} /></Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {agent.recouvrements.length > RECOUVREMENT_PAGE_SIZE && (
          <div className="flex items-center justify-between px-1 pt-3 mt-1 border-t border-slate-100 text-xs text-slate-600">
            <span>{start}–{end} sur {agent.recouvrements.length} actions</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-medium">{page} / {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function TabZones({ agent }: { agent: FicheAgentMicrofinance }) {
  return (
    <div className="grid lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 space-y-4">
        <Card title={`Zones gérées (${agent.zones.length})`} icon={<MapPin size={15} />}>
          <div className="space-y-4">
            {agent.zones.map(z => (
              <div key={z.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex flex-wrap justify-between gap-2 mb-3">
                  <div>
                    <div className="font-bold text-slate-900">{z.nom}</div>
                    <div className="text-xs text-slate-500">{z.agence} · {z.id}</div>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded h-fit',
                    z.statut === 'BON' ? 'bg-emerald-100 text-emerald-800' :
                    z.statut === 'TENSION' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800',
                  )}>{z.statut}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  <div><span className="text-slate-500 text-xs">Couverture</span><div className="font-bold">{z.couverture_pct} %</div></div>
                  <div><span className="text-slate-500 text-xs">Clients</span><div className="font-bold">{z.clients_assignes}</div></div>
                  <div><span className="text-slate-500 text-xs">Encours</span><div className="font-bold">{formatFcfa(z.encours_fcfa)}</div></div>
                  <div><span className="text-slate-500 text-xs">PAR zone</span><div className={cn('font-bold', z.par_pct > 10 ? 'text-red-600' : 'text-emerald-600')}>{z.par_pct} %</div></div>
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold">Quartiers : </span>{z.quartiers.join(' · ')}
                </div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${z.couverture_pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="lg:col-span-5">
        <Card title="Couverture & visites du mois" icon={<Navigation size={15} />}>
          {agent.zones.length > 0 ? (
            <AgentZoneMap
              zones={agent.zones}
              visites={agent.visites_terrain}
              agentNom={agent.nom}
              height="320px"
            />
          ) : (
            <p className="text-sm text-slate-500 py-8 text-center">Aucune zone terrain assignée.</p>
          )}
          <dl className="text-sm space-y-2 mt-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between"><dt className="text-slate-500">Conformité GPS</dt><dd className="font-bold">{agent.gps_conformite_pct} %</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Visites ce mois</dt><dd className="font-bold">{agent.realise.visites}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Collecte zone</dt><dd className="font-bold">{formatFcfa(agent.zones.reduce((s, z) => s + z.collecte_mois_fcfa, 0))}</dd></div>
          </dl>
        </Card>
      </div>
    </div>
  )
}

function TabEquipeTerrain({ agent }: { agent: FicheAgentMicrofinance }) {
  const equipe = agent.equipe_terrain ?? []
  const commerciaux = equipe.filter(m => m.role === 'Commercial')
  const totalCommerciaux = commerciaux.reduce((s, m) => s + m.clients, 0)
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600 px-1">
        <strong>{agent.clients_portefeuille} clients</strong> pour l&apos;agence — répartis entre les commerciaux par zone terrain
        ({totalCommerciaux} clients couverts) ; le GP supervise l&apos;ensemble du portefeuille ({agent.clients_portefeuille} clients, échéances et relances).
      </p>
      <Card title="Commerciaux — zones terrain" icon={<Footprints size={15} />}>
        <EquipeMembreTable membres={equipe.filter(m => m.role === 'Commercial')} />
      </Card>
      <Card title="Gestionnaire(s) de portefeuille — suivi crédit" icon={<Wallet size={15} />}>
        <EquipeMembreTable membres={equipe.filter(m => m.role === 'GP')} />
      </Card>
    </div>
  )
}

function EquipeMembreTable({ membres }: { membres: NonNullable<FicheAgentMicrofinance['equipe_terrain']> }) {
  if (membres.length === 0) return <p className="text-xs text-slate-500">Aucun membre.</p>
  return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-bold">Agent</th>
                <th className="px-3 py-2 font-bold">Zone / périmètre</th>
                <th className="px-3 py-2 font-bold text-center">Clients</th>
                <th className="px-3 py-2 font-bold text-right">Encours</th>
                <th className="px-3 py-2 font-bold text-center">Recouv.</th>
                <th className="px-3 py-2 font-bold text-center">{membres[0]?.role === 'GP' ? 'Relances' : 'Visites'}</th>
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {membres.map(m => (
                <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-semibold">{m.nom}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{m.zone ?? '—'}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="font-bold">{m.clients}</div>
                    <div className="text-[10px] text-slate-500">
                      {m.role === 'GP' ? 'portefeuille agence' : 'zone terrain'}
                    </div>
                    {m.clients_a_risque > 0 && <div className="text-[10px] text-red-600">{m.clients_a_risque} à risque</div>}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium">{formatFcfa(m.encours_fcfa)}</td>
                  <td className={cn('px-3 py-2.5 text-center font-bold', m.recouvrement_pct >= 85 ? 'text-emerald-600' : m.recouvrement_pct >= 70 ? 'text-amber-600' : 'text-red-600')}>
                    {m.recouvrement_pct} %
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs">
                    {m.visites_mois} / {m.visites_objectif}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={m.lien_fiche} className="text-teal-600 hover:text-teal-800" title="Fiche agent">
                      <ExternalLink size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  )
}

function TabPortefeuilleAgence({ agent }: { agent: FicheAgentMicrofinance }) {
  const equipe = agent.equipe_terrain ?? []
  const encoursTotal = agent.zones.reduce((s, z) => s + z.encours_fcfa, 0)
  const commerciaux = equipe.filter(m => m.role === 'Commercial')
  const gps = equipe.filter(m => m.role === 'GP')

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-4 gap-3">
        <FinBox label="Clients uniques" value={String(agent.clients_portefeuille)} />
        <FinBox label="Encours total" value={formatFcfa(encoursTotal)} />
        <FinBox label="Commerciaux" value={String(commerciaux.length)} />
        <FinBox label="GP suivi crédit" value={String(gps.length)} />
      </div>
      <Card title={`Vues portefeuille par rôle — ${agent.clients_portefeuille} clients agence`} icon={<Users size={15} />}>
        <div className="space-y-3">
          {equipe.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
              <div className={cn(
                'shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold',
                m.role === 'Commercial' ? 'bg-blue-100 text-blue-800' : 'bg-teal-100 text-teal-800',
              )}>
                {m.role === 'Commercial' ? 'COM' : 'GP'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900">
                  {m.nom} <span className="text-xs font-normal text-slate-500">· {m.role}</span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {m.zone} — <strong>{m.clients} clients</strong>
                  {m.role === 'GP' ? ' (portefeuille agence)' : ' (zone terrain)'} · recouvrement {m.recouvrement_pct} %
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {m.vue_portefeuille === 'GP'
                    ? 'Vue crédit : échéances, relances, fidélisation'
                    : 'Vue terrain : zones, visites, prospection'}
                </div>
              </div>
              <Link href={m.lien_fiche} className="shrink-0 text-xs text-teal-700 font-medium hover:text-teal-900 flex items-center gap-1">
                Fiche <ExternalLink size={12} />
              </Link>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-4 px-1">
          Les commerciaux couvrent leurs zones terrain ({commerciaux.reduce((s, m) => s + m.clients, 0)} clients) ; le GP supervise les {agent.clients_portefeuille} clients de l&apos;agence (échéances, relances, fidélisation).
        </p>
      </Card>
    </div>
  )
}

function TabPortefeuille({ agent, isGP }: { agent: FicheAgentMicrofinance; isGP: boolean }) {
  const [filtre, setFiltre] = useState('')
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => {
    const q = filtre.toLowerCase().trim()
    if (!q) return agent.portefeuille
    return agent.portefeuille.filter(c =>
      c.nom.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.activite.toLowerCase().includes(q),
    )
  }, [agent.portefeuille, filtre])

  useEffect(() => {
    setPage(1)
  }, [filtre])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PORTEFEUILLE_PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PORTEFEUILLE_PAGE_SIZE, page * PORTEFEUILLE_PAGE_SIZE)
  const start = filtered.length === 0 ? 0 : (page - 1) * PORTEFEUILLE_PAGE_SIZE + 1
  const end = Math.min(page * PORTEFEUILLE_PAGE_SIZE, filtered.length)

  const encoursTotal = agent.zones.length > 0
    ? agent.zones.reduce((s, z) => s + z.encours_fcfa, 0)
    : agent.portefeuille.reduce((s, c) => s + c.encours_fcfa, 0)
  const performants = agent.clients_portefeuille - agent.clients_a_risque

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-4 gap-3">
        <FinBox label="Portefeuille total" value={String(agent.clients_portefeuille)} />
        <FinBox label="Encours total" value={formatFcfa(encoursTotal)} />
        <FinBox label="En retard / défaut" value={String(agent.clients_a_risque)} highlight={agent.clients_a_risque > 0} />
        <FinBox label="Performants" value={String(performants)} />
      </div>
      <Card
        title={isGP
          ? `Portefeuille agence — ${agent.clients_portefeuille} clients (vue crédit GP)`
          : `Portefeuille agence — ${agent.clients_portefeuille} clients (vue terrain)`}
        icon={<Users size={15} />}
      >
        <div className="mb-3">
          <input
            type="search"
            value={filtre}
            onChange={e => setFiltre(e.target.value)}
            placeholder="Rechercher client, activité, ID…"
            className="w-full max-w-md text-sm border border-slate-200 rounded-lg px-3 py-2"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-bold">ID</th>
                <th className="px-3 py-2 font-bold">Client</th>
                <th className="px-3 py-2 font-bold">Activité</th>
                {!isGP && <th className="px-3 py-2 font-bold">Zone</th>}
                <th className="px-3 py-2 font-bold text-right">Encours</th>
                <th className="px-3 py-2 font-bold text-right">Mensualité</th>
                <th className="px-3 py-2 font-bold text-center">Retard</th>
                <th className="px-3 py-2 font-bold text-center">Score</th>
                <th className="px-3 py-2 font-bold">Statut</th>
                {isGP ? (
                  <>
                    <th className="px-3 py-2 font-bold">Prochaine échéance</th>
                    <th className="px-3 py-2 font-bold">Dernière relance</th>
                    <th className="px-3 py-2 font-bold">Canal</th>
                  </>
                ) : (
                  <th className="px-3 py-2 font-bold">Dernière visite</th>
                )}
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {paginated.map(c => (
                <tr key={c.id} className={cn('border-t border-slate-100 hover:bg-slate-50', c.statut === 'RETARD' && 'bg-orange-50/40')}>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    <Link href={`/dashboard/credit/clients/${c.id}`} className="text-teal-700 hover:text-teal-900 hover:underline">
                      {c.id}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/dashboard/credit/clients/${c.id}`} className="font-semibold text-slate-900 hover:text-teal-800 hover:underline">
                      {c.nom}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 max-w-[140px] truncate">{c.activite}</td>
                  {!isGP && <td className="px-3 py-2.5 text-xs">{c.zone ?? '—'}</td>}
                  <td className="px-3 py-2.5 text-right font-bold tabular-nums">{c.encours_fcfa > 0 ? formatFcfa(c.encours_fcfa) : '—'}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{c.mensualite_fcfa > 0 ? formatFcfa(c.mensualite_fcfa) : '—'}</td>
                  <td className={cn('px-3 py-2.5 text-center font-bold text-xs', c.jours_retard > 0 ? 'text-red-600' : 'text-emerald-600')}>
                    {c.jours_retard > 0 ? `J+${c.jours_retard}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold">{c.score_ia}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', STATUT_CLIENT[c.statut])}>{c.statut}</span>
                  </td>
                  {isGP ? (
                    <>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">{c.prochaine_echeance}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">{c.derniere_relance ?? '—'}</td>
                      <td className="px-3 py-2.5 text-xs">{c.canal_relance ?? '—'}</td>
                    </>
                  ) : (
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap">{c.derniere_visite}</td>
                  )}
                  <td className="px-3 py-2.5">
                    <Link href={`/dashboard/credit/clients/${c.id}`} className="text-teal-600 hover:text-teal-800" title="Fiche client">
                      <ExternalLink size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > PORTEFEUILLE_PAGE_SIZE && (
          <div className="flex items-center justify-between px-1 pt-3 mt-1 border-t border-slate-100 text-xs text-slate-600">
            <span>{start}–{end} sur {filtered.length} clients</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-medium">{page} / {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <span className="text-slate-500">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function HeroKpi({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-slate-400 uppercase font-bold">{label}</div>
      <div className={cn('text-sm font-black mt-0.5', alert ? 'text-red-300' : 'text-white')}>{value}</div>
    </div>
  )
}

function FinBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn('p-3 rounded-xl border', highlight ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200')}>
      <div className="text-[10px] text-slate-500 uppercase font-bold">{label}</div>
      <div className={cn('text-lg font-black mt-1', highlight ? 'text-red-700' : 'text-slate-900')}>{value}</div>
    </div>
  )
}

function ObjectifBar({ label, realise, objectif, format }: { label: string; realise: number; objectif: number; format: 'number' | 'fcfa' | 'pct' }) {
  const pct = objectif === 0 ? 0 : Math.round((realise / objectif) * 100)
  const fmt = (v: number) => format === 'fcfa' ? formatFcfa(v) : format === 'pct' ? `${v}%` : String(v)
  const ok = pct >= 90
  const warn = pct >= 70 && pct < 90
  return (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium text-slate-700">{label}</span>
        <span className={cn('font-bold', ok ? 'text-green-600' : warn ? 'text-orange-600' : 'text-red-600')}>{pct}%</span>
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
        <span>Réalisé : <strong>{fmt(realise)}</strong></span>
        <span>Obj. : <strong>{fmt(objectif)}</strong></span>
      </div>
      <div className="bg-slate-200 rounded-full h-2">
        <div className={cn('h-full rounded-full', ok ? 'bg-green-500' : warn ? 'bg-orange-500' : 'bg-red-500')} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}
