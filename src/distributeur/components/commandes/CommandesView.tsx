'use client'

import { useState, useMemo } from 'react'
import {
  ShoppingCart, Package, TrendingUp, AlertTriangle, Sparkles,
  Warehouse, Filter, Building2, Store,
} from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { getCommandesHub } from '@distributeur/lib/mock-distribution'
import { useHubContext } from '@distributeur/lib/use-hub-context'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { useTerrainWorkflow } from '@distributeur/contexts/TerrainWorkflowContext'
import { PanierDrawer } from '@distributeur/components/terrain/PanierDrawer'
import { WorkflowToast } from '@distributeur/components/shared/WorkflowToast'
import { formatFcfa } from '@distributeur/lib/utils'
import { ENTREPRISE_REGISTRY } from '@distributeur/lib/registries/entreprise-registry'
import {
  buildSyntheseCommandesDG, buildAnalysesCommandesIA, getCommandesParZone,
  getFluxEntrepot, getCommandesPrioritairesEntrepot, getRepartitionTypeClient,
  STATUT_COMMANDE_LABEL, TYPE_CLIENT_LABEL,
} from '@distributeur/lib/commandes-dg-builder'
import type { Commande, CommandeStatut } from '@distributeur/types'

const STATUT_STYLE: Record<string, string> = {
  BROUILLON: 'bg-slate-100 text-slate-600',
  VALIDEE: 'bg-blue-100 text-blue-700',
  PREPARATION: 'bg-amber-100 text-amber-700',
  LIVREE: 'bg-emerald-100 text-emerald-700',
  ANNULEE: 'bg-red-100 text-red-700',
}

const PRIORITE_STYLE = {
  HAUTE: 'bg-orange-100 text-orange-700',
  NORMALE: 'bg-slate-100 text-slate-600',
  BLOQUEE: 'bg-red-100 text-red-700',
}

const PIPELINE_BAR_COLORS: Record<string, string> = {
  BROUILLON: 'bg-slate-400',
  VALIDEE: 'bg-blue-500',
  PREPARATION: 'bg-amber-500',
  LIVREE: 'bg-emerald-500',
}

const ROLES_PILOTAGE = new Set(['DG', 'DC', 'DAF', 'RESP_VENTES', 'SUPERVISEUR', 'RESP_STOCK', 'GEST_ENTREPOT'])

function CommandeCardDG({ cmd }: { cmd: Commande }) {
  const isPropre = cmd.type_magasin === 'PROPRE'
  return (
    <div className={`p-4 rounded-xl border-2 bg-white ${cmd.priorite_ia === 'BLOQUEE' ? 'border-red-200' : cmd.priorite_ia === 'HAUTE' ? 'border-amber-200' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] text-slate-500">{cmd.reference}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${STATUT_STYLE[cmd.statut]}`}>
              {STATUT_COMMANDE_LABEL[cmd.statut]}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${PRIORITE_STYLE[cmd.priorite_ia]}`}>
              {cmd.priorite_ia === 'BLOQUEE' ? 'BLOQUÉE IA' : cmd.priorite_ia === 'HAUTE' ? 'PRIORITÉ' : 'NORMALE'}
            </span>
          </div>
          <div className="font-bold text-sm text-slate-900 mt-1 flex items-center gap-1.5">
            {isPropre ? <Building2 size={13} className="text-violet-500" /> : <Store size={13} className="text-amber-500" />}
            {cmd.pdv_nom}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {TYPE_CLIENT_LABEL[cmd.type_client]} · {cmd.zone} · {cmd.entrepot}
            {cmd.commercial !== '—' && <> · {cmd.commercial}</>}
            {cmd.type_commercial === 'FREELANCE' && (
              <span className="ml-1 text-[8px] px-1 py-0.5 rounded bg-lime-100 text-lime-700 font-bold">FREELANCE</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-slate-900">{formatFcfa(cmd.montant_societe)}</div>
          <div className="text-[10px] text-emerald-600 font-semibold">Marge {cmd.marge_brute_pct}%</div>
          {cmd.marge_freelance && (
            <div className="text-[10px] text-lime-600">Marge free. {formatFcfa(cmd.marge_freelance)}</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        <span className="text-slate-400">{cmd.lignes} lignes</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-500">{cmd.familles.join(' + ')}</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-400">{cmd.date}</span>
      </div>

      {cmd.alerte && (
        <div className="mt-2 text-[10px] text-red-700 font-medium flex items-center gap-1 bg-red-50 rounded-lg px-2 py-1">
          <AlertTriangle size={10} /> {cmd.alerte}
        </div>
      )}
    </div>
  )
}

export function CommandesView() {
  const { user } = useAuth()
  const ctx = useHubContext()
  const isFreelance = user?.role === 'FREELANCE'
  const isPilotage = user?.role && ROLES_PILOTAGE.has(user.role)

  const { commandes } = getCommandesHub(ctx)
  const { commandes: commandesTerrain, panierCount, lastAction, clearLastAction } = useTerrainWorkflow()
  const [filtreStatut, setFiltreStatut] = useState<string>('tous')
  const [filtreZone, setFiltreZone] = useState<string>('toutes')
  const [panierOuvert, setPanierOuvert] = useState(false)

  const synthese = useMemo(() => buildSyntheseCommandesDG(commandes), [commandes])
  const analyses = useMemo(() => buildAnalysesCommandesIA(commandes), [commandes])
  const parZone = useMemo(() => getCommandesParZone(commandes), [commandes])
  const fluxEntrepot = useMemo(() => getFluxEntrepot(commandes), [commandes])
  const prioritaires = useMemo(() => getCommandesPrioritairesEntrepot(commandes, 6), [commandes])
  const parTypeClient = useMemo(() => getRepartitionTypeClient(commandes), [commandes])
  const volumePipelineTotal = synthese.volume_jour_fcfa

  const filtered = useMemo(() => {
    return commandes.filter(c => {
      if (filtreStatut !== 'tous' && c.statut !== filtreStatut) return false
      if (filtreZone !== 'toutes' && c.zone !== filtreZone) return false
      return true
    }).sort((a, b) => b.montant_societe - a.montant_societe)
  }, [commandes, filtreStatut, filtreZone])

  if (isFreelance) {
    return (
      <div className="p-6 max-w-7xl">
        <PageHeader
          title="Mes commandes grossiste"
          subtitle={`Prix société ${ENTREPRISE_REGISTRY.nom} vs vos prix client — marge calculée`}
          badge="Mode freelance"
        />
        <div className="mb-4 bg-lime-50 border border-lime-200 rounded-xl p-4 text-sm text-lime-900">
          Vous commandez au <strong>tarif grossiste</strong> (paniers 2–4 M FCFA). Le prix client est le vôtre — marge non visible par la société.
        </div>
        <div className="grid gap-3">
          {commandes.map(cmd => (
            <CommandeCardDG key={cmd.id} cmd={cmd} />
          ))}
        </div>
      </div>
    )
  }

  if (!isPilotage) {
    return (
      <div className="p-6 max-w-7xl">
        <PageHeader title="Prise de commande terrain" subtitle="Catalogue · vérif. stock · sync offline" />

        {commandesTerrain.length > 0 && (
          <div className="mb-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Commandes terrain transmises ({commandesTerrain.length})
            </h3>
            <div className="grid gap-2">
              {commandesTerrain.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{c.pdv_nom}</div>
                    <div className="text-[11px] text-slate-500">
                      {c.lignes.length} lignes · {c.canal.toLowerCase()} · {new Date(c.createdAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-slate-900">{formatFcfa(c.montant_total)} F</div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                      {c.statut}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {commandes.map(cmd => (
            <CommandeCardDG key={cmd.id} cmd={cmd} />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setPanierOuvert(true)}
          className="mt-4 flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
        >
          <ShoppingCart size={16} /> Nouvelle commande terrain
          {panierCount > 0 && (
            <span className="bg-white/25 rounded-full px-2 py-0.5 text-xs">{panierCount}</span>
          )}
        </button>
        {panierCount === 0 && (
          <p className="mt-2 text-xs text-slate-400">
            Astuce : ajoutez d&apos;abord des produits depuis <strong>Disponibilité</strong>, puis transmettez la commande ici.
          </p>
        )}

        <PanierDrawer open={panierOuvert} onClose={() => setPanierOuvert(false)} />
        <WorkflowToast action={lastAction} onClose={clearLastAction} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <PageHeader
        title="Pilotage commandes grossiste"
        subtitle="Vue DG — pipeline B2B, volumes entrepôt, marges, priorités IA · paniers 1,5 à 8 M FCFA"
        badge={`${synthese.total_commandes} commandes jour`}
      />

      {/* KPI exécutifs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Volume jour', value: formatFcfa(synthese.volume_jour_fcfa), color: 'text-amber-700' },
          { label: 'Panier moyen', value: formatFcfa(synthese.panier_moyen), sub: 'obj. 3 M+' },
          { label: 'Marge brute moy.', value: `${synthese.marge_brute_moy_pct}%`, color: 'text-emerald-600' },
          { label: 'En préparation', value: String(synthese.en_preparation), sub: formatFcfa(synthese.volume_preparation_fcfa) },
          { label: 'Priorité IA', value: String(synthese.prioritaires), color: 'text-orange-600' },
          { label: 'Bloquées crédit', value: String(synthese.commandes_bloquees), sub: formatFcfa(synthese.volume_bloque_fcfa), color: 'text-red-600' },
          { label: 'Magasins enseigne', value: String(synthese.commandes_enseigne), sub: formatFcfa(synthese.volume_enseigne_fcfa), color: 'text-violet-600' },
          { label: 'Lignes totales', value: String(synthese.lignes_total), icon: Package },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="text-[10px] text-slate-400 font-medium mb-1">{k.label}</div>
            <div className={`text-sm font-black ${k.color ?? 'text-slate-800'}`}>{k.value}</div>
            {k.sub && <div className="text-[10px] text-slate-400">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Pipeline + zones */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp size={15} /> Pipeline commandes — flux entrepôt
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {synthese.pipeline.map(p => (
              <button
                key={p.statut}
                type="button"
                onClick={() => setFiltreStatut(filtreStatut === p.statut ? 'tous' : p.statut)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${filtreStatut === p.statut ? 'border-amber-400 bg-amber-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
              >
                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mb-1 ${STATUT_STYLE[p.statut]}`}>
                  {STATUT_COMMANDE_LABEL[p.statut]}
                </div>
                <div className="text-lg font-black text-slate-800">{p.count}</div>
                <div className="text-[10px] text-slate-500">{formatFcfa(p.volume_fcfa)}</div>
              </button>
            ))}
          </div>

          {/* Barre volume pipeline */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Répartition volume</span>
              <span className="text-[10px] text-slate-400">{formatFcfa(volumePipelineTotal)} total</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
              {synthese.pipeline.map(p => {
                const pct = volumePipelineTotal > 0 ? (p.volume_fcfa / volumePipelineTotal) * 100 : 0
                if (pct < 0.5) return null
                return (
                  <div
                    key={p.statut}
                    className={`${PIPELINE_BAR_COLORS[p.statut]} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${STATUT_COMMANDE_LABEL[p.statut]} : ${Math.round(pct)}%`}
                  />
                )
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {synthese.pipeline.map(p => {
                const pct = volumePipelineTotal > 0 ? Math.round((p.volume_fcfa / volumePipelineTotal) * 100) : 0
                return (
                  <span key={p.statut} className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${PIPELINE_BAR_COLORS[p.statut]}`} />
                    {STATUT_COMMANDE_LABEL[p.statut]} {pct}%
                  </span>
                )
              })}
            </div>
          </div>

          {/* Flux entrepôts */}
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {fluxEntrepot.map(f => (
              <div key={f.entrepot} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Warehouse size={14} className="text-amber-600" />
                  <span className="text-xs font-bold text-slate-900">{f.entrepot}</span>
                  <span className="ml-auto text-[10px] font-semibold text-emerald-600">{f.taux_service_pct}% service</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <div className="text-slate-400">Commandes</div>
                    <div className="font-bold text-slate-800">{f.commandes}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">En prep.</div>
                    <div className="font-bold text-amber-700">{f.en_preparation}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Bloquées</div>
                    <div className={`font-bold ${f.bloquees > 0 ? 'text-red-600' : 'text-slate-600'}`}>{f.bloquees}</div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-[10px]">
                  <span className="text-slate-500">Volume jour</span>
                  <span className="font-bold text-slate-800">{formatFcfa(f.volume_fcfa)}</span>
                </div>
                {f.en_preparation > 0 && (
                  <div className="mt-1.5">
                    <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                      <span>Charge picking</span>
                      <span>{formatFcfa(f.volume_preparation_fcfa)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((f.volume_preparation_fcfa / f.volume_fcfa) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Type client + zones */}
          <div className="mt-4 grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 flex-1">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Par type client</div>
              <div className="space-y-1.5">
                {parTypeClient.slice(0, 5).map(t => {
                  const pct = volumePipelineTotal > 0 ? Math.round((t.volume / volumePipelineTotal) * 100) : 0
                  return (
                    <div key={t.type} className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-600 w-24 truncate">{t.label}</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 w-10 text-right">{t.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">File prioritaire entrepôt</div>
              <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                {prioritaires.map(cmd => (
                  <div
                    key={cmd.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] ${cmd.priorite_ia === 'BLOQUEE' ? 'bg-red-50 border border-red-100' : cmd.priorite_ia === 'HAUTE' ? 'bg-amber-50 border border-amber-100' : 'bg-white border border-slate-100'}`}
                  >
                    <span className={`shrink-0 px-1 py-0.5 rounded font-bold ${STATUT_STYLE[cmd.statut]}`}>
                      {STATUT_COMMANDE_LABEL[cmd.statut].slice(0, 4)}
                    </span>
                    <span className="flex-1 truncate font-medium text-slate-800">{cmd.pdv_nom}</span>
                    <span className="shrink-0 font-bold text-slate-700">{formatFcfa(cmd.montant_societe)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Par zone :</span>
            {parZone.map(z => (
              <button key={z.zone} type="button" onClick={() => setFiltreZone(filtreZone === z.zone ? 'toutes' : z.zone)}
                className={`text-[10px] px-2 py-1 rounded-lg font-semibold ${filtreZone === z.zone ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                {z.zone} · {z.count} · {formatFcfa(z.volume)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={15} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-indigo-900">Analyses IA commandes</h3>
          </div>
          <div className="space-y-2">
            {analyses.map((a, i) => (
              <div key={i} className={`p-2.5 rounded-lg border text-xs ${
                a.severite === 'CRITIQUE' ? 'bg-red-50 border-red-200 text-red-800' :
                a.severite === 'HAUTE' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                'bg-white border-indigo-100 text-slate-700'
              }`}>
                <div className="font-bold">{a.titre}</div>
                <div className="text-[10px] opacity-90 mt-0.5">{a.detail}</div>
                <div className="text-[10px] font-semibold mt-1">→ {a.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={12} className="text-slate-400" />
        <button type="button" onClick={() => { setFiltreStatut('tous'); setFiltreZone('toutes') }}
          className="text-[10px] px-2.5 py-1 rounded-lg font-semibold bg-slate-100 text-slate-600">
          Tout afficher
        </button>
        <span className="text-xs text-slate-400">{filtered.length} commande(s) · tri par montant décroissant</span>
      </div>

      {/* Liste commandes */}
      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map(cmd => (
          <CommandeCardDG key={cmd.id} cmd={cmd} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-sm text-slate-400">Aucune commande pour ces filtres.</div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <Warehouse size={12} />
          <span>Entrepôts : Lomé Port · Kara — préparation prioritaire magasins enseigne</span>
        </div>
        <AiBadge variant="small" label="Pipeline temps réel" pulse />
      </div>
    </div>
  )
}
