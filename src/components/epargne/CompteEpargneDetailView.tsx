'use client'

import Link from 'next/link'
import {
  ArrowLeft, ArrowDownLeft, ArrowUpRight, Calendar, Clock, CreditCard,
  Lock, MapPin, PiggyBank, Shield, Sparkles, TrendingUp, Users, Wallet,
  AlertTriangle, CheckCircle2, Phone, Target, RefreshCw,
} from 'lucide-react'
import { formatFcfa, cn } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'
import type { CompteEpargneDetail } from '@/lib/epargne-compte-detail'
import type { TypeCompteEpargne, MouvementEpargne } from '@/lib/epargne-hub'

const TYPE_LABEL: Record<TypeCompteEpargne, string> = {
  VUE: 'Épargne à vue',
  BLOQUE: 'Épargne bloquée',
  TONTINE: 'Tontine solidaire',
  DAT: 'DAT — Dépôt à terme',
}

const TYPE_COLOR: Record<TypeCompteEpargne, string> = {
  VUE: 'from-blue-500 to-blue-600',
  BLOQUE: 'from-rose-500 to-rose-600',
  TONTINE: 'from-violet-500 to-violet-600',
  DAT: 'from-teal-500 to-teal-600',
}

const STATUT_STYLE = {
  ACTIF: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  DORMANT: 'bg-amber-100 text-amber-800 ring-amber-200',
  BLOQUE: 'bg-red-100 text-red-800 ring-red-200',
}

const MOUV_STYLE: Record<MouvementEpargne['type'], { icon: typeof ArrowDownLeft; color: string; sign: string }> = {
  DEPOT: { icon: ArrowDownLeft, color: 'text-emerald-600 bg-emerald-50 ring-emerald-100', sign: '+' },
  RETRAIT: { icon: ArrowUpRight, color: 'text-orange-600 bg-orange-50 ring-orange-100', sign: '−' },
  INTERET: { icon: TrendingUp, color: 'text-blue-600 bg-blue-50 ring-blue-100', sign: '+' },
  FRAIS: { icon: Wallet, color: 'text-slate-600 bg-slate-50 ring-slate-100', sign: '−' },
}

function InfoChip({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5', className)}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
      <p className="text-xs font-semibold text-slate-800">{value}</p>
    </div>
  )
}

function SectionCard({
  title, icon: Icon, iconClass, children, badge,
}: {
  title: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconClass?: string
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 to-white">
        <div className="flex items-center gap-2.5">
          <div className={cn('p-1.5 rounded-lg', iconClass ?? 'bg-teal-50 text-teal-600')}>
            <Icon size={15} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        {badge}
      </div>
      {children}
    </div>
  )
}

export function CompteEpargneDetailView({ detail }: { detail: CompteEpargneDetail }) {
  const { compte: c, produit } = detail
  const gradient = TYPE_COLOR[c.type]

  return (
    <div className="space-y-5">
      <Link
        href="/epargne"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors"
      >
        <ArrowLeft size={14} />
        Retour à l&apos;épargne
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-[0.07] pointer-events-none', gradient)} />
        <div className="relative p-5 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            <div className="flex gap-4 min-w-0">
              <div className={cn('shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center shadow-md', gradient)}>
                <PiggyBank size={26} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-black text-slate-900">{c.client}</h1>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full ring-1', STATUT_STYLE[c.statut])}>
                    {c.statut}
                  </span>
                </div>
                <p className="text-sm font-mono text-slate-500">{c.numero}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-100">
                    {TYPE_LABEL[c.type]}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    <MapPin size={10} /> {c.agence}
                  </span>
                  {c.taux_pct != null && c.taux_pct > 0 && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800">
                      {c.taux_pct} % / an
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-left lg:text-right shrink-0">
              <AiBadge variant="small" confidence={c.score_ia} />
              <p className="text-3xl font-black text-teal-700 tabular-nums mt-2">{formatFcfa(c.solde_fcfa)}</p>
              <p className="text-xs text-slate-500 mt-1">Solde au {c.dernier_mouvement}</p>
            </div>
          </div>

          {detail.progression_objectif_pct != null && c.objectif_fcfa && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-600 flex items-center gap-1">
                  <Target size={12} /> Objectif {formatFcfa(c.objectif_fcfa)}
                </span>
                <span className="font-bold text-teal-700">{detail.progression_objectif_pct} %</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn('h-full rounded-full bg-gradient-to-r', gradient)}
                  style={{ width: `${detail.progression_objectif_pct}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-5 pt-5 border-t border-slate-100">
            <InfoChip label="Ouverture" value={detail.date_ouverture} />
            <InfoChip label="Agent" value={detail.agent_ouverture} />
            <InfoChip label="Produit" value={produit.nom} />
            <InfoChip label="Dépôt min." value={formatFcfa(produit.depot_min_fcfa)} />
            {detail.interets_cumules_fcfa != null && (
              <InfoChip label="Intérêts cumulés" value={formatFcfa(detail.interets_cumules_fcfa)} />
            )}
            {detail.credit_eligible_fcfa != null && (
              <InfoChip label="Crédit éligible" value={formatFcfa(detail.credit_eligible_fcfa)} className="border-teal-100 bg-teal-50/50" />
            )}
          </div>
        </div>
      </div>

      {/* Alertes */}
      {detail.alertes.length > 0 && (
        <div className="space-y-2">
          {detail.alertes.map((a, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
              {a}
            </div>
          ))}
        </div>
      )}

      {/* Spécifique DAT */}
      {c.type === 'DAT' && (
        <SectionCard title="Dépôt à terme — échéance & conditions" icon={Calendar} iconClass="bg-teal-50 text-teal-600">
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoChip label="Date échéance" value={detail.date_echeance ?? '—'} />
            <InfoChip label="Montant initial" value={detail.montant_initial_fcfa ? formatFcfa(detail.montant_initial_fcfa) : '—'} />
            <InfoChip label="Durée restante" value={detail.duree_restante_jours ? `${detail.duree_restante_jours} jours` : '—'} />
            <InfoChip
              label="Renouvellement auto"
              value={detail.renouvellement_auto ? 'Activé' : 'Désactivé'}
            />
          </div>
          <p className="px-5 pb-5 text-xs text-slate-600 leading-relaxed">{produit.description}</p>
        </SectionCard>
      )}

      {/* Spécifique Tontine */}
      {c.type === 'TONTINE' && detail.tontine && (
        <>
          <SectionCard
            title="Cycle tontine"
            icon={Users}
            iconClass="bg-violet-50 text-violet-600"
            badge={
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                detail.tontine.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-800'
                  : detail.tontine.statut === 'CLOTURE_IMMINENTE' ? 'bg-red-100 text-red-800'
                    : 'bg-orange-100 text-orange-800',
              )}>
                {detail.tontine.statut.replace('_', ' ')}
              </span>
            }
          >
            <div className="p-5 grid grid-cols-2 md:grid-cols-5 gap-3">
              <InfoChip label="Cycle n°" value={String(detail.tontine.cycle_num)} />
              <InfoChip label="Membres" value={String(detail.tontine.membres)} />
              <InfoChip label="Cotisation / mois" value={detail.cotisation_mensuelle_fcfa ? formatFcfa(detail.cotisation_mensuelle_fcfa) : '—'} />
              <InfoChip label="Collecte cycle" value={`${detail.tontine.collecte_pct} %`} />
              <InfoChip label="Prochaine clôture" value={detail.tontine.prochaine_cloture} />
            </div>
            <div className="px-5 pb-5">
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${detail.tontine.collecte_pct}%` }} />
              </div>
              <p className="text-xs text-slate-600">{produit.description}</p>
            </div>
          </SectionCard>

          {detail.membres && detail.membres.length > 0 && (
            <SectionCard title={`Membres du groupe (${detail.membres.length})`} icon={Users} iconClass="bg-indigo-50 text-indigo-600">
              <div className="divide-y divide-slate-100">
                {detail.membres.map((m, i) => (
                  <div key={i} className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-black shrink-0">
                        {m.nom.split(' ').map(p => p[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{m.nom}</p>
                        <p className="text-[11px] text-slate-500">{m.role.replace('_', ' ')} · {formatFcfa(m.cotisation_fcfa)}/mois</p>
                        {m.telephone && (
                          <p className="text-[11px] text-teal-700 flex items-center gap-1 mt-0.5">
                            <Phone size={10} /> {m.telephone}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      'text-[9px] font-bold px-2 py-1 rounded-full',
                      m.statut === 'A_JOUR' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700',
                    )}>
                      {m.statut === 'A_JOUR' ? 'À jour' : 'Retard'}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}

      {/* Spécifique Bloquée */}
      {c.type === 'BLOQUE' && detail.credit_lie && (
        <SectionCard title="Garantie crédit liée" icon={Lock} iconClass="bg-rose-50 text-rose-600">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InfoChip label="Réf. crédit" value={detail.credit_lie.reference} />
              <InfoChip label="Montant prêt" value={formatFcfa(detail.credit_lie.montant_fcfa)} />
              <InfoChip label="Couverture" value={`${detail.credit_lie.couverture_pct} %`} />
              <InfoChip label="Déblocage prévu" value={detail.date_deblocage_prevue ?? '—'} />
            </div>
            {detail.credit_lie.mensualite_fcfa && (
              <p className="text-xs text-slate-600">
                Mensualité crédit : <strong>{formatFcfa(detail.credit_lie.mensualite_fcfa)}</strong> · Statut{' '}
                <strong>{detail.credit_lie.statut.replace('_', ' ')}</strong>
              </p>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-xs text-rose-900">
              <Shield size={14} className="shrink-0" />
              Les fonds restent immobilisés jusqu&apos;au remboursement intégral du crédit garanti.
            </div>
          </div>
        </SectionCard>
      )}

      {/* Spécifique À vue */}
      {c.type === 'VUE' && (
        <SectionCard title="Compte à vue — conditions" icon={Wallet} iconClass="bg-blue-50 text-blue-600">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <InfoChip label="Plafond retrait / jour" value={detail.plafond_retrait_jour_fcfa ? formatFcfa(detail.plafond_retrait_jour_fcfa) : 'Illimité'} />
              <InfoChip label="Durée" value={produit.duree} />
              {produit.variantes && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                  <p className="text-[10px] font-bold uppercase text-blue-700 mb-1">Variantes</p>
                  <p className="text-xs text-slate-700">{produit.variantes.join(' · ')}</p>
                </div>
              )}
            </div>
            {detail.mandataire && (
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Mandataire autorisé</p>
                <p className="text-sm font-bold text-slate-900">{detail.mandataire.nom}</p>
                <p className="text-xs text-slate-600">{detail.mandataire.lien}</p>
                <p className="text-xs text-teal-700 font-semibold mt-2 flex items-center gap-1">
                  <Phone size={11} /> {detail.mandataire.telephone}
                </p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Mouvements */}
      <SectionCard
        title={`Mouvements récents (${detail.mouvements.length})`}
        icon={RefreshCw}
        iconClass="bg-emerald-50 text-emerald-600"
      >
        {detail.mouvements.length === 0 ? (
          <p className="p-5 text-sm text-slate-400 italic">Aucun mouvement enregistré sur ce compte.</p>
        ) : (
          <div className="p-5">
            <div className="relative">
              <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-teal-200 via-slate-200 to-transparent" />
              <ul className="space-y-0">
                {detail.mouvements.map((m, i) => {
                  const st = MOUV_STYLE[m.type]
                  const Icon = st.icon
                  return (
                    <li key={m.id + i} className="relative flex gap-4 pb-4 last:pb-0">
                      <div className={cn('relative z-10 shrink-0 w-10 h-10 rounded-xl ring-4 ring-white flex items-center justify-center', st.color)}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0 rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3 hover:bg-white transition-colors">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono text-slate-400">{m.date}</span>
                              <span className="text-[10px] font-bold uppercase text-slate-500">{m.type}</span>
                              <span className="text-[10px] text-slate-400">· {m.canal}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn('text-sm font-black tabular-nums', m.type === 'DEPOT' || m.type === 'INTERET' ? 'text-emerald-700' : 'text-orange-700')}>
                              {st.sign}{formatFcfa(m.montant_fcfa)}
                            </p>
                            <p className="text-[10px] text-slate-500 tabular-nums">Solde {formatFcfa(m.solde_apres)}</p>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Produit & IA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Fiche produit" icon={CreditCard} iconClass="bg-slate-100 text-slate-600">
          <div className="p-5 space-y-3 text-sm">
            <p className="text-slate-700 leading-relaxed">{produit.description}</p>
            <div className="grid grid-cols-2 gap-2">
              <InfoChip label="Profil cible" value={produit.profil_cible} />
              <InfoChip label="Durée" value={produit.duree} />
              <InfoChip label="Taux" value={produit.taux_label} />
              <InfoChip label="Croissance réseau" value={`+${produit.croissance_pct} %`} />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Analyse IA"
          icon={Sparkles}
          iconClass="bg-violet-50 text-violet-600"
          badge={<span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">Prospera AI</span>}
        >
          <div className="p-5">
            <p className="text-sm text-slate-700 leading-relaxed">{detail.analyse_ia}</p>
            {detail.credit_eligible_fcfa != null && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50/50 px-4 py-3 text-xs text-teal-900">
                <CheckCircle2 size={14} className="shrink-0" />
                Éligible microcrédit garanti jusqu&apos;à {formatFcfa(detail.credit_eligible_fcfa)} (1,5× solde).
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Meta footer */}
      <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 px-1">
        <span className="flex items-center gap-1"><Clock size={11} /> Dernier mouvement {c.dernier_mouvement}</span>
        <span className="flex items-center gap-1"><MapPin size={11} /> Agence {c.agence}</span>
        <span>ID {c.id}</span>
      </div>
    </div>
  )
}
