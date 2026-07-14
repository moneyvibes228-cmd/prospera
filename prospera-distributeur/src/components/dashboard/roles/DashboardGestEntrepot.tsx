'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  PackageCheck, Truck, ArrowDownToLine, ClipboardCheck, AlertTriangle,
  Users, Clock, ArrowRight, Ban,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { PerformancePostePanel } from '@/components/dashboard/PerformancePostePanel'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { getPerimetreLogistique } from '@/lib/perimetre-logistique'
import { buildBonsPreparation, buildVagues, buildChargeJour } from '@/lib/picking-engine'
import { buildPlanExpedition } from '@/lib/expedition-engine'
import { buildReceptionsAttendues } from '@/lib/reception-engine'
import { buildClassificationABC, buildTachesComptage } from '@/lib/inventaire-engine'
import { getTopologie, preparateursPresents } from '@/lib/registries/entrepot-logistique-registry'

/**
 * Le poste du Gestionnaire d'Entrepôt.
 *
 * Ce n'est pas un tableau de bord de pilotage, c'est un **plan de journée**. Tout ce qui est
 * ici est une chose à faire avant une heure précise. L'unité de compte est la ligne, la
 * palette, le kilo et la minute — jamais le franc : ni CA, ni marge, ni impayé.
 *
 * Il ne voit qu'un entrepôt : le sien.
 */
export function DashboardGestEntrepot() {
  const { user } = useAuth()
  const perimetre = getPerimetreLogistique(user)
  const entrepot = perimetre.entrepots[0] ?? 'Lomé Port'

  const bons = useMemo(() => buildBonsPreparation([entrepot]), [entrepot])
  const vagues = useMemo(() => buildVagues(entrepot, bons), [entrepot, bons])
  const charge = useMemo(() => buildChargeJour(entrepot, bons), [entrepot, bons])
  const plan = useMemo(() => buildPlanExpedition(entrepot, bons), [entrepot, bons])
  const receptions = useMemo(() => buildReceptionsAttendues([entrepot]), [entrepot])
  const abc = useMemo(() => buildClassificationABC([entrepot]), [entrepot])
  const taches = useMemo(() => buildTachesComptage([entrepot], abc), [entrepot, abc])

  const topologie = getTopologie(entrepot)
  const equipe = preparateursPresents(entrepot)
  const auQuai = receptions.filter(r => r.statut === 'A_QUAI' || r.statut === 'EN_RETARD')
  const bloques = bons.filter(b => b.blocage !== 'AUCUN')

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <PageHeader
        title={`Entrepôt ${entrepot}`}
        subtitle={`Plan de la journée — départ des camions à ${topologie.heure_cutoff}`}
        badge="Temps réel"
      />

      {/* La journée en une ligne : ce qui doit sortir, ce qui doit entrer, ce qui doit être compté */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Lignes à préparer',
            value: String(charge.lignes_a_preparer),
            sub: `${vagues.length} vague${vagues.length > 1 ? 's' : ''} · ${charge.taux_charge_pct} % de la capacité`,
            icon: PackageCheck,
            color: charge.taux_charge_pct > 100 ? 'text-red-600' : 'text-blue-600',
            href: '/entrepot?tab=preparation',
          },
          {
            label: 'Camions à charger',
            value: String(plan.tournees.length),
            sub: `remplissage moyen ${plan.remplissage_moyen_pct} %`,
            icon: Truck,
            color: plan.remplissage_moyen_pct >= 65 ? 'text-emerald-600' : 'text-amber-600',
            href: '/entrepot?tab=expedition',
          },
          {
            label: 'Réceptions au quai',
            value: String(auQuai.length),
            sub: auQuai.some(r => r.statut === 'EN_RETARD')
              ? `${auQuai.filter(r => r.statut === 'EN_RETARD').length} en retard fournisseur`
              : 'aucun retard',
            icon: ArrowDownToLine,
            color: auQuai.some(r => r.statut === 'EN_RETARD') ? 'text-red-600' : 'text-slate-800',
            href: '/entrepot?tab=reception',
          },
          {
            label: 'Comptages du jour',
            value: String(taches.length),
            sub: taches.filter(t => t.statut === 'EN_RETARD').length > 0
              ? `${taches.filter(t => t.statut === 'EN_RETARD').length} en retard`
              : 'inventaire à jour',
            icon: ClipboardCheck,
            color: taches.filter(t => t.statut === 'EN_RETARD').length > 0 ? 'text-amber-600' : 'text-emerald-600',
            href: '/entrepot?tab=inventaire',
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
              <div className={cn('text-2xl font-black mt-1 tabular-nums', k.color)}>{k.value}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{k.sub}</div>
            </Link>
          )
        })}
      </div>

      {/* La question de 7 h : l'équipe présente peut-elle sortir le travail avant le cutoff ? */}
      <div className={cn(
        'rounded-xl border p-4',
        charge.lignes_reportees > 0 ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white',
      )}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users size={15} className="text-slate-500" /> Équipe du jour
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {equipe.length} préparateur{equipe.length > 1 ? 's' : ''} présent{equipe.length > 1 ? 's' : ''}
              {charge.preparateurs_absents > 0 && ` · ${charge.preparateurs_absents} absent${charge.preparateurs_absents > 1 ? 's' : ''}`}
              {' '}· capacité {charge.capacite_lignes} lignes
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {equipe.map(p => (
              <div key={p.id} className="bg-slate-50 rounded-lg px-2.5 py-1.5 text-center">
                <div className="text-[11px] font-bold text-slate-700">{p.nom}</div>
                <div className="text-[9px] text-slate-400">
                  {p.cadence_lignes_h} lignes/h
                  {p.taux_erreur_pct > 3 && (
                    <span className="text-orange-600 font-bold"> · {p.taux_erreur_pct} % err.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {charge.alerte && (
          <p className="text-xs text-red-700 font-medium mt-3 flex items-start gap-1.5">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {charge.alerte}
          </p>
        )}
      </div>

      <PerformancePostePanel role="GEST_ENTREPOT" />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Vagues du jour */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PackageCheck size={15} className="text-blue-600" /> Vagues de préparation
            </h3>
            <Link href="/entrepot?tab=preparation" className="text-[11px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
              Ouvrir les bons <ArrowRight size={11} />
            </Link>
          </div>

          {vagues.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">Aucune commande à préparer aujourd&apos;hui.</p>
          ) : (
            <div className="space-y-2">
              {vagues.map(vague => (
                <div key={vague.id} className={cn(
                  'flex flex-wrap items-center gap-3 p-2.5 rounded-lg border',
                  vague.tenable ? 'border-slate-100' : 'border-amber-200 bg-amber-50/50',
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{vague.libelle}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock size={9} /> {vague.creneau} · {vague.bons.length} bons · {vague.nb_lignes} lignes
                      {vague.preparateur && ` · ${vague.preparateur.nom}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {vague.parcours.map(a => (
                      <span key={a} className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {a}
                      </span>
                    ))}
                  </div>
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
                    vague.tenable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800',
                  )}>
                    {vague.duree_min} min
                  </span>
                </div>
              ))}
            </div>
          )}

          {bloques.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[11px] text-red-700 font-medium flex items-start gap-1.5">
                <Ban size={12} className="shrink-0 mt-0.5" />
                {bloques.length} commande{bloques.length > 1 ? 's' : ''} retirée{bloques.length > 1 ? 's' : ''} des vagues —
                encours client bloquant. Le stock reste disponible pour les clients à jour.
              </p>
            </div>
          )}
        </div>

        {/* Ce qui arrive au quai */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <ArrowDownToLine size={15} className="text-slate-500" /> Au quai aujourd&apos;hui
            </h3>
            {auQuai.length === 0 ? (
              <p className="text-xs text-slate-400">Aucune livraison fournisseur attendue.</p>
            ) : (
              <div className="space-y-2">
                {auQuai.map(rec => (
                  <div key={rec.commande_id} className={cn(
                    'p-2.5 rounded-lg border text-xs',
                    rec.statut === 'EN_RETARD' ? 'border-red-200 bg-red-50/50' : 'border-slate-100',
                  )}>
                    <div className="font-semibold text-slate-800 truncate">{rec.fournisseur_nom}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {rec.palettes_total} palettes · {rec.duree_quai_min} min de quai
                    </div>
                    <div className={cn(
                      'text-[9px] font-bold mt-1',
                      rec.controle === 'ALLEGE' ? 'text-emerald-600' : rec.controle === 'RENFORCE' ? 'text-amber-600' : 'text-red-600',
                    )}>
                      contrôle {rec.controle.toLowerCase()}
                      {rec.statut === 'EN_RETARD' && ` · retard de ${Math.abs(rec.jours_ecart)} j`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Camions */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Truck size={15} className="text-emerald-600" /> Chargement
            </h3>
            {plan.tournees.length === 0 ? (
              <p className="text-xs text-slate-400">Aucun camion à charger.</p>
            ) : (
              <div className="space-y-2">
                {plan.tournees.map(t => (
                  <div key={t.id} className="text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">{t.camion.immatriculation}</span>
                      <span className={cn(
                        'font-black tabular-nums',
                        t.rentable ? 'text-emerald-600' : 'text-amber-600',
                      )}>
                        {t.remplissage_pct} %
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {t.arrets.length} arrêts · {t.camion.chauffeur}
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', t.rentable ? 'bg-emerald-500' : 'bg-amber-500')}
                        style={{ width: `${Math.min(100, t.remplissage_pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
