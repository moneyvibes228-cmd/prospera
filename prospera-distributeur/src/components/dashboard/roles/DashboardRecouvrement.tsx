'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Bot, Phone, HandCoins, TrendingDown,
  ArrowRight, MapPin, CheckCircle2, XCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { PerformancePostePanel } from '@/components/dashboard/PerformancePostePanel'
import { buildCockpitRecouvrement, CAPACITE_JOUR } from '@/lib/recouvrement-cockpit-builder'
import { buildSyntheseAutomation, CANAL_ICON } from '@/lib/automation/automation-types'
import { STATUT_PROMESSE_STYLE } from '@/lib/automation/recouvrement-automations'
import { formatFcfa } from '@/lib/utils'

function Tuile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
      <div className="text-[10px] text-slate-400 font-medium">{label}</div>
      <div className={`text-base font-black mt-0.5 ${accent ?? 'text-slate-800'}`}>{value}</div>
      {sub ? <div className="text-[9px] text-slate-400 mt-0.5">{sub}</div> : null}
    </div>
  )
}

export function DashboardRecouvrement() {
  const c = useMemo(() => buildCockpitRecouvrement(), [])
  const synthese = useMemo(() => buildSyntheseAutomation(c.regles), [c.regles])
  const [ouvert, setOuvert] = useState<string | null>(c.file[0]?.cible.id ?? null)

  const tauxObjectif = Math.round((c.encaisse_mois / c.objectif_mois) * 100)
  const { prevision } = c
  const parts = [
    { label: 'Quasi certain', value: prevision.quasi_certain, couleur: 'bg-emerald-500', texte: 'text-emerald-700' },
    { label: 'Probable', value: prevision.probable, couleur: 'bg-sky-500', texte: 'text-sky-700' },
    { label: 'Incertain', value: prevision.incertain, couleur: 'bg-amber-500', texte: 'text-amber-700' },
    { label: 'À provisionner', value: prevision.perdu, couleur: 'bg-red-500', texte: 'text-red-700' },
  ]

  return (
    <div className="p-6 max-w-[90rem] space-y-5">
      <PageHeader
        title="Cockpit recouvrement"
        subtitle="La file du jour, priorisée par ce qu'elle rapporte vraiment"
        badge={`${c.file.length} dossiers aujourd'hui`}
      />

      {/* Le cash, d'abord */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Tuile label="Encours total" value={`${formatFcfa(c.prevision.total_encours)} F`} sub={`${c.dossiers.length} dossiers`} accent="text-slate-800" />
        <Tuile label="Cash attendu 30 j" value={`${formatFcfa(c.prevision.attendu_30j)} F`} sub="pondéré par probabilité" accent="text-emerald-700" />
        <Tuile label="Perte attendue" value={`${formatFcfa(c.perte_attendue)} F`} sub="à provisionner" accent="text-red-600" />
        <Tuile label="DSO réseau" value={`${c.dso_reseau} j`} sub="objectif 35 j" accent={c.dso_reseau > 45 ? 'text-red-600' : 'text-emerald-700'} />
        <Tuile label="Encaissé ce mois" value={`${formatFcfa(c.encaisse_mois)} F`} sub={`${tauxObjectif}% de l'objectif`} accent="text-emerald-700" />
        <Tuile label="Crédits bloqués" value={String(c.clients_bloques)} sub={`${c.promesses_rompues} promesse(s) rompue(s)`} accent="text-red-600" />
      </div>

      {/* Ce que la machine a fait */}
      <div className="bg-gradient-to-br from-slate-50 to-emerald-50 rounded-xl border border-emerald-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bot size={16} className="text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Cette nuit, sans vous</h3>
          <span className="text-[10px] text-slate-500">
            {synthese.regles_actives} règles actives · {synthese.gain_temps_h_mois} h/mois de relances manuelles évitées
          </span>
          <Link href="/automatisations" className="ml-auto text-[10px] font-semibold text-emerald-700 hover:underline flex items-center gap-1">
            Voir les règles <ArrowRight size={11} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tuile label="Relances parties seules" value={String(synthese.actions_auto)} sub="rappels, SMS, lettrages" accent="text-emerald-700" />
          <Tuile label="En attente de vous" value={String(synthese.actions_a_valider)} sub="visites, mises en demeure" accent="text-amber-700" />
          <Tuile label="Promesses à surveiller" value={String(c.promesses_en_attente)} sub="échéance sous 7 j" accent="text-sky-700" />
          <Tuile label="Cash dans la file" value={`${formatFcfa(c.cash_du_jour)} F`} sub={`${CAPACITE_JOUR} dossiers max/jour`} accent="text-emerald-700" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* La file du jour */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Phone size={15} className="text-red-600" />
            <h3 className="text-sm font-bold">Ma file du jour</h3>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">
            Triée sur la valeur espérée (montant × probabilité), pas sur le montant brut — courir après
            une grosse créance irrécouvrable coûte plus de temps qu&apos;elle ne rapporte d&apos;argent.
          </p>

          <div className="space-y-2">
            {c.file.map(a => {
              const actif = ouvert === a.cible.id
              return (
                <div key={a.cible.id} className={`border rounded-lg transition-colors ${actif ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => setOuvert(prev => (prev === a.cible.id ? null : a.cible.id))}
                    className="w-full text-left p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        {a.rang}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{CANAL_ICON[a.cible.canal]}</span>
                          <span className="font-bold text-xs text-slate-900 truncate">{a.cible.libelle}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{a.cible.detail}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-emerald-700">{formatFcfa(a.valeur_esperee)} F</div>
                        <div className="text-[9px] text-slate-400">valeur espérée</div>
                      </div>
                    </div>
                  </button>

                  {actif && (
                    <div className="px-3 pb-3 space-y-2">
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                        <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                          Message prêt · {a.regle.nom}
                        </div>
                        <p className="text-[11px] text-slate-700 whitespace-pre-line">{a.cible.message}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="text-[10px] font-bold px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                          Envoyer maintenant
                        </button>
                        <button type="button" className="text-[10px] font-semibold px-3 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800">
                          Enregistrer une promesse
                        </button>
                        <button type="button" className="text-[10px] font-semibold px-3 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                          Modifier
                        </button>
                        <button type="button" className="text-[10px] font-semibold px-3 py-1 rounded-lg text-slate-400 hover:bg-slate-50">
                          Reporter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          {/* Prévision d'encaissement */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <HandCoins size={15} className="text-emerald-600" />
              <h3 className="text-sm font-bold">Ce qui rentrera vraiment</h3>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden mb-3">
              {parts.map(p => (
                <div
                  key={p.label}
                  className={p.couleur}
                  style={{ width: `${(p.value / Math.max(1, prevision.total_encours)) * 100}%` }}
                />
              ))}
            </div>
            <div className="space-y-1.5">
              {parts.map(p => (
                <div key={p.label} className="flex justify-between text-[10px]">
                  <span className="text-slate-500">{p.label}</span>
                  <span className={`font-bold ${p.texte}`}>{formatFcfa(p.value)} F</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 mt-2 italic">
              La perte attendue n&apos;est pas un échec du recouvrement : c&apos;est ce que la vente a
              accordé de trop. Elle se corrige à la source.
            </p>
          </div>

          {/* Promesses */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={15} className="text-sky-600" />
              <h3 className="text-sm font-bold">Promesses de paiement</h3>
            </div>
            <div className="space-y-2">
              {c.promesses.map(p => (
                <div key={p.id} className={`border rounded-lg p-2 ${STATUT_PROMESSE_STYLE[p.statut]}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-[11px] truncate">{p.client_nom}</div>
                      <div className="text-[9px] opacity-80">
                        {p.statut === 'ROMPUE' ? 'Rompue' : p.statut === 'TENUE' ? 'Tenue' : p.statut === 'ECHUE_AUJOURDHUI' ? 'Échue aujourd\'hui' : `Dans ${p.jours_restants} j`}
                        {' · '}fiabilité {p.fiabilite_pct}%
                      </div>
                    </div>
                    <div className="text-[11px] font-black shrink-0">{formatFcfa(p.montant)} F</div>
                  </div>
                  {p.promesses_rompues > 0 && (
                    <div className="flex items-center gap-1 text-[9px] mt-1 opacity-90">
                      <XCircle size={9} /> {p.promesses_rompues}/{p.historique_promesses} promesses rompues
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Où le retard se fabrique */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={15} className="text-orange-600" />
            <h3 className="text-sm font-bold">L&apos;encours par zone</h3>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">
            L&apos;impayé ne naît pas au recouvrement, il naît à la vente.
          </p>
          <div className="space-y-1.5">
            {c.zones.map(z => (
              <div key={z.zone} className="flex items-center gap-2 text-[10px]">
                <span className="w-24 truncate text-slate-600 shrink-0">{z.zone}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400 rounded-full" style={{ width: `${z.part_pct}%` }} />
                </div>
                <span className="w-16 text-right font-bold text-slate-700">{formatFcfa(z.encours)}</span>
                <span className={`w-10 text-right font-bold ${z.dso_jours > 45 ? 'text-red-600' : 'text-slate-400'}`}>
                  {z.dso_jours} j
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={15} className="text-red-600" />
            <h3 className="text-sm font-bold">L&apos;encours par commercial</h3>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">
            Un commercial qui accorde des délais pour tenir son quota transfère son problème ici.
          </p>
          <div className="space-y-1.5">
            {c.commerciaux.map(cm => (
              <div key={cm.commercial} className="flex justify-between items-center text-[10px] border-b border-slate-100 pb-1.5 last:border-0">
                <span className="text-slate-700 font-medium truncate">{cm.commercial}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-400">{cm.clients_en_retard} clients</span>
                  <span className={`font-bold ${cm.dso_jours > 45 ? 'text-red-600' : 'text-slate-600'}`}>{cm.dso_jours} j</span>
                  <span className="font-black text-slate-800 w-16 text-right">{formatFcfa(cm.encours)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PerformancePostePanel role="RECOUVREMENT" />
    </div>
  )
}
