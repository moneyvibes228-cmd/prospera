'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, ChevronRight } from 'lucide-react'
import { getAllDossiersBloquesRoc } from '@/lib/roc-recouvrement-vue360'
import { formatFcfa } from '@/lib/utils'

export default function DossiersBloquesListePage() {
  const router = useRouter()
  const dossiers = getAllDossiersBloquesRoc()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button type="button" onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Tableau de bord ROC
      </button>

      <div className="flex items-center gap-2">
        <Lock size={20} className="text-orange-700" />
        <h1 className="text-2xl font-black text-slate-900">Dossiers bloqués &gt; 48h</h1>
        <span className="text-sm font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">{dossiers.length}</span>
      </div>

      <div className="bg-white rounded-xl border border-orange-200 divide-y divide-slate-100">
        {dossiers.map(d => (
          <Link key={d.reference} href={`/credit/recouvrement/dossiers/${encodeURIComponent(d.reference)}`}
            className="flex items-center gap-4 px-5 py-4 hover:bg-orange-50/50 transition-colors group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-slate-400">{d.reference}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">{d.etape.replaceAll('_', ' ')}</span>
              </div>
              <div className="font-bold text-slate-900 mt-0.5">{d.client}</div>
              <div className="text-xs text-slate-500">{d.agence} · {formatFcfa(d.montant)}</div>
              <div className="text-xs text-orange-700 font-semibold mt-0.5">{d.blocage_raison}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-black text-red-600">{d.bloque_depuis_h}h</div>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-orange-700" />
          </Link>
        ))}
      </div>
    </div>
  )
}
