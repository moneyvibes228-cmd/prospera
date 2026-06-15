'use client'

import { useMemo, useState } from 'react'
import { useDossierCreditStrict } from '@/hooks/useCreditPhase2Strict'
import {
  ApiErrorState,
  ApiLoadingState,
  ApiPageShell,
  statutPillClass,
} from '@/components/api-ui'
import { DossierWorkflowStepper } from '@/components/credit/DossierWorkflowStepper'
import { DossierCreditActions } from '@/components/credit/DossierCreditActions'
import { DossierEnrichiSections } from '@/components/dashboard/DossierEnrichiSections'
import { RapportCcDossier } from '@/components/dashboard/RapportCcDossier'
import { RapportRocView } from '@/components/credit/RapportRocView'
import { DossierScorePanel } from '@/components/credit/DossierScorePanel'
import { RapportTabLoader } from '@/components/credit/RapportTabLoader'
import { ConditionsFinalesBanner } from '@/components/credit/ConditionsFinalesBanner'
import { InstructionCcPanel } from '@/components/credit/InstructionCcPanel'
import { GpRecouvrementPanel } from '@/components/gp/GpRecouvrementPanel'
import { useDossierRapports, type RapportTab } from '@/hooks/useDossierRapports'
import { formatFcfa } from '@/lib/utils'
import { getDossierByRef } from '@/lib/credit-pipeline-roc'
import { useAuth } from '@/contexts/AuthContext'
import type { SectionsVisibles } from '@/types/credit-api'

interface Props {
  dossierId: string
}

type TabId = 'workflow' | 'client' | RapportTab | 'comite' | 'instruction_cc' | 'recouvrement'

function tabsFromSections(s: SectionsVisibles): { id: TabId; label: string }[] {
  const t: { id: TabId; label: string }[] = [{ id: 'workflow', label: 'Workflow' }]
  if (s.fiche_client) t.push({ id: 'client', label: 'Client' })
  if (s.instruction_cc) t.push({ id: 'instruction_cc', label: 'Instruction CC' })
  if (s.rapport_cc) t.push({ id: 'rapport_cc', label: 'Rapport CC' })
  if (s.rapport_roc) t.push({ id: 'rapport_roc', label: 'Rapport ROC' })
  if (s.scoring_ia) t.push({ id: 'scoring', label: 'Score CBI' })
  if (s.comite) t.push({ id: 'comite', label: 'Comité' })
  if (s.echeancier) t.push({ id: 'echeancier', label: 'Échéancier' })
  if (s.recouvrement) t.push({ id: 'recouvrement', label: 'Recouvrement' })
  return t
}

export function DossierCreditFicheViewWithApi({ dossierId }: Props) {
  const { user } = useAuth()
  const {
    dossier,
    workflow,
    state,
    error,
    submitAvisCharge,
    submitDecisionRoc,
    submitComite,
    reload,
  } = useDossierCreditStrict(dossierId)

  const tabs = workflow
    ? tabsFromSections(workflow.sections_visibles)
    : [{ id: 'workflow' as TabId, label: 'Workflow' }]
  const [activeTab, setActiveTab] = useState<TabId>('workflow')

  const rapportClient = useMemo(() => getDossierByRef(dossierId), [dossierId])

  const rapports = useDossierRapports(
    dossierId,
    activeTab === 'workflow' || activeTab === 'client' || activeTab === 'comite' ? '' : activeTab,
    dossier,
  )

  if (state === 'loading') {
    return (
      <ApiPageShell title="Fiche dossier" endpoint={`GET /dossiers-credit/${dossierId}`}>
        <ApiLoadingState label="Chargement du dossier…" />
      </ApiPageShell>
    )
  }

  if (state === 'error' || !dossier) {
    return (
      <ApiPageShell
        title="Fiche dossier"
        endpoint={`GET /dossiers-credit/${dossierId}`}
        onRefresh={() => void reload()}
      >
        <ApiErrorState
          message={error ?? 'Dossier introuvable'}
          onRetry={() => void reload()}
        />
      </ApiPageShell>
    )
  }

  const montant =
    typeof dossier.montant_demande === 'number'
      ? dossier.montant_demande
      : Number(dossier.montant_demande) || 0

  return (
    <ApiPageShell
      title={dossier.reference}
      subtitle={`${dossier.client.prenom} ${dossier.client.nom}${dossier.client.activite ? ` · ${dossier.client.activite}` : ''}`}
      endpoint={`GET /dossiers-credit/${dossierId}`}
      backHref="/credit/dossiers-with-api"
      backLabel="Tous les dossiers"
      onRefresh={() => void reload()}
    >
    <div className="space-y-6">
      <ConditionsFinalesBanner dossier={dossier} />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statutPillClass(String(dossier.statut))}`}
              >
                {String(dossier.statut).replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-2xl font-bold text-teal-700 tabular-nums">{formatFcfa(montant)}</p>
            {dossier.duree_mois && (
              <p className="text-xs text-slate-500">Durée {dossier.duree_mois} mois</p>
            )}
          </div>
        </div>
      </div>

      {workflow && <DossierWorkflowStepper workflow={workflow} />}

      {workflow && (
        <DossierCreditActions
          actions={workflow.actions_disponibles}
          apiMode={true}
          montantDemande={montant}
          onAvisCharge={submitAvisCharge}
          onDecisionRoc={submitDecisionRoc}
          onComite={submitComite}
        />
      )}

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto bg-white rounded-t-xl px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors duration-200 cursor-pointer ${
              activeTab === tab.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'workflow' && dossier.objet_credit && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Objet du crédit</p>
          {dossier.objet_credit}
        </div>
      )}

      {activeTab === 'client' && (
        rapportClient ? (
          <DossierEnrichiSections dossier={rapportClient} />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500 text-center">
            Fiche client détaillée disponible après synchronisation du rapport CC.
          </div>
        )
      )}

      {activeTab === 'rapport_cc' && (
        <RapportTabLoader
          state={rapports.ccState}
          error={rapports.errors.rapport_cc}
          onRetry={() => void rapports.reloadCc()}
        >
          {rapports.rapportCc && (
            <RapportCcDossier
              dossier={rapports.rapportCc}
              userRole={user?.role}
              onDecisionClick={() => {}}
            />
          )}
        </RapportTabLoader>
      )}

      {activeTab === 'rapport_roc' && (
        <RapportTabLoader
          state={rapports.rocState}
          error={rapports.errors.rapport_roc}
          onRetry={() => void rapports.reloadRoc()}
        >
          {rapports.rapportRoc && (
            <RapportRocView rapport={rapports.rapportRoc} source={rapports.rocSource} />
          )}
        </RapportTabLoader>
      )}

      {activeTab === 'scoring' && (
        <RapportTabLoader state={rapports.scoreState} error={rapports.errors.scoring}>
          {rapports.score && <DossierScorePanel score={rapports.score} apiMode={true} />}
        </RapportTabLoader>
      )}

      {activeTab === 'instruction_cc' && <InstructionCcPanel dossierId={dossierId} />}

      {activeTab === 'recouvrement' && workflow && (
        <GpRecouvrementPanel
          dossierId={dossierId}
          actions={workflow.actions_disponibles}
          mensualite={
            dossier.mensualite != null ? Number(dossier.mensualite) : montant / 12
          }
          onPaid={() => void reload()}
        />
      )}

      {activeTab === 'comite' && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-900">
          Dossier en attente de validation comité. Utilisez les actions workflow ci-dessus.
        </div>
      )}

      {activeTab === 'echeancier' && workflow?.sections_visibles.recouvrement ? (
        <GpRecouvrementPanel
          dossierId={dossierId}
          actions={workflow.actions_disponibles}
          mensualite={
            dossier.mensualite != null ? Number(dossier.mensualite) : montant / 12
          }
          onPaid={() => void reload()}
        />
      ) : activeTab === 'echeancier' ? (
        <RapportTabLoader state={rapports.echState}>
          {rapports.echeancier && rapports.echeancier.lignes.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="text-left p-3">#</th>
                    <th className="text-left p-3">Échéance</th>
                    <th className="text-right p-3">Montant</th>
                    <th className="text-left p-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {rapports.echeancier.lignes.map((row, i) => {
                    const r = row as Record<string, unknown>
                    return (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="p-3">{String(r.numero ?? i + 1)}</td>
                        <td className="p-3">{String(r.date_echeance ?? '—')}</td>
                        <td className="p-3 text-right font-semibold">
                          {formatFcfa(Number(r.montant) || 0)}
                        </td>
                        <td className="p-3">{String(r.statut ?? '—')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">
              Aucune ligne — dossier pas encore en gestion PF
            </p>
          )}
        </RapportTabLoader>
      ) : null}

    </div>
    </ApiPageShell>
  )
}
