'use client'
import { useMemo, useState } from 'react'
import {
  Sparkles, Send, ArrowRightLeft, Clock, Users, FileSignature, Plus,
} from 'lucide-react'
import type { Proforma, ProformaStatut } from '@/types'
import { cn, formatFcfa } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useFacturationWorkflow } from '@/contexts/FacturationWorkflowContext'
import { isPortefeuilleRole } from '@/lib/hub-context'
import { ProformaBuilder } from './ProformaBuilder'
import { DocumentPreview } from './DocumentPreview'
import { WorkflowToast } from '@/components/shared/WorkflowToast'
import { REGISTRE_PROFORMAS } from '@/lib/registries/proformas-registry'
import {
  buildSyntheseProformas, buildAcceptationParCommercial, joursAvantExpiration, estExpirante,
  STATUT_PROFORMA_STYLE, CANAL_LABEL,
} from '@/lib/proforma-builder'

const FILTRES: (ProformaStatut | 'toutes')[] = [
  'toutes', 'BROUILLON', 'ENVOYEE', 'VUE', 'ACCEPTEE', 'CONVERTIE', 'REFUSEE', 'EXPIREE',
]

/** Le DC et le DG comparent leur force de vente ; les autres regardent leurs propres proformas. */
const ROLES_PILOTAGE = ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR', 'DAF', 'COMPTABLE']

export function ProformasView() {
  const { user } = useAuth()
  const {
    proformasCreees, convertir, getConversion, estConvertie, relancer, getRelanceCount,
    lastAction, clearLastAction,
  } = useFacturationWorkflow()

  const proformas = useMemo(() => {
    // Les proformas créées depuis le builder passent devant celles du registre.
    const base = [...proformasCreees, ...REGISTRE_PROFORMAS]
    // Déduplique par numéro au cas où une proforma serait déjà connue.
    const vues = new Set<string>()
    const uniques = base.filter(p => (vues.has(p.numero) ? false : (vues.add(p.numero), true)))
    if (user && isPortefeuilleRole(user.role)) {
      return uniques.filter(p => p.commercial === user.nom)
    }
    return uniques
  }, [user, proformasCreees])

  const synthese = useMemo(() => buildSyntheseProformas(proformas), [proformas])
  const parCommercial = useMemo(() => buildAcceptationParCommercial(proformas), [proformas])

  const [filtre, setFiltre] = useState<ProformaStatut | 'toutes'>('toutes')
  const [selectionnee, setSelectionnee] = useState<string | null>(null)
  const [creation, setCreation] = useState(false)

  const filtrees = useMemo(() => {
    const liste = filtre === 'toutes' ? proformas : proformas.filter(p => p.statut === filtre)
    // Ce qui est encore en jeu passe devant, et les scores les plus élevés d'abord.
    const ouvert = (p: Proforma) => ['ENVOYEE', 'VUE', 'BROUILLON'].includes(p.statut) ? 0 : 1
    return [...liste].sort((a, b) => ouvert(a) - ouvert(b) || b.score_acceptation_ia - a.score_acceptation_ia)
  }, [proformas, filtre])

  const selected = proformas.find(p => p.id === selectionnee) ?? null
  const peutPiloter = user ? ROLES_PILOTAGE.includes(user.role) : false

  return (
    <div className="space-y-4">
      {/* KPI proformas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Proformas en attente', value: String(synthese.en_attente), color: 'text-amber-700' },
          { label: 'Taux d\'acceptation', value: `${synthese.taux_acceptation_pct}%`, color: 'text-emerald-600' },
          { label: 'Délai proforma → cmd', value: `${synthese.delai_moyen_conversion_j} j`, color: 'text-slate-800' },
          { label: 'Montant en jeu', value: formatFcfa(synthese.montant_en_jeu), color: 'text-slate-900' },
          { label: 'Expirent sous 48 h', value: String(synthese.expirantes_48h), color: 'text-red-600' },
          { label: 'Score moyen IA', value: `${synthese.score_moyen}/100`, color: 'text-indigo-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={cn('text-sm font-black mt-0.5', k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Création */}
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={() => setCreation(c => !c)}
          className={cn('inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors',
            creation ? 'bg-slate-200 text-slate-700' : 'bg-slate-900 text-white hover:bg-slate-800')}>
          {creation ? '← Retour à la liste' : <><Plus size={13} /> Créer une proforma</>}
        </button>
        {!creation && synthese.expirantes_48h > 0 && (
          <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1">
            <Clock size={11} />
            {synthese.expirantes_48h} proforma{synthese.expirantes_48h > 1 ? 's' : ''} expire{synthese.expirantes_48h > 1 ? 'nt' : ''} sous 48 h — à relancer aujourd&apos;hui
          </span>
        )}
      </div>

      {creation ? <ProformaBuilder /> : (
        <>
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-2">
            {FILTRES.map(f => (
              <button key={f} type="button" onClick={() => setFiltre(f)}
                className={cn('text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-colors',
                  filtre === f ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>
                {f === 'toutes' ? 'Toutes' : STATUT_PROFORMA_STYLE[f].label}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                {filtrees.map(p => {
                  const st = STATUT_PROFORMA_STYLE[p.statut]
                  const jours = joursAvantExpiration(p)
                  const expirante = estExpirante(p)
                  const convertie = estConvertie(p)
                  const conversion = getConversion(p.id)
                  const relanceCount = getRelanceCount(p)

                  return (
                    <div key={p.id} className={cn('p-4', expirante && 'bg-red-50/40', selectionnee === p.id && 'bg-amber-50/60')}>
                      <button type="button" onClick={() => setSelectionnee(prev => prev === p.id ? null : p.id)}
                        className="w-full text-left">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[11px] text-slate-400">{p.numero}</span>
                              <span className="font-bold text-sm text-slate-900">{p.pdv_nom}</span>
                              <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                                convertie ? STATUT_PROFORMA_STYLE.CONVERTIE.className : st.className)}>
                                {convertie ? 'Convertie' : st.label}
                              </span>
                              {expirante && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-red-100 text-red-700 inline-flex items-center gap-1">
                                  <Clock size={9} /> expire dans {jours} j
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {p.zone} · {p.commercial} · {CANAL_LABEL[p.canal_envoi]} · émise le {p.date_emission}
                              {p.vue_le && <> · vue le {p.vue_le}</>}
                              {relanceCount > 0 && <> · {relanceCount} relance{relanceCount > 1 ? 's' : ''}</>}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-black text-slate-900">{formatFcfa(p.montant_ttc)}</div>
                            <div className="text-[10px] text-slate-400">
                              TTC · {p.lignes.length} ligne{p.lignes.length > 1 ? 's' : ''}
                              {p.remise_globale_pct > 0 && <> · −{p.remise_globale_pct}%</>}
                            </div>
                            <div className="flex items-center gap-1 justify-end mt-0.5">
                              <Sparkles size={9} className="text-indigo-500" />
                              <span className={cn('text-[11px] font-black',
                                p.score_acceptation_ia >= 70 ? 'text-emerald-600'
                                  : p.score_acceptation_ia >= 50 ? 'text-amber-600' : 'text-red-600')}>
                                {p.score_acceptation_ia}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>

                      {p.suggestion_ia && (
                        <p className="text-[11px] text-indigo-900 bg-indigo-50 border border-indigo-100 rounded-lg p-2 mt-2 leading-relaxed">
                          <Sparkles size={10} className="inline mr-1 text-indigo-600" />
                          {p.suggestion_ia}
                        </p>
                      )}

                      {['ENVOYEE', 'VUE', 'ACCEPTEE', 'BROUILLON'].includes(p.statut) && !convertie && (
                        <div className="flex items-center gap-2 flex-wrap mt-2.5">
                          <button type="button" onClick={() => convertir(p)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                            <ArrowRightLeft size={11} /> Convertir en commande
                          </button>
                          <button type="button" onClick={() => relancer(p, p.canal_envoi)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                            <Send size={11} /> Relancer par {CANAL_LABEL[p.canal_envoi]}
                          </button>
                        </div>
                      )}

                      {conversion && p.statut !== 'CONVERTIE' && (
                        <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2 mt-2">
                          Convertie en commande <span className="font-mono font-bold">{conversion.commande_ref}</span> ·
                          facture <span className="font-mono font-bold">{conversion.facture_ref}</span> à certifier —
                          la proforma est close, la commande part en préparation.
                        </p>
                      )}

                      {p.commande_ref && !conversion && (
                        <p className="text-[10px] text-slate-400 mt-2">
                          Commande <span className="font-mono font-bold">{p.commande_ref}</span>
                          {p.facture_ref && <> · facture <span className="font-mono font-bold">{p.facture_ref}</span></>}
                        </p>
                      )}
                    </div>
                  )
                })}

                {filtrees.length === 0 && (
                  <p className="p-6 text-center text-xs text-slate-400">Aucune proforma dans cette vue.</p>
                )}
              </div>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-3">
              {peutPiloter && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={14} className="text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-900">Acceptation par commercial</h3>
                  </div>
                  <div className="space-y-2">
                    {parCommercial.map(c => (
                      <div key={c.commercial} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">
                            {c.commercial === '—' ? 'Enseigne' : c.commercial}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {c.emises} émise{c.emises > 1 ? 's' : ''} · {c.gagnees} gagnée{c.gagnees > 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={cn('font-black',
                            c.taux_pct >= 60 ? 'text-emerald-600' : c.taux_pct >= 40 ? 'text-amber-600' : 'text-red-600')}>
                            {c.taux_pct}%
                          </div>
                          <div className="text-[10px] text-slate-400">{formatFcfa(c.montant_gagne)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileSignature size={14} className="text-indigo-600" />
                  <h3 className="text-sm font-bold text-indigo-900">Le cycle documentaire</h3>
                </div>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  Proforma → acceptation client → commande → bon de livraison → facture → e-facture certifiée.
                  Une proforma expire au bout de 15 jours : passé ce délai, il faut la réémettre, et le client
                  qui a hésité une fois hésite deux fois.
                </p>
                <div className="mt-2.5 pt-2.5 border-t border-indigo-200/60 text-[11px] text-indigo-800">
                  <strong>{synthese.taux_acceptation_pct} %</strong> des proformas tranchées ont été signées,
                  pour un délai moyen de <strong>{synthese.delai_moyen_conversion_j} j</strong>.
                </div>
              </div>
            </div>
          </div>

          {/* Aperçu du document sélectionné */}
          {selected && (
            <DocumentPreview
              type="PROFORMA"
              numero={selected.numero}
              client={selected.pdv_nom}
              zone={selected.zone}
              date_emission={selected.date_emission}
              date_limite={selected.date_validite}
              lignes={selected.lignes}
              montant_ht={selected.montant_ht}
              montant_ttc={selected.montant_ttc}
              remise_globale_pct={selected.remise_globale_pct}
              conditions_paiement={selected.conditions_paiement}
            />
          )}
        </>
      )}

      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
