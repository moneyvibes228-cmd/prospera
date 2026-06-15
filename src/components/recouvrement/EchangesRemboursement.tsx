'use client'
import { MessageSquare, Phone, MapPin, Smartphone, Building2, Mail } from 'lucide-react'
import type { EchangeRemboursement } from '@/lib/roc-recouvrement-vue360'
import { formatFcfa } from '@/lib/utils'

const CANAL_ICON: Record<string, React.ReactNode> = {
  VISITE: <MapPin size={12} />,
  APPEL: <Phone size={12} />,
  WHATSAPP: <MessageSquare size={12} />,
  MOMO: <Smartphone size={12} />,
  GUICHET: <Building2 size={12} />,
  SMS: <Mail size={12} />,
}

const TYPE_STYLE: Record<string, string> = {
  PAIEMENT: 'bg-green-100 text-green-800',
  PARTIEL: 'bg-teal-100 text-teal-800',
  PROMESSE: 'bg-blue-100 text-blue-800',
  REFUS: 'bg-red-100 text-red-800',
  INJOIGNABLE: 'bg-slate-100 text-slate-700',
  RESTRUCTURATION: 'bg-purple-100 text-purple-800',
}

export function EchangesRemboursement({ echanges }: { echanges: EchangeRemboursement[] }) {
  if (echanges.length === 0) {
    return <p className="text-sm text-slate-500 italic">Aucun échange enregistré récemment.</p>
  }

  return (
    <div className="space-y-3">
      {echanges.map((e, i) => (
        <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500">
            {CANAL_ICON[e.canal]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-mono text-slate-400">{e.date} · {e.heure}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${TYPE_STYLE[e.type] ?? 'bg-slate-100'}`}>
                {e.type.replaceAll('_', ' ')}
              </span>
              <span className="text-[9px] text-slate-500">{e.canal}</span>
              {e.montant != null && (
                <span className="text-[10px] font-bold text-teal-700">{formatFcfa(e.montant)}</span>
              )}
            </div>
            <p className="text-sm text-slate-800">{e.resume}</p>
            <p className="text-[10px] text-slate-500 mt-1">Agent : {e.agent}</p>
            {e.promesse_date && (
              <p className={`text-[10px] mt-1 font-semibold ${e.promesse_honoree === false ? 'text-red-600' : e.promesse_honoree ? 'text-green-600' : 'text-blue-600'}`}>
                Promesse {e.promesse_date}
                {e.promesse_honoree === false && ' — non honorée'}
                {e.promesse_honoree === true && ' — honorée'}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
