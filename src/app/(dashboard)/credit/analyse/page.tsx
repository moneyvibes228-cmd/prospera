'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  FileText, Filter, Search, Sparkles, AlertTriangle,
  ChevronRight, ArrowLeft, X, ListFilter, FolderOpen,
} from 'lucide-react'
import { CreditApiModeBanner } from '@/components/credit/CreditApiModeBanner'
import { API_CREDIT_PHASE2_ENABLED } from '@/lib/api-config'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RapportCcDossier } from '@/components/dashboard/RapportCcDossier'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { formatFcfa } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { isRocRole, isCcRole, type DecisionCredit } from '@/lib/credit-decisions'
import { getAllDossiersAnalyse, canCcAnalyseEtape } from '@/lib/credit-pipeline-roc'
import {
  CC_WORKSPACE_STATS,
  type ClasseBceao, type EtapeScore,
} from '@/lib/mockMicrofinance'

const ETAPE_LABEL: Record<EtapeScore, string> = {
  SOUMIS:          'Soumis',
  DOSSIER_COMPLET: 'Docs OK',
  EN_ANALYSE:      'Analyse CC',
  VALIDE_CHARGE:   'Validé CC',
  EN_ANALYSE_ROC:  'Analyse ROC',
}

const CLASSE_BCEAO_COLORS: Record<ClasseBceao, { bg: string; text: string; dot: string }> = {
  PERFORMANT:        { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500' },
  SOUS_SURVEILLANCE: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  DOUTEUX:           { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500' },
  COMPROMIS:         { bg: 'bg-red-200',    text: 'text-red-900',    dot: 'bg-red-700' },
  PERTE:             { bg: 'bg-slate-900',  text: 'text-white',      dot: 'bg-slate-900' },
}

export default function CreditAnalysePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const isCc = isCcRole(user?.role)
  const allDossiers = useMemo(() => getAllDossiersAnalyse(), [])
  const [selectedId, setSelectedId] = useState<string>(() => {
    const first = isCcRole(user?.role)
      ? allDossiers.find(d => canCcAnalyseEtape(d.etape_courante))?.dossier_id
      : allDossiers[0]?.dossier_id
    return first ?? allDossiers[0]?.dossier_id ?? ''
  })
  const [filterEtape, setFilterEtape] = useState<EtapeScore | 'ALL'>(isCc ? 'EN_ANALYSE' : 'ALL')
  const [filterClasse, setFilterClasse] = useState<ClasseBceao | 'ALL'>('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const dossierParam = searchParams.get('dossier')
    const refParam = searchParams.get('ref')
    if (dossierParam) {
      const found = allDossiers.find(d => d.dossier_id === dossierParam)
      if (found) {
        setSelectedId(found.dossier_id)
        setFilterEtape('ALL')
        setSearch('')
      }
      return
    }
    if (refParam) {
      const found = allDossiers.find(
        d => d.reference_dossier === refParam || d.dossier_id === refParam,
      )
      if (found) {
        setSelectedId(found.dossier_id)
        setFilterEtape('ALL')
        setSearch(refParam)
      } else {
        setSearch(refParam)
      }
    }
  }, [searchParams, allDossiers])

  const filteredDossiers = useMemo(() => {
    return allDossiers.filter(d => {
      if (isCc && !canCcAnalyseEtape(d.etape_courante)) return false
      if (filterEtape !== 'ALL' && d.etape_courante !== filterEtape) return false
      if (filterClasse !== 'ALL' && d.classe_bceao !== filterClasse) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          d.client.nom.toLowerCase().includes(q) ||
          d.client.prenom.toLowerCase().includes(q) ||
          d.reference_dossier.toLowerCase().includes(q) ||
          d.client.activite.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [filterEtape, filterClasse, search, allDossiers, isCc])

  const selectedDossier = filteredDossiers.find(d => d.dossier_id === selectedId)
    ?? filteredDossiers[0]
    ?? allDossiers.find(d => d.dossier_id === selectedId)
    ?? allDossiers[0]

  const handleDecision = (decision: DecisionCredit) => {
    const roleLabel = isRocRole(user?.role) ? 'ROC' : isCcRole(user?.role) ? 'CC' : 'Utilisateur'
    alert(`Décision ${roleLabel} : ${decision.replaceAll('_', ' ')}\n\nDossier : ${selectedDossier.reference_dossier}\nClient : ${selectedDossier.client.prenom} ${selectedDossier.client.nom}\n\nDécision enregistrée.`)
  }

  const pageTitle = isRocRole(user?.role)
    ? 'Analyse dossier — Validation ROC'
    : isCcRole(user?.role)
      ? 'Analyse Charge de Crédit (CC)'
      : 'Analyse dossier crédit'

  return (
    <PageWrapper
      title={pageTitle}
      subtitle={isCc
        ? 'Workspace réservé aux dossiers à l\'étape Analyse CC — scoring CBI et décision'
        : 'Workspace d\'analyse approfondie dossier par dossier — Modèle CBI v5'}>

      <CreditApiModeBanner source={API_CREDIT_PHASE2_ENABLED ? 'api' : 'mock'} />

      {/* Header — retour + stats globales + export */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button onClick={() => router.push(isRocRole(user?.role) ? '/credit/pipeline' : isCcRole(user?.role) ? '/dashboard' : '/credit')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-teal-300 transition-all cursor-pointer">
          <ArrowLeft size={13} />
          {isCcRole(user?.role) ? 'Retour tableau de bord' : 'Retour Pilotage Crédit'}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            <b>{CC_WORKSPACE_STATS.total_dossiers}</b> dossiers à analyser ·
            <b className="text-red-600 ml-1">{CC_WORKSPACE_STATS.alertes_critiques}</b> alertes critiques ·
            Score moyen <b>{CC_WORKSPACE_STATS.score_moyen}</b>/100 ·
            Délai moy. <b>{CC_WORKSPACE_STATS.delai_moyen_jours}j</b>
          </span>
          <Link
            href={`/credit/dossiers/${selectedDossier.dossier_id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100"
          >
            <FolderOpen size={13} />
            Fiche processus
          </Link>
          <ExportButton label="Exporter analyse CC" filename={`analyse_cc_${selectedDossier.reference_dossier}`} />
        </div>
      </div>

      {/* KPI bandeau — CC : uniquement Analyse CC */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {(Object.keys(CC_WORKSPACE_STATS.par_etape) as EtapeScore[]).map(e => {
          if (isCc && e !== 'EN_ANALYSE') return null
          const count = isCc
            ? filteredDossiers.length
            : CC_WORKSPACE_STATS.par_etape[e]
          const isFiltered = filterEtape === e
          return (
            <button key={e}
              onClick={() => !isCc && setFilterEtape(isFiltered ? 'ALL' : e)}
              disabled={isCc}
              className={`bg-white rounded-xl border p-3 text-left transition-all ${
                isFiltered ? 'border-teal-400 ring-2 ring-teal-100' : 'border-slate-200 hover:border-teal-200'
              } ${isCc ? 'cursor-default' : 'cursor-pointer'}`}>
              <div className="text-[9px] font-bold text-slate-500 uppercase">{ETAPE_LABEL[e]}</div>
              <div className="text-2xl font-black text-slate-800">{count}</div>
              <div className="text-[10px] text-slate-400">{count > 0 ? 'dossiers' : 'aucun'}</div>
            </button>
          )
        })}
      </div>

      {/* Layout 2 panneaux */}
      <div className="grid grid-cols-12 gap-4">

        {/* ── PANNEAU GAUCHE : Liste dossiers ── */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-3">

          {/* Recherche + filtres */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 space-y-2 sticky top-0 z-10">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher dossier, client, activité..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-200 focus:border-teal-300"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X size={13} className="text-slate-400 hover:text-slate-700" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] flex-wrap">
              <ListFilter size={11} className="text-slate-400" />
              <span className="font-bold text-slate-500">Classe :</span>
              {(['ALL', 'PERFORMANT', 'SOUS_SURVEILLANCE', 'DOUTEUX'] as const).map(c => (
                <button key={c}
                  onClick={() => setFilterClasse(c === 'ALL' ? 'ALL' : c as ClasseBceao)}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    filterClasse === c ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {c === 'ALL' ? 'Toutes' : c.replaceAll('_', ' ')}
                </button>
              ))}
            </div>

            {(filterEtape !== 'ALL' || filterClasse !== 'ALL' || search) && (
              <button
                onClick={() => { setFilterEtape('ALL'); setFilterClasse('ALL'); setSearch('') }}
                className="text-[10px] font-semibold text-teal-700 hover:underline">
                Réinitialiser filtres
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase px-1">
              {filteredDossiers.length} dossier{filteredDossiers.length > 1 ? 's' : ''}
            </div>
            {filteredDossiers.map(d => {
              const isSelected = d.dossier_id === selectedId
              const classeColor = CLASSE_BCEAO_COLORS[d.classe_bceao]
              const hasCritical = d.alertes_actives.some(a => a.severite === 'CRITICAL')
              return (
                <button
                  key={d.dossier_id}
                  onClick={() => setSelectedId(d.dossier_id)}
                  className={`w-full bg-white rounded-xl border p-3 text-left transition-all ${
                    isSelected ? 'border-teal-500 ring-2 ring-teal-100 shadow-md' : 'border-slate-200 hover:border-teal-300 hover:shadow-sm'
                  }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono font-bold text-slate-400">{d.reference_dossier}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${classeColor.bg} ${classeColor.text}`}>
                      {d.classe_bceao}
                    </span>
                    {hasCritical && <AlertTriangle size={11} className="text-red-500 ml-auto animate-pulse" />}
                  </div>
                  <div className="text-sm font-bold text-slate-800 truncate">{d.client.prenom} {d.client.nom}</div>
                  <div className="text-[11px] text-slate-500 truncate">{d.client.activite}</div>

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px]">
                    <span className="text-slate-500">Étape : <b className="text-slate-700">{ETAPE_LABEL[d.etape_courante]}</b></span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[10px]">
                    <span className="text-slate-500">Demandé <b className="text-slate-700">{formatFcfa(d.montant_demande)}</b></span>
                    <span className={`font-bold ${d.score_consolide >= 75 ? 'text-green-600' : d.score_consolide >= 55 ? 'text-orange-600' : 'text-red-600'}`}>
                      Score {d.score_consolide}/100
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-teal-100 flex items-center gap-1.5 text-[10px] font-bold text-teal-700">
                      <ChevronRight size={11} />
                      Affiché à droite
                    </div>
                  )}
                </button>
              )
            })}
            {filteredDossiers.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                <Filter size={24} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Aucun dossier ne correspond aux filtres</p>
              </div>
            )}
          </div>
        </div>

        {/* ── PANNEAU DROIT : Rapport CC ── */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          <div className="mb-3 flex items-center gap-2 px-1">
            <FileText size={14} className="text-teal-600" />
            <h2 className="text-sm font-bold text-slate-700">Rapport d'analyse CBI v5</h2>
            <AiBadge variant="small" label="Recalculé en temps réel" pulse />
            <span className="ml-auto text-[10px] text-slate-400">
              <Sparkles size={10} className="inline mr-1" />
              5C · 8 dimensions · 9 codes alerte · Analyse Prospera IA
            </span>
          </div>
          <RapportCcDossier dossier={selectedDossier} userRole={user?.role} onDecisionClick={handleDecision} />
        </div>
      </div>
    </PageWrapper>
  )
}
