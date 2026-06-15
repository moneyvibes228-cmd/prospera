'use client'
import { useState } from 'react'
import {
  Sparkles, MapPin, AlertTriangle, Users, Target, Award, Clock, Bell,
  TrendingUp, TrendingDown, CheckCircle2, ArrowRight, ChevronRight, Trophy,
  Route, Navigation, Wallet, Phone, Eye, Calendar, Camera, Flag,
  Banknote, AlertOctagon, Activity, Crosshair, ChevronDown, Shield,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { MOCK_TERRAIN_HOME } from '@/lib/mockMicrofinance'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { formatFcfa } from '@/lib/utils'

// =============================================================================
//   STYLE MAPS
// =============================================================================
const PRIO_STYLE: Record<string, string> = {
  CRITIQUE: 'bg-red-600 text-white',
  HAUTE:    'bg-orange-500 text-white',
  MOYENNE:  'bg-yellow-400 text-yellow-900',
  NORMALE:  'bg-slate-200 text-slate-700',
}

const SEVERITE_STYLE: Record<string, string> = {
  CRITIQUE: 'bg-red-50  border-red-300    text-red-800',
  HAUTE:    'bg-orange-50 border-orange-300 text-orange-800',
  MOYENNE:  'bg-yellow-50 border-yellow-300 text-yellow-800',
  INFO:     'bg-blue-50   border-blue-300   text-blue-800',
}

const RISQUE_PILL: Record<string, string> = {
  CRITIQUE: 'bg-red-600 text-white',
  HAUT:     'bg-orange-500 text-white',
  MOYEN:    'bg-yellow-400 text-yellow-900',
  FAIBLE:   'bg-green-500 text-white',
}

const SEGMENT_STYLE: Record<string, { bg: string; label: string }> = {
  VIP:      { bg: 'bg-purple-100 text-purple-700',  label: 'VIP' },
  BONNE:    { bg: 'bg-green-100 text-green-700',    label: 'Bonne payeuse' },
  SENSIBLE: { bg: 'bg-yellow-100 text-yellow-700',  label: 'Sensible' },
  RISQUE:   { bg: 'bg-red-100 text-red-700',        label: 'À risque' },
  INACTIVE: { bg: 'bg-slate-100 text-slate-600',    label: 'Inactive' },
}

const STATUT_GROUPE_STYLE: Record<string, string> = {
  BON:       'bg-green-100 text-green-700 border-green-300',
  NORMAL:    'bg-blue-100 text-blue-700 border-blue-300',
  TENSION:   'bg-yellow-100 text-yellow-700 border-yellow-300',
  DEGRADE:   'bg-orange-100 text-orange-700 border-orange-300',
  CRITIQUE:  'bg-red-100 text-red-700 border-red-300',
  PROGRAMME: 'bg-slate-100 text-slate-600 border-slate-300',
}

const STATUT_PROSPECT_STYLE: Record<string, string> = {
  CHAUD: 'bg-red-100 text-red-700 border-red-300',
  TIEDE: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  FROID: 'bg-blue-100 text-blue-700 border-blue-300',
}

const TYPE_VISITE_ICON: Record<string, React.ElementType> = {
  TONTINE:      Users,
  RECOUVREMENT: AlertTriangle,
  PROSPECTION:  Target,
  PROMESSE:     CheckCircle2,
  DOSSIER:      Flag,
  VISITE:       Eye,
  COLLECTE:     Banknote,
}

const TYPE_VISITE_COLOR: Record<string, string> = {
  TONTINE:      'bg-indigo-100 text-indigo-700',
  RECOUVREMENT: 'bg-red-100 text-red-700',
  PROSPECTION:  'bg-emerald-100 text-emerald-700',
  PROMESSE:     'bg-amber-100 text-amber-700',
  DOSSIER:      'bg-purple-100 text-purple-700',
  VISITE:       'bg-blue-100 text-blue-700',
  COLLECTE:     'bg-teal-100 text-teal-700',
}

const TONE_DOT: Record<string, string> = {
  positif:   'bg-green-500',
  negatif:   'bg-red-500',
  attention: 'bg-orange-500',
  info:      'bg-blue-500',
}

const BADGE_ICON_COLOR: Record<string, string> = {
  OR:     'text-amber-500',
  ARGENT: 'text-slate-400',
  BRONZE: 'text-orange-600',
}

// =============================================================================
//   MAIN COMPONENT
// =============================================================================
export default function DashboardTerrain() {
  const d = MOCK_TERRAIN_HOME
  const [openSynthese, setOpenSynthese] = useState(true)
  const [activeTab, setActiveTab] = useState<'tontine' | 'recouv' | 'prospect'>('recouv')

  const taux = d.resume_journee.taux_atteinte_pct
  const tauxColor = taux >= 80 ? 'bg-green-500' : taux >= 60 ? 'bg-blue-500' : taux >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* =====================================================================
          HEADER : Synthèse IA "Ma journée"
          ===================================================================== */}
      <section className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => setOpenSynthese(!openSynthese)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/30 transition"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">Synthèse IA — Ma journée</h2>
                <AiBadge variant="small" pulse />
              </div>
              <p className="text-xs text-slate-500">Générée {d.synthese_ia_journee.date_generation}</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openSynthese ? 'rotate-180' : ''}`} />
        </button>

        {openSynthese && (
          <div className="px-4 sm:px-5 pb-5 space-y-4">
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium border-l-4 border-indigo-500 pl-3 italic">
              {d.synthese_ia_journee.intro}
            </p>

            {/* Points clés */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {d.synthese_ia_journee.points.map((p, i) => (
                <div key={i} className="flex items-start gap-2 bg-white/70 rounded-lg p-2.5 border border-white">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${TONE_DOT[p.tone] || 'bg-slate-400'}`} />
                  <span className="text-xs sm:text-sm text-slate-700 leading-snug">{p.texte}</span>
                </div>
              ))}
            </div>

            {/* Priorités IA */}
            <div className="bg-white rounded-xl p-3 sm:p-4 border border-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-indigo-600" />
                <span className="text-xs sm:text-sm font-bold text-indigo-700 uppercase tracking-wider">Priorités IA recommandées</span>
              </div>
              <ol className="space-y-2">
                {d.synthese_ia_journee.priorites.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-xs sm:text-sm text-slate-700 leading-snug">{p}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================================
          RÉSUMÉ JOURNÉE : 8 KPIs immédiats
          ===================================================================== */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Ma journée — Résumé
          </h2>
          <ExportButton filename="journee-terrain" size="sm" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <MiniKpi icon={<MapPin className="w-4 h-4" />}        label="À visiter"     value={d.resume_journee.clientes_a_visiter}                        sub="clientes" color="bg-blue-500" />
          <MiniKpi icon={<Wallet className="w-4 h-4" />}        label="À collecter"   value={formatFcfa(d.resume_journee.montant_a_collecter)}            sub="FCFA"     color="bg-emerald-500" />
          <MiniKpi icon={<Users className="w-4 h-4" />}         label="Tontines"      value={d.resume_journee.tontines_prevues}                          sub="prévues"  color="bg-indigo-500" />
          <MiniKpi icon={<AlertTriangle className="w-4 h-4" />} label="En retard"     value={d.resume_journee.clients_en_retard}                         sub="clients"  color="bg-red-500" />
          <MiniKpi icon={<Target className="w-4 h-4" />}        label="Objectif jour" value={formatFcfa(d.resume_journee.objectif_jour)}                  sub="FCFA"     color="bg-purple-500" />
          <MiniKpi icon={<TrendingUp className="w-4 h-4" />}    label="Atteinte"      value={`${taux}%`}                                                  sub="du jour"   color={tauxColor} progress={taux} />
          <MiniKpi icon={<Crosshair className="w-4 h-4" />}     label="Prospects"     value={d.resume_journee.prospects_a_rencontrer}                    sub="à voir"    color="bg-pink-500" />
          <MiniKpi icon={<Flag className="w-4 h-4" />}          label="Dossiers"      value={d.resume_journee.dossiers_a_completer}                      sub="à finaliser" color="bg-amber-500" />
        </div>
      </section>

      {/* =====================================================================
          GRID PRINCIPAL : Planning (left, big) + Alertes IA (right)
          ===================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Planning intelligent — 2/3 largeur */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Planning intelligent du jour</h3>
              <AiBadge variant="small" />
            </div>
            <span className="text-xs text-slate-500">{d.planning_jour.length} visites</span>
          </div>

          <div className="divide-y divide-slate-100">
            {d.planning_jour.map((v, i) => {
              const Icon = TYPE_VISITE_ICON[v.type] || MapPin
              return (
                <div key={i} className="px-3 sm:px-4 py-3 hover:bg-slate-50 transition flex items-center gap-3">
                  <div className="text-xs font-bold text-slate-700 w-12 shrink-0">{v.heure}</div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TYPE_VISITE_COLOR[v.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{v.cliente}</div>
                    <div className="text-xs text-slate-500 truncate">{v.action}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase shrink-0 ${PRIO_STYLE[v.priorite]}`}>
                    {v.priorite}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 rounded-b-xl flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-indigo-600" />
              Itinéraire optimisé : <span className="font-bold text-emerald-600">-{d.gps.economie_km} km</span> ({d.gps.economie_pct}%)
            </span>
            <button className="text-indigo-600 font-semibold hover:underline">Voir carte →</button>
          </div>
        </div>

        {/* Alertes intelligentes — 1/3 largeur */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Alertes</h3>
            </div>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{d.alertes_intelligentes.length}</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
            {d.alertes_intelligentes.map((a, i) => (
              <div key={i} className={`p-3 border-l-4 ${SEVERITE_STYLE[a.severite] || 'bg-slate-50'}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{a.categorie}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${a.severite === 'CRITIQUE' ? 'bg-red-600 text-white' : a.severite === 'HAUTE' ? 'bg-orange-500 text-white' : a.severite === 'INFO' ? 'bg-blue-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
                    {a.severite}
                  </span>
                </div>
                <div className="text-sm font-semibold leading-tight mb-0.5">{a.titre}</div>
                <div className="text-xs opacity-80 leading-snug">{a.detail}</div>
                <button className="mt-1.5 text-xs font-semibold underline opacity-90 hover:opacity-100">
                  → {a.action}
                </button>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* =====================================================================
          TABS : Tontines / Recouvrement / Prospection
          ===================================================================== */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <TabButton active={activeTab === 'recouv'}   onClick={() => setActiveTab('recouv')}   icon={<AlertTriangle className="w-4 h-4" />} label="Recouvrement"   count={d.recouvrement.clients_en_retard} color="red" />
          <TabButton active={activeTab === 'tontine'}  onClick={() => setActiveTab('tontine')}  icon={<Users className="w-4 h-4" />}         label="Tontines"       count={d.tontines.groupes_actifs}        color="indigo" />
          <TabButton active={activeTab === 'prospect'} onClick={() => setActiveTab('prospect')} icon={<Target className="w-4 h-4" />}        label="Prospection"    count={d.prospection.prospects_chauds}   color="emerald" />
        </div>

        <div className="p-4 sm:p-5">
          {activeTab === 'recouv'   && <SectionRecouvrement   data={d.recouvrement} />}
          {activeTab === 'tontine'  && <SectionTontines       data={d.tontines}     />}
          {activeTab === 'prospect' && <SectionProspection    data={d.prospection}  />}
        </div>
      </section>

      {/* =====================================================================
          GPS + Itinéraire optimisé
          ===================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Carte intelligente */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Carte intelligente — Tournée optimisée</h3>
              <AiBadge variant="small" />
            </div>
            <span className="text-xs text-slate-500">{d.gps.geo_points.length} points</span>
          </div>

          {/* Mini-mock map visuel */}
          <div className="relative h-64 sm:h-80 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 overflow-hidden">
            {/* Grille décor */}
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }} />
            {/* Position actuelle */}
            <div className="absolute" style={{ top: '60%', left: '50%' }}>
              <div className="w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg animate-pulse" />
              <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-600/30 rounded-full animate-ping" />
              <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded whitespace-nowrap">Vous</span>
            </div>
            {/* Points (positions calculées par index) */}
            {d.gps.geo_points.map((g, i) => {
              const top = 20 + ((i * 73) % 60)
              const left = 15 + ((i * 47) % 70)
              const Icon = TYPE_VISITE_ICON[g.type] || MapPin
              return (
                <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: `${top}%`, left: `${left}%` }}>
                  <div className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-md ${TYPE_VISITE_COLOR[g.type]}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white border border-slate-300 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-700">
                    {g.ordre}
                  </div>
                </div>
              )
            })}
            {/* Légende */}
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 shadow-sm">
              {d.gps.derniere_position.lieu} · {d.gps.derniere_position.heure}
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200 text-center">
            <div className="p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Distance</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{d.gps.distance_optimisee_km} km</div>
              <div className="text-[10px] text-emerald-600 font-semibold">-{d.gps.economie_km} km vs initial</div>
            </div>
            <div className="p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Temps estimé</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{d.gps.temps_estime_min} min</div>
              <div className="text-[10px] text-emerald-600 font-semibold">-{d.gps.temps_economise_min} min gagnées</div>
            </div>
            <div className="p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Économie</div>
              <div className="text-sm font-bold text-emerald-600 mt-0.5">{d.gps.economie_pct}%</div>
              <div className="text-[10px] text-slate-500 font-semibold">déplacement</div>
            </div>
          </div>
        </div>

        {/* Zones potentiel prospection + sécurité */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Zones de potentiel</h3>
              <AiBadge variant="small" />
            </div>
            <div className="p-3 space-y-2">
              {d.prospection.zones_potentiel.map((z, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{z.zone}</span>
                    <span className={`text-[10px] font-bold ${z.potentiel_pct >= 75 ? 'text-emerald-700' : z.potentiel_pct >= 50 ? 'text-yellow-700' : 'text-slate-500'}`}>
                      {z.potentiel_pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1.5">
                    <div className={`h-full rounded-full ${z.potentiel_pct >= 75 ? 'bg-emerald-500' : z.potentiel_pct >= 50 ? 'bg-yellow-500' : 'bg-slate-400'}`} style={{ width: `${z.potentiel_pct}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-500 leading-snug">{z.raison}</div>
                  <div className="text-[10px] text-slate-600 font-semibold mt-0.5">{z.boutiques_eligibles} boutiques éligibles</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sécurité terrain */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-bold text-amber-900">Vigilance sécurité</h3>
            </div>
            <ul className="space-y-1.5">
              {d.gps.zones_risque_securite.map((z, i) => (
                <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                  <AlertOctagon className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{z}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </section>

      {/* =====================================================================
          PORTEFEUILLE PERSONNEL + PERFORMANCE
          ===================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Mes clientes (table) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Mon portefeuille</h3>
            </div>
            <span className="text-xs text-slate-500">{d.portefeuille.total_clientes} clientes</span>
          </div>

          {/* Segmentation */}
          <div className="grid grid-cols-5 divide-x divide-slate-200 border-b border-slate-200 text-center">
            <SegmentBox label="VIP"      count={d.portefeuille.clientes_vip}      bg="bg-purple-50"  text="text-purple-700" />
            <SegmentBox label="Bonnes"   count={d.portefeuille.bonnes_payeuses}   bg="bg-green-50"   text="text-green-700" />
            <SegmentBox label="Sensibles" count={d.portefeuille.clientes_sensibles} bg="bg-yellow-50" text="text-yellow-700" />
            <SegmentBox label="À risque" count={d.portefeuille.clientes_a_risque} bg="bg-red-50"     text="text-red-700" />
            <SegmentBox label="Inactives" count={d.portefeuille.clientes_inactives} bg="bg-slate-50" text="text-slate-600" />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="text-left  px-3 py-2 font-semibold">Cliente</th>
                  <th className="text-left  px-3 py-2 font-semibold hidden sm:table-cell">Produit</th>
                  <th className="text-right px-3 py-2 font-semibold">Encours</th>
                  <th className="text-left  px-3 py-2 font-semibold hidden md:table-cell">Dernier paiement</th>
                  <th className="text-left  px-3 py-2 font-semibold">Risque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {d.portefeuille.mes_clientes.map((c, i) => {
                  const seg = SEGMENT_STYLE[c.segment] || SEGMENT_STYLE.BONNE
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">{c.cliente}</div>
                        <div className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${seg.bg}`}>{seg.label}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-600 hidden sm:table-cell">{c.produit}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatFcfa(c.encours)}</td>
                      <td className="px-3 py-2 text-slate-500 hidden md:table-cell">{c.dernier_paiement}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RISQUE_PILL[c.risque]}`}>{c.risque}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance personnelle */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Trophy className={`w-5 h-5 ${BADGE_ICON_COLOR[d.performance.badge]}`} />
                Classement
              </h3>
              <span className="text-xs bg-white px-2 py-0.5 rounded-full font-bold text-slate-700">#{d.performance.classement_agence} / 14</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{d.performance.taux_global_pct}%</div>
            <div className="text-xs text-slate-600">d'atteinte globale ce mois</div>
            <div className="mt-2 flex items-center gap-1 text-xs">
              {d.performance.classement_evolution > 0 ? (
                <><TrendingUp className="w-3 h-3 text-emerald-600" /><span className="text-emerald-700 font-bold">+{d.performance.classement_evolution} places</span></>
              ) : (
                <><TrendingDown className="w-3 h-3 text-red-600" /><span className="text-red-700 font-bold">{d.performance.classement_evolution} places</span></>
              )}
              <span className="text-slate-500">vs mois préc.</span>
            </div>
          </div>

          {/* Objectifs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              Mes objectifs
            </h3>
            <ObjectifBar label="Collecte"     realise={d.performance.realise_collecte_mois}     objectif={d.performance.objectif_collecte_mois}     fmt="fcfa" />
            <ObjectifBar label="Recouvrement" realise={d.performance.realise_recouvrement_mois} objectif={d.performance.objectif_recouvrement_mois} fmt="fcfa" />
            <ObjectifBar label="Prospection"  realise={d.performance.realise_prospection_mois}  objectif={d.performance.objectif_prospection_mois}  fmt="count" suffix="prospects" />
            <ObjectifBar label="Visites"      realise={d.performance.visites_realisees_mois}    objectif={d.performance.visites_objectif_mois}      fmt="count" suffix="visites" />
          </div>

          {/* Vs équipe */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Vs équipe
            </h3>
            <VsEquipeRow label="Collectes"     moi={d.performance.vs_equipe.mes_collectes_pct} equipe={d.performance.vs_equipe.equipe_collectes_pct} suffix="%" />
            <VsEquipeRow label="Recouvrement"  moi={d.performance.vs_equipe.mes_recouv_pct}    equipe={d.performance.vs_equipe.equipe_recouv_pct}    suffix="%" />
            <VsEquipeRow label="Prospects"     moi={d.performance.vs_equipe.mes_prospects}     equipe={d.performance.vs_equipe.equipe_prospects_moy} />
          </div>
        </div>

      </section>

      {/* =====================================================================
          ÉVOLUTION HEBDO
          ===================================================================== */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Évolution hebdomadaire
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={d.performance.evolution_hebdo}>
            <XAxis dataKey="sem" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: any) => formatFcfa(Number(value))} />
            <Line type="monotone" dataKey="collecte"      stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="Collecte" />
            <Line type="monotone" dataKey="recouvrement"  stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} name="Recouvrement" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-2 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded" />Collecte</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-500 rounded" />Recouvrement</span>
        </div>
      </section>

    </div>
  )
}

// =============================================================================
//   SUB-COMPONENTS
// =============================================================================

function MiniKpi({
  icon, label, value, sub, color, progress,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub: string;
  color: string; progress?: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-7 h-7 rounded-lg ${color} text-white flex items-center justify-center shrink-0`}>{icon}</div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold truncate">{label}</span>
      </div>
      <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">{value}</div>
      <div className="text-[10px] text-slate-500">{sub}</div>
      {progress !== undefined && (
        <div className="h-1 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}

function TabButton({
  active, onClick, icon, label, count, color,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
  count: number; color: 'red' | 'indigo' | 'emerald';
}) {
  const colorMap: Record<string, { active: string; badge: string }> = {
    red:     { active: 'border-red-500 text-red-700',         badge: 'bg-red-100 text-red-700' },
    indigo:  { active: 'border-indigo-500 text-indigo-700',   badge: 'bg-indigo-100 text-indigo-700' },
    emerald: { active: 'border-emerald-500 text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  }
  const c = colorMap[color]
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition ${
        active ? c.active : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? c.badge : 'bg-slate-100 text-slate-600'}`}>{count}</span>
    </button>
  )
}

function SegmentBox({ label, count, bg, text }: { label: string; count: number; bg: string; text: string }) {
  return (
    <div className={`${bg} p-2 text-center`}>
      <div className={`text-base font-black ${text}`}>{count}</div>
      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</div>
    </div>
  )
}

function ObjectifBar({
  label, realise, objectif, fmt, suffix,
}: { label: string; realise: number; objectif: number; fmt: 'fcfa' | 'count'; suffix?: string }) {
  const pct = Math.min(100, Math.round((realise / objectif) * 100))
  const color = pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="text-slate-500 font-mono">{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5">
        {fmt === 'fcfa' ? formatFcfa(realise) : realise} / {fmt === 'fcfa' ? formatFcfa(objectif) : `${objectif} ${suffix ?? ''}`}
      </div>
    </div>
  )
}

function VsEquipeRow({ label, moi, equipe, suffix = '' }: { label: string; moi: number; equipe: number; suffix?: string }) {
  const better = moi > equipe
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-b-0 text-xs">
      <span className="text-slate-700 font-semibold">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-slate-900 font-bold">{moi}{suffix}</span>
        <span className="text-slate-400">vs</span>
        <span className="text-slate-500">{equipe}{suffix}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${better ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {better ? '↑' : '↓'} {Math.abs(moi - equipe)}{suffix}
        </span>
      </div>
    </div>
  )
}

// ─── Section RECOUVREMENT ─────────────────────────────────────────────────
function SectionRecouvrement({ data }: { data: typeof MOCK_TERRAIN_HOME.recouvrement }) {
  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <KpiSmall label="En retard"          value={data.clients_en_retard}                             sub="clients"  color="text-red-700"     bg="bg-red-50" />
        <KpiSmall label="À recouvrer"        value={formatFcfa(data.montant_a_recouvrer)}                sub="FCFA"     color="text-orange-700"  bg="bg-orange-50" />
        <KpiSmall label="Récupéré jour"      value={formatFcfa(data.montant_recupere_jour)}              sub="FCFA"     color="text-emerald-700" bg="bg-emerald-50" />
        <KpiSmall label="Retards critiques"  value={data.retards_critiques}                              sub=">30j"     color="text-red-700"     bg="bg-red-50" />
        <KpiSmall label="Promesses jour"     value={`${data.promesses_paiement_jour} (${formatFcfa(data.promesses_montant_jour)})`} sub="à honorer" color="text-amber-700" bg="bg-amber-50" />
      </div>

      {/* Priorisation IA */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
        <div className="text-xs text-indigo-900 leading-snug">
          <span className="font-bold">Priorisation IA :</span> les clients sont ordonnés par <span className="font-semibold">probabilité de recouvrement × montant × ancienneté du retard</span>. Suivez l'ordre proposé pour maximiser vos collectes.
        </div>
      </div>

      {/* Liste clients */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-600">
            <tr>
              <th className="text-center px-2 py-2 font-semibold">#</th>
              <th className="text-left  px-3 py-2 font-semibold">Client</th>
              <th className="text-center px-2 py-2 font-semibold">Retard</th>
              <th className="text-right px-3 py-2 font-semibold">Montant</th>
              <th className="text-center px-2 py-2 font-semibold">Risque</th>
              <th className="text-left  px-3 py-2 font-semibold hidden md:table-cell">Recommandation IA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.clients_a_visiter.map((c, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-2 py-2 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-[10px] font-bold">{c.priorite_ia}</span>
                </td>
                <td className="px-3 py-2 font-semibold text-slate-900">{c.client}</td>
                <td className="px-2 py-2 text-center font-bold">
                  <span className={c.retard_j >= 30 ? 'text-red-700' : c.retard_j >= 14 ? 'text-orange-700' : 'text-yellow-700'}>
                    {c.retard_j}j
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatFcfa(c.montant)}</td>
                <td className="px-2 py-2 text-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RISQUE_PILL[c.risque]}`}>{c.risque}</span>
                </td>
                <td className="px-3 py-2 text-xs text-slate-600 italic hidden md:table-cell">{c.raison_ia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Section TONTINES ─────────────────────────────────────────────────────
function SectionTontines({ data }: { data: typeof MOCK_TERRAIN_HOME.tontines }) {
  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <KpiSmall label="Prévu jour"        value={formatFcfa(data.montant_prevu_jour)}    sub="FCFA"  color="text-blue-700"    bg="bg-blue-50" />
        <KpiSmall label="Collecté jour"     value={formatFcfa(data.montant_collecte_jour)} sub="FCFA"  color="text-emerald-700" bg="bg-emerald-50" />
        <KpiSmall label="Taux collecte"     value={`${data.taux_collecte_pct}%`}            sub="aujourd'hui" color="text-indigo-700" bg="bg-indigo-50" />
        <KpiSmall label="Absentes"          value={data.clientes_absentes_count}            sub="clientes" color="text-red-700"     bg="bg-red-50" />
        <KpiSmall label="Versements manqués" value={data.versements_manques_count}          sub="à relancer" color="text-orange-700" bg="bg-orange-50" />
        <KpiSmall label="Retards tontine"   value={data.retards_tontine_count}              sub="dossiers" color="text-yellow-700"  bg="bg-yellow-50" />
        <KpiSmall label="Groupes actifs"    value={data.groupes_actifs}                     sub="suivis"   color="text-purple-700"  bg="bg-purple-50" />
      </div>

      {/* Groupes */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mes groupes tontine</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {data.groupes.map((g, i) => (
            <div key={i} className={`rounded-xl border p-3 ${STATUT_GROUPE_STYLE[g.statut]}`}>
              <div className="flex items-start justify-between mb-2">
                <h5 className="text-sm font-bold leading-tight">{g.nom}</h5>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{g.statut}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center text-xs mb-2">
                <div>
                  <div className="font-bold">{g.membres}</div>
                  <div className="text-[9px] opacity-70 uppercase">Membres</div>
                </div>
                <div>
                  <div className="font-bold">{g.retard_membres}</div>
                  <div className="text-[9px] opacity-70 uppercase">Retards</div>
                </div>
                <div>
                  <div className="font-bold">{g.taux_pct}%</div>
                  <div className="text-[9px] opacity-70 uppercase">Taux</div>
                </div>
              </div>
              <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                <div className="h-full bg-current rounded-full opacity-70" style={{ width: `${g.taux_pct}%` }} />
              </div>
              <div className="mt-1.5 text-[10px] font-semibold">
                {formatFcfa(g.collecte_jour)} / {formatFcfa(g.montant_prevu)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertes tontine */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          Alertes tontine
        </h4>
        <div className="space-y-2">
          {data.alertes_tontine.map((a, i) => (
            <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border ${SEVERITE_STYLE[a.severite]}`}>
              <span className="text-[10px] font-bold uppercase shrink-0">{a.type.replace(/_/g, ' ')}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold">{a.cliente}</div>
                <div className="text-xs opacity-80 leading-snug">{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Section PROSPECTION ──────────────────────────────────────────────────
function SectionProspection({ data }: { data: typeof MOCK_TERRAIN_HOME.prospection }) {
  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <KpiSmall label="Nouveaux mois"  value={data.nouveaux_prospects_mois} sub="prospects" color="text-emerald-700" bg="bg-emerald-50" />
        <KpiSmall label="RDV jour"       value={data.rdv_commerciaux_jour}    sub="prévus"    color="text-blue-700"    bg="bg-blue-50" />
        <KpiSmall label="Conversion"     value={`${data.taux_conversion_pct}%`} sub="moyen"   color="text-indigo-700"  bg="bg-indigo-50" />
        <KpiSmall label="Dossiers ouverts" value={data.dossiers_ouverts_mois} sub="ce mois"   color="text-purple-700"  bg="bg-purple-50" />
        <KpiSmall label="Chauds"         value={data.prospects_chauds}        sub="à closer"  color="text-red-700"     bg="bg-red-50" />
      </div>

      {/* Vue prospects */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-600">
            <tr>
              <th className="text-left  px-3 py-2 font-semibold">Prospect</th>
              <th className="text-left  px-3 py-2 font-semibold hidden sm:table-cell">Activité</th>
              <th className="text-right px-3 py-2 font-semibold">Potentiel</th>
              <th className="text-center px-2 py-2 font-semibold">Prob.</th>
              <th className="text-center px-2 py-2 font-semibold">Statut</th>
              <th className="text-left  px-3 py-2 font-semibold hidden md:table-cell">Dernière interaction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.prospects.map((p, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-semibold text-slate-900">{p.prospect}</td>
                <td className="px-3 py-2 text-slate-600 hidden sm:table-cell">{p.activite}</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatFcfa(p.potentiel_fcfa)}</td>
                <td className="px-2 py-2 text-center">
                  <span className={`font-bold ${p.probabilite_pct >= 70 ? 'text-emerald-700' : p.probabilite_pct >= 50 ? 'text-yellow-700' : 'text-slate-500'}`}>
                    {p.probabilite_pct}%
                  </span>
                </td>
                <td className="px-2 py-2 text-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUT_PROSPECT_STYLE[p.statut]}`}>{p.statut}</span>
                </td>
                <td className="px-3 py-2 text-xs text-slate-500 hidden md:table-cell">{p.derniere_interaction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KpiSmall({ label, value, sub, color, bg }: { label: string; value: string | number; sub: string; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-lg p-2.5 text-center`}>
      <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">{label}</div>
      <div className={`text-base sm:text-lg font-black ${color} leading-tight mt-0.5`}>{value}</div>
      <div className="text-[10px] text-slate-500">{sub}</div>
    </div>
  )
}
