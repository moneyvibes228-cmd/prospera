'use client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, MapPin, CreditCard, ChevronRight } from 'lucide-react'
import { getClientRecouvrementById } from '@/lib/roc-recouvrement-vue360'
import { ScoreRecouvrementIA } from '@/components/recouvrement/ScoreRecouvrementIA'
import { EchangesRemboursement } from '@/components/recouvrement/EchangesRemboursement'
import { BlocAnalyseIA } from '@/components/recouvrement/BlocAnalyseIA'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'
import { RecouvrementDrillBanner } from '@/components/recouvrement/RecouvrementDrillBanner'

export default function ClientRecouvrementPage() {
  const params = useParams()
  const router = useRouter()
  const client = getClientRecouvrementById(params.id as string)

  if (!client) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Client introuvable.</p>
        <button type="button" onClick={() => router.back()} className="text-teal-600 text-sm mt-2">← Retour</button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <RecouvrementDrillBanner type="client" id={params.id as string} />
      <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400">{client.id}</span>
              <AiBadge variant="small" label={client.classe_bceao} />
              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">J+{client.retard_j}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900">{client.nom}</h1>
            <p className="text-sm text-slate-500 mt-1 flex gap-3 flex-wrap">
              <span className="flex items-center gap-1"><MapPin size={12} /> {client.localite}</span>
              <span className="flex items-center gap-1"><Phone size={12} /> {client.telephone}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-red-700">{formatFcfa(client.montant_du)}</div>
            <div className="text-xs text-slate-500">Montant dû</div>
          </div>
        </div>
      </div>

      <ScoreRecouvrementIA
        score={client.score_recouvrement_ia}
        probabilite_pct={client.probabilite_remboursement_pct}
        facteurs={client.facteurs_score}
      />

      <BlocAnalyseIA titre="Analyse recouvrement IA" contenu={client.analyse_ia_recouvrement} />

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><User size={15} /> Profil</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Activité" value={client.activite} />
              <Row label="Agence" value={client.agence} />
              <Row label="Agent" value={client.agent} />
            </dl>
            <Link href={`/credit/recouvrement/agents/${client.agent_id}`}
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal-700">
              Agent recouvrement <ChevronRight size={12} />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><CreditCard size={15} /> Crédits actifs</h3>
            {client.credits.map(c => (
              <div key={c.reference} className="p-3 bg-slate-50 rounded-lg mb-2 text-sm">
                <div className="font-mono text-[10px] text-slate-400">{c.reference}</div>
                <div className="font-bold">{formatFcfa(c.encours)} encours</div>
                <div className="text-xs text-slate-500">{c.echeances_impayees} éch. impayées · {formatFcfa(c.mensualite)}/mois</div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Échanges de remboursement</h3>
            <p className="text-xs text-slate-500 mb-4">Historique des contacts, paiements et promesses — alimente le score IA</p>
            <EchangesRemboursement echanges={client.echanges} />
          </div>

          <div className="mt-4 bg-teal-50 border border-teal-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-teal-900 uppercase mb-2">Actions ROC</h4>
            <ul className="space-y-1">
              {client.actions_recommandees.map((a, i) => (
                <li key={i} className="text-sm text-teal-800">• {a}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-800 text-right">{value}</dd>
    </div>
  )
}
