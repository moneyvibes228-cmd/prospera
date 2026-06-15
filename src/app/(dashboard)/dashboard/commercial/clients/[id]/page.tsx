'use client'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, MapPin, RefreshCcw, Sparkles, History } from 'lucide-react'
import { getClientInactifById } from '@/lib/dc-vue360'
import { formatFcfa } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'

export default function ClientCommercialDetailPage() {
  const params = useParams()
  const router = useRouter()
  const client = getClientInactifById(params.id as string)

  if (!client) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Client introuvable.</p>
        <button onClick={() => router.back()} className="text-teal-600 text-sm mt-2">← Retour</button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Retour au dashboard Commercial DC
      </button>

      <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-purple-50 border-b border-purple-100">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono text-slate-500">{client.id}</span>
            <AiBadge variant="small" label={`Inactif ${client.mois_inactivite} mois`} />
            <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              Réactivation {client.probabilite_reactivation}%
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900">{client.nom}</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1"><MapPin size={12} /> {client.agence} · {client.agent}</span>
            <span className="flex items-center gap-1"><Phone size={12} /> {client.telephone}</span>
          </p>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Dernière activité</div>
            <div className="font-bold text-slate-800">{client.derniere_activite}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Encours passé</div>
            <div className="font-bold text-slate-800">{formatFcfa(client.encours_passe)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Dernier produit</div>
            <div className="font-bold text-slate-800">{client.dernier_produit}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Canal recommandé</div>
            <div className="font-bold text-teal-700">{client.canal_recommande}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <History size={15} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Historique d&apos;activité récent</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {client.historique_activite.map((h, i) => (
            <div key={i} className="px-4 py-3 flex justify-between items-center text-sm">
              <div>
                <div className="font-semibold text-slate-800">{h.type}</div>
                <div className="text-xs text-slate-500">{h.date} · {h.canal}</div>
              </div>
              {h.montant != null && (
                <div className="font-bold text-slate-700">{formatFcfa(h.montant)}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-teal-50 to-purple-50 rounded-xl border border-teal-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={15} className="text-teal-600" />
          <span className="text-sm font-bold text-teal-800">Analyse DC — Réactivation</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{client.analyse_dc}</p>
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
          <RefreshCcw size={12} /> Activité : {client.activite}
        </p>
      </div>
    </div>
  )
}
