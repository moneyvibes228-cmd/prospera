'use client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Clock, FileText, User, Briefcase,
  AlertTriangle, CheckCircle2, XCircle, ChevronRight, History,
} from 'lucide-react'
import { getDossierBloqueById, getClientRisqueById } from '@/lib/dec-vue360'
import { formatFcfa } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'

const PIECE_ICON: Record<string, React.ReactNode> = {
  OK:        <CheckCircle2 size={14} className="text-green-600" />,
  MANQUANT:  <XCircle size={14} className="text-red-600" />,
  EN_REVUE:  <AlertTriangle size={14} className="text-orange-500" />,
}

export default function DossierBloqueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dossier = getDossierBloqueById(params.id as string)

  if (!dossier) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Dossier introuvable.</p>
        <button onClick={() => router.back()} className="text-teal-600 text-sm mt-2">← Retour</button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Retour au dashboard DEC
      </button>

      {/* En-tête */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-red-50 border-b border-red-100 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono font-bold text-slate-500">{dossier.id}</span>
              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                Bloqué {dossier.bloque_depuis_h}h
              </span>
              <AiBadge variant="small" label={dossier.statut_workflow.replaceAll('_', ' ')} />
            </div>
            <h1 className="text-xl font-black text-slate-900">{dossier.client}</h1>
            <p className="text-sm text-slate-600 mt-1">{dossier.objet}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-slate-900">{formatFcfa(dossier.montant)}</div>
            <div className="text-xs text-slate-500">{dossier.duree_mois} mois · {dossier.taux}%</div>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <InfoItem icon={<Briefcase size={14} />} label="Étape" value={dossier.etape} />
          <InfoItem icon={<User size={14} />} label="Agent" value={`${dossier.agent} · ${dossier.agence}`} />
          <InfoItem icon={<Clock size={14} />} label="Blocage depuis" value={dossier.date_blocage} />
          <InfoItem icon={<AlertTriangle size={14} />} label="Raison" value={dossier.raison} alert />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Colonne gauche — client & crédit */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <Section title="Informations client" icon={<User size={15} />}>
            <dl className="space-y-2 text-sm">
              <Row label="Type" value={dossier.type_client} />
              {dossier.telephone && <Row label="Téléphone" value={dossier.telephone} />}
              {dossier.activite && <Row label="Activité" value={dossier.activite} />}
              {dossier.localite && <Row label="Localité" value={dossier.localite} />}
              {dossier.revenus_mensuels && <Row label="Revenus mensuels" value={formatFcfa(dossier.revenus_mensuels)} />}
              {dossier.client_id && getClientRisqueById(dossier.client_id) && (
                <div className="pt-2">
                  <Link href={`/dashboard/credit/clients/${dossier.client_id}`}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1">
                    Voir fiche client <ChevronRight size={12} />
                  </Link>
                </div>
              )}
            </dl>
          </Section>

          <Section title="Conditions crédit" icon={<FileText size={15} />}>
            <dl className="space-y-2 text-sm">
              <Row label="Montant demandé" value={formatFcfa(dossier.montant)} />
              <Row label="Durée" value={`${dossier.duree_mois} mois`} />
              <Row label="Taux" value={`${dossier.taux}%`} />
              <Row label="Garanties" value={dossier.garanties} />
              {dossier.score_cbi && <Row label="Score CBI" value={`${dossier.score_cbi}/100`} />}
              {dossier.classe_bceao && <Row label="Classe BCEAO" value={dossier.classe_bceao} />}
              {dossier.charge_credit && <Row label="Chargé de crédit" value={dossier.charge_credit} />}
              <Row label="Date soumission" value={dossier.date_soumission} />
            </dl>
          </Section>

          {dossier.dossiers_lies && dossier.dossiers_lies.length > 0 && (
            <Section title="Dossiers liés" icon={<FileText size={15} />}>
              <div className="space-y-2">
                {dossier.dossiers_lies.map(d => (
                  <div key={d.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg text-sm">
                    <div>
                      <div className="font-semibold text-slate-800">{d.id}</div>
                      <div className="text-xs text-slate-500">{d.libelle}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-700">{formatFcfa(d.montant)}</div>
                      <div className="text-[10px] text-slate-400">{d.statut}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Colonne droite — workflow & pièces */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <Section title="Historique du workflow" icon={<History size={15} />}>
            <div className="space-y-0">
              {dossier.historique_etapes.map((h, i) => (
                <div key={i} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${i === dossier.historique_etapes.length - 1 ? 'bg-red-500' : 'bg-teal-500'}`} />
                    {i < dossier.historique_etapes.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">{h.etape}</span>
                      <span className="text-[10px] text-slate-400">{h.date}</span>
                    </div>
                    <div className="text-xs text-teal-700 font-medium">{h.acteur}</div>
                    {h.commentaire && <p className="text-xs text-slate-600 mt-1">{h.commentaire}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Pièces du dossier" icon={<FileText size={15} />}>
            <div className="space-y-2">
              {dossier.pieces.map(p => (
                <div key={p.nom} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 text-sm">
                  <div className="flex items-center gap-2">
                    {PIECE_ICON[p.statut]}
                    <span className="font-medium text-slate-800">{p.nom}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      p.statut === 'OK' ? 'bg-green-100 text-green-700' :
                      p.statut === 'MANQUANT' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>{p.statut.replace('_', ' ')}</span>
                    {p.date_depot && <div className="text-[10px] text-slate-400 mt-0.5">{p.date_depot}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-orange-600" />
              <h3 className="text-sm font-bold text-orange-900">Actions recommandées DEC</h3>
            </div>
            <ul className="space-y-2">
              {dossier.actions_recommandees.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-orange-500 font-bold mt-0.5">{i + 1}.</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <span className="text-slate-500">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function InfoItem({ icon, label, value, alert }: { icon: React.ReactNode; label: string; value: string; alert?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold mb-0.5">{icon} {label}</div>
      <div className={`text-sm font-semibold ${alert ? 'text-red-700' : 'text-slate-800'}`}>{value}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className="font-medium text-slate-800 text-right">{value}</dd>
    </div>
  )
}
