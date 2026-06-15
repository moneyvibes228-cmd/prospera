'use client'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, FileEdit, Sparkles, Monitor, Globe } from 'lucide-react'
import { getModificationById } from '@/lib/operationnel-vue360'
import { AiBadge } from '@/components/dashboard/AiBadge'

const CRIT_STYLE: Record<string, string> = {
  CRITIQUE: 'bg-red-100 text-red-800',
  HAUTE: 'bg-orange-100 text-orange-800',
  MOYENNE: 'bg-yellow-100 text-yellow-800',
}

export default function ModificationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const mod = getModificationById(params.id as string)

  if (!mod) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Modification introuvable.</p>
        <button onClick={() => router.back()} className="text-teal-600 text-sm mt-2">← Retour</button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Retour au dashboard opérationnel
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <FileEdit size={14} className="text-slate-500" />
              <span className="text-xs font-mono text-slate-500">{mod.id}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${CRIT_STYLE[mod.criticite] ?? ''}`}>{mod.criticite}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${mod.justifie ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {mod.justifie ? '✓ Justifié' : '✗ À vérifier'}
              </span>
            </div>
            <h1 className="text-lg font-black text-slate-900">{mod.action}</h1>
            <p className="text-sm text-slate-500 mt-1">{mod.date} · {mod.user} ({mod.role})</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Entité</div>
              <div className="font-semibold">{mod.entite} — <span className="font-mono text-xs">{mod.entite_id}</span></div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Impact</div>
              <div className="font-semibold text-slate-800">{mod.impact}</div>
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Modification</div>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="text-red-600 font-medium line-through">{mod.avant}</span>
              <span className="text-slate-400">→</span>
              <span className="text-green-700 font-bold">{mod.apres}</span>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Globe size={12} /> IP {mod.ip}</span>
            <span className="flex items-center gap-1"><Monitor size={12} /> {mod.appareil}</span>
          </div>
          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{mod.contexte}</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={15} className="text-teal-600" />
          <span className="text-sm font-bold text-teal-800">Analyse IA — Audit trail</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{mod.analyse_ia}</p>
      </div>

      {mod.procedure_requise.length > 0 && mod.procedure_requise[0] !== 'Aucune' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Procédure requise</h3>
          <ul className="space-y-2">
            {mod.procedure_requise.map((p, i) => (
              <li key={i} className="text-sm text-slate-700 flex gap-2">
                <span className="text-teal-600 font-bold">{i + 1}.</span>{p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
