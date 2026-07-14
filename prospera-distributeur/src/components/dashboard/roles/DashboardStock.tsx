'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, Repeat, Banknote, ShieldAlert, Truck, Bot, ArrowRight,
  TrendingDown, Warehouse, Zap, Timer,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { PerformancePostePanel } from '@/components/dashboard/PerformancePostePanel'
import { cn, formatFcfa } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { getPerimetreLogistique } from '@/lib/perimetre-logistique'
import { buildPlanTransferts, buildSanteStock } from '@/lib/transferts-engine'
import { buildJournalAutomatisation } from '@/lib/automation-journal'
import { buildBonsPreparation, buildChargeJour } from '@/lib/picking-engine'
import { buildReceptionsAttendues } from '@/lib/reception-engine'
import { REGISTRE_FOURNISSEURS } from '@/lib/registries/fournisseurs-registry'
import { REGISTRE_STOCK } from '@/lib/registries/stock-registry'

/**
 * Le poste du Responsable Stock & Logistique.
 *
 * Il ne prépare pas les commandes et ne conduit pas les camions : il décide de la
 * politique qui les gouverne. Son tableau de bord ne montre donc pas l'activité du jour,
 * il montre **les arbitrages qui l'attendent** — et ce que l'automatisation a déjà tranché
 * pour lui pendant la nuit.
 *
 * Ce qu'on n'y met surtout pas : le chiffre d'affaires, la marge commerciale, les impayés.
 * Ce ne sont pas ses leviers, et c'était précisément l'erreur de l'ancienne version, qui lui
 * servait le tableau de bord du DG.
 */
export function DashboardStock() {
  const { user } = useAuth()
  const perimetre = getPerimetreLogistique(user)
  const entrepots = perimetre.entrepots

  const transferts = useMemo(() => buildPlanTransferts(), [])
  const sante = useMemo(() => buildSanteStock(entrepots), [entrepots])
  const journal = useMemo(() => buildJournalAutomatisation(entrepots), [entrepots])
  const bons = useMemo(() => buildBonsPreparation(entrepots), [entrepots])
  const receptions = useMemo(() => buildReceptionsAttendues(entrepots), [entrepots])

  const charges = entrepots.map(e => buildChargeJour(e, bons))
  const capitalDormant = sante.reduce((s, x) => s + x.perte_potentielle, 0)
  const ruptures = REGISTRE_STOCK.filter(p => entrepots.includes(p.entrepot) && p.stock < p.seuil)
  const retardsFournisseur = receptions.filter(r => r.statut === 'EN_RETARD')

  // La fiabilité fournisseur, c'est la moitié des ruptures. On la sort au premier plan.
  const fournisseursDefaillants = REGISTRE_FOURNISSEURS
    .filter(f => f.statut !== 'SUSPENDU')
    .filter(f => f.delai_reel_moyen_j > f.delai_livraison_j + 2 || f.taux_livraison_conforme_pct < 92)
    .sort((a, b) => (b.delai_reel_moyen_j - b.delai_livraison_j) - (a.delai_reel_moyen_j - a.delai_livraison_j))
    .slice(0, 4)

  const arbitrages = journal.entrees.filter(e => e.nature === 'ESCALADE')

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <PageHeader
        title="Pilotage stock & logistique"
        subtitle={`${perimetre.libelle} — politique de stock, réappro, transferts, performance fournisseurs`}
        badge={`${journal.decisions_executees} décisions automatisées`}
      />

      {/* Ce que la nuit a produit */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 text-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Bot size={15} className="text-amber-400" /> Le système a travaillé cette nuit
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {journal.decisions_executees} décisions prises sans vous · {journal.decisions_proposees} vous attendent ·{' '}
              {journal.escalades} exigent votre arbitrage
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-xl font-black text-emerald-400">{formatFcfa(journal.gain_fcfa_total)} F</div>
              <div className="text-[10px] text-slate-400">gagnés ou préservés</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-sky-400">{journal.gain_heures} h</div>
              <div className="text-[10px] text-slate-400">de travail épargnées</div>
            </div>
          </div>
        </div>
        <Link
          href="/stock?tab=automatisation"
          className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          Ouvrir le journal d&apos;automatisation <ArrowRight size={12} />
        </Link>
      </div>

      <PerformancePostePanel role="RESP_STOCK" />

      {/* Les quatre chiffres qui gouvernent le poste */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Références sous seuil',
            value: String(ruptures.length),
            sub: `sur ${REGISTRE_STOCK.filter(p => entrepots.includes(p.entrepot)).length} références`,
            icon: AlertTriangle,
            color: ruptures.length > 5 ? 'text-red-600' : 'text-amber-600',
            href: '/approvisionnement?tab=reappro',
          },
          {
            label: 'Capital qui dort',
            value: `${formatFcfa(capitalDormant)} F`,
            sub: 'perte si rien n\'est fait',
            icon: TrendingDown,
            color: 'text-red-600',
            href: '/stock?tab=sante',
          },
          {
            label: 'Transferts à arbitrer',
            value: String(transferts.suggestions.filter(t => !t.auto).length),
            sub: `${formatFcfa(transferts.economie_totale)} F d'économie en jeu`,
            icon: Repeat,
            color: 'text-indigo-600',
            href: '/stock?tab=transferts',
          },
          {
            label: 'Fournisseurs en retard',
            value: String(retardsFournisseur.length),
            sub: retardsFournisseur.length > 0 ? 'produits sous seuil concernés' : 'livraisons dans les temps',
            icon: Truck,
            color: retardsFournisseur.length > 0 ? 'text-red-600' : 'text-emerald-600',
            href: '/entrepot?tab=reception',
          },
        ].map(k => {
          const Icon = k.icon
          return (
            <Link
              key={k.label}
              href={k.href}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <Icon size={12} /> {k.label}
              </div>
              <div className={cn('text-xl font-black mt-1', k.color)}>{k.value}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{k.sub}</div>
            </Link>
          )
        })}
      </div>

      {/* Arbitrages : ce que la machine refuse de trancher seule */}
      {arbitrages.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <h3 className="text-sm font-bold text-red-900 flex items-center gap-2 mb-1">
            <ShieldAlert size={15} /> {arbitrages.length} décision{arbitrages.length > 1 ? 's' : ''} que le système refuse de prendre seul
          </h3>
          <p className="text-[11px] text-red-800/70 mb-3">
            Un garde-fou a sauté. Ces décisions engagent la trésorerie, un client ou un fournisseur —
            elles vous reviennent.
          </p>
          <div className="space-y-2">
            {arbitrages.map(a => (
              <div key={a.id} className="bg-white rounded-lg border border-red-100 p-3">
                <div className="font-bold text-xs text-slate-900">{a.titre}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">{a.declencheur}</p>
                <p className="text-[11px] text-slate-700 font-medium mt-1">→ {a.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Transferts — le levier le plus rentable */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Repeat size={15} className="text-indigo-600" /> Rééquilibrage du réseau
            </h3>
            <Link href="/stock?tab=transferts" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700">
              Tout voir →
            </Link>
          </div>

          {transferts.suggestions.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">Le réseau est équilibré — aucun excédent à déplacer.</p>
          ) : (
            <div className="space-y-2">
              {transferts.suggestions.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center gap-2.5 text-xs py-2 border-b border-slate-50 last:border-0">
                  {t.auto && <Zap size={11} className="text-emerald-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{t.produit_nom}</div>
                    <div className="text-[10px] text-slate-400">
                      {t.entrepot_source} → {t.entrepot_destination} · {t.quantite.toLocaleString('fr-FR')} u.
                      {' · '}évite {t.delai_reappro_j - t.delai_transfert_j} j de rupture
                    </div>
                  </div>
                  <span className="font-bold text-emerald-600 tabular-nums shrink-0">
                    +{formatFcfa(t.economie_nette)} F
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance fournisseurs — la moitié des ruptures naît ici */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Timer size={15} className="text-orange-600" /> Fournisseurs — délai promis vs délai réel
            </h3>
            <Link href="/approvisionnement?tab=fournisseurs" className="text-[11px] font-bold text-orange-600 hover:text-orange-700">
              Tout voir →
            </Link>
          </div>

          {fournisseursDefaillants.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">Tous les fournisseurs tiennent leurs engagements.</p>
          ) : (
            <div className="space-y-2.5">
              {fournisseursDefaillants.map(f => {
                const derive = f.delai_reel_moyen_j - f.delai_livraison_j
                return (
                  <div key={f.id} className="text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800 truncate">{f.nom}</span>
                      <span className={cn(
                        'font-bold tabular-nums shrink-0',
                        derive > 3 ? 'text-red-600' : 'text-amber-600',
                      )}>
                        {f.delai_livraison_j} j promis → {f.delai_reel_moyen_j} j réels
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {f.taux_livraison_conforme_pct} % de livraisons conformes · {f.taux_litige_pct} % de litiges
                      {derive > 2 && ' — le moteur de réappro compense déjà en avançant les commandes.'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Charge des entrepôts — il supervise, il n'exécute pas */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Warehouse size={15} className="text-slate-500" /> Charge des entrepôts
          </h3>
          <Link href="/entrepot" className="text-[11px] font-bold text-slate-600 hover:text-slate-800">
            Vue opérations →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {charges.map(charge => (
            <div key={charge.entrepot} className={cn(
              'rounded-lg border p-3',
              charge.lignes_reportees > 0 ? 'border-red-200 bg-red-50/40' : 'border-slate-200',
            )}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">{charge.entrepot}</span>
                <span className={cn(
                  'text-sm font-black tabular-nums',
                  charge.taux_charge_pct > 100 ? 'text-red-600' : charge.taux_charge_pct > 85 ? 'text-amber-600' : 'text-emerald-600',
                )}>
                  {charge.taux_charge_pct} %
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {charge.lignes_a_preparer} lignes à sortir · {charge.preparateurs_presents} préparateurs · cutoff {charge.cutoff}
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    charge.taux_charge_pct > 100 ? 'bg-red-500' : charge.taux_charge_pct > 85 ? 'bg-amber-500' : 'bg-emerald-500',
                  )}
                  style={{ width: `${Math.min(100, charge.taux_charge_pct)}%` }}
                />
              </div>
              {charge.alerte && (
                <p className="text-[10px] text-red-700 font-medium mt-1.5">{charge.alerte}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Capital immobilisé par site */}
      <div className="grid md:grid-cols-2 gap-3">
        {sante.map(site => (
          <div key={site.entrepot} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Banknote size={14} className="text-amber-600" /> {site.entrepot}
              </h3>
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                site.part_dormante_pct > 25 ? 'bg-red-100 text-red-700'
                  : site.part_dormante_pct > 12 ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-700',
              )}>
                {site.part_dormante_pct} % dormant
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-[10px] text-slate-400">Capital immobilisé</div>
                <div className="font-black text-slate-900">{formatFcfa(site.capital_immobilise_total)} F</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Perte potentielle</div>
                <div className="font-black text-red-600">{formatFcfa(site.perte_potentielle)} F</div>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2">
              {site.sku_surstock} en surstock · {site.sku_dormant} dormantes · {site.sku_dlc_courte} à DLC menacée
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
