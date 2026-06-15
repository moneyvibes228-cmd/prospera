'use client'

import { Check, Circle, X } from 'lucide-react'
import type { DossierWorkflowResponse } from '@/types/credit-api'

interface Props {
  workflow: DossierWorkflowResponse
}

export function DossierWorkflowStepper({ workflow }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Étape courante</p>
          <p className="text-sm font-bold text-slate-900">{workflow.etape_label}</p>
          <p className="text-[10px] text-slate-500 font-mono">{workflow.statut_bd}</p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
          Rôle : {workflow.role_connecte}
        </span>
      </div>

      <ol className="flex flex-col sm:flex-row sm:items-start gap-0 sm:gap-2">
        {workflow.timeline.map((step, i) => {
          const done = step.statut === 'TERMINE'
          const current = step.statut === 'EN_COURS'
          const refused = step.statut === 'REFUSE'
          return (
            <li
              key={step.etape}
              className={`flex-1 flex sm:flex-col items-start sm:items-center gap-2 sm:gap-1 py-2 sm:py-0 ${
                i < workflow.timeline.length - 1 ? 'sm:border-r sm:border-slate-100' : ''
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  refused
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : done
                      ? 'border-teal-500 bg-teal-50 text-teal-600'
                      : current
                        ? 'border-teal-500 bg-teal-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                {refused ? (
                  <X size={14} />
                ) : done ? (
                  <Check size={14} />
                ) : (
                  <Circle size={10} fill={current ? 'currentColor' : 'none'} />
                )}
              </span>
              <div className="sm:text-center">
                <p
                  className={`text-[11px] font-bold ${
                    current ? 'text-teal-700' : refused ? 'text-red-700' : 'text-slate-700'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[9px] text-slate-400 hidden sm:block">{step.statut.replace('_', ' ')}</p>
              </div>
            </li>
          )
        })}
      </ol>

      {workflow.jalons.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-3">
          {workflow.jalons.map((j) => (
            <div key={j.cle} className="text-[10px]">
              <span className="text-slate-500">{j.label} : </span>
              <span className="font-semibold text-slate-800">{j.date ?? '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
