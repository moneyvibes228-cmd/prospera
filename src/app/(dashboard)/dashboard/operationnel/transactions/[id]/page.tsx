'use client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Shield, Clock, Sparkles } from 'lucide-react'
import { getTransactionSuspecteById } from '@/lib/operationnel-vue360'
import { formatFcfa } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'

const STATUT_STYLE: Record<string, string> = {
  EN_INVESTIGATION: 'bg-orange-100 text-orange-800',
  RESOLUE: 'bg-green-100 text-green-800',
  BLOQUEE: 'bg-red-100 text-red-800',
}

const SEV_STYLE: Record<string, string> = {
  CRITIQUE: 'bg-red-100 text-red-700',
  HAUTE: 'bg-orange-100 text-orange-700',
  MOYENNE: 'bg-yellow-100 text-yellow-700',
}

export default function TransactionSuspecteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tx = getTransactionSuspecteById(params.id as string)

  if (!tx) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Transaction introuvable.</p>
        <button onClick={() => router.back()} className="text-teal-600 text-sm mt-2">← Retour</button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Retour au dashboard opérationnel
      </button>

      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono font-bold text-slate-600">{tx.id}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUT_STYLE[tx.statut] ?? 'bg-slate-100'}`}>
              {tx.statut.replaceAll('_', ' ')}
            </span>
            <span className="text-[10px] font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded">
              Score fraude {tx.score_fraude}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900">{formatFcfa(tx.montant)}</h1>
          <p className="text-sm text-slate-600 mt-1">{tx.motif}</p>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><div className="text-[10px] text-slate-400 uppercase font-bold">Date · Heure</div><div className="font-semibold">{tx.date} · {tx.heure}</div></div>
          <div><div className="text-[10px] text-slate-400 uppercase font-bold">Client</div>
            <div className="font-semibold">{tx.client}
              {tx.client_id && (
                <Link href={`/dashboard/commercial/clients/${tx.client_id}`} className="block text-xs text-teal-600 mt-0.5">Voir fiche →</Link>
              )}
            </div>
          </div>
          <div><div className="text-[10px] text-slate-400 uppercase font-bold">Canal</div><div className="font-semibold">{tx.canal}</div></div>
          <div><div className="text-[10px] text-slate-400 uppercase font-bold">Type</div><div className="font-semibold">{tx.type_operation.replaceAll('_', ' ')}</div></div>
          <div><div className="text-[10px] text-slate-400 uppercase font-bold">Agent · Agence</div><div className="font-semibold">{tx.agent} · {tx.agence}</div></div>
          <div><div className="text-[10px] text-slate-400 uppercase font-bold">Référence</div><div className="font-mono text-xs">{tx.reference_externe}</div></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Shield size={14} /> Pattern détecté
        </h3>
        <p className="text-sm text-slate-700">{tx.pattern_detecte}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Signaux IA</h3>
        <div className="space-y-2">
          {tx.signaux.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-sm">
              <span className="text-slate-700">{s.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{s.valeur}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${SEV_STYLE[s.severite]}`}>{s.severite}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {tx.historique_lie.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Clock size={14} /> Historique lié
          </h3>
          <div className="space-y-2">
            {tx.historique_lie.map((h, i) => (
              <div key={i} className="flex justify-between text-sm p-2 border-b border-slate-50 last:border-0">
                <span className="text-slate-600">{h.date} — {h.libelle}</span>
                <span className="font-bold">{formatFcfa(h.montant)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-teal-50 to-red-50 rounded-xl border border-teal-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={15} className="text-teal-600" />
          <span className="text-sm font-bold text-teal-800">Analyse IA</span>
          {tx.responsable_enquete && <AiBadge variant="small" label={`${tx.responsable_enquete} · ${tx.delai_traitement}`} />}
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{tx.analyse_ia}</p>
      </div>

      <div className="bg-white rounded-xl border border-orange-200 p-5">
        <h3 className="text-sm font-bold text-orange-900 mb-3 flex items-center gap-2">
          <AlertTriangle size={14} /> Actions recommandées
        </h3>
        <ul className="space-y-2">
          {tx.actions_recommandees.map((a, i) => (
            <li key={i} className="text-sm text-slate-700 flex gap-2">
              <span className="text-orange-600 font-bold">{i + 1}.</span>{a}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
