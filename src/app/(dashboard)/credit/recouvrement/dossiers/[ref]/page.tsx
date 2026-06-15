'use client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, Clock, FileText, ChevronRight, History, AlertTriangle } from 'lucide-react'
import { getDossierBloqueRocByRef } from '@/lib/roc-recouvrement-vue360'
import { BlocAnalyseIA } from '@/components/recouvrement/BlocAnalyseIA'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'

export default function DossierBloqueRocPage() {
  const params = useParams()
  const router = useRouter()
  const ref = decodeURIComponent(params.ref as string)
  const dossier = getDossierBloqueRocByRef(ref)

  if (!dossier) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Dossier {ref} introuvable.</p>
        <button type="button" onClick={() => router.back()} className="text-teal-600 text-sm mt-2">← Retour</button>
      </div>
    )
  }

  const canOpenAnalyse = dossier.etape === 'EN_ANALYSE_ROC' && dossier.dossier_analyse_id

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Retour tableau de bord ROC
      </button>

      <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-orange-50 border-b border-orange-100 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Lock size={16} className="text-orange-700" />
              <span className="text-xs font-mono font-bold text-slate-500">{dossier.reference}</span>
              <span className="text-[10px] font-bold bg-orange-600 text-white px-2 py-0.5 rounded-full">
                Bloqué {dossier.bloque_depuis_h}h
              </span>
              <AiBadge variant="small" label={dossier.etape.replaceAll('_', ' ')} />
            </div>
            <h1 className="text-xl font-black text-slate-900">{dossier.client}</h1>
            <p className="text-sm text-orange-800 font-semibold mt-1">{dossier.blocage_raison}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-slate-900">{formatFcfa(dossier.montant)}</div>
            <div className="text-xs text-slate-500">{dossier.agence} · {dossier.agent}</div>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Info label="Soumis le" value={dossier.date_soumission} />
          <Info label="Bloqué depuis" value={dossier.date_blocage} />
          {dossier.charge_credit && <Info label="Charge CC" value={dossier.charge_credit} />}
          {dossier.score_cbi != null && (
            <Info label="Score CBI" value={`${dossier.score_cbi}/100 · ${dossier.classe_bceao ?? '—'}`} />
          )}
        </div>
      </div>

      <BlocAnalyseIA titre="Analyse IA du blocage" contenu={dossier.analyse_ia_blocage} variant="alert" />

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <History size={15} /> Historique du dossier
            </h3>
            <div className="space-y-3">
              {dossier.historique.map((h, i) => (
                <div key={i} className="flex gap-3 text-sm border-l-2 border-teal-200 pl-3">
                  <div>
                    <div className="text-[10px] text-slate-400">{h.date}</div>
                    <div className="font-bold text-slate-800">{h.etape.replaceAll('_', ' ')}</div>
                    <div className="text-slate-600">{h.commentaire}</div>
                    <div className="text-[10px] text-slate-500">{h.acteur}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-4">
          {dossier.pieces_manquantes && dossier.pieces_manquantes.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 p-4">
              <h3 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                <AlertTriangle size={15} /> Pièces / points bloquants
              </h3>
              <ul className="space-y-1">
                {dossier.pieces_manquantes.map(p => (
                  <li key={p} className="text-sm text-red-800">• {p}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-teal-900 mb-2">Actions ROC recommandées</h3>
            <ul className="space-y-1.5">
              {dossier.actions_roc.map((a, i) => (
                <li key={i} className="text-sm text-teal-800 flex items-start gap-2">
                  <span className="font-bold text-teal-600">{i + 1}.</span> {a}
                </li>
              ))}
            </ul>
          </div>

          {canOpenAnalyse && (
            <Link
              href={`/credit/analyse?dossier=${dossier.dossier_analyse_id}`}
              className="flex items-center justify-between w-full p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-purple-700" />
                <div>
                  <div className="text-sm font-bold text-purple-900">Ouvrir workspace analyse CC</div>
                  <div className="text-xs text-purple-700">Validation ROC — dossier complet</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-purple-600" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-slate-400 uppercase font-bold">{label}</div>
      <div className="font-semibold text-slate-800 mt-0.5">{value}</div>
    </div>
  )
}
