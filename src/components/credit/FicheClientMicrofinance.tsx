'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  ArrowLeft, User, Phone, MapPin, Briefcase, AlertTriangle, CreditCard,
  History, Shield, FileText, TrendingDown, Sparkles, Wallet, Users,
  Building2, Fingerprint, Scale, Clock, ChevronRight,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { FicheClientMicrofinance, EcheanceCredit, Cautionnaire, ScoreFacteur } from '@/lib/fiche-client-microfinance'
import { MIN_CAUTIONNAIRES } from '@/lib/fiche-client-microfinance'
import { formatFcfa, cn } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'

const MiniMap = dynamic(() => import('@/components/terrain/MiniMap'), { ssr: false })

const TABS = [
  { id: 'synthese', label: 'Synthèse' },
  { id: 'identite', label: 'Identité & KYC' },
  { id: 'activite', label: 'Activité' },
  { id: 'credits', label: 'Crédits & échéancier' },
  { id: 'recouvrement', label: 'Recouvrement' },
  { id: 'risque', label: 'Risque BCEAO' },
] as const

type TabId = (typeof TABS)[number]['id']

const CLASSE_COLOR: Record<string, string> = {
  NORMAL: 'bg-emerald-100 text-emerald-800',
  SOUS_SURVEILLANCE: 'bg-amber-100 text-amber-800',
  DOUTEUX: 'bg-orange-100 text-orange-800',
  COMPROMISES: 'bg-red-100 text-red-800',
  CONTENTIEUX: 'bg-red-200 text-red-900',
}

const ECHEANCE_STATUT: Record<EcheanceCredit['statut'], string> = {
  PAYE: 'bg-emerald-100 text-emerald-800',
  PARTIEL: 'bg-orange-100 text-orange-800',
  IMPAYE: 'bg-red-100 text-red-800',
  A_VENIR: 'bg-slate-100 text-slate-600',
}

const CAUTIONNAIRE_STATUT: Record<Cautionnaire['statut'], string> = {
  ACTIF: 'bg-emerald-100 text-emerald-800',
  REALISE: 'bg-slate-200 text-slate-700',
  APPELE: 'bg-amber-100 text-amber-800',
  INJOIGNABLE: 'bg-red-100 text-red-800',
  REFUSE: 'bg-red-100 text-red-800',
}

const EXIGENCE_STATUT: Record<string, string> = {
  OK: 'bg-emerald-100 text-emerald-800',
  MANQUANT: 'bg-red-100 text-red-800',
  PARTIEL: 'bg-orange-100 text-orange-800',
  NON_REQUIS: 'bg-slate-100 text-slate-500',
}

const RECOUV_TYPE: Record<string, string> = {
  RELANCE_SMS: 'SMS',
  RELANCE_WA: 'WhatsApp',
  APPEL: 'Appel',
  VISITE: 'Visite terrain',
  COURRIER: 'Courrier',
  MISE_EN_DEMEURE: 'Mise en demeure',
  CONTENTIEUX: 'Contentieux',
}

interface Props {
  fiche: FicheClientMicrofinance
  backHref?: string
  backLabel?: string
  /** Badge recouvrement — client classé mauvais payeur */
  mauvaisPayeurBadge?: string
}

export function FicheClientMicrofinanceView({ fiche, backHref, backLabel = 'Retour', mauvaisPayeurBadge }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>(mauvaisPayeurBadge ? 'recouvrement' : 'synthese')
  const [creditActif, setCreditActif] = useState(fiche.credits_detail.find(c => c.encours_fcfa > 0)?.reference ?? fiche.credits_detail[0]?.reference)

  const scoreColor = fiche.score_ia < 45 ? 'text-red-600' : fiche.score_ia < 55 ? 'text-orange-600' : 'text-yellow-600'
  const credit = fiche.credits_detail.find(c => c.reference === creditActif) ?? fiche.credits_detail[0]
  const initiales = `${fiche.identite.prenom[0] ?? ''}${fiche.identite.nom[0] ?? ''}`.toUpperCase()

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <button
        type="button"
        onClick={() => (backHref ? router.push(backHref) : router.back())}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 cursor-pointer"
      >
        <ArrowLeft size={16} /> {backLabel}
      </button>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 rounded-2xl p-5 md:p-6 text-white shadow-lg">
        <div className="flex flex-wrap gap-4 items-start">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-black shrink-0 border border-white/20">
            {initiales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400">{fiche.id}</span>
              <span className="text-xs font-mono text-teal-300">{fiche.numero_adherent}</span>
              {mauvaisPayeurBadge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/40 text-red-100 border border-red-400/30">
                  Mauvais payeur {mauvaisPayeurBadge}
                </span>
              )}
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                fiche.jours_retard > 60 ? 'bg-red-500/30 text-red-200' : 'bg-orange-500/30 text-orange-200',
              )}>
                Retard J+{fiche.jours_retard}
              </span>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', CLASSE_COLOR[fiche.classe_bceao] ?? 'bg-slate-600')}>
                {fiche.classe_bceao.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-black">{fiche.identite.prenom} {fiche.identite.nom}</h1>
            <p className="text-slate-300 text-sm mt-1">{fiche.activite_detail.description.slice(0, 80)}…</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><MapPin size={12} /> {fiche.agence}</span>
              <span className="flex items-center gap-1"><Building2 size={12} /> RA {fiche.responsable_agence ?? '—'}</span>
              <span className="flex items-center gap-1"><User size={12} /> COM {fiche.agent_commercial ?? fiche.agent}</span>
              <span className="flex items-center gap-1 text-teal-300"><Users size={12} /> GP {fiche.agent_gp ?? '—'}</span>
              <span className="flex items-center gap-1"><Phone size={12} /> {fiche.telephone}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> Client depuis {fiche.client_depuis}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={cn('text-4xl font-black', scoreColor)}>
              {fiche.score_ia}<span className="text-lg text-slate-400">/100</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Score IA · PD {fiche.pd_pct}% · CBI {fiche.indicateurs_risque.score_cbi}</div>
            <div className="mt-2"><AiBadge variant="small" label="Prospera AI" /></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-5 pt-5 border-t border-white/10">
          <HeroKpi label="Encours" value={formatFcfa(fiche.encours)} />
          <HeroKpi label="Capital restant dû" value={formatFcfa(credit?.capital_restant_du_fcfa ?? fiche.encours)} />
          <HeroKpi label="Pénalités" value={formatFcfa(credit?.penalites_fcfa ?? 0)} alert />
          <HeroKpi label="EL estimée" value={formatFcfa(fiche.el)} alert />
          <HeroKpi label="Mensualité" value={formatFcfa(fiche.mensualite)} />
          <HeroKpi label="Impayés" value={String(fiche.echeances_impayees)} alert={fiche.echeances_impayees > 0} />
        </div>
      </div>

      {/* Décision DEC urgente */}
      {fiche.jours_retard >= 30 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-wrap gap-3 items-start">
          <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-red-900 text-sm">Action DEC en cours : {fiche.action}</div>
            <p className="text-sm text-red-800 mt-1">{fiche.decision_dec.recommandation}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-red-700">
              <span>Délai : {fiche.decision_dec.delai}</span>
              {fiche.decision_dec.comite_requis && <span className="font-bold">Comité crédit requis</span>}
              {fiche.decision_dec.prochaine_echeance_dec !== '—' && (
                <span>Prochaine décision : {fiche.decision_dec.prochaine_echeance_dec}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-px">
        {TABS.map(t => (
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
          </button>
        ))}
      </div>

      {tab === 'synthese' && <TabSynthese fiche={fiche} scoreColor={scoreColor} />}
      {tab === 'identite' && <TabIdentite fiche={fiche} />}
      {tab === 'activite' && <TabActivite fiche={fiche} />}
      {tab === 'credits' && (
        <TabCredits
          fiche={fiche}
          credit={credit}
          creditActif={creditActif}
          onSelectCredit={setCreditActif}
        />
      )}
      {tab === 'recouvrement' && <TabRecouvrement fiche={fiche} />}
      {tab === 'risque' && <TabRisque fiche={fiche} />}
    </div>
  )
}

function TabSynthese({ fiche, scoreColor }: { fiche: FicheClientMicrofinance; scoreColor: string }) {
  return (
    <div className="grid lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 space-y-4">
        <Card title="Analyse DEC" icon={<Sparkles size={15} className="text-teal-600" />}>
          <p className="text-sm text-slate-700 leading-relaxed">{fiche.analyse_dec}</p>
        </Card>
        <Card title="Crédit actif" icon={<CreditCard size={15} />}>
          {fiche.credits_detail.filter(c => c.encours_fcfa > 0 || c.statut === 'EN_RETARD' || c.statut === 'ACTIF').map(c => (
            <div key={c.reference} className="p-4 bg-slate-50 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between flex-wrap gap-2">
                <span className="font-bold text-teal-800 font-mono">{c.reference}</span>
                <span className="text-red-700 font-bold">{c.statut.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><span className="text-slate-500">Produit</span><div className="font-medium">{c.produit}</div></div>
                <div><span className="text-slate-500">Taux</span><div className="font-medium">{c.taux_annuel_pct} %/an</div></div>
                <div><span className="text-slate-500">Décaissé</span><div className="font-medium">{c.date_decaissement}</div></div>
                <div><span className="text-slate-500">Impayés</span><div className="font-bold text-red-600">{c.nb_impayes} échéances</div></div>
              </div>
            </div>
          ))}
        </Card>
        <Card title="Alertes IA" icon={<AlertTriangle size={15} className="text-orange-500" />}>
          <div className="space-y-2">
            {fiche.alertes_ia.map((a, i) => (
              <div key={i} className={cn('p-3 rounded-lg border text-sm', a.severite === 'CRITIQUE' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-bold">{a.severite}</span>
                  <span className="text-[10px] text-slate-400">{a.date}</span>
                </div>
                <p>{a.message}</p>
                <p className="text-xs text-teal-700 font-semibold mt-1">→ {a.action}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="lg:col-span-5 space-y-4">
        <Card title="Équipe client (3 rôles)" icon={<Users size={15} />}>
          <dl className="space-y-2 text-sm">
            <DlRow label="RA — pilotage agence" value={fiche.responsable_agence ?? '—'} />
            <DlRow label="COM — commercial terrain" value={fiche.agent_commercial ?? fiche.agent} />
            <DlRow label="GP — suivi crédit" value={fiche.agent_gp ?? '—'} />
          </dl>
        </Card>
        <Card title="Évolution score IA (6 mois)" icon={<TrendingDown size={15} />}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={fiche.score_evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className={cn('text-center text-sm font-bold mt-2', scoreColor)}>
            {fiche.score_evolution[0].score - fiche.score_evolution.at(-1)!.score > 0 ? '−' : '+'}
            {Math.abs(fiche.score_evolution[0].score - fiche.score_evolution.at(-1)!.score)} pts sur 6 mois
          </p>
        </Card>
        <Card title="Derniers paiements" icon={<History size={15} />}>
          {fiche.paiements_recents.map((p, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
              <div>
                <div className="font-medium">{p.date}</div>
                <div className="text-xs text-slate-500">{p.canal}</div>
              </div>
              <div className="text-right">
                <div className={cn('font-bold', p.type === 'MANQUE' ? 'text-red-600' : p.type === 'PARTIEL' ? 'text-orange-600' : 'text-emerald-600')}>
                  {p.type === 'MANQUE' ? 'Non payé' : formatFcfa(p.montant)}
                </div>
                <span className="text-[10px] font-bold text-slate-500">{p.type}</span>
              </div>
            </div>
          ))}
        </Card>
        <Card title="Comptes épargne liés" icon={<Wallet size={15} />}>
          {fiche.comptes_epargne.map(ep => (
            <div key={ep.numero} className="flex justify-between py-2 text-sm">
              <div>
                <div className="font-mono text-xs text-teal-700">{ep.numero}</div>
                <div className="text-xs text-slate-500">{ep.produit}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatFcfa(ep.solde_fcfa)}</div>
                <span className="text-[10px] text-slate-500">{ep.statut}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

function TabIdentite({ fiche }: { fiche: FicheClientMicrofinance }) {
  const id = fiche.identite
  return (
    <div className="grid lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 space-y-4">
        <Card title="État civil & coordonnées" icon={<User size={15} />}>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <DlRow label="Nom complet" value={`${id.prenom} ${id.nom}`} />
            <DlRow label="Genre" value={id.genre === 'M' ? 'Masculin' : 'Féminin'} />
            <DlRow label="Date de naissance" value={`${id.date_naissance} (${id.age} ans)`} />
            <DlRow label="Nationalité" value={id.nationalite} />
            <DlRow label="Situation matrimoniale" value={id.situation_matrimoniale} />
            <DlRow label="Personnes à charge" value={String(id.personnes_charge)} />
            <DlRow label="Téléphone principal" value={id.telephone_principal} />
            <DlRow label="WhatsApp" value={id.whatsapp} />
            {id.telephone_secondaire && <DlRow label="Tél. secondaire" value={id.telephone_secondaire} />}
            {id.email && <DlRow label="E-mail" value={id.email} />}
          </dl>
        </Card>
        <Card title="Pièce d'identité" icon={<Fingerprint size={15} />}>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <DlRow label="CNI" value={id.cni} />
            <DlRow label="Délivrance" value={`${id.cni_delivrance} — ${id.cni_lieu}`} />
          </dl>
        </Card>
        <Card title="Adresses" icon={<MapPin size={15} />}>
          <dl className="space-y-3 text-sm">
            <DlRow label="Domicile" value={id.adresse_domicile} />
            <DlRow label="Lieu d'activité" value={id.adresse_activite} />
            <DlRow label="GPS activité" value={`${id.gps.lat.toFixed(4)}°, ${id.gps.lng.toFixed(4)}°`} />
          </dl>
        </Card>
        <Card title="Contact d'urgence" icon={<Users size={15} />}>
          <dl className="text-sm space-y-2">
            <DlRow label="Prénom" value={id.contact_urgence.prenom} />
            <DlRow label="Nom" value={id.contact_urgence.nom} />
            <DlRow label="Lien" value={id.contact_urgence.lien} />
            <DlRow label="Téléphone" value={id.contact_urgence.telephone} />
          </dl>
        </Card>
      </div>
      <div className="lg:col-span-5 space-y-4">
        <Card title="Localisation activité" icon={<MapPin size={15} />}>
          <div className="h-48 rounded-lg overflow-hidden border border-slate-200">
            <MiniMap lat={id.gps.lat} lng={id.gps.lng} label={fiche.activite_detail.lieu_exercice} />
          </div>
        </Card>
        <Card title="Dossier KYC" icon={<Shield size={15} />}>
          <div className="space-y-2">
            {fiche.kyc.map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-sm">
                <div>
                  <div className="font-medium">{doc.type}</div>
                  {doc.reference && <div className="text-xs text-slate-500 font-mono">{doc.reference}</div>}
                  {doc.date_depot && doc.date_depot !== '—' && (
                    <div className="text-[10px] text-slate-400">Dépôt {doc.date_depot}</div>
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded',
                  doc.statut === 'VALIDE' ? 'bg-emerald-100 text-emerald-800' :
                  doc.statut === 'MANQUANT' ? 'bg-red-100 text-red-800' :
                  doc.statut === 'EXPIRE' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800',
                )}>
                  {doc.statut.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function TabActivite({ fiche }: { fiche: FicheClientMicrofinance }) {
  const a = fiche.activite_detail
  const ia = fiche.analyse_activite_ia
  const c = ia.chiffres
  return (
    <div className="grid lg:grid-cols-12 gap-5">
      <div className="lg:col-span-8 space-y-4">
        <Card title="Activité économique" icon={<Briefcase size={15} />}>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
            <DlRow label="Secteur BCEAO" value={a.secteur} />
            <DlRow label="Sous-secteur" value={a.sous_secteur} />
            <DlRow label="Lieu d'exercice" value={a.lieu_exercice} />
            {a.numero_stand && <DlRow label="N° stand / local" value={a.numero_stand} />}
            <DlRow label="Ancienneté" value={`${a.anciennete_annees} ans`} />
            <DlRow label="Effectif" value={`${a.effectif} personne(s)`} />
          </dl>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg">{a.description}</p>
        </Card>
        <Card
          title="Analyse financière"
          icon={<Sparkles size={15} className="text-teal-600" />}
          badge={<AiBadge variant="small" label="Prospera IA" />}
          subtitle={`Généré le ${ia.date_generation} · Confiance ${ia.confiance_pct} %`}
        >
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <FinBox label="CA mensuel (déclaré)" value={formatFcfa(c.ca_mensuel_fcfa)} />
            <FinBox label="Charges mensuelles" value={formatFcfa(c.charges_mensuelles_fcfa)} />
            <FinBox label="Marge nette estimée" value={formatFcfa(c.marge_nette_fcfa)} highlight={c.marge_pct < 20} />
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex mb-4">
            <div className="bg-red-400 h-full" style={{ width: `${100 - c.marge_pct}%` }} title="Charges" />
            <div className="bg-emerald-500 h-full" style={{ width: `${c.marge_pct}%` }} title="Marge" />
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{ia.analyse_financiere}</p>
          <ul className="mt-3 space-y-1.5">
            {ia.points_cles.map((pt, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                <span className="text-teal-500 font-bold mt-0.5">→</span>
                {pt}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="lg:col-span-4 space-y-4">
        <Card
          title="Contexte marché"
          icon={<Sparkles size={15} className="text-teal-600" />}
          badge={<AiBadge variant="small" label="Prospera IA" />}
          subtitle={`Généré le ${ia.date_generation}`}
        >
          <p className="text-sm text-slate-700 leading-relaxed">{ia.contexte_marche}</p>
        </Card>
        <Card title="Lien agence & équipe" icon={<MapPin size={15} />}>
          <dl className="space-y-2 text-sm">
            <DlRow label="Agence de gestion" value={fiche.agence} />
            <DlRow label="Responsable agence (RA)" value={fiche.responsable_agence ?? '—'} />
            <DlRow label="Commercial terrain (COM)" value={fiche.agent_commercial ?? fiche.agent} />
            <DlRow label="Gestionnaire portefeuille (GP)" value={fiche.agent_gp ?? '—'} />
            <DlRow label="Dernier contact" value={fiche.dernier_contact} />
          </dl>
          <p className="text-[11px] text-slate-500 mt-3 border-t border-slate-100 pt-2">
            Modèle réseau : le commercial assure visites et prospection ; le GP pilote échéances, relances et fidélisation. Le RA supervise l&apos;agence sans visite client directe.
          </p>
        </Card>
      </div>
    </div>
  )
}

function TabCredits({
  fiche,
  credit,
  creditActif,
  onSelectCredit,
}: {
  fiche: FicheClientMicrofinance
  credit: FicheClientMicrofinance['credits_detail'][0] | undefined
  creditActif: string | undefined
  onSelectCredit: (ref: string) => void
}) {
  if (!credit) return null
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {fiche.credits_detail.map(c => (
          <button
            key={c.reference}
            type="button"
            onClick={() => onSelectCredit(c.reference)}
            className={cn(
              'px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-colors',
              creditActif === c.reference ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300',
            )}
          >
            {c.reference} {c.encours_fcfa > 0 ? formatFcfa(c.encours_fcfa) : '(clos)'}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <FinBox label="Montant décaissé" value={formatFcfa(credit.montant_decaisse_fcfa)} />
        <FinBox label="Capital restant dû" value={formatFcfa(credit.capital_restant_du_fcfa)} />
        <FinBox label="Intérêts courus" value={formatFcfa(credit.interets_courus_fcfa)} />
        <FinBox label="Pénalités retard" value={formatFcfa(credit.penalites_fcfa)} highlight />
      </div>

      <Card title={`Échéancier — ${credit.reference}`} icon={<FileText size={15} />}>
        {credit.echeancier.length === 0 ? (
          <p className="text-sm text-slate-500">
            {credit.encours_fcfa > 0 || credit.statut === 'EN_RETARD'
              ? 'Échéancier indisponible pour ce dossier — vérifiez les données crédit.'
              : 'Crédit clôturé — échéancier archivé'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-bold">N°</th>
                  <th className="px-3 py-2 font-bold">Échéance</th>
                  <th className="px-3 py-2 font-bold text-right">Capital</th>
                  <th className="px-3 py-2 font-bold text-right">Intérêt</th>
                  <th className="px-3 py-2 font-bold text-right">Total dû</th>
                  <th className="px-3 py-2 font-bold text-right">Payé</th>
                  <th className="px-3 py-2 font-bold">Statut</th>
                  <th className="px-3 py-2 font-bold text-right">Solde CRD</th>
                  <th className="px-3 py-2 font-bold text-center">Retard</th>
                </tr>
              </thead>
              <tbody>
                {credit.echeancier.map(e => (
                  <tr key={e.numero} className={cn('border-t border-slate-100', e.statut === 'IMPAYE' && 'bg-red-50/50')}>
                    <td className="px-3 py-2 font-mono text-xs">{e.numero}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.date_echeance}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatFcfa(e.capital_fcfa)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatFcfa(e.interet_fcfa)}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums">{formatFcfa(e.total_fcfa)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{e.montant_paye_fcfa ? formatFcfa(e.montant_paye_fcfa) : '—'}</td>
                    <td className="px-3 py-2">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', ECHEANCE_STATUT[e.statut])}>{e.statut}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatFcfa(e.solde_apres_fcfa)}</td>
                    <td className="px-3 py-2 text-center text-xs font-bold text-red-600">{e.retard_jours ? `J+${e.retard_jours}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title={`Cautionnaires solidaires (${MIN_CAUTIONNAIRES} minimum)`}
        icon={<Users size={15} />}
        subtitle={`${credit.reglement_garanties.nb_cautionnaires_valides}/${MIN_CAUTIONNAIRES} valide(s) · engagement ${formatFcfa(credit.montant_decaisse_fcfa)} chacun`}
      >
        <div className="space-y-3">
          {credit.cautionnaires.map(c => (
            <div key={c.ordre} className="p-3 bg-slate-50 rounded-xl text-sm flex flex-wrap justify-between gap-2 border border-slate-100">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">Caution {c.ordre}</span>
                  <span className="font-bold text-slate-800">{c.prenom} {c.nom}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{c.lien}{c.profession ? ` · ${c.profession}` : ''}</div>
                <div className="text-xs text-teal-700 mt-0.5">{c.telephone}{c.cni ? ` · CNI ${c.cni}` : ''}</div>
                <div className="text-xs text-slate-600 mt-1">
                  Revenu déclaré : <span className="font-semibold">{formatFcfa(c.revenu_mensuel_fcfa)}/mois</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5">
                  Contact urgence : {c.contact_urgence.prenom} {c.contact_urgence.nom} ({c.contact_urgence.lien}) · {c.contact_urgence.telephone}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Engagement du {c.date_engagement}</div>
              </div>
              <div className="text-right shrink-0">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', CAUTIONNAIRE_STATUT[c.statut])}>
                  {c.statut.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Barème garanties — selon montant" icon={<Shield size={15} />}>
        <div className={cn(
          'mb-4 p-3 rounded-lg text-sm border',
          credit.reglement_garanties.conforme ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900',
        )}>
          <div className="font-bold flex items-center justify-between gap-2 flex-wrap">
            <span>{credit.reglement_garanties.conforme ? '✓ Dossier conforme' : '⚠ Dossier non conforme'}</span>
            <span className="text-xs font-medium">Couverture globale {credit.reglement_garanties.couverture_totale_pct} %</span>
          </div>
          <p className="text-xs mt-1 leading-relaxed">{credit.reglement_garanties.synthese}</p>
        </div>
        <div className="space-y-2">
          {credit.reglement_garanties.exigences.map((ex, i) => (
            <div key={i} className="flex items-start justify-between gap-3 p-2.5 bg-slate-50 rounded-lg text-sm">
              <div className="min-w-0">
                <div className="font-medium text-slate-800">{ex.libelle}</div>
                {ex.detail && <div className="text-xs text-slate-500 mt-0.5">{ex.detail}</div>}
              </div>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded shrink-0', EXIGENCE_STATUT[ex.statut])}>
                {ex.statut.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-3 border-t border-slate-100 pt-2">
          Barème Prospera : ≤ 300 k → 2 cautions · &gt; 300 k → + dépôt 10 % · &gt; 500 k → + garantie réelle ≥ 30 % · &gt; 1 M → dépôt 15 % + garantie ≥ 50 %
        </p>
      </Card>

      {credit.garanties.length > 0 && (
      <Card title="Garanties complémentaires" icon={<Shield size={15} />}>
        <div className="space-y-3">
          {credit.garanties.map((g, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-xl text-sm flex flex-wrap justify-between gap-2">
              <div>
                <div className="font-bold text-slate-800">{g.type.replace('_', ' ')}</div>
                <p className="text-slate-600 text-xs mt-1">{g.description}</p>
                {g.contact && <p className="text-xs text-teal-700 mt-1">{g.contact}</p>}
              </div>
              <div className="text-right">
                <div className="font-bold">{formatFcfa(g.valeur_estimee_fcfa)}</div>
                <div className="text-xs text-slate-500">Couverture {g.couverture_pct} %</div>
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block',
                  g.statut === 'ACTIF' || g.statut === 'REALISE' ? 'bg-emerald-100 text-emerald-800' :
                  g.statut === 'MANQUANT' || g.statut === 'INSUFFISANT' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-600',
                )}>{g.statut.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
      )}
    </div>
  )
}

function TabRecouvrement({ fiche }: { fiche: FicheClientMicrofinance }) {
  return (
    <div className="grid lg:grid-cols-12 gap-5">
      <div className="lg:col-span-8">
        <Card title="Journal recouvrement" icon={<History size={15} />}>
          {fiche.recouvrement.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Aucune action de recouvrement enregistrée.</p>
          ) : (
          <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 pl-6">
            {fiche.recouvrement.map((r, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[1.6rem] w-3 h-3 rounded-full bg-teal-500 border-2 border-white" />
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-sm">
                  <div className="flex flex-wrap justify-between gap-2 mb-1">
                    <span className="font-bold text-slate-800">{RECOUV_TYPE[r.type] ?? r.type}</span>
                    <span className="text-xs text-slate-500">{r.date}{r.heure ? ` · ${r.heure}` : ''}</span>
                  </div>
                  <div className="text-xs text-teal-700 mb-1">{r.agent} · {r.canal}</div>
                  <p className="text-slate-700">{r.resultat}</p>
                  {r.montant_promis_fcfa && (
                    <p className="text-xs text-orange-700 font-bold mt-1">Montant promis : {formatFcfa(r.montant_promis_fcfa)}</p>
                  )}
                  {r.prochaine_action && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <ChevronRight size={12} /> {r.prochaine_action}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
        </Card>
      </div>
      <div className="lg:col-span-4 space-y-4">
        <Card title="Visites terrain" icon={<MapPin size={15} />}>
          {fiche.visites.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Aucune visite terrain enregistrée.</p>
          ) : (
          <>
          {fiche.visites.map((v, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm mb-2 last:mb-0">
              <div className="flex justify-between mb-1">
                <span className="font-semibold">{v.date}</span>
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded',
                  v.statut === 'POSITIVE' ? 'bg-emerald-100 text-emerald-800' :
                  v.statut === 'NEGATIVE' ? 'bg-red-100 text-red-800' : 'bg-slate-200',
                )}>{v.statut}</span>
              </div>
              <div className="text-xs text-teal-700">{v.agent}</div>
              <p className="text-xs text-slate-600 mt-1">{v.commentaire}</p>
            </div>
          ))}
          </>
          )}
        </Card>
        <Card title="Action en cours" icon={<Clock size={15} />}>
          <p className="text-sm font-bold text-teal-800">{fiche.action}</p>
          <p className="text-xs text-slate-600 mt-2">Dernier contact : {fiche.dernier_contact}</p>
        </Card>
      </div>
    </div>
  )
}

function TabRisque({ fiche }: { fiche: FicheClientMicrofinance }) {
  const r = fiche.indicateurs_risque
  return (
    <div className="grid lg:grid-cols-12 gap-5">
      <div className="lg:col-span-8 space-y-4">
        <Card title="Classification BCEAO (Instruction 001-01-2020)" icon={<Scale size={15} />}>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <FinBox label="Classe actuelle" value={r.classe_bceao.replace('_', ' ')} highlight />
            <FinBox label="Classe précédente" value={r.classe_precedente.replace('_', ' ')} />
            <FinBox label="Migration ce mois" value={r.migration_mois ? 'Oui' : 'Non'} />
            <FinBox label="Provision" value={`${r.provision_pct} % · ${formatFcfa(r.provision_fcfa)}`} />
          </div>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm mb-5">
            <DlRow label="LGD (perte en défaut)" value={`${r.lgd_pct} %`} />
            <DlRow label="Expected Loss (EL)" value={formatFcfa(r.el_fcfa)} />
            <DlRow label="Ratio encours / revenu" value={`${r.ratio_encours_revenu}×`} />
            <DlRow label="DTI (endettement)" value={`${r.dti_pct} %`} />
            <DlRow label="Jours de retard max" value={`J+${fiche.jours_retard}`} />
          </dl>

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <MetricDetailPanel
              modele={r.explication_score_ia.modele}
              version={r.explication_score_ia.version}
              valeur={r.explication_score_ia.score}
              unite="/100"
              synthese={r.explication_score_ia.synthese}
              facteurs={r.explication_score_ia.facteurs}
              contributionSuffix="pts"
              accent="teal"
              valeurClassName={scoreColorClass(r.explication_score_ia.score)}
              badge={<AiBadge variant="small" label="Prospera AI" />}
            />
            <MetricDetailPanel
              modele={r.explication_score_cbi.modele}
              version={r.explication_score_cbi.version}
              valeur={r.explication_score_cbi.score}
              unite="/100"
              synthese={r.explication_score_cbi.synthese}
              facteurs={r.explication_score_cbi.facteurs}
              contributionSuffix="pts"
              accent="slate"
              valeurClassName={scoreColorClass(r.explication_score_cbi.score)}
              badge={<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">CBI v5</span>}
            />
            <div className="md:col-span-2">
              <MetricDetailPanel
                modele={r.explication_pd.modele}
                version={r.explication_pd.version}
                valeur={r.explication_pd.pd_pct}
                unite="%"
                synthese={r.explication_pd.synthese}
                facteurs={r.explication_pd.facteurs}
                contributionSuffix="% PD"
                accent="rose"
                valeurClassName={pdColorClass(r.explication_pd.pd_pct)}
                formule={r.explication_pd.formule_el}
                badge={<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Probabilité défaut</span>}
              />
            </div>
          </div>
        </Card>
        <Card title="Recommandation DEC" icon={<Sparkles size={15} className="text-teal-600" />}>
          <p className="text-sm text-slate-700 leading-relaxed">{fiche.decision_dec.recommandation}</p>
        </Card>
      </div>
      <div className="lg:col-span-4">
        <Card title="Barème provision BCEAO" icon={<Shield size={15} />}>
          <div className="space-y-2 text-xs">
            {[
              { cls: 'Normal (J+0–30)', pct: '1 %' },
              { cls: 'Sous surveillance (J+31–90)', pct: '10 %' },
              { cls: 'Douteux (J+91–180)', pct: '50 %' },
              { cls: 'Compromises (J+181–360)', pct: '80 %' },
              { cls: 'Contentieux (J+360+)', pct: '100 %' },
            ].map(row => (
              <div key={row.cls} className={cn(
                'flex justify-between p-2 rounded-lg',
                fiche.classe_bceao.includes(row.cls.split(' ')[0].toUpperCase()) ? 'bg-teal-50 border border-teal-200 font-bold' : 'bg-slate-50',
              )}>
                <span>{row.cls}</span>
                <span>{row.pct}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Card({
  title,
  icon,
  badge,
  subtitle,
  children,
}: {
  title: string
  icon: React.ReactNode
  badge?: React.ReactNode
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-slate-500 shrink-0">{icon}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {badge}
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

function DlRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500 text-xs">{label}</dt>
      <dd className="font-medium text-slate-900 mt-0.5">{value}</dd>
    </div>
  )
}

const STATUT_FACTEUR: Record<ScoreFacteur['statut'], string> = {
  FORT: 'bg-emerald-100 text-emerald-800',
  MOYEN: 'bg-amber-100 text-amber-800',
  FAIBLE: 'bg-orange-100 text-orange-800',
  CRITIQUE: 'bg-red-100 text-red-800',
}

function scoreColorClass(score: number): string {
  if (score < 45) return 'text-red-600'
  if (score < 55) return 'text-orange-600'
  if (score < 70) return 'text-amber-600'
  return 'text-emerald-600'
}

function pdColorClass(pd: number): string {
  if (pd >= 50) return 'text-red-600'
  if (pd >= 35) return 'text-orange-600'
  if (pd >= 20) return 'text-amber-600'
  return 'text-emerald-600'
}

function MetricDetailPanel({
  modele,
  version,
  valeur,
  unite,
  synthese,
  facteurs,
  contributionSuffix,
  accent,
  valeurClassName,
  badge,
  formule,
}: {
  modele: string
  version: string
  valeur: number
  unite: string
  synthese: string
  facteurs: ScoreFacteur[]
  contributionSuffix: string
  accent: 'teal' | 'slate' | 'rose'
  valeurClassName: string
  badge?: React.ReactNode
  formule?: string
}) {
  const borderAccent = accent === 'teal'
    ? 'border-teal-200 bg-teal-50/40'
    : accent === 'rose'
      ? 'border-red-200 bg-red-50/30'
      : 'border-slate-200 bg-slate-50/60'
  const barAccent = accent === 'teal' ? 'bg-teal-500' : accent === 'rose' ? 'bg-red-500' : 'bg-slate-600'

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', borderAccent)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">
            {modele} · {version}
          </div>
          <div className={cn('text-3xl font-black mt-1', valeurClassName)}>
            {valeur}<span className="text-sm text-slate-400 font-normal">{unite}</span>
          </div>
        </div>
        {badge}
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{synthese}</p>
      {formule && (
        <p className="text-[10px] font-mono text-slate-500 bg-white/70 border border-slate-100 rounded-lg px-2.5 py-1.5">
          {formule}
        </p>
      )}
      <div className="space-y-2.5 pt-1">
        {facteurs.map(f => (
          <div key={f.libelle} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-800 truncate">{f.libelle}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', STATUT_FACTEUR[f.statut])}>
                  {f.statut}
                </span>
                <span className="text-slate-500 font-mono">{f.contribution} {contributionSuffix}</span>
              </div>
            </div>
            <div className="h-1.5 bg-white/80 rounded-full overflow-hidden border border-slate-100">
              <div
                className={cn('h-full rounded-full transition-all', barAccent)}
                style={{ width: `${f.note}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">{f.explication}</p>
          </div>
        ))}
      </div>
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
