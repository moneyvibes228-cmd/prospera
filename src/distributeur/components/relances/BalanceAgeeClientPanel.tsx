'use client'
import { useMemo, useState } from 'react'
import { Wallet, Lock, Unlock, Sparkles, History } from 'lucide-react'
import { cn, formatFcfa } from '@distributeur/lib/utils'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { useAuth } from '@distributeur/contexts/AuthContext'
import {
  buildBalanceAgeeClient, buildDossiersRecouvrement, buildSyntheseRecouvrement, SEUIL_BLOCAGE_JOURS,
} from '@distributeur/lib/recouvrement-builder'

interface TraceBlocage {
  client: string
  action: 'BLOCAGE' | 'DEBLOCAGE'
  auteur: string
  motif: string
}

/**
 * Écran d'entrée du recouvrement : la balance âgée, les dossiers priorisés par
 * probabilité de récupération, et le blocage de crédit — qui laisse toujours une trace.
 */
export function BalanceAgeeClientPanel() {
  const { user } = useAuth()
  const balance = useMemo(() => buildBalanceAgeeClient(), [])
  const dossiers = useMemo(() => buildDossiersRecouvrement(), [])
  const synthese = useMemo(() => buildSyntheseRecouvrement(dossiers), [dossiers])

  /** Surcharges manuelles du blocage automatique — la décision humaine prime, mais elle est tracée. */
  const [surcharges, setSurcharges] = useState<Record<string, boolean>>({})
  const [journal, setJournal] = useState<TraceBlocage[]>([])

  const total = balance.reduce((s, t) => s + t.montant, 0)

  function basculer(clientId: string, clientNom: string, bloqueActuel: boolean) {
    const nouveau = !bloqueActuel
    setSurcharges(s => ({ ...s, [clientId]: nouveau }))
    setJournal(j => [{
      client: clientNom,
      action: nouveau ? 'BLOCAGE' : 'DEBLOCAGE',
      auteur: user?.nom ?? 'Recouvrement',
      motif: nouveau
        ? `Crédit coupé — créance au-delà de ${SEUIL_BLOCAGE_JOURS} j ou risque avéré`
        : 'Crédit rétabli — accord d\'échéancier signé avec le client',
    }, ...j])
  }

  return (
    <div className="space-y-4">
      {/* Balance âgée */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Wallet size={15} className="text-red-500" />
          <h3 className="text-sm font-bold text-slate-900">Balance âgée client</h3>
          <AiBadge variant="small" label="Temps réel" />
          <span className="text-xs text-slate-400 ml-auto">{formatFcfa(total)} d&apos;encours ouvert</span>
        </div>

        <div className="space-y-2.5">
          {balance.map(t => {
            const pct = total > 0 ? Math.round((t.montant / total) * 100) : 0
            return (
              <div key={t.tranche}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="font-medium text-slate-700">{t.tranche}</span>
                    <span className="text-[10px] text-slate-400">{t.clients} client{t.clients > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{formatFcfa(t.montant)}</span>
                    <span className="font-bold tabular-nums" style={{ color: t.color }}>{pct}%</span>
                  </div>
                </div>
                <div className="bg-slate-100 rounded-full h-2">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: t.color }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          {[
            { label: 'Encours total', value: formatFcfa(synthese.encours_total), color: 'text-slate-900' },
            { label: 'Recouvrement espéré', value: formatFcfa(synthese.valeur_esperee_totale), color: 'text-emerald-600' },
            { label: 'Perte attendue', value: formatFcfa(synthese.perte_attendue), color: 'text-red-600' },
            { label: 'Crédits bloqués', value: String(synthese.clients_bloques), color: 'text-orange-600' },
          ].map(k => (
            <div key={k.label} className="bg-slate-50 rounded-lg p-2.5">
              <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
              <div className={cn('text-sm font-black mt-0.5', k.color)}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dossiers priorisés */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
          <Sparkles size={15} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Dossiers priorisés par probabilité de recouvrement</h3>
          <span className="text-[10px] text-slate-400 ml-auto">
            trié sur la valeur espérée, pas sur le montant brut
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {dossiers.map(d => {
            const bloque = surcharges[d.client_id] ?? d.credit_bloque
            return (
              <div key={d.client_id} className={cn('p-4', d.probabilite_recouvrement < 40 && 'bg-red-50/40')}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{d.client_nom}</span>
                      <span className="font-mono text-[10px] text-slate-400">{d.compte_aux}</span>
                      {bloque && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-red-100 text-red-700 inline-flex items-center gap-1">
                          <Lock size={9} /> Crédit bloqué
                        </span>
                      )}
                      {d.provision_pct > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">
                          provisionné {d.provision_pct} %
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {d.commercial} · {d.jours_retard} j de retard · {d.factures.length} facture{d.factures.length > 1 ? 's' : ''}
                      {d.paye > 0 && <> · {formatFcfa(d.paye)} déjà payés</>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-black text-slate-900">{formatFcfa(d.reste)}</div>
                    <div className="text-[10px] text-slate-400">
                      espéré <span className="font-bold text-emerald-600">{formatFcfa(d.valeur_esperee)}</span>
                    </div>
                    <div className={cn('text-[11px] font-black mt-0.5',
                      d.probabilite_recouvrement >= 70 ? 'text-emerald-600'
                        : d.probabilite_recouvrement >= 40 ? 'text-amber-600' : 'text-red-600')}>
                      {d.probabilite_recouvrement}% de chances
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-indigo-900 bg-indigo-50 border border-indigo-100 rounded-lg p-2 mt-2 leading-relaxed">
                  <Sparkles size={10} className="inline mr-1 text-indigo-600" />
                  {d.action_recommandee}
                </p>

                <button type="button" onClick={() => basculer(d.client_id, d.client_nom, bloque)}
                  className={cn('mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors',
                    bloque
                      ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      : 'bg-red-600 text-white hover:bg-red-700')}>
                  {bloque ? <><Unlock size={11} /> Débloquer le crédit</> : <><Lock size={11} /> Bloquer le crédit</>}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Trace des décisions */}
      {journal.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <History size={14} className="text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Trace des décisions de crédit</h3>
            <span className="text-[10px] text-slate-400 ml-auto">
              toute coupure de crédit est journalisée
            </span>
          </div>
          <div className="space-y-1.5">
            {journal.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs py-1.5 border-b border-slate-100 last:border-0">
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0',
                  t.action === 'BLOCAGE' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700')}>
                  {t.action === 'BLOCAGE' ? 'Blocage' : 'Déblocage'}
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-slate-800">{t.client}</span>
                  <span className="text-slate-400"> — par {t.auteur}</span>
                  <div className="text-[10px] text-slate-500">{t.motif}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
