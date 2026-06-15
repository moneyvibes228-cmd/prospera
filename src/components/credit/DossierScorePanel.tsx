'use client'

import type { DossierScoreApi } from '@/types/credit-rapports-api'

interface Props {
  score: DossierScoreApi
  apiMode: boolean
}

export function DossierScorePanel({ score, apiMode }: Props) {
  const s = score.score_actuel

  return (
    <div className="space-y-4">
      <span
        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
          apiMode ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }`}
      >
        {apiMode ? 'Score CBI' : 'Score CBI (rapport CC)'}
      </span>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-[9px] font-bold text-slate-500 uppercase">Consolidé</p>
          <p className="text-3xl font-black text-teal-700">{s.score_consolide}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-[9px] font-bold text-slate-500 uppercase">CBI</p>
          <p className="text-3xl font-black text-slate-800">{s.score_cbi}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-[9px] font-bold text-slate-500 uppercase">Prospera IA</p>
          <p className="text-3xl font-black text-indigo-700">
            {s.ajustement_claude > 0 ? '+' : ''}
            {s.ajustement_claude}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[9px] font-bold text-slate-500 uppercase">BCEAO</p>
          <p className="text-sm font-black text-slate-900 mt-1">{s.classe_bceao}</p>
          <p className="text-[10px] text-slate-500">PD {s.probabilite_defaut_pct}% · {s.etape}</p>
        </div>
      </div>

      {score.historique.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Historique par étape</p>
          <div className="space-y-2">
            {score.historique.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-700">{h.etape}</span>
                <span className="font-black text-teal-700">{h.score_consolide}/100</span>
                {h.date && <span className="text-slate-400">{h.date}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(score.alertes_actives?.length ?? 0) > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Alertes actives</p>
          {score.alertes_actives!.map((a) => (
            <p key={a.code} className="text-xs text-slate-600">
              <strong>{a.code}</strong> — {a.message}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
