'use client'
import { useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { VisitHistory } from '@/components/terrain/VisitHistory'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useVisitHistory, useRevisitReady } from '@/hooks/useVisits'
import { cn } from '@/lib/utils'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'

const TABS = ['Toutes les visites', 'Prêts à revisiter', 'Stats']

export default function HistoriqueVisitesPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [period, setPeriod] = useState('semaine')
  const [agentFilter, setAgentFilter] = useState('')
  const [statutFilter, setStatutFilter] = useState('')

  const { data: visits, isLoading } = useVisitHistory()
  const { data: revisitReady } = useRevisitReady()

  if (isLoading) return <LoadingSpinner message="Chargement de l'historique..." />

  const data = visits ?? []

  const filtered = data.filter(v => {
    if (agentFilter && v.agentNom !== agentFilter) return false
    if (statutFilter && v.statut !== statutFilter) return false
    return true
  })

  const pieData = [
    { name: 'Positive',     value: data.filter(v => v.statut === 'POSITIVE').length,     color: '#16a34a' },
    { name: 'Négative',     value: data.filter(v => v.statut === 'NEGATIVE').length,     color: '#dc2626' },
    { name: 'Sans réponse', value: data.filter(v => v.statut === 'SANS_REPONSE').length, color: '#94a3b8' },
  ]

  const agents = ['Kofi Amavi', 'Akua Lawson', 'Edem Kpélim']
  const barData = agents.map(a => ({
    agent: a.split(' ')[0],
    visites: data.filter(v => v.agentNom === a).length,
  }))

  return (
    <PageWrapper
      title="Historique des visites"
      subtitle="Suivi complet des visites terrain"
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-5">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={cn(
              'px-4 py-2 text-sm rounded-lg font-medium transition-colors',
              activeTab === i
                ? 'bg-teal-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Filtres */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="aujourd_hui">Aujourd&apos;hui</option>
              <option value="semaine">Cette semaine</option>
              <option value="mois">Ce mois</option>
            </select>
            <select
              value={agentFilter}
              onChange={e => setAgentFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Tous les agents</option>
              {agents.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select
              value={statutFilter}
              onChange={e => setStatutFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Tous les statuts</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEGATIVE">Négative</option>
              <option value="SANS_REPONSE">Sans réponse</option>
            </select>
          </div>
          <VisitHistory visits={filtered} />
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Emprunteurs prêts à revisiter</h3>
            <p className="text-xs text-slate-500 mt-0.5">Intervalle de revisite écoulé</p>
          </div>
          {!revisitReady || revisitReady.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Aucun emprunteur à revisiter pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {revisitReady.map(v => (
                <div key={v.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <span className="text-sm font-medium text-slate-800">{v.borrowerNom}</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dernière visite : {v.date} · Agent : {v.agentNom}
                    </p>
                  </div>
                  <button className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors">
                    Planifier
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 2 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Répartition par statut</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Visites par agent (semaine)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="agent" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="visites" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
