'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Wallet, PiggyBank, TrendingUp, Plus } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getEpargneHubForUser, resolveAgenceNomFromZone, type TypeCompteEpargne } from '@/lib/epargne-hub'
import { useAuth } from '@/contexts/AuthContext'
import { formatFcfa } from '@/lib/utils'
import { ModuleSyntheseIA } from '@/components/modules/ModuleSyntheseIA'
import { ModuleKpiGrid } from '@/components/modules/ModuleKpiGrid'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { cn } from '@/lib/utils'

const TYPE_LABEL: Record<TypeCompteEpargne, string> = {
  VUE: 'À vue',
  BLOQUE: 'Bloquée',
  TONTINE: 'Tontine',
  DAT: 'DAT',
}

const STATUT_STYLE = {
  ACTIF: 'bg-emerald-100 text-emerald-800',
  DORMANT: 'bg-amber-100 text-amber-800',
  BLOQUE: 'bg-red-100 text-red-800',
}

export function EpargneView() {
  const { user } = useAuth()
  const agenceNom = resolveAgenceNomFromZone(user?.zone)
  const hub = useMemo(() => getEpargneHubForUser(user), [user])
  const [tab, setTab] = useState<'comptes' | 'mouvements' | 'produits'>('comptes')

  const syntheseTitre = agenceNom
    ? `Synthèse IA — Épargne · ${agenceNom}`
    : 'Synthèse IA — Épargne opérationnelle'

  return (
    <>
      <ModuleSyntheseIA texte={hub.synthese_ia} variant="blue" titre={syntheseTitre} />
      <ModuleKpiGrid
        cols={6}
        items={[
          { label: 'Encours total', value: formatFcfa(hub.kpis.encours_total_fcfa), highlight: 'teal' },
          { label: 'Comptes actifs', value: hub.kpis.comptes_actifs.toLocaleString('fr-FR') },
          { label: 'Dormants', value: String(hub.kpis.comptes_dormants), highlight: 'orange' },
          { label: 'Dépôts jour', value: formatFcfa(hub.kpis.depots_jour_fcfa), highlight: 'teal' },
          { label: 'Retraits jour', value: formatFcfa(hub.kpis.retraits_jour_fcfa) },
          { label: 'Flux net', value: formatFcfa(hub.kpis.flux_net_jour_fcfa), highlight: 'teal' },
        ]}
      />

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          Évolution encours (6 mois){agenceNom ? ` — ${agenceNom}` : ''}
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={hub.evolution_mensuelle}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
            <Tooltip formatter={(v) => formatFcfa(Number(v))} />
            <Area type="monotone" dataKey="encours" stroke="#0d9488" fill="#0d948833" name="Encours" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(['comptes', 'mouvements', 'produits'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium capitalize cursor-pointer transition-colors duration-200',
              tab === t ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {t}
          </button>
        ))}
        <button type="button" className="ml-auto flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
          <Plus size={16} />
          Ouvrir compte
        </button>
      </div>

      {tab === 'comptes' && (
        <div className="grid md:grid-cols-2 gap-4">
          {hub.comptes.map((c) => (
            <Link
              key={c.id}
              href={`/epargne/${c.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-400 hover:shadow-md transition-all duration-200 cursor-pointer block group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-teal-800 transition-colors">{c.client}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{c.numero}</div>
                </div>
                <AiBadge variant="small" confidence={c.score_ia} />
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">{TYPE_LABEL[c.type]}</span>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded', STATUT_STYLE[c.statut])}>{c.statut}</span>
              </div>
              <div className="text-2xl font-black text-teal-700 mt-3">{formatFcfa(c.solde_fcfa)}</div>
              {c.objectif_fcfa && (
                <div className="text-xs text-slate-500 mt-1">Objectif {formatFcfa(c.objectif_fcfa)}</div>
              )}
              <div className="text-xs text-slate-400 mt-2">{c.agence} · Dernier mouv. {c.dernier_mouvement}</div>
              <p className="text-[10px] font-bold text-teal-600 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                Voir la fiche détaillée →
              </p>
            </Link>
          ))}
        </div>
      )}

      {tab === 'mouvements' && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {hub.mouvements.slice(0, 30).map((m) => (
            <Link
              key={m.id}
              href={`/epargne/${m.compte_id}`}
              className="p-4 flex flex-wrap items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer block"
            >
              <div className={cn('p-2 rounded-lg', m.type === 'DEPOT' ? 'bg-emerald-100' : 'bg-orange-100')}>
                {m.type === 'DEPOT' ? <TrendingUp size={18} className="text-emerald-700" /> : <Wallet size={18} className="text-orange-700" />}
              </div>
              <div className="flex-1 min-w-[160px]">
                <div className="font-medium text-slate-900">{m.client}</div>
                <div className="text-xs text-slate-500">{m.date} · {m.type} · {m.canal}</div>
              </div>
              <div className={cn('font-bold', m.type === 'DEPOT' ? 'text-emerald-700' : 'text-orange-700')}>
                {m.type === 'DEPOT' ? '+' : '-'}{formatFcfa(m.montant_fcfa)}
              </div>
              <div className="text-sm text-slate-600">Solde {formatFcfa(m.solde_apres)}</div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'produits' && (
        <div className="grid md:grid-cols-2 gap-4">
          {hub.produits.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <PiggyBank size={20} className="text-teal-600" />
                <span className="font-bold text-slate-900">{p.nom}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div><span className="text-slate-500">Taux</span><div className="font-bold">{p.taux_annuel_pct}%/an</div></div>
                <div><span className="text-slate-500">Dépôt min.</span><div className="font-bold">{formatFcfa(p.depot_min_fcfa)}</div></div>
                <div><span className="text-slate-500">Clients</span><div className="font-bold">{p.clients_actifs}</div></div>
                <div><span className="text-slate-500">Encours</span><div className="font-bold text-teal-700">{formatFcfa(p.encours_fcfa)}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
