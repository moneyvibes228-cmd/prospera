'use client'
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { formatFcfa, formatDate } from '@/lib/utils'
import type { Borrower } from '@/types'

interface Echeance {
  id: string
  date: string
  montant: number
  statut: 'PAYE' | 'A_VENIR' | 'RETARD' | 'PARTIEL'
  montant_paye?: number
}

function buildEcheances(borrower: Borrower): Echeance[] {
  const mensualite = Math.round(borrower.montant_credit / 12)
  const today = new Date('2026-05-27')
  const echeances: Echeance[] = []

  for (let i = 0; i < 12; i++) {
    const d = new Date('2025-06-01')
    d.setMonth(d.getMonth() + i)
    const dateStr = d.toISOString().split('T')[0]
    const date = new Date(dateStr)

    let statut: Echeance['statut'] = 'A_VENIR'
    let montant_paye: number | undefined

    if (date < today) {
      const paidRatio = borrower.montant_rembourse / borrower.montant_credit
      const expectedPaid = mensualite * (i + 1)
      if (borrower.montant_rembourse >= expectedPaid) {
        statut = 'PAYE'
        montant_paye = mensualite
      } else if (borrower.retard_jours > 0 && i === Math.floor(paidRatio * 12)) {
        statut = borrower.montant_rembourse > expectedPaid - mensualite ? 'PARTIEL' : 'RETARD'
        montant_paye = Math.max(0, borrower.montant_rembourse - mensualite * i)
      } else if (borrower.montant_rembourse >= mensualite * i) {
        statut = 'PAYE'
        montant_paye = mensualite
      } else {
        statut = 'RETARD'
      }
    }

    echeances.push({ id: `ech-${i}`, date: dateStr, montant: mensualite, statut, montant_paye })
  }

  return echeances
}

const STATUT_STYLE: Record<Echeance['statut'], { bg: string; icon: typeof CheckCircle2; label: string }> = {
  PAYE:    { bg: 'bg-green-50 border-green-200 text-green-800', icon: CheckCircle2, label: 'Payé' },
  A_VENIR: { bg: 'bg-slate-50 border-slate-200 text-slate-600', icon: Clock, label: 'À venir' },
  RETARD:  { bg: 'bg-red-50 border-red-200 text-red-800', icon: AlertCircle, label: 'En retard' },
  PARTIEL: { bg: 'bg-orange-50 border-orange-200 text-orange-800', icon: AlertCircle, label: 'Partiel' },
}

export function CalendrierRecouvrementBlock({ borrower }: { borrower: Borrower }) {
  const echeances = buildEcheances(borrower)
  const payes = echeances.filter(e => e.statut === 'PAYE').length
  const retards = echeances.filter(e => e.statut === 'RETARD' || e.statut === 'PARTIEL').length
  const prochaine = echeances.find(e => e.statut === 'A_VENIR')
  const taux = Math.round((borrower.montant_rembourse / borrower.montant_credit) * 100)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniKpi label="Échéances payées" value={`${payes}/12`} ok />
        <MiniKpi label="En retard" value={retards} alert={retards > 0} />
        <MiniKpi label="Progression" value={`${taux}%`} />
        <MiniKpi
          label="Prochaine échéance"
          value={prochaine ? formatDate(prochaine.date) : '—'}
          small
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {echeances.map(e => {
          const s = STATUT_STYLE[e.statut]
          const Icon = s.icon
          return (
            <div key={e.id} className={`rounded-lg border p-3 ${s.bg}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span className="text-xs font-bold">{formatDate(e.date)}</span>
                </div>
                <Icon size={14} />
              </div>
              <div className="text-sm font-black">{formatFcfa(e.montant)}</div>
              <div className="text-[10px] font-bold mt-0.5 uppercase">{s.label}</div>
              {e.montant_paye !== undefined && e.statut !== 'PAYE' && (
                <div className="text-[10px] mt-0.5">Payé : {formatFcfa(e.montant_paye)}</div>
              )}
            </div>
          )
        })}
      </div>

      {borrower.retard_jours > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
          Retard actuel : <strong>J+{borrower.retard_jours}</strong> — Montant restant dû :{' '}
          <strong>{formatFcfa(borrower.montant_credit - borrower.montant_rembourse)}</strong>
        </div>
      )}
    </div>
  )
}

function MiniKpi({ label, value, small, alert, ok }: {
  label: string; value: string | number; small?: boolean; alert?: boolean; ok?: boolean
}) {
  const bg = alert ? 'bg-red-50 border-red-200' : ok ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
  return (
    <div className={`rounded-lg border p-2.5 ${bg}`}>
      <div className="text-[9px] font-bold text-slate-500 uppercase">{label}</div>
      <div className={`font-black mt-0.5 ${small ? 'text-xs' : 'text-lg'} ${alert ? 'text-red-700' : ok ? 'text-green-700' : 'text-slate-900'}`}>
        {value}
      </div>
    </div>
  )
}
