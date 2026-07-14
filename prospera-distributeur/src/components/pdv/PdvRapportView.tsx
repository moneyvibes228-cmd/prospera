'use client'

import Link from 'next/link'
import {
  ArrowLeft, Store, Building2, Sparkles, Phone, MapPin, Warehouse,
  TrendingUp, TrendingDown, Package, Wallet, Truck, AlertTriangle,
  BarChart3, FileText, Target,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { buildPdvRapportDG, buildPdvContexteCommercial, PIPELINE_STYLE } from '@/lib/pdv-rapport-builder'
import { useAuth } from '@/contexts/AuthContext'
import { formatFcfa, scoreBg } from '@/lib/utils'

interface Props {
  pdvId: string
}

const ROLES_TERRAIN = new Set(['COMMERCIAL', 'FREELANCE', 'PROSPECTION'])

const ALERTE_STYLE = {
  CRITIQUE: 'bg-red-50 border-red-200 text-red-800',
  HAUTE: 'bg-orange-50 border-orange-200 text-orange-800',
  MODEREE: 'bg-amber-50 border-amber-200 text-amber-800',
}

const STATUT_CMD: Record<string, string> = {
  LIVREE: 'bg-emerald-100 text-emerald-700',
  VALIDEE: 'bg-sky-100 text-sky-700',
  PREPARATION: 'bg-amber-100 text-amber-700',
  BROUILLON: 'bg-slate-100 text-slate-600',
  ANNULEE: 'bg-red-100 text-red-700',
}

export function PdvRapportView({ pdvId }: Props) {
  const { user } = useAuth()
  const rapport = buildPdvRapportDG(pdvId)
  const isTerrain = !!user?.role && ROLES_TERRAIN.has(user.role)
  const ctxCommercial = isTerrain ? buildPdvContexteCommercial(pdvId) : null

  if (!rapport) {
    return <div className="p-6 text-sm text-slate-500">Point de vente introuvable.</div>
  }

  const { pdv, kpis, alertes, contexte_zone } = rapport
  const pipe = PIPELINE_STYLE[pdv.pipeline]
  const isPropre = pdv.type_magasin === 'PROPRE'

  return (
    <div className="p-6 max-w-6xl space-y-5">
      <Link href="/points-de-vente" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-amber-600">
        <ArrowLeft size={14} /> Retour réseau clients
      </Link>

      {/* En-tête rapport */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className={`px-6 py-5 border-b border-slate-100 ${isPropre ? 'bg-gradient-to-r from-violet-50 to-white' : 'bg-gradient-to-r from-amber-50 to-white'}`}>
          <div className="flex flex-wrap items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isPropre ? 'bg-violet-100 text-violet-600' : 'bg-amber-100 text-amber-600'}`}>
              {isPropre ? <Building2 size={26} /> : <Store size={26} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">{pdv.nom}</h1>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isPropre ? 'bg-violet-200 text-violet-800' : 'bg-slate-200 text-slate-700'}`}>
                  {isPropre ? 'MAGASIN ENSEIGNE' : 'PARTENAIRE B2B'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${pipe.className}`}>{pipe.label}</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1"><MapPin size={13} />{pdv.adresse}, {pdv.zone}</span>
                <span className="flex items-center gap-1"><Phone size={13} />{pdv.telephone}</span>
                <span className="flex items-center gap-1"><Warehouse size={13} />{pdv.entrepot_source}</span>
                {pdv.commercial !== '—' && <span>Commercial : <strong className="text-slate-700">{pdv.commercial}</strong></span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className={`inline-flex items-center gap-1.5 text-lg font-black px-4 py-2 rounded-xl ${scoreBg(pdv.score_ia)}`}>
                <Sparkles size={16} /> {pdv.score_ia}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Score santé IA</div>
              <AiBadge variant="small" label={isTerrain ? 'Fiche client' : 'Rapport DG'} confidence={pdv.score_ia} />
            </div>
          </div>
        </div>

        {/* Alertes */}
        {alertes.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-2">
            {alertes.map((a, i) => (
              <div key={i} className={`text-[10px] px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 ${ALERTE_STYLE[a.severite]}`}>
                <AlertTriangle size={11} /> <strong>{a.titre}</strong> — {a.detail}
              </div>
            ))}
          </div>
        )}

        {/* Synthèse IA */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-indigo-600" />
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">{isTerrain ? 'Synthèse IA' : 'Synthèse exécutive IA'}</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{rapport.synthese_ia}</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-px bg-slate-100">
          {[
            { label: 'CA mois', value: formatFcfa(kpis.ca_mois), sub: `${kpis.ca_evolution_pct > 0 ? '+' : ''}${kpis.ca_evolution_pct}%`, color: kpis.ca_evolution_pct >= 0 ? 'text-emerald-600' : 'text-red-600' },
            { label: 'CA moyen 6m', value: formatFcfa(kpis.ca_moyen_6m), sub: 'moyenne glissante' },
            { label: 'Commandes', value: String(kpis.commandes_mois), sub: 'ce mois' },
            { label: 'Panier moyen', value: formatFcfa(kpis.panier_moyen), sub: 'FCFA' },
            { label: 'BL / mois', value: String(kpis.livraisons_mois), sub: 'livraisons' },
            { label: 'Délai livr.', value: `${kpis.delai_livraison_j}j`, sub: `service ${kpis.taux_service_pct}%` },
            { label: 'Créance', value: pdv.creance > 0 ? formatFcfa(pdv.creance) : '—', sub: pdv.creance_jours > 0 ? `${pdv.creance_jours}j retard` : 'OK', color: pdv.creance > 0 ? 'text-red-600' : 'text-emerald-600' },
            { label: 'Rang zone', value: `${contexte_zone.rang_ca_zone}/${contexte_zone.total_points_zone}`, sub: contexte_zone.zone_nom },
            { label: 'Dernière cmd', value: pdv.derniere_commande === '—' ? '—' : pdv.derniere_commande.slice(5), sub: kpis.jours_depuis_commande < 30 ? `${kpis.jours_depuis_commande}j` : 'Inactif' },
          ].map((k, i) => (
            <div key={i} className="bg-white px-4 py-3">
              <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
              <div className="text-sm font-black text-slate-800 mt-0.5">{k.value}</div>
              <div className={`text-[10px] mt-0.5 ${k.color ?? 'text-slate-400'}`}>{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Évolution CA */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <BarChart3 size={16} /> Évolution CA — 6 mois
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={rapport.ca_sparkline_6m} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${Math.round(v / 1_000_000)}M`} />
              <Tooltip formatter={(v) => [formatFcfa(Number(v ?? 0)), 'CA']} />
              <Bar dataKey="ca" fill={isPropre ? '#7c3aed' : '#d97706'} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Contexte — terrain : ma fiche client ; encadrement : contexte zone DG */}
        {isTerrain && ctxCommercial ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Target size={16} /> Ma fiche client
            </h3>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500">Objectif du mois</span>
                <span className="font-bold text-slate-800">{formatFcfa(ctxCommercial.objectif_mois_fcfa)} F</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${ctxCommercial.progression_objectif_pct >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${ctxCommercial.progression_objectif_pct}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{ctxCommercial.progression_objectif_pct}% atteint · CA actuel {formatFcfa(pdv.ca_mois)} F</div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="py-2 border-b border-slate-100">
                <div className="text-slate-500 mb-1">Dernière visite</div>
                {ctxCommercial.derniere_visite ? (
                  <div className="text-slate-700">
                    <span className="font-semibold">{ctxCommercial.derniere_visite.date}</span>
                    {ctxCommercial.derniere_visite.resultat && <span> · {ctxCommercial.derniere_visite.resultat}</span>}
                    <div className="text-[10px] text-slate-400">
                      {ctxCommercial.derniere_visite.commercial}
                      {ctxCommercial.derniere_visite.commentaire && ` — « ${ctxCommercial.derniere_visite.commentaire} »`}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400">Aucune visite enregistrée — à planifier.</div>
                )}
              </div>

              <div className="py-2 border-b border-slate-100">
                <div className="text-slate-500 mb-1">Relances à faire ({ctxCommercial.relances_a_faire.length})</div>
                {ctxCommercial.relances_a_faire.length === 0 ? (
                  <div className="text-emerald-600">Rien à relancer.</div>
                ) : (
                  <ul className="space-y-1">
                    {ctxCommercial.relances_a_faire.slice(0, 4).map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${r.priorite === 'CRITIQUE' ? 'bg-red-500' : 'bg-amber-400'}`} />
                        <span className="text-slate-700">
                          {r.action} <span className="text-slate-400">· {r.canal}{r.date && ` · ${r.date}`}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="py-2">
                <div className="text-slate-500 mb-1">Stock en rupture au PDV</div>
                {ctxCommercial.ruptures.length === 0 ? (
                  <div className="text-emerald-600">Assortiment complet.</div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {ctxCommercial.ruptures.map(r => (
                      <span key={r} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-700">{r}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {pdv.telephone && (
              <a
                href={`tel:${pdv.telephone.replace(/\s/g, '')}`}
                className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                <Phone size={13} /> Appeler {pdv.nom}
              </a>
            )}
          </div>
        ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Target size={16} /> Contexte zone — {contexte_zone.zone_nom}
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Rang CA zone</span>
              <span className="font-bold text-slate-800">{contexte_zone.rang_ca_zone}e / {contexte_zone.total_points_zone}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Magasins enseigne</span>
              <span className="font-bold text-violet-600">{contexte_zone.magasins_enseigne_zone}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Partenaires zone</span>
              <span className="font-bold text-slate-700">{contexte_zone.partenaires_zone}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Saturation partenaires</span>
              <span className={`font-bold ${contexte_zone.saturation_partenaires_pct >= 70 ? 'text-orange-600' : 'text-slate-700'}`}>{contexte_zone.saturation_partenaires_pct}%</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Impayés zone</span>
              <span className="font-bold text-red-600">{formatFcfa(contexte_zone.impayes_zone_fcfa)}</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-[10px] text-slate-600">
            <Truck size={10} className="inline mr-1" />
            {rapport.analyse_logistique}
          </div>
        </div>
        )}
      </div>

      {/* Produits */}
      {rapport.produits.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Package size={16} /> Assortiment & évolution produits
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="pb-2 pr-4">Produit</th>
                  <th className="pb-2 pr-4">Qté mois</th>
                  <th className="pb-2 pr-4">Évolution</th>
                  <th className="pb-2 pr-4">Part volume</th>
                  <th className="pb-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {rapport.produits.map(p => (
                  <tr key={p.reference} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-medium text-slate-800">{p.nom}</td>
                    <td className="py-2.5 pr-4">{p.quantite_mois.toLocaleString('fr-FR')}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex items-center gap-0.5 font-bold ${p.evolution_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {p.evolution_pct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {p.evolution_pct > 0 ? '+' : ''}{p.evolution_pct}%
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">{p.part_ca_pct}%</td>
                    <td className="py-2.5">
                      {p.rupture
                        ? <span className="text-red-600 font-bold">Rupture</span>
                        : <span className="text-emerald-600">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Commandes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Truck size={16} /> Dernières commandes
          </h3>
          {rapport.commandes.length === 0 ? (
            <p className="text-xs text-slate-400">Aucune commande enregistrée.</p>
          ) : (
            <div className="space-y-2">
              {rapport.commandes.map(c => (
                <div key={c.reference} className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                  <div>
                    <div className="font-medium text-slate-800">{c.reference}</div>
                    <div className="text-slate-400">{c.date} · {c.lignes} lignes</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-700">{formatFcfa(c.montant)}</div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${STATUT_CMD[c.statut] ?? 'bg-slate-100'}`}>{c.statut}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Factures */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <FileText size={16} /> Facturation & créances
          </h3>
          <p className="text-[10px] text-slate-500 mb-3">{rapport.analyse_financiere}</p>
          {rapport.factures.length === 0 ? (
            <p className="text-xs text-emerald-600 font-medium">Aucune facture impayée.</p>
          ) : (
            <div className="space-y-2">
              {rapport.factures.map(f => (
                <div key={f.numero} className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                  <div>
                    <div className="font-medium text-slate-800">{f.numero}</div>
                    <div className="text-slate-400">{f.statut}{f.jours_retard > 0 && ` · ${f.jours_retard}j retard`}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">{formatFcfa(f.montant - f.paye)}</div>
                    <div className="text-slate-400">/ {formatFcfa(f.montant)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions prioritaires */}
      <div className="bg-gradient-to-br from-indigo-50 to-amber-50 rounded-xl border border-indigo-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-indigo-900">{isTerrain ? 'Mes prochaines actions' : 'Actions prioritaires DG'}</h3>
        </div>
        <ol className="space-y-2">
          {rapport.actions_prioritaires.map((action, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              {action}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
