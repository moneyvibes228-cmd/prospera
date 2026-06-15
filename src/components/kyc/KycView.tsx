'use client'
import { useState } from 'react'
import { FileCheck, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getKycHub, type TypeDocument } from '@/lib/kyc-hub'
import { ModuleSyntheseIA } from '@/components/modules/ModuleSyntheseIA'
import { ModuleKpiGrid } from '@/components/modules/ModuleKpiGrid'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { cn } from '@/lib/utils'

const DOC_LABEL: Record<TypeDocument, string> = {
  CNI: 'CNI / Passeport',
  PASSEPORT: 'Passeport',
  ATTESTATION_DOMICILE: 'Attestation domicile',
  PHOTO: 'Photo identité',
  CONTRAT: 'Contrat crédit',
  JUSTIFICATIF_REVENU: 'Justificatif revenu',
}

const STATUT_KYC = {
  COMPLET: 'bg-emerald-100 text-emerald-800',
  INCOMPLET: 'bg-amber-100 text-amber-800',
  EXPIRE: 'bg-red-100 text-red-800',
  EN_VERIFICATION: 'bg-blue-100 text-blue-800',
  REJETE: 'bg-red-100 text-red-800',
}

const STATUT_DOC = {
  VALIDE: 'bg-emerald-100 text-emerald-800',
  EN_ATTENTE: 'bg-slate-100 text-slate-600',
  REJETE: 'bg-red-100 text-red-800',
  EXPIRE: 'bg-orange-100 text-orange-800',
}

export function KycView() {
  const hub = getKycHub()
  const [selected, setSelected] = useState(hub.dossiers[0]?.id ?? '')

  const dossier = hub.dossiers.find((d) => d.id === selected) ?? hub.dossiers[0]

  return (
    <>
      <ModuleSyntheseIA texte={hub.synthese_ia} variant="amber" titre="Synthèse IA — KYC & conformité" />
      <ModuleKpiGrid
        cols={5}
        items={[
          { label: 'Dossiers complets', value: hub.kpis.dossiers_complets.toLocaleString('fr-FR'), highlight: 'teal' },
          { label: 'Incomplets', value: String(hub.kpis.dossiers_incomplets), highlight: 'orange' },
          { label: 'Docs expirés', value: String(hub.kpis.documents_expires), highlight: 'red' },
          { label: 'En vérification', value: String(hub.kpis.en_verification) },
          { label: 'Conformité', value: `${hub.kpis.taux_conformite_pct}%`, highlight: 'teal' },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">File d&apos;attente prioritaire</h3>
          <div className="space-y-2">
            {hub.file_attente.map((f) => (
              <button
                key={f.dossier_id}
                type="button"
                onClick={() => setSelected(f.dossier_id)}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-teal-400 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">{f.priorite}</span>
                  <span className="font-medium text-slate-900 text-sm">{f.client}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 ml-8">{f.motif}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          {hub.dossiers.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelected(d.id)}
              className={cn(
                'w-full text-left bg-white rounded-xl border p-4 transition-colors cursor-pointer',
                selected === d.id ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200 hover:border-teal-300',
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <FileCheck size={18} className="text-teal-600" />
                <span className="font-bold text-slate-900">{d.client}</span>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded', STATUT_KYC[d.statut])}>{d.statut}</span>
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{d.niveau}</span>
                <AiBadge variant="small" confidence={d.score_conformite_ia} />
              </div>
              {d.alertes.length > 0 && (
                <div className="mt-2 flex items-start gap-1 text-xs text-amber-800">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  {d.alertes.join(' · ')}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {dossier && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Pièces jointes — {dossier.client}</h3>
            <button type="button" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
              <Upload size={16} />
              Ajouter document
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {dossier.documents.map((doc) => (
              <div key={doc.id} className="border border-slate-200 rounded-lg p-4 hover:border-teal-300 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-900">{DOC_LABEL[doc.type]}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{doc.nom_fichier || '—'}</div>
                  </div>
                  {doc.statut === 'VALIDE' ? (
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  ) : (
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded', STATUT_DOC[doc.statut])}>{doc.statut}</span>
                  )}
                </div>
                {doc.score_ocr_ia !== undefined && (
                  <div className="mt-2 text-xs text-slate-500">Score OCR IA : <strong>{doc.score_ocr_ia}%</strong></div>
                )}
                {doc.date_expiration && (
                  <div className="text-xs text-slate-400 mt-1">Expire {doc.date_expiration}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
