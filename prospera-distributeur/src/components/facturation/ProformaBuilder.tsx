'use client'
import { useMemo, useState } from 'react'
import { Plus, Trash2, Sparkles, AlertTriangle, Check } from 'lucide-react'
import type { LigneFacture, ModePaiementFacture, CanalEnvoiProforma, Proforma } from '@/types'
import { cn, formatFcfa } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { useAuth } from '@/contexts/AuthContext'
import { useFacturationWorkflow } from '@/contexts/FacturationWorkflowContext'
import { DocumentPreview } from './DocumentPreview'
import { REGISTRE_PDV } from '@/lib/registries/pdv-registry'
import { REGISTRE_STOCK } from '@/lib/registries/stock-registry'
import { genId } from '@/lib/persistence'
import { genererReference } from '@/lib/facturation-workflow'
import {
  calculerTotaux, ligneDepuisProduit, scoreAcceptationIA,
  CANAL_LABEL, MODE_PAIEMENT_LABEL, VALIDITE_JOURS, TVA_PCT,
} from '@/lib/proforma-builder'

const MODES: ModePaiementFacture[] = ['ESPECES', 'VIREMENT', 'CHEQUE', 'CREDIT_30J', 'CREDIT_45J', 'CREDIT_60J']
const CANAUX: CanalEnvoiProforma[] = ['WHATSAPP', 'EMAIL', 'SMS', 'IMPRESSION']

/** Marge minimale sous laquelle un freelance ne doit pas vendre. */
const MARGE_MIN_FREELANCE_PCT = 12

function dansNJours(n: number): string {
  const d = new Date('2026-06-11')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function ProformaBuilder() {
  const { user } = useAuth()
  const { creerProforma, proformasCreees } = useFacturationWorkflow()
  const estFreelance = user?.role === 'FREELANCE'

  const pdvs = useMemo(() => {
    // Un commercial ne monte une proforma que pour les PDV de son portefeuille.
    if (user && ['COMMERCIAL', 'FREELANCE', 'PROSPECTION'].includes(user.role)) {
      return REGISTRE_PDV.filter(p => p.commercial === user.nom)
    }
    return REGISTRE_PDV
  }, [user])

  const [pdvId, setPdvId] = useState(pdvs[0]?.id ?? '')
  const [lignes, setLignes] = useState<LigneFacture[]>([])
  const [remiseGlobale, setRemiseGlobale] = useState(0)
  const [mode, setMode] = useState<ModePaiementFacture>('CREDIT_30J')
  const [canal, setCanal] = useState<CanalEnvoiProforma>('WHATSAPP')
  /** Prix de revente du freelance — sa marge est la différence avec le prix société. */
  const [majorationFreelance, setMajorationFreelance] = useState(15)
  const [envoyee, setEnvoyee] = useState(false)

  const pdv = pdvs.find(p => p.id === pdvId) ?? pdvs[0]
  const totaux = useMemo(() => calculerTotaux(lignes, remiseGlobale), [lignes, remiseGlobale])

  const plafond = pdv ? Math.max(1_000_000, Math.round(pdv.ca_mois * 1.5)) : 0
  const encoursApres = (pdv?.creance ?? 0) + totaux.montant_ttc
  const depassePlafond = plafond > 0 && encoursApres > plafond

  const score = useMemo(() => {
    if (!pdv || lignes.length === 0) return 0
    return scoreAcceptationIA({
      score_pdv: pdv.score_ia,
      creance: pdv.creance,
      plafond_credit: plafond,
      remise_pct: remiseGlobale,
      montant_ttc: totaux.montant_ttc,
      panier_habituel: Math.max(200_000, Math.round(pdv.ca_mois / 3)),
    })
  }, [pdv, lignes, plafond, remiseGlobale, totaux])

  const margeFreelance = Math.round(totaux.montant_ttc * (majorationFreelance / 100))
  const margePct = majorationFreelance
  const sousMargeMin = estFreelance && margePct < MARGE_MIN_FREELANCE_PCT

  function ajouterProduit(reference: string) {
    const produit = REGISTRE_STOCK.find(p => p.reference === reference)
    if (!produit || lignes.some(l => l.reference === reference)) return
    setLignes(l => [...l, ligneDepuisProduit(produit, 10)])
  }

  function majQuantite(reference: string, quantite: number) {
    setLignes(ls => ls.map(l => {
      if (l.reference !== reference) return l
      return { ...l, quantite, total: Math.round(l.prix_unitaire * quantite * (1 - l.remise_pct / 100)) }
    }))
  }

  function majRemise(reference: string, remise: number) {
    setLignes(ls => ls.map(l => {
      if (l.reference !== reference) return l
      return { ...l, remise_pct: remise, total: Math.round(l.prix_unitaire * l.quantite * (1 - remise / 100)) }
    }))
  }

  const numeroPreview = genererReference('PRO', 143 + proformasCreees.length + 1)

  function envoyer() {
    if (!pdv || lignes.length === 0) return
    const proforma: Proforma = {
      id: genId('pro'),
      numero: numeroPreview,
      pdv_id: pdv.id,
      pdv_nom: pdv.nom,
      commercial: user?.nom ?? '—',
      zone: pdv.zone,
      date_emission: '2026-06-11',
      date_validite: dansNJours(VALIDITE_JOURS),
      lignes,
      montant_ht: totaux.montant_ht,
      tva_pct: TVA_PCT,
      montant_ttc: totaux.montant_ttc,
      remise_globale_pct: remiseGlobale,
      statut: 'ENVOYEE',
      conditions_paiement: mode,
      score_acceptation_ia: score,
      canal_envoi: canal,
      relances_envoyees: 0,
    }
    creerProforma(proforma)
    setEnvoyee(true)
  }

  if (!pdv) {
    return <p className="text-sm text-slate-400 p-6">Aucun point de vente dans votre portefeuille.</p>
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Saisie */}
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Nouvelle proforma</h3>

          {/* Client */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Client</label>
            <select value={pdvId} onChange={e => { setPdvId(e.target.value); setEnvoyee(false) }}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              {pdvs.map(p => (
                <option key={p.id} value={p.id}>{p.nom} — {p.zone}</option>
              ))}
            </select>
          </div>

          {/* Encours crédit affiché AVANT la prise de commande */}
          <div className={cn('rounded-lg border p-2.5 text-xs',
            depassePlafond ? 'border-red-200 bg-red-50' : pdv.creance > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50')}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Encours crédit du client</span>
              <span className="font-black text-slate-900">{formatFcfa(pdv.creance)}</span>
            </div>
            <div className="flex items-center justify-between mt-0.5 text-[11px] text-slate-500">
              <span>Plafond accordé</span>
              <span className="font-bold">{formatFcfa(plafond)}</span>
            </div>
            {depassePlafond && (
              <div className="flex items-start gap-1.5 mt-1.5 text-[11px] text-red-800 font-semibold">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                Cette proforma porterait l&apos;encours à {formatFcfa(encoursApres)} — au-delà du plafond.
                Validation superviseur requise.
              </div>
            )}
          </div>

          {/* Catalogue */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Ajouter un produit</label>
            <select value="" onChange={e => e.target.value && ajouterProduit(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">— Catalogue grossiste —</option>
              {REGISTRE_STOCK.filter(p => !lignes.some(l => l.reference === p.reference)).map(p => (
                <option key={p.reference} value={p.reference}>
                  {p.nom} — {p.prix_unitaire.toLocaleString('fr-FR')} F
                </option>
              ))}
            </select>
          </div>

          {/* Lignes */}
          {lignes.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left p-2">Produit</th>
                    <th className="text-right p-2 w-20">Qté</th>
                    <th className="text-right p-2 w-20">Remise</th>
                    <th className="text-right p-2">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {lignes.map(l => (
                    <tr key={l.reference} className="border-t border-slate-100">
                      <td className="p-2 font-medium text-slate-800">{l.produit}</td>
                      <td className="p-2">
                        <input type="number" min={1} value={l.quantite}
                          onChange={e => majQuantite(l.reference, Math.max(1, Number(e.target.value)))}
                          className="w-full px-1.5 py-1 rounded border border-slate-200 text-right tabular-nums" />
                      </td>
                      <td className="p-2">
                        <input type="number" min={0} max={30} value={l.remise_pct}
                          onChange={e => majRemise(l.reference, Math.max(0, Math.min(30, Number(e.target.value))))}
                          className="w-full px-1.5 py-1 rounded border border-slate-200 text-right tabular-nums" />
                      </td>
                      <td className="p-2 text-right font-bold tabular-nums">{l.total.toLocaleString('fr-FR')}</td>
                      <td className="p-2">
                        <button type="button" onClick={() => setLignes(ls => ls.filter(x => x.reference !== l.reference))}
                          className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-lg">
              <Plus size={14} className="inline mr-1" />
              Ajoutez des produits depuis le catalogue
            </p>
          )}

          {/* Conditions */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Remise globale</label>
              <input type="number" min={0} max={20} value={remiseGlobale}
                onChange={e => setRemiseGlobale(Math.max(0, Math.min(20, Number(e.target.value))))}
                className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-right tabular-nums" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Paiement</label>
              <select value={mode} onChange={e => setMode(e.target.value as ModePaiementFacture)}
                className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm">
                {MODES.map(m => <option key={m} value={m}>{MODE_PAIEMENT_LABEL[m]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Envoi</label>
              <select value={canal} onChange={e => setCanal(e.target.value as CanalEnvoiProforma)}
                className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm">
                {CANAUX.map(c => <option key={c} value={c}>{CANAL_LABEL[c]}</option>)}
              </select>
            </div>
          </div>

          {/* Marge freelance en direct */}
          {estFreelance && (
            <div className={cn('rounded-lg border p-2.5', sousMargeMin ? 'border-red-200 bg-red-50' : 'border-lime-200 bg-lime-50')}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                  Votre majoration de revente
                </label>
                <span className={cn('text-sm font-black', sousMargeMin ? 'text-red-700' : 'text-lime-700')}>
                  {majorationFreelance} %
                </span>
              </div>
              <input type="range" min={0} max={40} value={majorationFreelance}
                onChange={e => setMajorationFreelance(Number(e.target.value))}
                className="w-full accent-lime-600" />
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="text-slate-500">
                  Prix société {formatFcfa(totaux.montant_ttc)} → client {formatFcfa(totaux.montant_ttc + margeFreelance)}
                </span>
                <span className={cn('font-black', sousMargeMin ? 'text-red-700' : 'text-lime-700')}>
                  marge {formatFcfa(margeFreelance)}
                </span>
              </div>
              {sousMargeMin && (
                <div className="flex items-start gap-1.5 mt-1.5 text-[11px] text-red-800 font-semibold">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  Vente sous la marge minimale de {MARGE_MIN_FREELANCE_PCT} % — elle sera signalée au DC.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Score IA */}
        {lignes.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-200 p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-600" />
                <h4 className="text-sm font-bold text-indigo-900">Probabilité de signature</h4>
              </div>
              <span className={cn('text-2xl font-black',
                score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600')}>
                {score}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/70 overflow-hidden">
              <div className={cn('h-full rounded-full',
                score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                style={{ width: `${score}%` }} />
            </div>
            <p className="text-[11px] text-indigo-900 mt-2 leading-relaxed">
              {pdv.creance > 0 && score < 55
                ? `Encours de ${formatFcfa(pdv.creance)} non soldé : le client signera difficilement une nouvelle commande à crédit. Proposez un paiement comptant ou soldez d'abord.`
                : remiseGlobale < 3 && score < 65
                  ? `Une remise de 3 % ferait gagner environ 10 points d'acceptation, pour ${Math.round(totaux.montant_ht * 0.03).toLocaleString('fr-FR')} F de marge cédée.`
                  : `Score porté par la santé du client (${pdv.score_ia}/100) et un panier cohérent avec ses habitudes.`}
            </p>
          </div>
        )}
      </div>

      {/* Aperçu */}
      <div className="space-y-3">
        {lignes.length > 0 ? (
          <>
            <DocumentPreview
              type="PROFORMA"
              numero={numeroPreview}
              client={pdv.nom}
              zone={pdv.zone}
              date_emission="2026-06-11"
              date_limite={dansNJours(VALIDITE_JOURS)}
              lignes={lignes}
              montant_ht={totaux.montant_ht}
              montant_ttc={totaux.montant_ttc}
              remise_globale_pct={remiseGlobale}
              conditions_paiement={mode}
              onEnvoyer={envoyee ? undefined : envoyer}
            />
            {envoyee && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-center gap-1.5">
                <Check size={13} />
                <span>
                  Proforma envoyée à {pdv.nom} par {CANAL_LABEL[canal]}
                  {canal === 'WHATSAPP' && ' — mise en file si le terrain est hors réseau, elle partira à la reconnexion'}.
                  Valable jusqu&apos;au {dansNJours(VALIDITE_JOURS)}.
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="h-full min-h-[300px] rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
            <div className="text-center">
              <AiBadge variant="small" label="Aperçu du document" />
              <p className="text-xs text-slate-400 mt-2">
                L&apos;aperçu imprimable apparaît dès la première ligne ajoutée.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
