'use client'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, AlertTriangle, ExternalLink } from 'lucide-react'
import { SECTEURS_DETAIL } from '@/lib/dg-vue360'
import { formatFcfa } from '@/lib/utils'
import { AiBadge } from './AiBadge'

export function SectorBreakdown() {
  const router = useRouter()
  const totalDossiers = SECTEURS_DETAIL.reduce((s, sec) => s + sec.nb_dossiers, 0)
  const totalEncours = SECTEURS_DETAIL.reduce((s, sec) => s + sec.encours, 0)
  const totalEL = SECTEURS_DETAIL.reduce((s, sec) => s + sec.expected_loss, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Répartition par secteur d&apos;activité</h3>
          <AiBadge variant="small" label="Détection concentration" />
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
          <span>{totalDossiers} emprunteurs</span>
          <span className="text-slate-300">·</span>
          <span className="font-medium">{formatFcfa(totalEncours)}</span>
          <span className="text-slate-300">·</span>
          <span className="text-red-600 font-medium">EL {formatFcfa(totalEL)}</span>
          <span className="text-slate-300">·</span>
          <span className="text-teal-600 font-medium flex items-center gap-1">
            <ExternalLink size={10} /> Cliquer une ligne pour le détail
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium">Secteur</th>
              <th className="text-right px-3 py-3 font-medium">Part réseau</th>
              <th className="text-right px-3 py-3 font-medium">Emprunteurs</th>
              <th className="text-right px-3 py-3 font-medium">En retard</th>
              <th className="text-right px-3 py-3 font-medium">Encours</th>
              <th className="text-right px-3 py-3 font-medium">PAR 30j</th>
              <th className="text-right px-3 py-3 font-medium">Expected Loss</th>
              <th className="text-right px-3 py-3 font-medium">Remb.</th>
              <th className="text-right px-3 py-3 font-medium">Croissance</th>
              <th className="text-right px-3 py-3 font-medium">Saison.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {SECTEURS_DETAIL.map((s) => {
              const parColor = s.par_30j_pct > 10 ? '#dc2626' : s.par_30j_pct > 8 ? '#f97316' : '#16a34a'
              return (
                <tr
                  key={s.slug}
                  className="hover:bg-teal-50/50 cursor-pointer transition-colors group"
                  onClick={() => router.push(`/dashboard/secteurs/${s.slug}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{s.icone}</span>
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5 group-hover:text-teal-700">
                          {s.nom}
                          <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 text-teal-500" />
                          {s.alerte_concentration && (
                            <span className="text-[10px] bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                              <AlertTriangle size={9} /> Concentration
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {s.sous_secteurs.length} sous-secteurs · Ticket moy. {formatFcfa(s.ticket_moyen)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={`font-bold ${s.part_reseau_pct > 30 ? 'text-orange-600' : 'text-slate-700'}`}>{s.part_reseau_pct}%</span>
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-slate-700">{s.nb_dossiers}</td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-bold text-orange-600">{s.dossiers_en_retard}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-slate-700">{formatFcfa(s.encours)}</td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-bold" style={{ color: parColor }}>{s.par_30j_pct}%</span>
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-red-700">{formatFcfa(s.expected_loss)}</td>
                  <td className="px-3 py-3 text-right">
                    <span className={`font-bold ${s.taux_remboursement >= 93 ? 'text-green-600' : s.taux_remboursement >= 88 ? 'text-orange-600' : 'text-red-600'}`}>
                      {s.taux_remboursement}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className={`inline-flex items-center gap-0.5 text-xs font-bold ${s.croissance_mensuelle_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {s.croissance_mensuelle_pct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {s.croissance_mensuelle_pct >= 0 ? '+' : ''}{s.croissance_mensuelle_pct}%
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-[10px] font-medium text-slate-500">{s.saisonalite}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
