'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight, Phone, MapPin, Sparkles, AlertTriangle,
  TrendingUp, Clock, ArrowRight, Users,
} from 'lucide-react'
import { formatFcfa, getRiskColor } from '@/lib/utils'
import type { ClientPortefeuilleGP } from '@/lib/gp-portefeuille-hub'

const RISQUE_STYLE: Record<string, string> = {
  CRITIQUE: 'bg-red-100 text-red-800 border-red-200',
  HAUT:     'bg-orange-100 text-orange-800 border-orange-200',
  MOYEN:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  FAIBLE:   'bg-green-100 text-green-800 border-green-200',
}

interface Props {
  clients: ClientPortefeuilleGP[]
  totalClients?: number
  compact?: boolean
  showHeader?: boolean
}

export function PortfolioClientGrid({ clients, totalClients, compact, showHeader = true }: Props) {
  const router = useRouter()

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {showHeader && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Mes clients</h3>
            <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
              {clients.length} affichés
            </span>
          </div>
          <Link
            href="/emprunteurs"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 transition-colors duration-200 cursor-pointer"
          >
            Voir tous{totalClients ? ` (${totalClients})` : ''}
            <ChevronRight size={12} />
          </Link>
        </div>
      )}

      <div className={`p-4 grid gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
        {clients.map(client => (
          <ClientCard
            key={client.borrowerId}
            client={client}
            onClick={() => router.push(`/emprunteurs/${client.borrowerId}`)}
          />
        ))}
      </div>
    </section>
  )
}

function ClientCard({ client, onClick }: { client: ClientPortefeuilleGP; onClick: () => void }) {
  const risk = getRiskColor(client.score)
  const initials = client.nom.split(' ').slice(0, 2).map(n => n[0]).join('')

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group text-left w-full rounded-xl border p-4 transition-all duration-200 cursor-pointer hover:border-sky-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
        client.risque === 'CRITIQUE' ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white hover:bg-sky-50/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
          style={{ backgroundColor: risk.dot }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 text-sm truncate group-hover:text-sky-900 transition-colors duration-200">
            {client.nom}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${RISQUE_STYLE[client.risque]}`}>
              {client.risque}
            </span>
            <span className="text-[10px] text-slate-500">{client.segment}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-lg font-black ${risk.text}`}>{client.score}</div>
          <div className="text-[9px] text-slate-400">score IA</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-50 rounded-lg px-2.5 py-1.5">
          <div className="text-[9px] font-bold text-slate-400 uppercase">Encours</div>
          <div className="text-xs font-black text-slate-800">{formatFcfa(client.encours)}</div>
        </div>
        <div className={`rounded-lg px-2.5 py-1.5 ${client.retard_j > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className="text-[9px] font-bold text-slate-400 uppercase">Retard</div>
          <div className={`text-xs font-black ${client.retard_j > 0 ? 'text-red-700' : 'text-green-700'}`}>
            {client.retard_j > 0 ? `J+${client.retard_j}` : 'À jour'}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-3">
        <span className="inline-flex items-center gap-1">
          <MapPin size={10} /> {client.zone}
        </span>
        <span className="inline-flex items-center gap-1 truncate">
          <Clock size={10} /> {client.dernier_paiement}
        </span>
      </div>

      {/* Suggestion IA */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-sky-50 border border-sky-100 group-hover:bg-sky-100/80 transition-colors duration-200">
        <Sparkles size={12} className="text-sky-600 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-sky-900 leading-relaxed line-clamp-2">{client.suggestion_ia}</p>
      </div>

      {client.action_prioritaire && (
        <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-orange-700">
          <AlertTriangle size={10} />
          {client.action_prioritaire}
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
          <Phone size={10} /> {client.telephone}
        </span>
        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-sky-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Fiche client <ArrowRight size={11} />
        </span>
      </div>
    </button>
  )
}

/** Filtres rapides pour la grille */
export function PortfolioClientFilters({
  active,
  onChange,
  counts,
}: {
  active: string
  onChange: (id: string) => void
  counts: Record<string, number>
}) {
  const tabs = [
    { id: 'tous',      label: 'Tous',      icon: Users },
    { id: 'critiques', label: 'Critiques', icon: AlertTriangle },
    { id: 'retard',    label: 'En retard', icon: Clock },
    { id: 'sains',     label: 'Sains',     icon: TrendingUp },
  ]

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-lg font-medium transition-colors duration-200 cursor-pointer ${
            active === tab.id
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300 hover:bg-sky-50'
          }`}
        >
          <tab.icon size={14} />
          {tab.label} ({counts[tab.id] ?? 0})
        </button>
      ))}
    </div>
  )
}
