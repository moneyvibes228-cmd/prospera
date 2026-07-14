'use client'

import { useState, useMemo } from 'react'
import {
  Megaphone, Target, Sparkles, MapPin,
  TrendingUp, Filter, AlertTriangle, Bot, Boxes,
} from 'lucide-react'
import { CampagneButEtProduits } from '@/components/marketing/CampagneButEtProduits'
import { CombosStockPanel } from '@/components/marketing/CombosStockPanel'
import { PromotionsFournisseursPanel } from '@/components/marketing/PromotionsFournisseursPanel'
import { useComboStockWorkflow } from '@/contexts/ComboStockWorkflowContext'
import { buildCombosStockIA } from '@/lib/marketing-combo-stock-builder'
import { PageHeader } from '@/components/shared/PageHeader'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'
import {
  buildCampagnesDG, buildSyntheseMarketingDG, buildPipelineLeads,
  buildAnalysesMarketingIA, getSegmentsIA, getZonesBlanches, getLeads,
  STATUT_CAMPAGNE_STYLE, STATUT_LEAD_LABEL,
  type CampagneDG, type VueMarketingDG,
} from '@/lib/marketing-dg-builder'
import type { LeadProspection } from '@/lib/registries/marketing-registry'

const VUE_TABS: { id: VueMarketingDG; label: string }[] = [
  { id: 'campagnes', label: 'Campagnes' },
  { id: 'leads', label: 'Pipeline leads' },
  { id: 'segments', label: 'Segmentation IA' },
  { id: 'zones', label: 'Zones blanches' },
]

const ANALYSE_STYLE = {
  CRITIQUE: 'border-red-200 bg-red-50',
  HAUTE: 'border-orange-200 bg-orange-50',
  MODEREE: 'border-sky-200 bg-sky-50',
}

const CANAL_ICON: Record<string, string> = {
  WHATSAPP: '💬', SMS: '📱', TERRAIN: '🚶', MIXTE: '🔀', CHATBOT: '🤖',
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-16 text-slate-500 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-bold">{value}</span>
    </div>
  )
}

function CampagneCard({ c, selected, onClick }: { c: CampagneDG; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${selected ? 'border-amber-400 bg-amber-50/50 shadow-md' : c.alerte ? 'border-orange-200' : 'border-slate-200 bg-white'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-bold text-sm text-slate-900">{c.nom}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{c.zone} · {CANAL_ICON[c.canal]} {c.canal}</div>
        </div>
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${STATUT_CAMPAGNE_STYLE[c.statut]}`}>
          {c.statut.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-[10px]">
        <div><div className="text-slate-400">CA généré</div><div className="font-bold text-emerald-700">{c.ca_genere > 0 ? formatFcfa(c.ca_genere) : '—'}</div></div>
        <div><div className="text-slate-400">Conversion</div><div className="font-bold">{c.taux_conversion_pct}%</div></div>
        <div><div className="text-slate-400">ROI</div><div className={`font-bold ${c.roi_pct > 300 ? 'text-emerald-600' : 'text-slate-700'}`}>{c.roi_pct > 0 ? `${c.roi_pct}%` : '—'}</div></div>
      </div>

      {c.contactes > 0 && (
        <div className="mt-3 space-y-1">
          <FunnelBar label="Cibles" value={c.cibles} max={c.cibles} color="bg-slate-300" />
          <FunnelBar label="Contactés" value={c.contactes} max={c.cibles} color="bg-sky-400" />
          <FunnelBar label="Convertis" value={c.convertis} max={c.cibles} color="bg-emerald-500" />
        </div>
      )}

      {c.alerte && (
        <p className="text-[9px] text-orange-700 mt-2 flex items-center gap-1">
          <AlertTriangle size={10} /> {c.alerte}
        </p>
      )}
    </button>
  )
}

function LeadCard({ l, selected, onClick }: { l: LeadProspection; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm ${selected ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}>
      <div className="font-bold text-xs">{l.nom}</div>
      <div className="text-[10px] text-slate-500">{l.type_client} · {l.zone}</div>
      <div className="text-[10px] font-bold text-emerald-700 mt-1">{formatFcfa(l.ca_potentiel_mois)}/mois</div>
      <div className="text-[9px] text-indigo-600 mt-1">IA {l.score_ia}/100</div>
    </button>
  )
}

export function MarketingOperateurView() {
  const [vue, setVue] = useState<VueMarketingDG>('campagnes')
  const [filtreStatut, setFiltreStatut] = useState<string>('tous')
  const [selectedCampagneId, setSelectedCampagneId] = useState<string | null>(null)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [expandedComboId, setExpandedComboId] = useState<string | null>(null)

  const { campagnesFromCombos, combosEligiblesMarketing } = useComboStockWorkflow()
  const combosStock = useMemo(() => buildCombosStockIA(), [])
  const combosFile = useMemo(
    () => combosEligiblesMarketing(combosStock),
    [combosStock, combosEligiblesMarketing],
  )

  const campagnes = useMemo(
    () => buildCampagnesDG(campagnesFromCombos),
    [campagnesFromCombos],
  )
  const leads = useMemo(() => getLeads(), [])
  const synthese = useMemo(() => buildSyntheseMarketingDG(campagnes, leads), [campagnes, leads])
  const analyses = useMemo(() => buildAnalysesMarketingIA(campagnes), [campagnes])
  const pipelineLeads = useMemo(() => buildPipelineLeads(leads), [leads])
  const segments = useMemo(() => getSegmentsIA(), [])
  const zones = useMemo(() => getZonesBlanches(), [])

  const campagnesFiltrees = useMemo(() => {
    if (filtreStatut === 'tous') return campagnes
    return campagnes.filter(c => c.statut === filtreStatut)
  }, [campagnes, filtreStatut])

  const selectedCampagne = campagnes.find(c => c.id === selectedCampagneId) ?? null
  const selectedLead = leads.find(l => l.id === selectedLeadId) ?? null

  const handleCampagneFromCombo = (campagneId: string) => {
    setVue('campagnes')
    setFiltreStatut('PLANIFIEE')
    setSelectedCampagneId(campagneId)
    setSelectedLeadId(null)
  }

  return (
    <div className="p-6 max-w-[90rem] space-y-5">
      <PageHeader
        title="Marketing & prospection — opérations"
        subtitle="Directeur Marketing & Commercial — campagnes · pipeline leads · segmentation IA · zones blanches"
        badge={`${synthese.campagnes_actives} campagnes actives`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'CA généré campagnes', value: formatFcfa(synthese.ca_genere_total), color: 'text-emerald-700' },
          { label: 'Marge générée', value: formatFcfa(synthese.marge_generee_total), color: 'text-emerald-600' },
          { label: 'ROI moyen', value: `${synthese.roi_moyen_pct}%`, color: 'text-amber-700' },
          { label: 'Budget consommé', value: formatFcfa(synthese.budget_consomme), color: 'text-slate-700' },
          { label: 'Leads actifs', value: String(synthese.leads_actifs), color: 'text-indigo-600' },
          { label: 'Leads chauds', value: String(synthese.leads_chauds), color: 'text-orange-600' },
          { label: 'Conv. WhatsApp', value: `${synthese.taux_conversion_wa_pct}%`, color: 'text-sky-600' },
          { label: 'Coût acquisition', value: formatFcfa(synthese.cout_acquisition_moyen), color: 'text-slate-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={`text-sm font-black mt-0.5 ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Combos à lancer — file marketing */}
      <div className="bg-gradient-to-br from-violet-50/80 to-emerald-50/80 rounded-xl border border-violet-200 p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Boxes size={15} className="text-violet-600" />
          <h3 className="text-sm font-bold text-slate-900">Combos écoulement stock — à lancer</h3>
          <span className="text-[10px] text-slate-500">
            {combosFile.length} prêt(s) · combos auto ou validés DG
          </span>
        </div>
        <CombosStockPanel
          mode="operateur"
          combos={combosStock}
          expandedId={expandedComboId}
          onToggle={id => setExpandedComboId(prev => prev === id ? null : id)}
          onCampagneCreated={handleCampagneFromCombo}
        />
      </div>

      {/* Promotions fournisseurs — écoulement du surstock via remise amont */}
      <PromotionsFournisseursPanel />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {VUE_TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setVue(t.id)}
            className={`text-[11px] px-4 py-2 rounded-lg font-semibold ${vue === t.id ? 'bg-pink-100 text-pink-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 space-y-4">
          {/* Campagnes */}
          {vue === 'campagnes' && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Filter size={11} className="text-slate-400" />
                {(['tous', 'EN_COURS', 'PLANIFIEE', 'PAUSE', 'TERMINEE'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setFiltreStatut(s)}
                    className={`text-[9px] px-2 py-1 rounded-full font-bold ${filtreStatut === s ? 'bg-pink-100 text-pink-700' : 'bg-slate-50 text-slate-400'}`}>
                    {s === 'tous' ? 'Toutes' : s.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {campagnesFiltrees.map(c => (
                  <CampagneCard
                    key={c.id}
                    c={c}
                    selected={selectedCampagneId === c.id}
                    onClick={() => { setSelectedCampagneId(prev => prev === c.id ? null : c.id); setSelectedLeadId(null) }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Pipeline leads */}
          {vue === 'leads' && (
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max">
                {pipelineLeads.map(col => (
                  <div key={col.statut} className={`w-48 shrink-0 rounded-xl border-2 ${col.couleur} p-2`}>
                    <div className="flex justify-between items-center mb-2 px-1">
                      <span className="text-[10px] font-bold uppercase">{col.label}</span>
                      <span className="text-[10px] font-black bg-white/80 px-1.5 rounded-full">{col.leads.length}</span>
                    </div>
                    {col.potentiel_total > 0 && (
                      <div className="text-[9px] text-slate-500 px-1 mb-2">{formatFcfa(col.potentiel_total)} pot.</div>
                    )}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {col.leads.map(l => (
                        <LeadCard
                          key={l.id}
                          l={l}
                          selected={selectedLeadId === l.id}
                          onClick={() => { setSelectedLeadId(prev => prev === l.id ? null : l.id); setSelectedCampagneId(null) }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Segmentation */}
          {vue === 'segments' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {segments.map(s => (
                <div key={s.id} className={`p-4 rounded-xl border-2 bg-white ${s.priorite === 'CRITIQUE' ? 'border-red-200' : s.priorite === 'HAUTE' ? 'border-amber-200' : 'border-slate-200'}`}>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm">{s.nom}</h4>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${s.priorite === 'CRITIQUE' ? 'bg-red-100 text-red-700' : s.priorite === 'HAUTE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {s.priorite}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{s.description}</p>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-[10px]">
                    <div><div className="text-slate-400">Clients</div><div className="font-bold">{s.nb_clients || '—'}</div></div>
                    <div><div className="text-slate-400">CA moyen</div><div className="font-bold">{s.ca_moyen_mois > 0 ? formatFcfa(s.ca_moyen_mois) : '—'}</div></div>
                    <div><div className="text-slate-400">Potentiel</div><div className="font-bold text-emerald-700">{formatFcfa(s.potentiel_ca)}</div></div>
                  </div>
                  <div className="text-[10px] mt-2 flex items-center gap-1 text-indigo-700 font-semibold">
                    <Bot size={10} /> {s.action_ia}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">Canal : {s.canal_recommande}</div>
                </div>
              ))}
            </div>
          )}

          {/* Zones blanches */}
          {vue === 'zones' && (
            <div className="space-y-3">
              {zones.map(z => (
                <div key={z.zone} className={`p-4 rounded-xl border flex flex-wrap gap-4 items-center ${z.priorite_ia >= 80 ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <MapPin size={16} className={z.priorite_ia >= 80 ? 'text-emerald-600' : 'text-slate-400'} />
                    <div>
                      <div className="font-bold text-sm">{z.zone}</div>
                      <div className="text-[10px] text-slate-500">{z.population_estimee}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 flex-1 text-[10px]">
                    <div><div className="text-slate-400">Partenaires</div><div className="font-bold">{z.partenaires_actuels}</div></div>
                    <div><div className="text-slate-400">Saturation</div><div className="font-bold">{z.saturation_pct}%</div></div>
                    <div><div className="text-slate-400">Potentiel/mois</div><div className="font-bold text-emerald-700">{formatFcfa(z.potentiel_ca_mois)}</div></div>
                    <div><div className="text-slate-400">Priorité IA</div><div className={`font-bold ${z.priorite_ia >= 80 ? 'text-emerald-600' : 'text-slate-600'}`}>{z.priorite_ia}/100</div></div>
                  </div>
                  <div className="text-xs text-indigo-800 font-medium w-full md:w-auto">→ {z.action_recommandee}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analyses IA */}
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-200 p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-indigo-900">Analyses IA marketing</h3>
            </div>
            <div className="space-y-2">
              {analyses.map((a, i) => (
                <div key={i} className={`p-2.5 rounded-lg border text-xs ${ANALYSE_STYLE[a.severite]}`}>
                  <div className="font-bold">{a.titre}</div>
                  <div className="text-[10px] opacity-90 mt-0.5">{a.detail}</div>
                  <div className="text-[10px] font-semibold mt-1 text-slate-700">→ {a.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fiche campagne */}
      {selectedCampagne && (
        <div className="bg-white rounded-xl border-2 border-amber-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-14 h-14 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
              <Megaphone size={22} className="text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black">{selectedCampagne.nom}</h3>
              <p className="text-sm text-slate-700 mt-2">{selectedCampagne.synthese_ia}</p>
              <p className="text-xs font-semibold text-indigo-700 mt-2 flex items-center gap-1">
                <Sparkles size={11} /> {selectedCampagne.recommandation_ia}
              </p>
            </div>
            <AiBadge variant="small" label="ROI IA" confidence={Math.min(99, selectedCampagne.roi_pct / 10)} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
            {[
              { label: 'CA généré', value: formatFcfa(selectedCampagne.ca_genere) },
              { label: 'Marge', value: formatFcfa(selectedCampagne.marge_generee) },
              { label: 'Coût', value: formatFcfa(selectedCampagne.cout_campagne) },
              { label: 'ROI', value: `${selectedCampagne.roi_pct}%` },
              { label: 'Conversion', value: `${selectedCampagne.taux_conversion_pct}%` },
              { label: 'Coût/conv.', value: selectedCampagne.cout_par_conversion > 0 ? formatFcfa(selectedCampagne.cout_par_conversion) : '—' },
              { label: 'Budget restant', value: formatFcfa(selectedCampagne.budget_max - selectedCampagne.cout_campagne) },
            ].map((k, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-2.5">
                <div className="text-slate-400">{k.label}</div>
                <div className="font-bold">{k.value}</div>
              </div>
            ))}
          </div>

          <CampagneButEtProduits campagne={selectedCampagne} />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-xl">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Funnel conversion</div>
              <div className="space-y-2">
                <FunnelBar label="Cibles" value={selectedCampagne.cibles} max={selectedCampagne.cibles} color="bg-slate-400" />
                <FunnelBar label="Contactés" value={selectedCampagne.contactes} max={selectedCampagne.cibles} color="bg-sky-400" />
                <FunnelBar label="Ouverts" value={selectedCampagne.ouverts} max={selectedCampagne.cibles} color="bg-blue-400" />
                <FunnelBar label="Réponses" value={selectedCampagne.repondus} max={selectedCampagne.cibles} color="bg-amber-400" />
                <FunnelBar label="Convertis" value={selectedCampagne.convertis} max={selectedCampagne.cibles} color="bg-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
                <div>Ouverture {selectedCampagne.taux_ouverture_pct}%</div>
                <div>Réponse {selectedCampagne.taux_reponse_pct}%</div>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div><strong>Zone :</strong> {selectedCampagne.zone}</div>
              <div><strong>Segment :</strong> {selectedCampagne.segment}</div>
              <div><strong>Canal :</strong> {selectedCampagne.canal}</div>
              <div><strong>Période :</strong> {selectedCampagne.date_debut}{selectedCampagne.date_fin ? ` → ${selectedCampagne.date_fin}` : ''}</div>
              {selectedCampagne.commercial_assigne && <div><strong>Commercial :</strong> {selectedCampagne.commercial_assigne}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Fiche lead */}
      {selectedLead && (
        <div className="bg-white rounded-xl border-2 border-indigo-200 p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap gap-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Target size={22} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black">{selectedLead.nom}</h3>
              <p className="text-sm text-slate-500">{selectedLead.type_client} · {selectedLead.zone} · {selectedLead.commercial !== '—' ? selectedLead.commercial : 'non assigné'}</p>
              <p className="text-sm text-slate-700 mt-2">{selectedLead.synthese_ia}</p>
            </div>
            <AiBadge variant="small" label="Score lead" confidence={selectedLead.score_ia} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            {[
              { label: 'Statut', value: STATUT_LEAD_LABEL[selectedLead.statut] },
              { label: 'CA potentiel/mois', value: formatFcfa(selectedLead.ca_potentiel_mois) },
              { label: 'Source', value: selectedLead.source },
              { label: 'Dernier contact', value: selectedLead.dernier_contact },
              { label: 'Téléphone', value: selectedLead.telephone },
            ].map((k, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-2.5">
                <div className="text-slate-400">{k.label}</div>
                <div className="font-bold">{k.value}</div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm flex items-center gap-2">
            <TrendingUp size={14} className="text-amber-600 shrink-0" />
            <span><strong>Prochaine action :</strong> {selectedLead.prochaine_action}</span>
          </div>
        </div>
      )}
    </div>
  )
}
