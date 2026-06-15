'use client'

import Link from 'next/link'
import {
  MapPin, Home, Briefcase, ArrowDownLeft, ArrowUpRight, Users, Shield,
  History, AlertTriangle, TrendingDown, User, Phone, IdCard,
  Sparkles, Wallet, TrendingUp, CheckCircle2, XCircle, Clock, Star,
} from 'lucide-react'
import { formatFcfa } from '@/lib/utils'
import {
  getEnrichissement,
  getSentimentStyle,
  computeTxStats,
  couvertureGaranties,
} from '@/lib/dossier-enrichissement'
import type { RapportCC } from '@/lib/mockMicrofinance'
import type { TransactionCompte } from '@/lib/dossier-enrichissement'

function initials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
}

function txIcon(type: TransactionCompte['type']) {
  if (type === 'DEPOT' || type === 'MOMO') return ArrowDownLeft
  return ArrowUpRight
}

function txColor(type: TransactionCompte['type']) {
  if (type === 'DEPOT') return 'text-emerald-600 bg-emerald-50 ring-emerald-100'
  if (type === 'MOMO') return 'text-teal-600 bg-teal-50 ring-teal-100'
  if (type === 'VIREMENT') return 'text-blue-600 bg-blue-50 ring-blue-100'
  return 'text-rose-600 bg-rose-50 ring-rose-100'
}

function SectionCard({
  title,
  icon: Icon,
  iconClass,
  badge,
  children,
  className = '',
}: {
  title: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconClass?: string
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap bg-gradient-to-r from-slate-50/80 to-white">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${iconClass ?? 'bg-teal-50 text-teal-600'}`}>
            <Icon size={15} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
        </div>
        {badge}
      </div>
      {children}
    </div>
  )
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
      <p className="text-xs font-semibold text-slate-800 leading-snug">{value}</p>
    </div>
  )
}

export function DossierEnrichiSections({ dossier }: { dossier: RapportCC }) {
  const e = getEnrichissement(dossier.dossier_id, dossier)
  const id = e.identite_client
  const cu = id?.contact_urgence
  const txStats = computeTxStats(e.transactions)
  const couverture = couvertureGaranties(e.garanties)
  const sentiment = getSentimentStyle(e.sentiment)

  return (
    <div className="space-y-5">

      {/* Hero identité */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.06] via-transparent to-indigo-500/[0.04] pointer-events-none" />
        <div className="relative p-5 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-5">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 text-white flex items-center justify-center text-lg font-black shadow-md shadow-teal-600/20">
                {initials(dossier.client.prenom, dossier.client.nom)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {dossier.client.prenom} {dossier.client.nom}
                  </h2>
                  {id?.genre && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {id.genre === 'M' ? 'Homme' : 'Femme'}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ${sentiment.bg} ${sentiment.text} ${sentiment.ring}`}>
                    {sentiment.label}
                  </span>
                  <span className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: e.etoiles }).map((_, i) => (
                      <Star key={i} size={11} fill="currentColor" />
                    ))}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  {dossier.client.activite} · {dossier.client.secteur} · {dossier.client.localite}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{e.resume}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-100">
                    <MapPin size={10} /> {e.agence}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-100">
                    <User size={10} /> {e.agent_terrain}
                  </span>
                  {dossier.client.id && (
                    <Link
                      href={`/dashboard/credit/clients/${encodeURIComponent(dossier.client.id)}`}
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-teal-700 hover:bg-teal-50 border border-slate-200 transition-colors"
                    >
                      Fiche {dossier.client.id} →
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Contact urgence */}
            <div className="lg:w-64 shrink-0 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 shadow-sm">
              <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <AlertTriangle size={11} className="text-amber-600" />
                Contact d&apos;urgence
              </p>
              {cu ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-900">{cu.prenom} {cu.nom}</p>
                  <p className="text-xs text-amber-900/70 font-medium">{cu.lien}</p>
                  <a
                    href={`tel:${cu.telephone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-white/80 px-2.5 py-1.5 rounded-lg border border-amber-100 hover:border-teal-200 transition-colors"
                  >
                    <Phone size={12} /> {cu.telephone}
                  </a>
                </div>
              ) : (
                <p className="text-xs text-amber-800/80 italic">Non renseigné</p>
              )}
            </div>
          </div>

          {/* Grille coordonnées */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-5 pt-5 border-t border-slate-100">
            <InfoChip label="Téléphone" value={dossier.client.telephone} />
            {id?.telephone_secondaire && <InfoChip label="Secondaire" value={id.telephone_secondaire} />}
            {id?.whatsapp && <InfoChip label="WhatsApp" value={id.whatsapp} />}
            {id?.cni && <InfoChip label="CNI" value={id.cni} />}
            {id?.date_naissance && (
              <InfoChip label="Naissance" value={`${id.date_naissance} (${dossier.client.age} ans)`} />
            )}
            {id?.client_depuis && <InfoChip label="Client depuis" value={id.client_depuis} />}
            {id?.situation_matrimoniale && <InfoChip label="Situation" value={id.situation_matrimoniale} />}
            {id?.personnes_charge != null && (
              <InfoChip label="Personnes à charge" value={String(id.personnes_charge)} />
            )}
          </div>
        </div>
      </div>

      {/* KPIs compte */}
      {txStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Mouvements', value: String(txStats.count), sub: '3 derniers mois', icon: Wallet, color: 'text-slate-700 bg-slate-50' },
            { label: 'Ratio dépôts', value: `${txStats.depotsPct}%`, sub: txStats.depotsPct >= 65 ? 'Profil cohérent' : 'À surveiller', icon: TrendingUp, color: txStats.depotsPct >= 65 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50' },
            { label: 'Total dépôts', value: formatFcfa(txStats.totalDepots), sub: `Solde max ${formatFcfa(txStats.soldeMax)}`, icon: ArrowDownLeft, color: 'text-teal-700 bg-teal-50' },
            { label: 'Couverture garanties', value: `${couverture}%`, sub: `${e.garanties.length} garantie(s)`, icon: Shield, color: couverture >= 70 ? 'text-indigo-700 bg-indigo-50' : 'text-orange-700 bg-orange-50' },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className={`inline-flex p-1.5 rounded-lg mb-2 ${kpi.color}`}>
                <kpi.icon size={14} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{kpi.label}</p>
              <p className="text-lg font-black text-slate-900 tabular-nums mt-0.5">{kpi.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Localisations */}
      <SectionCard
        title="Localisation vérifiée"
        icon={MapPin}
        iconClass="bg-blue-50 text-blue-600"
        badge={
          <span className="text-[10px] font-bold text-slate-500">
            {e.localisations.filter(l => l.verifie_terrain).length}/{e.localisations.length} vérifié(s) terrain
          </span>
        }
      >
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {e.localisations.map(loc => (
            <div
              key={loc.type}
              className="group relative rounded-xl border border-slate-100 p-4 hover:border-teal-200 hover:shadow-sm transition-all duration-200 bg-gradient-to-br from-white to-slate-50/50"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg ${loc.type === 'DOMICILE' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'}`}>
                  {loc.type === 'DOMICILE' ? <Home size={14} /> : <Briefcase size={14} />}
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {loc.type === 'DOMICILE' ? 'Domicile' : 'Lieu de travail'}
                </span>
                {loc.verifie_terrain ? (
                  <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={10} /> Vérifié
                  </span>
                ) : (
                  <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    <Clock size={10} /> Non vérifié
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-snug">{loc.adresse}</p>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <MapPin size={11} className="shrink-0" />
                {loc.quartier}
                {loc.distance_agence_km != null && ` · ${loc.distance_agence_km} km de l'agence`}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Timeline mouvements */}
      {e.transactions.length > 0 && (
        <SectionCard
          title={`Historique des mouvements (${e.transactions.length})`}
          icon={Wallet}
          iconClass="bg-emerald-50 text-emerald-600"
          badge={
            txStats && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${txStats.depotsPct >= 65 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {txStats.depotsPct}% dépôts
                {txStats.suspects > 0 && ` · ${txStats.suspects} signal(s)`}
              </span>
            )
          }
        >
          <div className="p-5">
            <div className="relative">
              <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-teal-200 via-slate-200 to-transparent" />
              <ul className="space-y-0">
                {e.transactions.map((t, i) => {
                  const Icon = txIcon(t.type)
                  const flagged = t.flag === 'SUSPECT' || t.flag === 'INHABITUEL'
                  return (
                    <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
                      <div className={`relative z-10 shrink-0 w-10 h-10 rounded-xl ring-4 ring-white flex items-center justify-center ${txColor(t.type)}`}>
                        <Icon size={16} />
                      </div>
                      <div className={`flex-1 min-w-0 rounded-xl border px-4 py-3 transition-colors ${flagged ? 'border-orange-200 bg-orange-50/60' : 'border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200'}`}>
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold text-slate-400">{t.date}/2026</span>
                              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t.type}</span>
                              {flagged && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                                  <AlertTriangle size={9} /> {t.flag}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-slate-800 mt-0.5">{t.libelle}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-black tabular-nums ${t.type === 'DEPOT' || t.type === 'MOMO' ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {t.type === 'DEPOT' || t.type === 'MOMO' ? '+' : '−'}{formatFcfa(t.montant)}
                            </p>
                            <p className="text-[10px] text-slate-500 tabular-nums mt-0.5">
                              Solde {formatFcfa(t.solde_apres)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Cautionnaires & garanties */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard
          title={`Cautionnaires (${e.cautionnaires.length})`}
          icon={Users}
          iconClass="bg-indigo-50 text-indigo-600"
        >
          <div className="divide-y divide-slate-100">
            {e.cautionnaires.length === 0 ? (
              <p className="p-5 text-xs text-slate-400 italic">Aucun cautionnaire enregistré</p>
            ) : e.cautionnaires.map((c, i) => (
              <div key={i} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex gap-3 min-w-0">
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                      {c.nom.split(' ').map(p => p[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{c.nom}</p>
                      <p className="text-[11px] text-slate-500">{c.lien}</p>
                      <p className="text-[11px] text-teal-700 font-semibold mt-1 flex items-center gap-1">
                        <Phone size={10} /> {c.telephone}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full ${c.solvable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {c.solvable ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                    {c.solvable ? 'Solvable' : 'Non solvable'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
                  <span className="text-slate-600">
                    Engagement <strong className="text-slate-800">{formatFcfa(c.engagement_fcfa)}</strong>
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600">
                    Revenus <strong className="text-slate-800">{formatFcfa(c.revenus_declares)}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Garanties & couverture"
          icon={Shield}
          iconClass="bg-teal-50 text-teal-600"
          badge={
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${couverture >= 70 ? 'bg-teal-100 text-teal-800' : 'bg-orange-100 text-orange-800'}`}>
              {couverture}% total
            </span>
          }
        >
          <div className="p-5 space-y-4">
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${couverture >= 70 ? 'bg-gradient-to-r from-teal-500 to-teal-600' : 'bg-gradient-to-r from-orange-400 to-amber-500'}`}
                style={{ width: `${Math.min(100, couverture)}%` }}
              />
            </div>
            {e.garanties.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucune garantie documentée</p>
            ) : e.garanties.map((g, i) => (
              <div key={i} className="rounded-xl border border-slate-100 p-3.5 bg-slate-50/50">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <p className="text-xs font-bold text-slate-800">{g.type}</p>
                  <span className="text-[10px] font-black text-teal-700 tabular-nums">{g.couverture_pct}%</span>
                </div>
                <p className="text-[11px] text-slate-600 mb-2">{g.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Valeur estimée</span>
                  <span className="text-xs font-bold text-slate-800 tabular-nums">{formatFcfa(g.valeur_estimee)}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${g.couverture_pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Prêts antérieurs */}
      {e.prets_anterieurs.length > 0 && (
        <SectionCard title="Historique crédits antérieurs" icon={History} iconClass="bg-slate-100 text-slate-600">
          <div className="divide-y divide-slate-100">
            {e.prets_anterieurs.map((p, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{p.reference}</span>
                  <span className="text-base font-black text-slate-900 tabular-nums">{formatFcfa(p.montant)}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { l: 'Octroi', v: p.date_octroi },
                    { l: 'Clôture', v: p.date_cloture },
                    { l: 'Durée', v: `${p.duree_remboursement_j} j` },
                    { l: 'PAR', v: p.par_atteint ? 'OUI' : 'NON', warn: p.par_atteint },
                  ].map(cell => (
                    <div key={cell.l} className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[9px] font-bold uppercase text-slate-400">{cell.l}</p>
                      <p className={`text-xs font-bold ${cell.warn ? 'text-red-600' : 'text-slate-800'}`}>{cell.v}</p>
                    </div>
                  ))}
                </div>
                {p.retards.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {p.retards.map((r, j) => (
                      <div key={j} className="flex items-start gap-2 text-[11px] bg-orange-50 rounded-lg px-3 py-2 border border-orange-100">
                        <TrendingDown size={12} className="text-orange-600 shrink-0 mt-0.5" />
                        <span><strong>Retard {r.jours}j</strong> — {r.motif}</span>
                      </div>
                    ))}
                  </div>
                )}
                {p.anomalies.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-700 font-medium">
                    <AlertTriangle size={11} />
                    {p.anomalies.join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Analyse IA étendue */}
      <SectionCard
        title="Analyse approfondie"
        icon={Sparkles}
        iconClass="bg-violet-50 text-violet-600"
        badge={<span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">Prospera IA</span>}
      >
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {([
            ['Transactions', e.analyse_prospera_ia_etendue.transactions],
            ['Comportement', e.analyse_prospera_ia_etendue.comportement],
            ['Macro-économie', e.analyse_prospera_ia_etendue.macro_economie],
            ['Saisonnalité', e.analyse_prospera_ia_etendue.saison],
            ['Recouvrement', e.analyse_prospera_ia_etendue.recouvrement],
            ['Saturation secteur', e.analyse_prospera_ia_etendue.saturation_secteur],
          ] as const).map(([title, text]) => (
            <div key={title} className="rounded-xl border border-violet-100/80 bg-gradient-to-br from-violet-50/50 to-white p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-violet-600 mb-1.5">{title}</p>
              <p className="text-xs text-slate-700 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Avis CC */}
      {e.avis_cc && (
        <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-indigo-50/30 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <IdCard size={14} className="text-violet-600" />
            <p className="text-[10px] font-bold text-violet-800 uppercase tracking-wide">Avis chargé de crédit</p>
          </div>
          <p className="text-sm text-violet-950 leading-relaxed">{e.avis_cc.commentaire}</p>
          <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-violet-700">
            <span className="font-bold bg-white/60 px-2 py-0.5 rounded">{e.avis_cc.decision}</span>
            <span>{e.avis_cc.charge}</span>
            <span className="text-violet-500">·</span>
            <span>{e.avis_cc.date}</span>
          </div>
        </div>
      )}
    </div>
  )
}
