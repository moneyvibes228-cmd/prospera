'use client'
import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ArrowLeft, Phone, MapPin, Briefcase, FileText, Sparkles,
  TrendingUp, TrendingDown, Minus, Calendar, User, Users,
  MessageCircle, Shield, Clock, BadgeCheck, AlertTriangle,
  Banknote, Star, Award, Activity, ChevronDown, ChevronUp,
  Wallet, CreditCard, Building2, Fingerprint,
} from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DemandeCreditModal } from '@/components/collecte/DemandeCreditModal'
import { RiskHistory } from '@/components/emprunteurs/RiskHistory'
import { CalendrierRecouvrementBlock } from '@/components/ra/CalendrierRecouvrementBlock'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { getClientMeta, statutLabel, type DemandeCreditSession } from '@/lib/clients-session'
import type { ClientCollecte } from '@/lib/collecte-agent-hub'
import type { Borrower, Visit } from '@/types'
import { formatFcfa, getRiskColor, formatDate } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'

const MiniMap = dynamic(() => import('@/components/terrain/MiniMap'), { ssr: false })

// ── Styles ────────────────────────────────────────────────────────────────────
const RISQUE_STYLE: Record<string, string> = {
  CRITIQUE: 'bg-red-100 text-red-800 border-red-300',
  HAUT:     'bg-orange-100 text-orange-800 border-orange-300',
  MOYEN:    'bg-yellow-100 text-yellow-800 border-yellow-300',
  FAIBLE:   'bg-green-100 text-green-800 border-green-300',
}
const RISQUE_DOT: Record<string, string> = {
  CRITIQUE: 'bg-red-500', HAUT: 'bg-orange-500', MOYEN: 'bg-yellow-500', FAIBLE: 'bg-green-500',
}
const TYPE_STYLE: Record<string, string> = {
  ACTIF:    'bg-green-100 text-green-700 border-green-200',
  RETARD:   'bg-orange-100 text-orange-700 border-orange-200',
  TONTINE:  'bg-purple-100 text-purple-700 border-purple-200',
  PROSPECT: 'bg-blue-100 text-blue-700 border-blue-200',
}
const CANAL_ICON: Record<string, React.ElementType> = {
  ESPECES: Banknote, MOMO: Phone, TONTINE: Users, VIREMENT: Building2,
}
const CANAL_LABEL: Record<string, string> = {
  ESPECES: 'Espèces', MOMO: 'Mobile Money', TONTINE: 'Tontine', VIREMENT: 'Virement',
}
const COMM_LABEL: Record<string, string> = {
  WHATSAPP: 'WhatsApp', APPEL: 'Appel', VISITE: 'Visite terrain',
}
const TABS = ['Échéancier', 'Historique paiements', 'Visites terrain', 'Alertes IA', 'Demandes crédit'] as const

interface Props {
  client: Borrower
  hubClient?: ClientCollecte
  demandes: DemandeCreditSession[]
  onDemandeCreated: (d: DemandeCreditSession) => void
}

export function FicheClientCollecte({ client, hubClient, demandes, onDemandeCreated }: Props) {
  const [showDemande, setShowDemande] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [profilOpen, setProfilOpen] = useState(true)

  const meta = getClientMeta(client.id)
  const activite = meta?.activite ?? hubClient?.activite ?? 'Non renseigné'
  const adresse   = meta?.adresse  ?? hubClient?.adresse  ?? client.zone
  const rawType   = meta?.type_client ?? hubClient?.type_client ?? (client.id.startsWith('new-') ? 'PROSPECT' : 'ACTIF')
  const typeClient = rawType === 'CLIENT' ? 'ACTIF' : rawType as string

  const encours    = client.montant_credit - client.montant_rembourse
  const pctRembourse = client.montant_credit > 0
    ? Math.min(100, Math.round(client.montant_rembourse / client.montant_credit * 100))
    : 0
  const hasScore  = client.score_ia > 0
  const risk      = getRiskColor(client.score_ia)
  const circumference = 2 * Math.PI * 44
  const dashOffset = hasScore ? circumference - (client.score_ia / 100) * circumference : circumference
  const canDemande = client.statut !== 'DEFAUT'

  const TendanceIcon = client.score_tendance === 'HAUSSE' ? TrendingUp
    : client.score_tendance === 'BAISSE' ? TrendingDown : Minus
  const tendanceColor = client.score_tendance === 'HAUSSE' ? 'text-green-600'
    : client.score_tendance === 'BAISSE' ? 'text-red-500' : 'text-slate-400'

  // Initiales
  const initiales = client.nom.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <>
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors duration-200"
      >
        <ArrowLeft size={16} /> Mes clients
      </Link>

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <div className="bg-linear-to-r from-slate-900 to-slate-800 rounded-2xl p-5 mb-5 text-white">
        <div className="flex flex-wrap items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
            style={{ backgroundColor: risk.dot }}>
            {initiales}
          </div>

          {/* Identité principale */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-black">{client.nom}</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_STYLE[typeClient] ?? TYPE_STYLE.ACTIF}`}>
                {typeClient}
              </span>
              {hubClient?.risque && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RISQUE_STYLE[hubClient.risque]}`}>
                  Risque {hubClient.risque}
                </span>
              )}
            </div>
            <p className="text-slate-300 text-sm">{activite} · {client.zone}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Phone size={11}/>{client.telephone}</span>
              <span className="flex items-center gap-1"><MapPin size={11}/>{adresse}</span>
              {hubClient?.membre_depuis && <span className="flex items-center gap-1"><Calendar size={11}/>Membre depuis {hubClient.membre_depuis}</span>}
            </div>
          </div>

          {/* Score cercle */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8"/>
                <circle cx="50" cy="50" r="44" fill="none" stroke={risk.dot} strokeWidth="8"
                  strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-black" style={{ color: risk.dot }}>
                  {hasScore ? client.score_ia : '—'}
                </span>
                {hasScore && <span className="text-slate-400 text-[9px]">/100</span>}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Score IA</div>
            <div className={`text-[10px] font-bold flex items-center gap-0.5 mt-0.5 ${tendanceColor}`}>
              <TendanceIcon size={10}/>{hasScore ? risk.label : 'Non calculé'}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex flex-col gap-2 shrink-0">
            <a href={`tel:${client.telephone}`}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors duration-200">
              <Phone size={13}/> Appeler
            </a>
            <a href={`https://wa.me/${client.telephone.replace(/\s/g,'').replace('+','')}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 bg-green-500/80 hover:bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors duration-200">
              <MessageCircle size={13}/> WhatsApp
            </a>
            {canDemande && (
              <button type="button" onClick={() => setShowDemande(true)}
                className="inline-flex items-center gap-2 bg-pink-500/80 hover:bg-pink-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors duration-200 cursor-pointer">
                <FileText size={13}/> Demande crédit
              </button>
            )}
          </div>
        </div>

        {/* IA suggestion dans le header */}
        {hubClient?.suggestion_ia && (
          <div className="mt-4 flex items-start gap-2.5 bg-white/10 rounded-xl p-3">
            <Sparkles size={14} className="text-yellow-400 mt-0.5 shrink-0"/>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-yellow-300">Analyse IA</span>
                <AiBadge variant="small"/>
              </div>
              <p className="text-xs text-white/90 leading-relaxed">{hubClient.suggestion_ia}</p>
              {hubClient.action_prioritaire && (
                <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold bg-orange-500/80 text-white px-2 py-0.5 rounded-full">
                  <AlertTriangle size={10}/> Action : {hubClient.action_prioritaire}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 8 KPIs en bandeau ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-5">
        <KpiCard label="Encours" value={client.montant_credit > 0 ? formatFcfa(encours) : '—'} highlight={encours > 0}/>
        <KpiCard label="Crédit initial" value={client.montant_credit > 0 ? formatFcfa(client.montant_credit) : '—'}/>
        <KpiCard label="Remboursé" value={client.montant_rembourse > 0 ? formatFcfa(client.montant_rembourse) : '—'} ok={pctRembourse > 0}
          sub={pctRembourse > 0 ? `${pctRembourse}%` : undefined}/>
        <KpiCard label="Retard" value={client.retard_jours > 0 ? `J+${client.retard_jours}` : 'À jour'} alert={client.retard_jours > 0}/>
        <KpiCard label="Mensualité" value={hubClient?.mensualite ? formatFcfa(hubClient.mensualite) : '—'}/>
        <KpiCard label="Prochaine éch." value={hubClient?.echeance_prochaine ?? '—'} small/>
        <KpiCard label="Ponctualité" value={hubClient?.taux_ponctualite_pct != null ? `${hubClient.taux_ponctualite_pct}%` : '—'}
          ok={(hubClient?.taux_ponctualite_pct ?? 0) >= 80} alert={(hubClient?.taux_ponctualite_pct ?? 100) < 60}/>
        <KpiCard label="Nb crédits" value={hubClient?.nb_credits_anterieurs != null ? String(hubClient.nb_credits_anterieurs) : '0'}/>
      </div>

      {/* ── Barre de progression crédit ─────────────────────────────────────── */}
      {client.montant_credit > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 mb-5 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-700">Progression remboursement</span>
              <span className={`font-black ${pctRembourse >= 80 ? 'text-green-700' : pctRembourse >= 50 ? 'text-blue-700' : 'text-orange-700'}`}>
                {pctRembourse}%
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${pctRembourse >= 80 ? 'bg-green-500' : pctRembourse >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                style={{ width: `${pctRembourse}%` }}
              />
            </div>
          </div>
          <div className="text-right text-xs shrink-0">
            <div className="font-black text-teal-700">{formatFcfa(client.montant_rembourse)}</div>
            <div className="text-slate-400">/ {formatFcfa(client.montant_credit)}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-5">
        {/* ── Colonne gauche ─────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-4 space-y-4">

          {/* Profil complet */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setProfilOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Fingerprint size={14} className="text-slate-500"/>
                <span className="text-sm font-bold text-slate-900">Profil client</span>
              </div>
              {profilOpen ? <ChevronUp size={14} className="text-slate-400"/> : <ChevronDown size={14} className="text-slate-400"/>}
            </button>
            {profilOpen && (
              <div className="divide-y divide-slate-50">
                <ProfileRow icon={User}        label="Statut"          value={<StatusBadge status={client.statut}/>}/>
                <ProfileRow icon={Phone}       label="Téléphone"       value={client.telephone}/>
                <ProfileRow icon={MapPin}      label="Zone"            value={client.zone}/>
                <ProfileRow icon={Briefcase}   label="Activité"        value={activite}/>
                <ProfileRow icon={MapPin}      label="Adresse"         value={adresse}/>
                {hubClient?.activite_secondaire && (
                  <ProfileRow icon={Briefcase} label="Activité 2"      value={hubClient.activite_secondaire}/>
                )}
                {hubClient?.revenu_estime_mensuel && (
                  <ProfileRow icon={Banknote}  label="Revenu estimé"   value={`${formatFcfa(hubClient.revenu_estime_mensuel)}/mois`}/>
                )}
                <ProfileRow icon={Calendar}    label="Membre depuis"   value={hubClient?.membre_depuis ?? '—'}/>
                <ProfileRow icon={Award}       label="Segment"         value={hubClient?.segment ?? '—'}/>
                {hubClient?.produit_actuel && (
                  <ProfileRow icon={CreditCard} label="Produit"        value={hubClient.produit_actuel}/>
                )}
                {hubClient?.garantie && (
                  <ProfileRow icon={Shield}    label="Garantie"        value={hubClient.garantie}/>
                )}
                {hubClient?.groupe_tontine && (
                  <ProfileRow icon={Users}     label="Groupe tontine"  value={hubClient.groupe_tontine}/>
                )}
              </div>
            )}
          </div>

          {/* Comportement & collecte */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Activity size={14} className="text-pink-600"/>
              <h3 className="text-sm font-bold text-slate-900">Comportement collecte</h3>
            </div>
            {hubClient?.canal_collecte && (
              <InfoRow2 icon={CANAL_ICON[hubClient.canal_collecte] ?? Banknote}
                label="Canal préféré" value={CANAL_LABEL[hubClient.canal_collecte]}/>
            )}
            {hubClient?.canal_communication && (
              <InfoRow2 icon={MessageCircle}
                label="Contact préféré" value={COMM_LABEL[hubClient.canal_communication]}/>
            )}
            <InfoRow2 icon={Clock}
              label="Dernier paiement" value={hubClient?.dernier_paiement ?? '—'}/>
            {hubClient?.nb_visites_mois != null && (
              <InfoRow2 icon={MapPin}
                label="Visites ce mois" value={`${hubClient.nb_visites_mois} visites`}/>
            )}
            {hubClient?.motif_dernier_contact && (
              <InfoRow2 icon={MessageCircle}
                label="Dernier contact" value={hubClient.motif_dernier_contact}/>
            )}
            {client.derniere_visite && (
              <InfoRow2 icon={Calendar}
                label="Dernière visite" value={formatDate(client.derniere_visite)}/>
            )}
            {/* Ponctualité visuelle */}
            {hubClient?.taux_ponctualite_pct != null && (
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500 font-medium">Taux ponctualité</span>
                  <span className={`font-black ${hubClient.taux_ponctualite_pct >= 80 ? 'text-green-700' : hubClient.taux_ponctualite_pct >= 60 ? 'text-orange-700' : 'text-red-700'}`}>
                    {hubClient.taux_ponctualite_pct}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${hubClient.taux_ponctualite_pct >= 80 ? 'bg-green-500' : hubClient.taux_ponctualite_pct >= 60 ? 'bg-orange-500' : 'bg-red-500'}`}
                    style={{ width: `${hubClient.taux_ponctualite_pct}%` }}/>
                </div>
              </div>
            )}
          </div>

          {/* Risque IA */}
          {hubClient?.risque && (
            <div className={`rounded-xl border p-4 ${RISQUE_STYLE[hubClient.risque]}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${RISQUE_DOT[hubClient.risque]}`}/>
                <span className="text-sm font-bold">Risque IA : {hubClient.risque}</span>
                <BadgeCheck size={14} className="ml-auto"/>
              </div>
              <p className="text-xs leading-relaxed opacity-80">{hubClient.suggestion_ia}</p>
            </div>
          )}

          {/* Carte GPS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <MapPin size={14} className="text-pink-500"/>
              <span className="text-sm font-bold text-slate-900">Localisation GPS</span>
            </div>
            {client.lat && client.lng ? (
              <MiniMap lat={client.lat} lng={client.lng} label={client.nom}/>
            ) : (
              <div className="h-40 bg-slate-50 flex items-center justify-center text-sm text-slate-400">
                Localisation non renseignée
              </div>
            )}
            {adresse && (
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 flex items-start gap-1.5">
                <MapPin size={11} className="text-slate-400 mt-0.5 shrink-0"/>{adresse}
              </div>
            )}
          </div>
        </div>

        {/* ── Colonne droite ─────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-8 space-y-4">

          {/* Onglets riches */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex overflow-x-auto border-b border-slate-100">
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={`px-4 py-3.5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                    activeTab === i
                      ? 'border-pink-500 text-pink-600 bg-pink-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                  {tab === 'Demandes crédit' && demandes.length > 0 && (
                    <span className="ml-1.5 bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full text-[9px] font-black">
                      {demandes.length}
                    </span>
                  )}
                  {tab === 'Alertes IA' && (client.alertes_ia?.length ?? 0) > 0 && (
                    <span className="ml-1.5 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-[9px] font-black">
                      {client.alertes_ia!.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === 0 && <CalendrierRecouvrementBlock borrower={client}/>}
              {activeTab === 1 && (
                client.historique_paiements && client.historique_paiements.length > 0
                  ? <RiskHistory payments={client.historique_paiements}/>
                  : <Empty msg="Aucun historique de paiement enregistré."/>
              )}
              {activeTab === 2 && <VisitesList visites={client.visites}/>}
              {activeTab === 3 && <AlertesList alertes={client.alertes_ia}/>}
              {activeTab === 4 && (
                <DemandesList
                  demandes={demandes}
                  canDemande={canDemande}
                  onNew={() => setShowDemande(true)}
                />
              )}
            </div>
          </div>

          {/* Statistiques crédit client */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star size={14} className="text-amber-500"/>
              <h3 className="text-sm font-bold text-slate-900">Profil financier détaillé</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <StatBox label="Crédit actuel" value={hubClient?.produit_actuel ?? '—'} icon={CreditCard}/>
              <StatBox label="Garantie" value={hubClient?.garantie ?? '—'} icon={Shield}/>
              <StatBox label="Segment" value={hubClient?.segment ?? '—'} icon={Award}/>
              <StatBox label="Nb crédits hist." value={String(hubClient?.nb_credits_anterieurs ?? 0)} icon={Activity}/>
              <StatBox label="Revenu estimé" value={hubClient?.revenu_estime_mensuel ? `${formatFcfa(hubClient.revenu_estime_mensuel)}/m` : '—'} icon={Wallet}/>
              <StatBox label="Activ. secondaire" value={hubClient?.activite_secondaire ?? '—'} icon={Briefcase}/>
              <StatBox label="Visites/mois" value={String(hubClient?.nb_visites_mois ?? '—')} icon={MapPin}/>
              <StatBox label="Ponctualité hist." value={hubClient?.taux_ponctualite_pct != null ? `${hubClient.taux_ponctualite_pct}%` : '—'} icon={BadgeCheck}
                alert={(hubClient?.taux_ponctualite_pct ?? 100) < 60}
                ok={(hubClient?.taux_ponctualite_pct ?? 0) >= 80}/>
            </div>
          </div>
        </div>
      </div>

      {showDemande && (
        <DemandeCreditModal
          clientId={client.id}
          clientNom={client.nom}
          onClose={() => setShowDemande(false)}
          onSuccess={d => { onDemandeCreated(d); setShowDemande(false) }}
        />
      )}
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, highlight, ok, alert, small }: {
  label: string; value: string; sub?: string; highlight?: boolean; ok?: boolean; alert?: boolean; small?: boolean
}) {
  const bg = alert ? 'bg-red-50 border-red-200' : ok ? 'bg-green-50 border-green-200' : highlight ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-200'
  const vc = alert ? 'text-red-700' : ok ? 'text-green-700' : highlight ? 'text-teal-700' : 'text-slate-800'
  return (
    <div className={`rounded-xl border p-3 ${bg}`}>
      <div className="text-[9px] font-bold text-slate-500 uppercase truncate">{label}</div>
      <div className={`${small ? 'text-xs' : 'text-sm'} font-black mt-0.5 ${vc} leading-tight`}>{value}</div>
      {sub && <div className="text-[9px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function ProfileRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
      <Icon size={13} className="text-slate-400 shrink-0"/>
      <span className="text-[10px] font-bold text-slate-500 uppercase w-24 shrink-0">{label}</span>
      <span className="text-xs text-slate-800 font-medium">{value}</span>
    </div>
  )
}

function InfoRow2({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={13} className="text-slate-400 shrink-0"/>
      <span className="text-[10px] text-slate-500 w-28 shrink-0">{label}</span>
      <span className="text-xs font-bold text-slate-800">{value}</span>
    </div>
  )
}

function StatBox({ label, value, icon: Icon, ok, alert }: {
  label: string; value: string; icon: React.ElementType; ok?: boolean; alert?: boolean
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-slate-400"/>
        <span className="text-[9px] font-bold text-slate-500 uppercase">{label}</span>
      </div>
      <div className={`text-xs font-black leading-tight ${alert ? 'text-red-700' : ok ? 'text-green-700' : 'text-slate-800'}`}>
        {value}
      </div>
    </div>
  )
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-center py-10 text-sm text-slate-400">{msg}</p>
}

function DemandesList({ demandes, canDemande, onNew }: {
  demandes: DemandeCreditSession[]; canDemande: boolean; onNew: () => void
}) {
  if (demandes.length === 0) {
    return (
      <div className="text-center py-10">
        <CreditCard size={32} className="mx-auto text-slate-300 mb-3"/>
        <p className="text-sm text-slate-400 mb-3">Aucune demande de crédit pour ce client.</p>
        {canDemande && (
          <button type="button" onClick={onNew}
            className="text-sm font-bold text-pink-600 hover:text-pink-800 cursor-pointer">
            Lancer une demande →
          </button>
        )}
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {demandes.map(d => (
        <div key={d.id} className="border border-slate-100 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-slate-800">{d.produit}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Réf. {d.reference} · {d.date} · {d.agent}</div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
              {d.statut.replace('_', ' ')}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="bg-teal-50 rounded-lg p-2 text-center">
              <div className="text-[9px] text-slate-500 uppercase font-bold">Montant</div>
              <div className="text-xs font-black text-teal-700">{formatFcfa(d.montant)}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="text-[9px] text-slate-500 uppercase font-bold">Durée</div>
              <div className="text-xs font-black text-slate-800">{d.duree_mois} mois</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="text-[9px] text-slate-500 uppercase font-bold">Objet</div>
              <div className="text-[10px] font-bold text-slate-700 leading-tight truncate">{d.objet}</div>
            </div>
          </div>
        </div>
      ))}
      {canDemande && (
        <button type="button" onClick={onNew}
          className="w-full py-2.5 border-2 border-dashed border-pink-200 text-sm font-bold text-pink-600 hover:border-pink-400 hover:bg-pink-50 rounded-xl transition-colors duration-200 cursor-pointer">
          + Nouvelle demande de crédit
        </button>
      )}
    </div>
  )
}

function VisitesList({ visites }: { visites?: Visit[] }) {
  const STATUS_COLORS: Record<string, string> = {
    POSITIVE:     'bg-green-50 border-green-100 text-green-800',
    NEGATIVE:     'bg-red-50 border-red-100 text-red-800',
    SANS_REPONSE: 'bg-slate-50 border-slate-200 text-slate-700',
  }
  if (!visites || visites.length === 0) return <Empty msg="Aucune visite terrain enregistrée."/>
  return (
    <div className="space-y-3">
      {visites.map(v => (
        <div key={v.id} className={`rounded-xl border p-3.5 ${STATUS_COLORS[v.statut] ?? STATUS_COLORS.SANS_REPONSE}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold">{formatDate(v.date)}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60">{v.statut.replace('_', ' ')}</span>
          </div>
          <p className="text-xs opacity-80">{v.agentNom} · {v.methode.replace('_', ' ')}</p>
          {v.commentaire && <p className="text-xs mt-1 font-medium">{v.commentaire}</p>}
        </div>
      ))}
    </div>
  )
}

function AlertesList({ alertes }: { alertes?: import('@/types').AIAlert[] }) {
  if (!alertes || alertes.length === 0) return <Empty msg="Aucune alerte IA active — client à jour."/>
  return (
    <div className="space-y-3">
      {alertes.map(a => (
        <div key={a.id} className={`rounded-xl border p-4 ${a.severity === 'CRITIQUE' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.severity === 'CRITIQUE' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
              {a.severity}
            </span>
            <span className="text-[10px] text-slate-400">{formatDate(a.createdAt)}</span>
          </div>
          <p className="text-sm font-bold text-slate-800">{a.message}</p>
          <p className="text-xs text-slate-600 mt-1">→ {a.action_recommandee}</p>
        </div>
      ))}
    </div>
  )
}
