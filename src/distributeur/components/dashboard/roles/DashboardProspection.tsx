'use client'
import Link from 'next/link'
import { Map, ShieldAlert, Handshake, HeartPulse, ArrowRight, TrendingDown } from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { PerformancePostePanel } from '@distributeur/components/dashboard/PerformancePostePanel'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { useHubContext } from '@distributeur/lib/use-hub-context'
import { getProspectionHub } from '@distributeur/lib/prospection-hub'
import {
  buildEntonnoirConquete, buildCohorteSurvie, buildFilePassation,
  buildAlertesConquete, buildSyntheseConquete,
} from '@distributeur/lib/prospection-builder'
import { REGLES_CONQUETE, type StatutZone } from '@distributeur/lib/registries/prospection-registry'
import { cn, formatFcfa } from '@distributeur/lib/utils'

const GRAVITE_STYLE = {
  CRITIQUE: { card: 'border-red-200 bg-red-50/70', badge: 'bg-red-100 text-red-700' },
  HAUTE: { card: 'border-amber-200 bg-amber-50/70', badge: 'bg-amber-100 text-amber-700' },
  MOYENNE: { card: 'border-slate-200 bg-slate-50/70', badge: 'bg-slate-200 text-slate-600' },
}

const STATUT_ZONE_BADGE: Record<StatutZone, string> = {
  A_RECENSER: 'bg-slate-100 text-slate-600',
  RECENSEMENT_EN_COURS: 'bg-sky-100 text-sky-700',
  EN_CONQUETE: 'bg-emerald-100 text-emerald-700',
  COUVERTE: 'bg-teal-100 text-teal-700',
  ABANDONNEE: 'bg-slate-200 text-slate-500',
}

export function DashboardProspection() {
  const { user } = useAuth()
  const ctx = useHubContext()
  const { zones, prospects, ouvertures } = getProspectionHub(ctx)

  const synthese = buildSyntheseConquete(zones, prospects, ouvertures)
  const entonnoir = buildEntonnoirConquete(prospects)
  const cohorte = buildCohorteSurvie(ouvertures)
  const orphelins = buildFilePassation(ouvertures).filter(o => o.orphelin)
  // Le dashboard ne liste pas tout : il tranche. Les 3 règles franchies les plus graves.
  const aTrancher = buildAlertesConquete(prospects, ouvertures).slice(0, 3)

  const zonesActives = zones.filter(z => z.statut !== 'ABANDONNEE')

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title={`Bonjour ${user?.nom?.split(' ')[0] ?? ''} — conquête de territoire`}
        subtitle={`${zonesActives.map(z => z.zone).join(' · ')} — recenser, convertir, passer la main`}
        badge="Temps réel"
      />

      <PerformancePostePanel role="PROSPECTION" compact />

      {/* Ce qui doit être tranché aujourd'hui — pas une liste de prospects, des décisions. */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert size={15} className="text-red-500" />
          <h2 className="text-sm font-bold text-slate-900">À trancher aujourd&apos;hui</h2>
          <AiBadge variant="small" label="garde-fous" />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {aTrancher.map(a => {
            const style = GRAVITE_STYLE[a.gravite]
            return (
              <div key={a.id} className={cn('rounded-xl border p-3.5', style.card)}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-xs font-bold text-slate-900">{a.cible}</p>
                  <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', style.badge)}>
                    {a.gravite}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mb-2">{a.constat}</p>
                <div className="flex items-start gap-1.5 pt-2 border-t border-slate-200/70">
                  <ArrowRight size={11} className="text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-xs font-medium text-slate-800">{a.action}</p>
                </div>
                {a.impact_fcfa ? (
                  <p className="text-[11px] font-bold text-red-600 mt-1.5">{formatFcfa(a.impact_fcfa)} F en jeu</p>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Entonnoir — où le carnet fuit */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Entonnoir de conquête</h3>
                <AiBadge variant="small" label="goulot" />
              </div>
              <Link href="/distributeur/prospection" className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">
                Ouvrir le carnet →
              </Link>
            </div>
            <div className="space-y-2">
              {entonnoir.etages.map(e => (
                <div key={e.etape} className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-slate-500 w-24 shrink-0">{e.label}</span>
                  <div className="flex-1 h-5 rounded-md bg-slate-100 overflow-hidden relative">
                    <div className={cn('h-full rounded-md',
                      entonnoir.goulot?.etape === e.etape ? 'bg-red-400' : 'bg-indigo-400')}
                      style={{ width: `${Math.max(5, (e.atteint / (entonnoir.etages[0]?.atteint || 1)) * 100)}%` }} />
                    <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-bold text-white">
                      {e.atteint}
                    </span>
                  </div>
                  <span className={cn('text-[11px] font-bold tabular-nums w-16 text-right',
                    e.bloques > 0 ? 'text-red-500' : 'text-slate-300')}>
                    {e.bloques > 0 ? `${e.bloques} bloqué${e.bloques > 1 ? 's' : ''}` : '—'}
                  </span>
                </div>
              ))}
            </div>
            {entonnoir.goulot && (
              <p className="text-xs text-red-800 bg-red-50 rounded-lg p-2.5 mt-3">
                <strong>Le travail est en panne sur « {entonnoir.goulot.label} »</strong> — {entonnoir.goulot.bloques} dossier
                {entonnoir.goulot.bloques > 1 ? 's y stagnent' : ' y stagne'} depuis
                plus de {REGLES_CONQUETE.jours_max_sans_contact} jours. Le recensement n&apos;est pas le
                problème : {entonnoir.etages[0]?.atteint} commerces sont dans le carnet,
                mais {synthese.prospects_bloques} y dorment.
              </p>
            )}
          </div>

          {/* Survie — la redevabilité */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <HeartPulse size={15} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">Survie de mes ouvertures</h3>
              <AiBadge variant="small" />
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Ouvrir un compte ne suffit pas : il doit recommander à M+3 et payer.
            </p>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {[
                { l: 'Ouvertures', v: String(cohorte.total_ouvertures), c: 'text-slate-800' },
                { l: 'Survie M+3', v: `${cohorte.survie_m3_pct}%`, c: cohorte.survie_m3_pct >= 70 ? 'text-emerald-600' : 'text-red-600' },
                { l: 'Réachat M+1', v: `${cohorte.reachat_m1_pct}%`, c: 'text-slate-800' },
                { l: 'Impayés', v: formatFcfa(cohorte.montant_impaye), c: 'text-red-600' },
              ].map(k => (
                <div key={k.l}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.l}</p>
                  <p className={cn('text-xl font-black mt-0.5', k.c)}>{k.v}</p>
                </div>
              ))}
            </div>
            {cohorte.valeur_nette < 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50/70 p-2.5 flex items-start gap-2">
                <TrendingDown size={14} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs text-red-900">
                  <strong>Valeur nette : −{formatFcfa(Math.abs(cohorte.valeur_nette))} F.</strong>{' '}
                  {formatFcfa(cohorte.marge_cumulee_total)} F de marge générée par mes ouvertures, contre{' '}
                  {formatFcfa(cohorte.cout_acquisition_total)} F d&apos;acquisition et{' '}
                  {formatFcfa(cohorte.montant_impaye)} F d&apos;impayés. Une seule 1ʳᵉ commande à crédit hors plafond
                  a effacé six mois de conquête.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Territoires — les vraies zones, plus la liste en dur */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Map size={15} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">Mes territoires</h3>
            </div>
            <div className="space-y-2">
              {zones.map(z => {
                const couverture = z.pdv_estimes > 0 ? Math.round((z.pdv_recenses / z.pdv_estimes) * 100) : 0
                return (
                  <div key={z.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-800">{z.zone}</p>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', STATUT_ZONE_BADGE[z.statut])}>
                        {z.statut === 'EN_CONQUETE' ? 'CONQUÊTE'
                          : z.statut === 'RECENSEMENT_EN_COURS' ? 'RECENSEMENT'
                            : z.statut === 'ABANDONNEE' ? 'ABANDONNÉE' : z.statut}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {z.pdv_recenses}/{z.pdv_estimes} recensés ({couverture} %) · {z.pdv_ouverts} ouverts
                      · {z.distance_depot_km} km
                    </p>
                    <div className="h-1 rounded-full bg-slate-200 overflow-hidden mt-1.5">
                      <div className="h-full rounded-full bg-sky-500" style={{ width: `${couverture}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Passation — l'angle mort du poste */}
          <div className={cn('rounded-xl border p-4',
            orphelins.length > 0 ? 'border-red-200 bg-red-50/60' : 'border-slate-200 bg-white')}>
            <div className="flex items-center gap-2 mb-2">
              <Handshake size={14} className={orphelins.length > 0 ? 'text-red-600' : 'text-slate-400'} />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Passation au secteur</h3>
            </div>
            {orphelins.length > 0 ? (
              <>
                <p className="text-xs text-red-900 mb-2">
                  <strong>{orphelins.length} PDV que j&apos;ai ouverts ne sont dans aucune tournée.</strong> Le plus ancien
                  depuis {Math.max(...orphelins.map(o => o.jours_depuis_ouverture))} jours. Sans commercial de secteur,
                  ils s&apos;éteignent — c&apos;est la cause n°1 de mortalité à M+3.
                </p>
                <ul className="space-y-1 mb-2">
                  {orphelins.slice(0, 3).map(o => (
                    <li key={o.id} className="text-[11px] text-red-800 flex justify-between gap-2">
                      <span className="truncate">{o.pdv_nom}</span>
                      <span className="font-bold tabular-nums shrink-0">+{o.jours_de_retard} j</span>
                    </li>
                  ))}
                </ul>
                <Link href="/distributeur/prospection"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 hover:text-red-900">
                  Transférer maintenant <ArrowRight size={11} />
                </Link>
              </>
            ) : (
              <p className="text-xs text-slate-500">Toutes mes ouvertures sont rattachées à un commercial de secteur.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
