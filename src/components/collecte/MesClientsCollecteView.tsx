'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Search, UserPlus, Phone, MapPin, ChevronRight, Sparkles } from 'lucide-react'
import { getCollecteHubData, COLL_BORROWER_IDS } from '@/lib/collecte-agent-hub'
import { getSessionClients } from '@/lib/clients-session'
import { useBorrowers } from '@/hooks/useBorrowers'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatFcfa, getRiskColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'tous', label: 'Tous' },
  { id: 'actifs', label: 'Actifs' },
  { id: 'retard', label: 'En retard' },
  { id: 'prospects', label: 'Prospects' },
]

const TYPE_STYLE: Record<string, string> = {
  ACTIF: 'bg-green-100 text-green-700',
  RETARD: 'bg-orange-100 text-orange-700',
  TONTINE: 'bg-purple-100 text-purple-700',
  PROSPECT: 'bg-blue-100 text-blue-700',
}

export function MesClientsCollecteView() {
  const hub = getCollecteHubData()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('tous')
  const [sessionClients, setSessionClients] = useState<ReturnType<typeof getSessionClients>>([])

  const { data, isLoading } = useBorrowers()

  useEffect(() => {
    setSessionClients(getSessionClients())
  }, [])

  const clients = useMemo(() => {
    const ids = new Set<string>([...COLL_BORROWER_IDS, ...sessionClients.map(c => c.id)])
    const fromApi = (data ?? []).filter(b => ids.has(b.id))
    const apiIds = new Set(fromApi.map(b => b.id))
    const extra = sessionClients.filter(s => !apiIds.has(s.id))
    const merged = [...extra, ...fromApi]
    const hubMap = new Map(hub.clients.map(c => [c.borrowerId, c]))

    let items = merged.map(b => {
      const meta = hubMap.get(b.id)
      return {
        id: b.id,
        nom: b.nom,
        telephone: b.telephone,
        zone: b.zone,
        activite: meta?.activite ?? '—',
        encours: b.montant_credit - b.montant_rembourse,
        retard_j: b.retard_jours,
        score: b.score_ia,
        statut: b.statut,
        type: meta?.type_client ?? (b.id.startsWith('new-') ? 'PROSPECT' : b.retard_jours > 0 ? 'RETARD' : 'ACTIF'),
        isNew: b.id.startsWith('new-'),
      }
    })

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(c => c.nom.toLowerCase().includes(q) || c.zone.toLowerCase().includes(q))
    }
    if (activeTab === 'actifs') items = items.filter(c => c.type === 'ACTIF' || c.type === 'TONTINE')
    if (activeTab === 'retard') items = items.filter(c => c.retard_j > 0 || c.type === 'RETARD')
    if (activeTab === 'prospects') items = items.filter(c => c.type === 'PROSPECT' || c.isNew || c.statut === 'EVALUATION')

    return items.sort((a, b) => a.nom.localeCompare(b.nom))
  }, [data, sessionClients, search, activeTab, hub.clients])

  if (isLoading) return <LoadingSpinner message="Chargement de vos clients..." />

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-pink-600 to-rose-700 rounded-xl p-4 text-white">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-bold mb-1">{hub.agent.nom} — {hub.clients.length + sessionClients.length} clients</div>
            <p className="text-xs text-pink-50 leading-relaxed">
              Zone {hub.agent.zone} · collecte {Math.round(hub.kpis.collecte_jour / hub.kpis.objectif_jour * 100)}% objectif ·
              {hub.kpis.en_retard} en retard. Ouvrez une fiche pour lancer une demande de crédit.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        <Link
          href="/clients/nouveau"
          className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors duration-200"
        >
          <UserPlus size={16} />
          Nouveau client
        </Link>
      </div>

      <div className="flex gap-1 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-lg font-bold transition-colors duration-200 cursor-pointer',
              activeTab === tab.id ? 'bg-pink-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {clients.map(c => {
          const risk = c.score > 0 ? getRiskColor(c.score) : { text: 'text-slate-500', dot: '#94a3b8', label: 'Nouveau' }
          return (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-pink-300 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-pink-800">{c.nom}</div>
                  <div className="text-[11px] text-slate-500">{c.activite}</div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${TYPE_STYLE[c.type] ?? TYPE_STYLE.ACTIF}`}>
                  {c.type}
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600 mb-3">
                <div className="flex items-center gap-1.5"><Phone size={11} />{c.telephone}</div>
                <div className="flex items-center gap-1.5"><MapPin size={11} />{c.zone}</div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  {c.encours > 0 ? (
                    <span className="text-xs font-bold text-teal-700">{formatFcfa(c.encours)} encours</span>
                  ) : (
                    <span className={`text-xs font-bold ${risk.text}`}>{c.isNew ? 'Fiche à compléter' : `Score ${c.score}`}</span>
                  )}
                  {c.retard_j > 0 && <span className="ml-2 text-[10px] font-bold text-red-600">J+{c.retard_j}</span>}
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-pink-600" />
              </div>
            </Link>
          )
        })}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          Aucun client trouvé.{' '}
          <Link href="/clients/nouveau" className="text-pink-600 font-bold hover:underline">Ajouter un client</Link>
        </div>
      )}
    </div>
  )
}
