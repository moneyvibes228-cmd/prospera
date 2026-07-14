'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, ArrowRight, Gauge } from 'lucide-react'
import { cn, formatFcfa } from '@distributeur/lib/utils'
import { AiBadge } from './AiBadge'
import { RapportExportBar } from '@distributeur/components/shared/RapportExportBar'
import {
  buildSyntheseDecisionDG, getChiffresDuGroupe, GROUPES_DECISION, STATUT_DECISION_STYLE,
  type ChiffreDecisionDG,
} from '@distributeur/lib/dg-synthese-decision-builder'

function valeurFormatee(c: ChiffreDecisionDG): string {
  switch (c.format) {
    case 'fcfa': return formatFcfa(c.valeur)
    case 'pct': return `${c.valeur}%`
    default: return c.valeur.toLocaleString('fr-FR')
  }
}

function CarteChiffre({ c }: { c: ChiffreDecisionDG }) {
  const style = STATUT_DECISION_STYLE[c.statut]
  // Une hausse de dette ou de créance n'est pas une bonne nouvelle.
  const bonneVariation = c.invert ? c.variation_pct < 0 : c.variation_pct > 0

  return (
    <div className={cn(
      'rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col',
      style.fond, style.ring,
    )}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">
          {c.label}
        </p>
        <span className={cn('w-2 h-2 rounded-full shrink-0 mt-0.5', style.pastille)}
          title={c.statut} aria-label={c.statut} />
      </div>

      <div className="text-3xl font-black text-slate-900 leading-none tabular-nums">
        {valeurFormatee(c)}
      </div>

      <div className="flex items-center gap-1 mt-2">
        {bonneVariation
          ? <TrendingUp size={11} className="text-emerald-600" />
          : <TrendingDown size={11} className="text-red-500" />}
        <span className={cn('text-[11px] font-bold', bonneVariation ? 'text-emerald-600' : 'text-red-500')}>
          {c.variation_pct > 0 ? '+' : ''}{c.variation_pct}%
        </span>
        <span className="text-[10px] text-slate-400">· {c.variation_label}</span>
      </div>

      <div className="mt-2.5 space-y-1">
        <p className="text-sm font-semibold text-slate-800 leading-snug">{c.detail_principal}</p>
        {c.detail_secondaire && (
          <p className="text-xs text-slate-500 leading-snug">{c.detail_secondaire}</p>
        )}
        {c.seuil_alerte && (
          <p className="text-xs text-slate-500 italic leading-snug">{c.seuil_alerte}</p>
        )}
      </div>

      {c.action_label && c.action_href && (
        <Link href={c.action_href}
          className="mt-3 pt-2.5 border-t border-slate-100 inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 transition-colors">
          {c.action_label}
          <ArrowRight size={11} />
        </Link>
      )}
    </div>
  )
}

/**
 * Bandeau de décision du DG — les 8 chiffres, en tête de dashboard, avant le rapport IA.
 * Trois rangées : ce que j'ai, ce qu'on me doit / ce que je dois, ce que je produis.
 */
export function SyntheseDecisionDGPanel() {
  const chiffres = useMemo(() => buildSyntheseDecisionDG(), [])
  const critiques = chiffres.filter(c => c.statut === 'CRITIQUE')

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Gauge size={15} className="text-slate-500" />
        <h2 className="text-sm font-bold text-slate-700">Les chiffres qui engagent une décision</h2>
        <AiBadge variant="small" label="Temps réel" pulse />
        {critiques.length > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            {critiques.length} chiffre{critiques.length > 1 ? 's' : ''} au rouge
          </span>
        )}
        <span className="text-xs text-slate-400 ml-auto">Juin 2026 · consolidé réseau</span>
        <RapportExportBar
          nomFichier="synthese-decision-dg"
          colonnes={['Indicateur', 'Valeur', 'Format', 'Variation (%)', 'Variation', 'Statut', 'Détail']}
          getLignes={() =>
            chiffres.map(c => [
              c.label,
              c.valeur,
              c.format,
              c.variation_pct,
              c.variation_label,
              c.statut,
              c.detail_principal,
            ])
          }
        />
      </div>

      {GROUPES_DECISION.map(groupe => {
        const cartes = getChiffresDuGroupe(chiffres, groupe.cles)
        if (cartes.length === 0) return null
        return (
          <div key={groupe.id} className={cn('border-l-4 pl-3.5', groupe.bordure)}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className={cn('w-1.5 h-1.5 rounded-full', groupe.puce)} />
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {groupe.titre}
              </h3>
            </div>
            <div className={cn(
              'grid gap-3',
              cartes.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 lg:grid-cols-4',
            )}>
              {cartes.map(c => <CarteChiffre key={c.cle} c={c} />)}
            </div>
          </div>
        )
      })}
    </section>
  )
}
