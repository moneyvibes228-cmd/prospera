'use client'
import { useMemo, useState } from 'react'
import {
  ShieldCheck, AlertTriangle, RefreshCw, Archive, Send, FileMinus, Eye, X,
} from 'lucide-react'
import { cn, formatFcfa } from '@distributeur/lib/utils'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { DocumentPreview } from './DocumentPreview'
import { WorkflowToast } from '@distributeur/components/shared/WorkflowToast'
import { useFacturationWorkflow } from '@distributeur/contexts/FacturationWorkflowContext'
import {
  buildFileEFacture, buildSyntheseEFacture, STATUT_EFACTURE_STYLE, REGISTRE_AVOIRS, PLATEFORME,
} from '@distributeur/lib/efacture-builder'
import type { EFactureStatut } from '@distributeur/types'

const ORDRE_FILE: EFactureStatut[] = ['REJETEE', 'EN_ATTENTE', 'TRANSMISE', 'NON_TRANSMISE', 'CERTIFIEE']

const STATUT_AVOIR_STYLE = {
  EMIS: 'bg-amber-100 text-amber-700',
  IMPUTE: 'bg-emerald-100 text-emerald-700',
  REMBOURSE: 'bg-sky-100 text-sky-700',
}

export function EFactureView() {
  const { estRetransmise, retransmettre, lastAction, clearLastAction } = useFacturationWorkflow()
  const file = useMemo(() => buildFileEFacture(), [])
  const synthese = useMemo(() => buildSyntheseEFacture(file), [file])

  const [filtre, setFiltre] = useState<EFactureStatut | 'toutes'>('toutes')
  const [ouverte, setOuverte] = useState<string | null>(null)

  const filtrees = useMemo(() => {
    const liste = filtre === 'toutes' ? file : file.filter(f => f.efacture.statut === filtre)
    // Ce qui bloque la conformité remonte en tête : rejets d'abord, certifiées en dernier.
    return [...liste].sort(
      (a, b) => ORDRE_FILE.indexOf(a.efacture.statut) - ORDRE_FILE.indexOf(b.efacture.statut),
    )
  }, [file, filtre])

  const selected = file.find(f => f.id === ouverte) ?? null
  const rejets = file.filter(f => f.efacture.statut === 'REJETEE')

  return (
    <div className="space-y-4">
      {/* KPI conformité */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Taux de certification', value: `${synthese.taux_certification_pct}%`, color: 'text-emerald-600' },
          { label: 'Certifiées', value: String(synthese.certifiees), color: 'text-emerald-600' },
          { label: 'Transmises', value: String(synthese.transmises), color: 'text-indigo-600' },
          { label: 'En file', value: String(synthese.en_attente), color: 'text-sky-600' },
          { label: 'Rejets à corriger', value: String(synthese.rejetees), color: 'text-red-600' },
          { label: 'Montant non certifié', value: formatFcfa(synthese.montant_non_certifie), color: 'text-amber-700' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={cn('text-sm font-black mt-0.5', k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Rejets à corriger — ce qui bloque la conformité */}
      {rejets.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-red-600" />
            <h3 className="text-sm font-bold text-red-900">Rejets à corriger</h3>
            <AiBadge variant="small" label={`Plateforme ${PLATEFORME.replace('_', ' ')}`} />
          </div>
          <div className="space-y-2">
            {rejets.map(f => (
              <div key={f.id} className="bg-white rounded-lg border border-red-100 p-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">{f.numero}</span>
                      <span className="font-bold text-sm text-slate-900">{f.pdv_nom}</span>
                      <span className="text-[10px] text-slate-400">{f.efacture.tentatives} tentatives</span>
                    </div>
                    <p className="text-[11px] text-red-800 mt-1 leading-relaxed">{f.efacture.motif_rejet}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-slate-900">{formatFcfa(f.montant)}</div>
                  </div>
                </div>
                <div className="mt-2.5">
                  {estRetransmise(f.id) ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                      <ShieldCheck size={12} /> Corrigée et retransmise — certification en attente
                    </span>
                  ) : (
                    <button type="button" onClick={() => retransmettre(f.id, f.numero)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                      <RefreshCw size={11} /> Corriger et retransmettre
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File de transmission */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
          <Send size={15} className="text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">File de transmission</h3>
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            {(['toutes', ...ORDRE_FILE] as const).map(s => (
              <button key={s} type="button" onClick={() => setFiltre(s)}
                className={cn('text-[9px] px-2 py-1 rounded-full font-bold transition-colors',
                  filtre === s ? 'bg-amber-100 text-amber-800' : 'bg-slate-50 text-slate-400 hover:bg-slate-100')}>
                {s === 'toutes' ? 'Toutes' : STATUT_EFACTURE_STYLE[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-2.5">Facture</th>
                <th className="text-left p-2.5">Client</th>
                <th className="text-right p-2.5">Montant</th>
                <th className="text-center p-2.5">E-facture</th>
                <th className="text-left p-2.5 hidden lg:table-cell">Certification</th>
                <th className="text-center p-2.5 hidden md:table-cell">Archive</th>
                <th className="text-right p-2.5">Facture</th>
              </tr>
            </thead>
            <tbody>
              {filtrees.map(f => {
                const e = f.efacture
                const st = STATUT_EFACTURE_STYLE[estRetransmise(f.id) ? 'EN_ATTENTE' : e.statut]
                return (
                  <tr key={f.id}
                    onClick={() => setOuverte(f.id)}
                    className={cn('border-t border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors',
                      ouverte === f.id && 'bg-amber-50')}>
                    <td className="p-2.5 font-mono text-[11px] text-slate-500">{f.numero}</td>
                    <td className="p-2.5 font-medium text-slate-800">{f.pdv_nom}</td>
                    <td className="p-2.5 text-right font-bold tabular-nums">{formatFcfa(f.montant)}</td>
                    <td className="p-2.5 text-center">
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', st.className)}>
                        {st.label}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-slate-400 hidden lg:table-cell">
                      {e.numero_certification ?? '—'}
                    </td>
                    <td className="p-2.5 text-center hidden md:table-cell">
                      {e.archive_legale_url
                        ? <Archive size={13} className="inline text-emerald-600" />
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="p-2.5 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
                        <Eye size={12} /> Voir
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2 bg-slate-50 text-[10px] text-slate-500">
          Archive légale : conservation 10 ans · {synthese.certifiees} pièce{synthese.certifiees > 1 ? 's' : ''} archivée{synthese.certifiees > 1 ? 's' : ''}.
        </div>
      </div>

      {/* Aperçu de la facture avec QR — en modale, sinon il tombait sous la ligne de flottaison */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Facture ${selected.numero}`}
          onClick={() => setOuverte(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto p-4 sm:p-8"
        >
          <div onClick={ev => ev.stopPropagation()} className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-white">
                Facture {selected.numero} · {selected.pdv_nom}
              </h3>
              <button type="button" onClick={() => setOuverte(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                <X size={13} /> Fermer
              </button>
            </div>
            <DocumentPreview
              type="FACTURE"
              numero={selected.numero}
              client={selected.pdv_nom}
              zone={selected.zone ?? '—'}
              date_emission={selected.date_emission ?? '—'}
              date_limite={selected.echeance}
              lignes={selected.lignes ?? []}
              montant_ht={Math.round(selected.montant / 1.18)}
              montant_ttc={selected.montant}
              remise_globale_pct={0}
              conditions_paiement={selected.mode_paiement ?? 'CREDIT_30J'}
              efacture={selected.efacture}
            />
          </div>
        </div>
      )}

      {/* Avoirs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileMinus size={15} className="text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Avoirs — notes de crédit</h3>
          <span className="text-[10px] text-slate-400 ml-auto">{REGISTRE_AVOIRS.length} sur la période</span>
        </div>
        <div className="space-y-2">
          {REGISTRE_AVOIRS.map(a => (
            <div key={a.id} className="flex items-start justify-between gap-3 text-xs py-2 border-b border-slate-100 last:border-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-slate-400">{a.numero}</span>
                  <span className="font-semibold text-slate-800">{a.pdv_nom}</span>
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', STATUT_AVOIR_STYLE[a.statut])}>
                    {a.statut.toLowerCase()}
                  </span>
                  <span className="text-[10px] text-slate-400">sur {a.facture_ref}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{a.motif}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-black text-red-600">−{formatFcfa(a.montant_ttc)}</div>
                <div className="text-[10px] text-slate-400">{a.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
