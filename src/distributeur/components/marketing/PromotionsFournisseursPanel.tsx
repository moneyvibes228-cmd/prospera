'use client'
import { useMemo } from 'react'
import { Megaphone, Sparkles, Check, PackageOpen, ArrowRight } from 'lucide-react'
import { formatFcfa } from '@distributeur/lib/utils'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { WorkflowToast } from '@distributeur/components/shared/WorkflowToast'
import { REGISTRE_FOURNISSEURS } from '@distributeur/lib/registries/fournisseurs-registry'
import { getProduitsDuFournisseur } from '@distributeur/lib/registries/produits-fournisseurs-registry'
import { REGISTRE_STOCK } from '@distributeur/lib/registries/stock-registry'
import { useMarketingWorkflow } from '@distributeur/contexts/MarketingWorkflowContext'
import { useComboStockWorkflow } from '@distributeur/contexts/ComboStockWorkflowContext'
import { promoFournisseurToCampagne } from '@distributeur/lib/combo-stock-workflow'

interface PromoFournisseur {
  fournisseur_id: string
  fournisseur_nom: string
  remise_pct: number
  franco: number
  produits: { reference: string; nom: string; stock: number; couverture_jours: number; prix: number }[]
  volume_a_ecouler: number
  economie_achat: number
  argumentaire: string
}

/**
 * Une remise volume fournisseur ne vaut que si l'on sait écouler le volume qu'elle exige.
 * On croise donc l'offre du fournisseur avec le surstock réel : ce sont ces produits-là
 * qu'il faut pousser en campagne.
 */
function buildPromotionsFournisseurs(): PromoFournisseur[] {
  return REGISTRE_FOURNISSEURS
    .filter(f => f.statut !== 'SUSPENDU' && f.remise_volume_pct >= 3)
    .map(f => {
      const produits = getProduitsDuFournisseur(f.id)
        .map(pf => {
          const p = REGISTRE_STOCK.find(s => s.reference === pf.produit_ref)
          if (!p) return null
          const vitesse = (p.ventes_30j ?? p.seuil * 3) / 30
          const couverture = vitesse > 0 ? Math.round((p.stock / vitesse) * 10) / 10 : 999
          return {
            reference: p.reference, nom: p.nom, stock: p.stock,
            couverture_jours: couverture, prix: p.prix_unitaire,
          }
        })
        .filter((p): p is NonNullable<typeof p> => p != null)
        // Surstock = couverture supérieure à 45 jours : c'est du capital immobilisé.
        .filter(p => p.couverture_jours > 45)
        .sort((a, b) => b.couverture_jours - a.couverture_jours)

      if (produits.length === 0) return null

      const volume = produits.reduce((s, p) => s + p.stock * p.prix, 0)

      return {
        fournisseur_id: f.id,
        fournisseur_nom: f.nom,
        remise_pct: f.remise_volume_pct,
        franco: f.franco_de_port,
        produits: produits.slice(0, 3),
        volume_a_ecouler: volume,
        economie_achat: Math.round(f.franco_de_port * (f.remise_volume_pct / 100)),
        argumentaire: `${f.nom} accorde ${f.remise_volume_pct} % au-delà de ${(f.franco_de_port / 1_000_000).toFixed(1)} M de commande. `
          + `${produits.length} référence${produits.length > 1 ? 's' : ''} dorment en entrepôt avec plus de 45 j de couverture — `
          + `une campagne d'écoulement libère le stock et déclenche la remise sur le réassort.`,
      }
    })
    .filter((p): p is PromoFournisseur => p != null)
    .sort((a, b) => b.volume_a_ecouler - a.volume_a_ecouler)
}

export function PromotionsFournisseursPanel() {
  const promos = useMemo(() => buildPromotionsFournisseurs(), [])
  const { isDone, getEntry, executer, annuler, lastAction, clearLastAction } = useMarketingWorkflow()
  const { ajouterCampagne, retirerCampagne, getCampagneBySource } = useComboStockWorkflow()

  if (promos.length === 0) return null

  const monterCampagne = (p: PromoFournisseur) => {
    const campagne = ajouterCampagne(promoFournisseurToCampagne(p))
    executer('CAMPAGNE_ECOULEMENT', p.fournisseur_id, {
      label: `Campagne d'écoulement — ${p.fournisseur_nom}`,
      detail: `${formatFcfa(p.volume_a_ecouler)} de stock, remise ${p.remise_pct} %`,
      message: `Campagne « ${campagne.nom} » créée — visible dans l'onglet Campagnes.`,
      payload: { campagneId: campagne.id, sourceId: campagne.source_combo_id },
    })
  }

  const annulerCampagne = (p: PromoFournisseur) => {
    const e = getEntry('CAMPAGNE_ECOULEMENT', p.fournisseur_id)
    retirerCampagne(`promo-fourn-${p.fournisseur_id}`)
    if (e) annuler(e.id)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
        <PackageOpen size={15} className="text-pink-600" />
        <h3 className="text-sm font-bold text-slate-900">Promotions fournisseurs — opportunités d&apos;écoulement</h3>
        <AiBadge variant="small" label="Croisement stock × remise" />
        <span className="text-[10px] text-slate-400 ml-auto">{promos.length} opportunités</span>
      </div>

      <div className="divide-y divide-slate-100">
        {promos.map(p => {
          const montee = isDone('CAMPAGNE_ECOULEMENT', p.fournisseur_id)
          const campagne = getCampagneBySource(`promo-fourn-${p.fournisseur_id}`)
          return (
            <div key={p.fournisseur_id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{p.fournisseur_nom}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                      −{p.remise_pct} % au-delà de {formatFcfa(p.franco)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {p.produits.length} référence{p.produits.length > 1 ? 's' : ''} en surstock
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-slate-900">{formatFcfa(p.volume_a_ecouler)}</div>
                  <div className="text-[10px] text-slate-400">de stock immobilisé</div>
                  <div className="text-[10px] text-emerald-600 font-bold">
                    +{formatFcfa(p.economie_achat)} de remise à la clé
                  </div>
                </div>
              </div>

              <div className="space-y-1 mb-2">
                {p.produits.map(pr => (
                  <div key={pr.reference} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2.5 py-1.5">
                    <span className="font-medium text-slate-700 truncate">{pr.nom}</span>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {pr.stock.toLocaleString('fr-FR')} u.
                      </span>
                      <span className="text-[11px] font-bold text-orange-600 tabular-nums">
                        {pr.couverture_jours} j de couverture
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-pink-900 bg-pink-50 border border-pink-100 rounded-lg p-2 leading-relaxed">
                <Sparkles size={10} className="inline mr-1 text-pink-600" />
                {p.argumentaire}
              </p>

              <div className="mt-2.5">
                {montee ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg w-fit">
                      <Check size={12} /> Campagne créée — statut PLANIFIÉE
                      <button
                        type="button"
                        onClick={() => annulerCampagne(p)}
                        className="ml-1 font-bold text-emerald-800 hover:text-emerald-950 underline"
                      >
                        Annuler
                      </button>
                    </span>
                    {campagne && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <ArrowRight size={10} className="text-pink-600" />
                        « {campagne.nom} » — retrouvez-la dans l&apos;onglet <strong>Campagnes</strong> (funnel, budget, ROI).
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => monterCampagne(p)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition-colors">
                    <Megaphone size={11} /> Monter une campagne d&apos;écoulement
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
