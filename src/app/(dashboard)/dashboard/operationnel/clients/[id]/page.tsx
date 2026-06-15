'use client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wallet, Sparkles, Briefcase } from 'lucide-react'
import { getEpargnantByClientId } from '@/lib/operationnel-vue360'
import { getClientInactifById } from '@/lib/dc-vue360'
import { getClientRisqueById } from '@/lib/dec-vue360'
import { formatFcfa } from '@/lib/utils'

export default function ClientEpargneDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const epargne = getEpargnantByClientId(id)
  const commercial = getClientInactifById(id)
  const risque = getClientRisqueById(id)

  if (!epargne && !commercial && !risque) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Client introuvable.</p>
        <button onClick={() => router.back()} className="text-teal-600 text-sm mt-2">← Retour</button>
      </div>
    )
  }

  const nom = epargne?.client ?? commercial?.nom ?? risque?.nom ?? id

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="flex gap-2 flex-wrap">
        {commercial && (
          <Link href={`/dashboard/commercial/clients/${id}`} className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
            Fiche commercial DC →
          </Link>
        )}
        {risque && (
          <Link href={`/dashboard/credit/clients/${id}`} className="text-xs font-semibold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
            Fiche risque crédit DEC →
          </Link>
        )}
      </div>

      {epargne && (
        <>
          <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={16} className="text-blue-600" />
                <span className="text-xs font-mono text-slate-500">{epargne.client_id}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900">{nom}</h1>
              <p className="text-sm text-slate-600 mt-1">{epargne.agence} · Compte {epargne.type.replaceAll('_', ' ')}</p>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Solde épargne</div>
                <div className="text-xl font-black text-blue-700">{formatFcfa(epargne.solde)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Secteur</div>
                <div className="font-semibold flex items-center gap-1"><Briefcase size={12} /> {epargne.secteur}</div>
                <div className="text-xs text-slate-500">{epargne.activite}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Ancienneté</div>
                <div className="font-semibold">{epargne.anciennete_mois} mois</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Fréquence dépôts</div>
                <div className="font-semibold">{epargne.frequence_depot}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Dernier dépôt</div>
                <div className="font-semibold">{epargne.dernier_depot}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Potentiel crédit garanti</div>
                <div className="font-bold text-teal-700">{formatFcfa(epargne.potentiel_credit)}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {!epargne && (commercial || risque) && (
        <p className="text-sm text-slate-600">Utilisez les liens ci-dessus pour la fiche complète.</p>
      )}
    </div>
  )
}
