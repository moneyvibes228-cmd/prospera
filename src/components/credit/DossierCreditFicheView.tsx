'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { mockGetDossierCredit, mockGetDossierWorkflow } from '@/lib/credit-mock-workflow'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DossierWorkflowStepper } from '@/components/credit/DossierWorkflowStepper'
import { DossierCreditActions } from '@/components/credit/DossierCreditActions'
import { RapportCcDossier } from '@/components/dashboard/RapportCcDossier'
import { DossierEnrichiSections } from '@/components/dashboard/DossierEnrichiSections'
import { RapportRocView } from '@/components/credit/RapportRocView'
import { DossierScorePanel } from '@/components/credit/DossierScorePanel'
import { RapportTabLoader } from '@/components/credit/RapportTabLoader'
import { ConditionsFinalesBanner } from '@/components/credit/ConditionsFinalesBanner'
import { InstructionCcPanel } from '@/components/credit/InstructionCcPanel'
import { GpRecouvrementPanel } from '@/components/gp/GpRecouvrementPanel'
import { useDossierRapports, type RapportTab } from '@/hooks/useDossierRapports'
import { formatFcfa } from '@/lib/utils'
import { getDossierByRef } from '@/lib/credit-pipeline-roc'
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

/** Fiche dossier crédit */
export function DossierCreditFicheView({ dossierId }: Props) {
  const { user } = useAuth()
  const dossier = useMemo(() => mockGetDossierCredit(dossierId), [dossierId])
  const workflow = useMemo(
    () => mockGetDossierWorkflow(dossierId, user?.role === 'CREDIT' ? 'CHARGE_CREDIT' : 'CHARGE_CREDIT'),
    [dossierId, user?.role],
  )

  const tabs = workflow
    ? tabsFromSections(workflow.sections_visibles)
    : [{ id: 'workflow' as TabId, label: 'Workflow' }]
  const [activeTab, setActiveTab] = useState<TabId>('workflow')

  const rapportClient = useMemo(() => getDossierByRef(dossierId), [dossierId])

  const rapports = useDossierRapports(
    dossierId,
    activeTab === 'workflow' || activeTab === 'client' || activeTab === 'comite' ? '' : activeTab,
    dossier,
    { mockOnly: true },
  )

  if (!dossier) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Dossier introuvable</p>
        <Link href="/credit/dossiers" className="text-xs text-teal-700 font-semibold mt-2 inline-block">
          ← Liste des dossiers
        </Link>
      </div>
    )
  }

  const montant =
    typeof dossier.montant_demande === 'number'
      ? dossier.montant_demande
      : Number(dossier.montant_demande) || 0

  const noop = async () => {}

  return (
    <div className="space-y-4">
      <ConditionsFinalesBanner dossier={dossier} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/credit/dossiers"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-teal-700 mb-2 cursor-pointer"
          >
            <ArrowLeft size={13} />
            Tous les dossiers
          </Link>
          <h1 className="text-lg font-black text-slate-900 font-mono">{dossier.reference}</h1>
          <p className="text-sm text-slate-600">
            {dossier.client.prenom} {dossier.client.nom}
            {dossier.client.activite ? ` · ${dossier.client.activite}` : ''}
          </p>
        </div>
        <div className="text-right text-xs text-slate-600 space-y-0.5">
          <p>
            Montant demandé : <strong className="text-slate-900">{formatFcfa(montant)}</strong>
          </p>
          {dossier.duree_mois && (
            <p>
              Durée : <strong>{dossier.duree_mois} mois</strong>
            </p>
          )}
          <p className="text-[10px] text-slate-400">Statut : {String(dossier.statut)}</p>
        </div>
      </div>

      {workflow && <DossierWorkflowStepper workflow={workflow} />}

      {workflow && (
        <DossierCreditActions
          actions={workflow.actions_disponibles}
          apiMode={false}
          montantDemande={montant}
          onAvisCharge={noop}
          onDecisionRoc={noop}
          onComite={noop}
        />
      )}

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
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
          {rapports.score && <DossierScorePanel score={rapports.score} apiMode={false} />}
        </RapportTabLoader>
      )}

      {activeTab === 'instruction_cc' && <InstructionCcPanel dossierId={dossierId} />}

      {activeTab === 'recouvrement' && workflow && (
        <GpRecouvrementPanel
          dossierId={dossierId}
          actions={workflow.actions_disponibles}
          mensualite={dossier.mensualite != null ? Number(dossier.mensualite) : montant / 12}
          onPaid={noop}
        />
      )}

      {activeTab === 'comite' && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-900">
          Dossier en attente de validation comité. Les actions de décision seront disponibles après convocation.
        </div>
      )}

      {activeTab === 'echeancier' && (
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
              Échéancier visible après validation comité (EN_GESTION)
            </p>
          )}
        </RapportTabLoader>
      )}
    </div>
  )
}
