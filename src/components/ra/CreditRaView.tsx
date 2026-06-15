'use client'
import { FileText, AlertTriangle, TrendingUp, Wallet, Sparkles, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { RapportIAGlobal } from '@/components/dashboard/RapportIAGlobal'
import { getRaHubData } from '@/lib/ra-agence-hub'
import { getMauvaisPayeurIdByNom } from '@/lib/roc-recouvrement-vue360'
import { formatFcfa } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'

export function CreditRaView() {
  const router = useRouter()
  const hub = getRaHubData()
  const d = hub

  const rapportCredit = {
    ...hub.rapport,
    synthese_executive: hub.rapport.synthese_executive.split('.').slice(2).join('.').trim() ||
      'Analyse crédit agence : 152 dossiers actifs, PAR 30 à 8,6 %. Priorité validation 5 dossiers > 24 h et maîtrise PME zone Est.',
    synthese_piliers: (hub.rapport.synthese_piliers ?? []).filter(p =>
      p.titre.includes('crédit') || p.titre.includes('PAR') || p.titre.includes('portefeuille')
    ),
  }

  return (
    <div className="space-y-5">
      <RapportIAGlobal
        rapport={rapportCredit}
        accentColor="indigo"
        analyseLabel={`Crédit & Opérations — ${hub.agence.nom}`}
      />

      {/* KPIs crédit */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <KpiCard label="Dossiers actifs" value={d.dossiers_synthese.actifs} />
        <KpiCard label="En retard" value={d.dossiers_synthese.en_retard} alert />
        <KpiCard label="Attente validation" value={d.dossiers_synthese.en_attente_validation} sub={formatFcfa(d.dossiers_synthese.montant_attente)} />
        <KpiCard label="PAR 30" value={`${d.kpis_credit.par_30_pct}%`} alert={d.kpis_credit.par_30_pct > 8} />
        <KpiCard label="Recouvrement" value={`${d.kpis_credit.taux_remboursement_pct}%`} ok />
        <KpiCard label="Impayés" value={formatFcfa(d.kpis_credit.montant_impayes)} small alert />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Secteurs */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileText size={15} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Secteurs — demandes & potentiel</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b">
                  <th className="text-left px-4 py-2.5 font-bold">Secteur</th>
                  <th className="text-center px-2 py-2.5 font-bold">Demandes</th>
                  <th className="text-center px-2 py-2.5 font-bold">Approuvés</th>
                  <th className="text-center px-2 py-2.5 font-bold">Encours</th>
                  <th className="text-center px-2 py-2.5 font-bold">PAR</th>
                  <th className="text-center px-2 py-2.5 font-bold">Potentiel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {d.secteurs_demande.map(s => (
                  <tr key={s.secteur} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-bold text-slate-800">{s.secteur}</td>
                    <td className="px-2 py-2 text-center">{s.demandes}</td>
                    <td className="px-2 py-2 text-center text-green-700 font-bold">{s.approuves}</td>
                    <td className="px-2 py-2 text-center">{s.encours_pct}%</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`font-bold ${s.par > 9 ? 'text-red-600' : 'text-slate-700'}`}>{s.par}%</span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <PotentielBadge value={s.potentiel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Dossiers par produit */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp size={15} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Portefeuille par produit</h3>
          </div>
          <div className="p-4 space-y-3">
            {d.dossiers_synthese.par_produit.map(p => (
              <div key={p.produit} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-sm font-bold text-slate-800">{p.produit}</div>
                  <div className="text-xs text-slate-500">{p.count} dossiers</div>
                </div>
                <div className="text-sm font-black text-indigo-700">{formatFcfa(p.montant)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Mauvais payeurs + recouvrement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => router.push('/credit/mauvais-payeurs')}
            className="w-full px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2 hover:bg-red-50/40 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-600" />
              <h3 className="text-sm font-bold text-slate-900">Mauvais payeurs — actions IA</h3>
              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                {d.mauvais_payeurs.length}
              </span>
            </div>
            <span className="text-[10px] font-bold text-teal-700 inline-flex items-center gap-0.5 shrink-0">
              Voir tout <ChevronRight size={12} />
            </span>
          </button>
          <div className="divide-y divide-slate-50">
            {d.mauvais_payeurs.map(m => {
              const clientId = getMauvaisPayeurIdByNom(m.client)
              return (
              <button
                key={m.client}
                type="button"
                onClick={() => {
                  if (clientId) {
                    router.push(`/credit/recouvrement/mauvais-payeurs/${clientId}?from=${encodeURIComponent('/credit/mauvais-payeurs')}`)
                  } else {
                    router.push('/credit/mauvais-payeurs')
                  }
                }}
                className="w-full px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900">{m.client}</span>
                  <span className="text-xs font-bold text-red-600">J+{m.retard_jours}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>{formatFcfa(m.montant_du)} dû · {m.agent}</span>
                  {m.proba_defaut != null && <span className="text-red-600 font-bold">{m.proba_defaut}% défaut</span>}
                </div>
                <p className="text-[11px] text-indigo-700 font-medium">{m.action_ia}</p>
              </button>
            )})}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp size={15} className="text-green-600" />
            <h3 className="text-sm font-bold text-slate-900">Évolution recouvrement (4 semaines)</h3>
          </div>
          <div className="p-4 space-y-2">
            {d.recouvrement_evolution.map(r => (
              <div key={r.semaine} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 w-8">{r.semaine}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${r.taux}%` }}
                  />
                </div>
                <span className="text-xs font-black text-green-700 w-12 text-right">{r.taux}%</span>
                <span className="text-[10px] text-slate-400 w-20 text-right">{formatFcfa(r.collecte)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Transactions & retraits */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Wallet size={15} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Transactions & retraits — analyse IA</h3>
          <AiBadge variant="small" label="IA" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:divide-x divide-slate-100">
          <div className="p-5">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-3">Flux du jour</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Transactions</span><span className="font-bold">{d.transactions.total_jour}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Dépôts</span><span className="font-bold text-green-700">{formatFcfa(d.transactions.depots)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Décaissements</span><span className="font-bold text-red-600">{formatFcfa(d.transactions.decaissements)}</span></div>
            </div>
          </div>
          <div className="p-5">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-3">Retraits par type</div>
            <div className="space-y-2">
              {d.transactions.retraits_par_type.map(r => (
                <div key={r.type} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{r.type}</span>
                  <span className="font-bold">{r.count} · {formatFcfa(r.montant)} ({r.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-3">Liquidité par jour</div>
            <div className="space-y-1.5">
              {d.transactions.liquidite_par_jour.map(j => (
                <div key={j.jour} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 w-8">{j.jour}</span>
                  <span className={`font-bold ${j.net >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {j.net >= 0 ? '+' : ''}{formatFcfa(j.net)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 py-4 bg-indigo-50 border-t border-indigo-100 flex items-start gap-2">
          <Sparkles size={14} className="text-indigo-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-indigo-900 leading-relaxed">{d.transactions.analyse_ia}</p>
        </div>
      </section>
    </div>
  )
}

function KpiCard({ label, value, sub, small, alert, ok }: {
  label: string; value: string | number; sub?: string; small?: boolean; alert?: boolean; ok?: boolean
}) {
  const bg = alert ? 'bg-red-50 border-red-200' : ok ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
  return (
    <div className={`rounded-xl border p-3 ${bg}`}>
      <div className="text-[9px] font-bold text-slate-500 uppercase">{label}</div>
      <div className={`font-black mt-1 ${small ? 'text-sm' : 'text-xl'} ${alert ? 'text-red-800' : ok ? 'text-green-800' : 'text-slate-900'}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

function PotentielBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    FORT: 'bg-green-100 text-green-700',
    MOYEN: 'bg-blue-100 text-blue-700',
    VIGILANCE: 'bg-orange-100 text-orange-700',
  }
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${styles[value] ?? 'bg-slate-100 text-slate-600'}`}>
      {value}
    </span>
  )
}
