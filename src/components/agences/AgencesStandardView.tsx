'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, ChevronRight } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AGENCES, AGENCES_DATA, RESEAU_CONSOLIDE } from '@/lib/agences'
import { ApiPhase1Banner } from '@/components/phase1/ApiPhase1Banner'
import { useAgencesApi } from '@/hooks/usePhase1'
import { formatFcfa } from '@/lib/utils'
import type { Agence } from '@/lib/agences'

const CONFORMITE_STYLE = {
  CONFORME: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'Conforme BCEAO' },
  ATTENTION: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: 'Attention' },
  NON_CONFORME: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Non conforme' },
}

function AgenceCard({ agence, selected, onClick }: { agence: Agence; selected: boolean; onClick: () => void }) {
  const data = AGENCES_DATA[agence.id]
  const parColor = agence.par_courant > 10 ? 'text-red-600' : agence.par_courant > 8 ? 'text-orange-600' : 'text-green-600'
  const collectePct = Math.round((agence.collecte_mois / agence.collecte_objectif) * 100)
  const conf = data?.conformite_bceao

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left w-full p-4 rounded-xl border-2 transition-all ${
        selected ? 'border-teal-400 bg-teal-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: agence.color + '20', color: agence.color }}
        >
          {agence.initiales}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-900 truncate">{agence.nom_court}</div>
          <div className="text-[11px] text-slate-500">{agence.ville} · {agence.responsable}</div>
        </div>
        {conf && (
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${CONFORMITE_STYLE[conf.statut].bg} ${CONFORMITE_STYLE[conf.statut].text} ${CONFORMITE_STYLE[conf.statut].border}`}>
            {CONFORMITE_STYLE[conf.statut].label}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-400">Encours</span>
          <div className="font-bold text-slate-800">{formatFcfa(agence.encours_fcfa)}</div>
        </div>
        <div>
          <span className="text-slate-400">PAR</span>
          <div className={`font-black ${parColor}`}>{agence.par_courant}%</div>
        </div>
        <div>
          <span className="text-slate-400">Emprunteurs</span>
          <div className="font-bold text-slate-800">{agence.emprunteurs_actifs}</div>
        </div>
        <div>
          <span className="text-slate-400">Collecte mois</span>
          <div className="font-bold text-teal-700">{collectePct}%</div>
        </div>
      </div>
    </button>
  )
}

function Row({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className={`font-bold ${alert ? 'text-red-600' : 'text-slate-800'}`}>{value}</span>
    </div>
  )
}

export function AgencesStandardView() {
  const { data: agencesApi } = useAgencesApi()
  const [selected, setSelected] = useState<Agence | null>(null)
  const detail = selected ? AGENCES_DATA[selected.id] : null

  const listAgences =
    agencesApi?.source === 'api' && agencesApi.data.length > 0 ? agencesApi.data : null

  return (
    <PageWrapper
      title="Agences"
      subtitle={`Réseau ${RESEAU_CONSOLIDE.total_agences} agences · ${RESEAU_CONSOLIDE.total_emprunteurs} emprunteurs actifs`}
    >
      <ApiPhase1Banner />
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <span className="font-bold text-slate-700">{formatFcfa(RESEAU_CONSOLIDE.encours_total)} encours total</span>
        <span className="text-slate-300">|</span>
        <span className={`font-bold ${RESEAU_CONSOLIDE.par_moyen > 10 ? 'text-red-600' : 'text-orange-600'}`}>
          PAR moyen {RESEAU_CONSOLIDE.par_moyen}%
        </span>
        <span className="text-slate-300">|</span>
        <span className="text-green-700 font-bold">{RESEAU_CONSOLIDE.agences_conformes} conformes BCEAO</span>
        {RESEAU_CONSOLIDE.agences_non_conformes > 0 && (
          <>
            <span className="text-slate-300">|</span>
            <span className="text-red-600 font-bold">{RESEAU_CONSOLIDE.agences_non_conformes} non conforme(s)</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={16} className="text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">Vue réseau</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {listAgences
              ? listAgences.map(a => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      const mock = AGENCES.find(m => m.nom === a.nom || m.ville === a.ville)
                      setSelected(mock ?? null)
                    }}
                    className="text-left w-full p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-slate-300"
                  >
                    <div className="text-sm font-bold text-slate-900">{a.nom}</div>
                    <div className="text-[11px] text-slate-500">{a.ville}</div>
                  </button>
                ))
              : AGENCES.map(a => (
                  <AgenceCard
                    key={a.id}
                    agence={a}
                    selected={selected?.id === a.id}
                    onClick={() => setSelected(prev => (prev?.id === a.id ? null : a))}
                  />
                ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          {selected && detail ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-4">
              <h3 className="text-lg font-black text-slate-900 mb-1">{selected.nom}</h3>
              <p className="text-sm text-slate-500 mb-4">Responsable : {selected.responsable}</p>
              <div className="space-y-3 text-sm">
                <Row label="Encours" value={formatFcfa(selected.encours_fcfa)} />
                <Row label="PAR actuel" value={`${selected.par_courant}%`} alert={selected.par_courant > 10} />
                <Row label="Taux remboursement" value={`${selected.taux_remboursement}%`} />
                <Row label="Agents" value={String(selected.agents)} />
                {detail.alertes?.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="text-xs font-bold text-red-700 uppercase mb-2">Alertes</div>
                    {detail.alertes.slice(0, 3).map((al, i) => (
                      <p key={i} className="text-xs text-slate-600 mb-1">• {al.detail}</p>
                    ))}
                  </div>
                )}
              </div>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900"
              >
                Voir détail dans le tableau de bord <ChevronRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              <Building2 size={32} className="mx-auto text-slate-300 mb-2" />
              Sélectionnez une agence pour voir le détail
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
