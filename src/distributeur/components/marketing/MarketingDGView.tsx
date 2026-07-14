'use client'

import { useMemo, useState } from 'react'
import {
  Sparkles, Target, Users, Wallet, Package,
  AlertTriangle, Zap, BarChart3, CheckCircle2, Clock, Boxes,
} from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { CampagneButEtProduits } from '@distributeur/components/marketing/CampagneButEtProduits'
import { CombosStockPanel } from '@distributeur/components/marketing/CombosStockPanel'
import { PromotionsFournisseursPanel } from '@distributeur/components/marketing/PromotionsFournisseursPanel'
import { buildCatalogueDG } from '@distributeur/lib/catalogue-dg-builder'
import { buildAnalyseEcoulementStock, buildCombosStockIA } from '@distributeur/lib/marketing-combo-stock-builder'
import { formatFcfa } from '@distributeur/lib/utils'
import {
  buildCampagnesDG, buildSyntheseMarketingDG, getLeads, getDecisionsIADG,
  buildAnalyseSituationMarketingDG, buildSuggestionsCampagnesIA,
  buildControleCampagnesActuelles, STATUT_CAMPAGNE_STYLE,
  type SuggestionCampagneIA, type MetriqueCibleCampagne,
} from '@distributeur/lib/marketing-dg-builder'

const POINT_STYLE = {
  CRITIQUE: 'border-red-200 bg-red-50',
  HAUTE: 'border-orange-200 bg-orange-50',
  MODEREE: 'border-sky-200 bg-sky-50',
  POSITIVE: 'border-emerald-200 bg-emerald-50',
}

const METRIQUE_STYLE: Record<MetriqueCibleCampagne['statut'], string> = {
  OK: 'text-emerald-600',
  ATTENTION: 'text-orange-600',
  CRITIQUE: 'text-red-600',
  CIBLE: 'text-slate-500',
}

const CANAL_ICON: Record<string, string> = {
  WHATSAPP: '💬', SMS: '📱', TERRAIN: '🚶', MIXTE: '🔀', CHATBOT: '🤖',
}

function SuggestionCard({ s, expanded, onToggle }: {
  s: SuggestionCampagneIA
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className={`rounded-xl border-2 overflow-hidden ${s.priorite === 1 ? 'border-amber-300' : 'border-slate-200'} bg-white`}>
      <button type="button" onClick={onToggle} className="w-full text-left p-4 hover:bg-slate-50/50 transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] flex items-center justify-center shrink-0">
              {s.priorite}
            </span>
            <div>
              <div className="font-bold text-sm text-slate-900">{s.nom}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.zone} · {CANAL_ICON[s.canal]} {s.canal} · {s.date_lancement_suggeree}</div>
            </div>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
            {s.statut_validation === 'A_VALIDER' ? 'À valider DG' : s.statut_validation}
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-2 line-clamp-2">{s.objectif}</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-[10px]">
          <div><div className="text-slate-400">Contacts</div><div className="font-bold">{s.contacts.cibles}</div></div>
          <div><div className="text-slate-400">Budget</div><div className="font-bold">{formatFcfa(s.budget.cout_estime_fcfa)}</div></div>
          <div><div className="text-slate-400">ROI attendu</div><div className="font-bold text-emerald-600">{s.budget.roi_attendu_pct}%</div></div>
          <div><div className="text-slate-400">CA potentiel</div><div className="font-bold">{formatFcfa(s.ca_potentiel_fcfa)}</div></div>
          <div><div className="text-slate-400">Marge pot.</div><div className="font-bold">{formatFcfa(s.marge_potentielle_fcfa)}</div></div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/40 space-y-4">
          <div className="pt-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Explication IA</div>
            <p className="text-xs text-slate-700 leading-relaxed">{s.explication}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                <Users size={11} /> Contacts ({s.contacts.cibles})
              </div>
              <div className="text-xs text-slate-600">{s.contacts.source}</div>
              <div className="text-[10px] text-slate-500 mt-1">{s.contacts.detail}</div>
              <div className="text-[10px] mt-2">Segment : <strong>{s.segment}</strong></div>
              <div className="text-[10px]">Coût/contact : <strong>{formatFcfa(s.budget.cout_par_contact_fcfa)}</strong></div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                <Wallet size={11} /> Budget & prix
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between"><span className="text-slate-400">Coût estimé</span><span className="font-bold">{formatFcfa(s.budget.cout_estime_fcfa)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Plafond</span><span className="font-bold">{formatFcfa(s.budget.budget_max_fcfa)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Durée</span><span className="font-bold">{s.duree_jours} jours</span></div>
              </div>
              {s.risque && (
                <p className="text-[10px] text-orange-700 mt-2 flex items-center gap-1">
                  <AlertTriangle size={10} /> {s.risque}
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
              <Package size={11} /> Produits ciblés
            </div>
            <div className="flex flex-wrap gap-2">
              {s.produits.map(p => (
                <div key={p.nom} className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-[10px]">
                  <div className="font-semibold">{p.nom}</div>
                  {p.prix_unitaire_fcfa > 0 && (
                    <div className="text-slate-500">{formatFcfa(p.prix_unitaire_fcfa)}/u. · marge {p.marge_pct}%</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
              <BarChart3 size={11} /> Métriques cibles
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {s.metriques_cibles.map(m => (
                <div key={m.label} className="p-2 bg-white rounded-lg border border-slate-100 text-[10px]">
                  <div className="text-slate-400">{m.label}</div>
                  <div className={`font-bold ${METRIQUE_STYLE[m.statut]}`}>{m.objectif}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function MarketingDGView() {
  const [expandedSugId, setExpandedSugId] = useState<string | null>('sug-camp-1')
  const [expandedComboId, setExpandedComboId] = useState<string | null>(null)

  const campagnes = useMemo(() => buildCampagnesDG(), [])
  const catalogue = useMemo(() => buildCatalogueDG(), [])
  const analyseEcoulement = useMemo(() => buildAnalyseEcoulementStock(catalogue), [catalogue])
  const combosStock = useMemo(() => buildCombosStockIA(), [])
  const leads = useMemo(() => getLeads(), [])
  const synthese = useMemo(() => buildSyntheseMarketingDG(campagnes, leads), [campagnes, leads])
  const situation = useMemo(() => buildAnalyseSituationMarketingDG(campagnes, synthese), [campagnes, synthese])
  const suggestions = useMemo(() => buildSuggestionsCampagnesIA(campagnes), [campagnes])
  const controle = useMemo(() => buildControleCampagnesActuelles(campagnes), [campagnes])
  const decisions = useMemo(() => getDecisionsIADG(), [])

  return (
    <div className="p-6 max-w-[90rem] space-y-5">
      <PageHeader
        title="Pilotage marketing — vue Directeur Général"
        subtitle="Analyse IA · suggestions de campagnes · contrôle des actions en cours"
        badge={`${synthese.campagnes_actives} campagnes actives`}
      />

      {/* KPIs exécutifs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'CA campagnes mois', value: formatFcfa(synthese.ca_genere_total), color: 'text-emerald-700' },
          { label: 'Marge générée', value: formatFcfa(synthese.marge_generee_total), color: 'text-emerald-600' },
          { label: 'ROI moyen', value: `${synthese.roi_moyen_pct}%`, color: 'text-amber-700' },
          { label: 'Budget consommé', value: formatFcfa(synthese.budget_consomme), color: 'text-slate-700' },
          { label: 'Marge / CA', value: `${situation.marge_actuelle_pct}%`, color: situation.marge_actuelle_pct >= situation.marge_objectif_pct ? 'text-emerald-600' : 'text-orange-600' },
          { label: 'Leads chauds', value: String(synthese.leads_chauds), color: 'text-indigo-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={`text-sm font-black mt-0.5 ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Analyse situation IA */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-indigo-900">Analyse IA — situation marketing</h3>
          <AiBadge variant="small" label="Synthèse DG" confidence={89} />
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{situation.synthese}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
          {situation.points.map((p, i) => (
            <div key={i} className={`p-3 rounded-lg border text-xs ${POINT_STYLE[p.severite]}`}>
              <div className="font-bold">{p.titre}</div>
              <div className="text-[10px] opacity-90 mt-1">{p.detail}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-[10px] text-slate-600">
          <span>Objectif trimestre : <strong>{formatFcfa(situation.ca_objectif_trimestre)}</strong></span>
          <span>Écart mensuel : <strong className={situation.ecart_objectif_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}>{situation.ecart_objectif_pct > 0 ? '+' : ''}{situation.ecart_objectif_pct}%</strong></span>
          <span>Marge cible : <strong>{situation.marge_objectif_pct}%</strong></span>
        </div>
      </div>

      {/* Contrôle campagnes en cours */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Contrôle — campagnes en cours</h3>
          <span className="text-[10px] text-slate-400">{controle.length} campagnes sous pilotage</span>
        </div>
        <div className="space-y-3">
          {controle.map(({ campagne: c, progression_pct, budget_consomme_pct, metriques, alerte }) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-bold text-sm">{c.nom}</div>
                  <div className="text-[10px] text-slate-500">{c.zone} · {CANAL_ICON[c.canal]} {c.canal} · {c.commercial_assigne ?? '—'}</div>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${STATUT_CAMPAGNE_STYLE[c.statut]}`}>
                  {c.statut.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-[10px]">
                <div>
                  <div className="text-slate-400 mb-1">Progression objectif</div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progression_pct}%` }} />
                  </div>
                  <div className="font-bold mt-0.5">{progression_pct}%</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">Budget consommé</div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${budget_consomme_pct > 85 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${budget_consomme_pct}%` }} />
                  </div>
                  <div className="font-bold mt-0.5">{formatFcfa(c.cout_campagne)} / {formatFcfa(c.budget_max)}</div>
                </div>
                <div>
                  <div className="text-slate-400">Contacts</div>
                  <div className="font-bold">{c.contactes}/{c.cibles} · {c.convertis} conv.</div>
                </div>
                <div>
                  <div className="text-slate-400">CA · ROI</div>
                  <div className="font-bold text-emerald-700">{c.ca_genere > 0 ? formatFcfa(c.ca_genere) : '—'} · {c.roi_pct > 0 ? `${c.roi_pct}%` : '—'}</div>
                </div>
              </div>

              <CampagneButEtProduits campagne={c} compact />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                {metriques.map(m => (
                  <div key={m.label} className="p-2 bg-slate-50 rounded-lg text-[10px]">
                    <div className="text-slate-400">{m.label}</div>
                    <div className="font-bold">{m.actuel ?? '—'} <span className="text-slate-400 font-normal">/ {m.objectif}</span></div>
                    <div className={`text-[9px] font-bold uppercase ${METRIQUE_STYLE[m.statut]}`}>{m.statut}</div>
                  </div>
                ))}
              </div>

              {alerte && (
                <p className="text-[10px] text-orange-700 mt-2 flex items-center gap-1">
                  <AlertTriangle size={10} /> {alerte}
                </p>
              )}
              <p className="text-[10px] text-indigo-700 mt-2 flex items-center gap-1">
                <Sparkles size={10} /> {c.recommandation_ia}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Combos écoulement stock IA */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Boxes size={15} className="text-violet-600" />
          <h3 className="text-sm font-bold text-slate-900">Combos écoulement stock IA</h3>
          <span className="text-[10px] text-slate-400">
            Croise stocks lents × produits moteurs — promos conditionnelles, pas de choc isolé
          </span>
        </div>
        <CombosStockPanel
          mode="dg"
          analyse={analyseEcoulement}
          combos={combosStock}
          expandedId={expandedComboId}
          onToggle={id => setExpandedComboId(prev => prev === id ? null : id)}
        />
      </div>

      {/* Promotions fournisseurs — écoulement du surstock via remise amont */}
      <PromotionsFournisseursPanel />

      {/* Suggestions campagnes IA */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target size={15} className="text-pink-600" />
          <h3 className="text-sm font-bold text-slate-900">Suggestions de campagnes IA</h3>
          <span className="text-[10px] text-slate-400">Cliquez pour voir contacts, produits, budget et métriques</span>
        </div>
        <div className="space-y-3">
          {suggestions.map(s => (
            <SuggestionCard
              key={s.id}
              s={s}
              expanded={expandedSugId === s.id}
              onToggle={() => setExpandedSugId(prev => prev === s.id ? null : s.id)}
            />
          ))}
        </div>
      </div>

      {/* Décisions IA */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-amber-600" />
          <h3 className="text-sm font-bold text-amber-900">5 décisions prioritaires pour le DG</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
          {decisions.map(d => (
            <div key={d.priorite} className="bg-white rounded-lg border border-amber-100 p-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 font-black text-[10px] flex items-center justify-center">{d.priorite}</span>
                <span className="font-bold text-slate-900">{d.titre}</span>
              </div>
              <div className="text-[10px] text-emerald-700 mt-1">Impact : {d.impact}</div>
              <div className="text-[10px] text-slate-500">Risque : {d.risque}</div>
              <div className="text-[10px] font-semibold text-amber-800 mt-1 flex items-center gap-1">
                <Clock size={10} /> → {d.decision}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
