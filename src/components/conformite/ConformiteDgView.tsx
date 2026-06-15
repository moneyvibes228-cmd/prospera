'use client'

import { useMemo, useState } from 'react'
import { Scale, Calculator, BookOpen, Shield, FileText, AlertTriangle, Download, ShieldAlert } from 'lucide-react'
import { getConformiteHub, type ClasseBceao } from '@/lib/conformite-hub'
import { exportConformiteReport } from '@/lib/conformite-export'
import { RESEAU_CONSOLIDE } from '@/lib/agences'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RapportIAGlobal } from '@/components/dashboard/RapportIAGlobal'
import { KpiCardWithSparkline } from '@/components/dashboard/KpiCardWithSparkline'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { ConformiteTables, ConformiteRepartitionBar, CLASSE_LABEL } from '@/components/conformite/ConformiteTables'
import { formatFcfa, cn } from '@/lib/utils'

type Tab = 'classification' | 'provisions' | 'lbc_ft' | 'exports'

const NIVEAU_BCEAO_LABEL: Record<string, string> = {
  CONFORME: 'Conforme',
  ATTENTION: 'À surveiller',
  NON_CONFORME: 'Non conforme',
}

const NIVEAU_BCEAO_STYLE: Record<string, string> = {
  CONFORME: 'bg-emerald-50 border-emerald-300 text-emerald-900',
  ATTENTION: 'bg-amber-50 border-amber-300 text-amber-900',
  NON_CONFORME: 'bg-red-50 border-red-300 text-red-900',
}

const RAPPORT_CONFORMITE_BASE = {
  date_generation: '28/05/2026 à 06:00',
  periode: 'Mai 2026 — Conformité BCEAO réseau',
  destinataire: 'Directeur Général',
  synthese_executive:
    `Portefeuille ${RESEAU_CONSOLIDE.total_emprunteurs} dossiers · ${formatFcfa(RESEAU_CONSOLIDE.encours_total)} encours. PAR réseau ${RESEAU_CONSOLIDE.par_moyen} % — Bè Kpota non conforme (11,2 %). LBC/FT : KYC 94,2 %, 1 DS CENTIF transmise, 2 comptes gelés — 14 dossiers KYC incomplets bloquent 6,2 M FCFA. Export BCEAO juin avant le 02/07.`,
  chiffres_cles: [] as { label: string; valeur: string; tendance?: 'HAUSSE' | 'BAISSE' | 'STABLE'; commentaire?: string }[],
  chiffres_cles_suite: [
    { label: 'Encours classé', valeur: formatFcfa(RESEAU_CONSOLIDE.encours_total), tendance: 'HAUSSE' as const, commentaire: '5 agences' },
    { label: 'PAR 30 réseau', valeur: `${RESEAU_CONSOLIDE.par_moyen}%`, tendance: 'BAISSE' as const, commentaire: 'Seuil BCEAO 10 %' },
    { label: 'KYC réseau', valeur: '94,2 %', tendance: 'STABLE' as const, commentaire: 'Seuil 95 %' },
    { label: 'DS CENTIF (mois)', valeur: '1', tendance: 'STABLE' as const, commentaire: '2 en analyse' },
  ],
  points_forts: [
    'Lomé Centre et Kpalimé : PAR < 8 % — conformes',
    'Taux couverture provisions > 90 % sur le réseau',
    'Modèle CBI v5 : 97 % cohérence dernier export mai',
  ],
  points_attention: [
    { titre: 'Bè Kpota — non conforme BCEAO', detail: 'PAR 11,2 % — plan de redressement requis avant rapport T2', severite: 'CRITIQUE' as const },
    { titre: 'LBC/FT — compte gelé Adidogomé', detail: 'Yawo Adjavon · retrait 850 k suspect · DS en préparation', severite: 'CRITIQUE' as const },
    { titre: 'KYC sous seuil (94,2 %)', detail: '14 dossiers incomplets — 6,2 M FCFA de décaissements bloqués', severite: 'HAUTE' as const },
    { titre: 'Export BCEAO juin non généré', detail: 'Échéance 02/07/2026 — J-35', severite: 'MODEREE' as const },
  ],
  recommandations: [
    { priorite: 1 as const, action: 'Valider gel + DS CENTIF — Yawo Adjavon (Adidogomé)', impact_estime: 'Conformité LBC/FT', delai: '48 h' },
    { priorite: 1 as const, action: 'Plan recouvrement Bè Kpota — 18 dossiers impayés', impact_estime: 'PAR -1,5 pt', delai: 'Cette semaine' },
    { priorite: 2 as const, action: 'Relancer 14 dossiers KYC incomplets (Bè Kpota, Adidogomé)', impact_estime: 'Déblocage 6,2 M', delai: 'Cette semaine' },
    { priorite: 2 as const, action: 'Préparer export BCEAO juin', impact_estime: 'Délai réglementaire', delai: '27/06' },
  ],
  previsions_30j: [],
  alertes_immediates: [
    '⚠ Bè Kpota : statut NON CONFORME',
    '⚠ LBC/FT : gel compte EP-8842 — retrait suspect 850 k',
    '⚠ KYC 94,2 % — sous seuil 95 %',
    'ℹ Export BCEAO juin à planifier',
  ],
  comparaison_mois_precedent: [],
  points_forts_list: [] as string[],
  signature_ia: 'Prospera AI — Conformité BCEAO',
}

export function ConformiteDgView() {
  const hub = getConformiteHub()
  const k = hub.kpis
  const lbc = hub.lbc_ft
  const [tab, setTab] = useState<Tab>('classification')
  const [classeFilter, setClasseFilter] = useState<ClasseBceao | ''>('')

  const rapportConformite = useMemo(() => {
    const scoreTendance =
      k.score_bceao >= 85 ? ('HAUSSE' as const) : k.score_bceao >= 70 ? ('STABLE' as const) : ('BAISSE' as const)
    return {
      ...RAPPORT_CONFORMITE_BASE,
      synthese_executive:
        `Score conformité BCEAO ${k.score_bceao}/100 (${NIVEAU_BCEAO_LABEL[k.niveau_bceao] ?? k.niveau_bceao}) — ${k.ratios_non_conformes} ratio(s) hors seuil, rapport dans ${k.jours_avant_rapport_bceao} j. ` +
        RAPPORT_CONFORMITE_BASE.synthese_executive,
      chiffres_cles: [
        {
          label: 'Score conformité BCEAO',
          valeur: `${k.score_bceao}/100`,
          tendance: scoreTendance,
          commentaire: `${NIVEAU_BCEAO_LABEL[k.niveau_bceao] ?? k.niveau_bceao} · ${k.ratios_non_conformes} NC`,
        },
        ...RAPPORT_CONFORMITE_BASE.chiffres_cles_suite,
      ],
    }
  }, [k.score_bceao, k.niveau_bceao, k.ratios_non_conformes, k.jours_avant_rapport_bceao])

  return (
    <PageWrapper
      title="Pilotage conformité BCEAO"
      subtitle={`${k.total_dossiers} dossiers · ${formatFcfa(k.encours_total_fcfa)} encours · BCEAO & LBC/FT`}
      actions={
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div
            className={cn(
              'inline-flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 shadow-sm',
              NIVEAU_BCEAO_STYLE[k.niveau_bceao] ?? 'bg-slate-50 border-slate-200',
            )}
            title={`${k.ratios_non_conformes} indicateur(s) non conforme(s) · rapport J-${k.jours_avant_rapport_bceao}`}
          >
            <div className="text-2xl font-black tabular-nums leading-none">{k.score_bceao}</div>
            <div className="text-left leading-tight">
              <div className="text-[10px] font-bold uppercase tracking-wide opacity-80">Score BCEAO</div>
              <div className="text-xs font-semibold">{NIVEAU_BCEAO_LABEL[k.niveau_bceao]}</div>
            </div>
          </div>
          {(lbc.kpis.comptes_geles > 0 || lbc.kpis.taux_kyc_pct < 95) && (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 rounded-lg">
              <ShieldAlert size={14} />
              LBC/FT — {lbc.kpis.comptes_geles} gel{lbc.kpis.comptes_geles > 1 ? 's' : ''} · KYC {lbc.kpis.taux_kyc_pct}%
            </span>
          )}
          {k.exports_en_attente > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
              {k.exports_en_attente} export à générer
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              const exp = hub.exports.find(e => e.statut === 'GENERE') ?? hub.exports[0]
              if (exp) void exportConformiteReport(hub, exp)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <Download size={14} />
            Export PDF
          </button>
        </div>
      }
    >
      <RapportIAGlobal
        rapport={{ ...rapportConformite, synthese_piliers: undefined, synthese_agences: undefined }}
        accentColor="indigo"
        analyseLabel="Conformité BCEAO"
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <KpiCardWithSparkline
          title="Score BCEAO"
          value={k.score_bceao}
          format="number"
          variation={k.score_bceao >= 85 ? 2.4 : -3.1}
          variationLabel="vs avril"
          sparkline={[71, 74, 76, 80, k.score_bceao]}
          sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']}
          colorScheme={k.score_bceao >= 85 ? 'green' : k.score_bceao >= 70 ? 'orange' : 'red'}
          badge={NIVEAU_BCEAO_LABEL[k.niveau_bceao]}
        />
        <KpiCardWithSparkline title="PAR 30 réseau" value={k.par_30_pct} format="pct" variation={-14.6} variationLabel="vs avril" sparkline={RESEAU_CONSOLIDE.par_historique.map(h => h.par_30j)} sparklineLabels={RESEAU_CONSOLIDE.par_historique.map(h => h.mois)} colorScheme="red" invertVariation badge="Seuil 10%" />
        <KpiCardWithSparkline title="Provisions totales" value={k.provisions_totales_fcfa} format="fcfa" variation={7.2} variationLabel="vs avril" sparkline={[14_200_000, 15_100_000, 16_000_000, 17_200_000, k.provisions_totales_fcfa]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="orange" />
        <KpiCardWithSparkline title="Taux couverture" value={k.taux_couverture_pct} format="pct" variation={2.1} variationLabel="vs avril" sparkline={[88, 90, 91, 93, k.taux_couverture_pct]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="green" />
        <KpiCardWithSparkline title="Migrations / mois" value={k.migrations_mois} format="number" sparkline={[8, 10, 12, 16, k.migrations_mois]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="purple" invertVariation />
      </div>

      {tab === 'lbc_ft' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <KpiCardWithSparkline title="Taux KYC réseau" value={lbc.kpis.taux_kyc_pct} format="pct" variation={-0.8} variationLabel="vs avril" sparkline={[96.1, 95.8, 95.2, 95.0, lbc.kpis.taux_kyc_pct]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="green" invertVariation badge="Seuil 95%" />
          <KpiCardWithSparkline title="Ops suspectes" value={lbc.kpis.operations_suspectes_mois} format="number" sparkline={[2, 3, 4, 3, lbc.kpis.operations_suspectes_mois]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="orange" invertVariation />
          <KpiCardWithSparkline title="DS CENTIF" value={lbc.kpis.ds_transmises} format="number" sparkline={[0, 1, 0, 1, lbc.kpis.ds_transmises]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="purple" />
          <KpiCardWithSparkline title="Comptes gelés" value={lbc.kpis.comptes_geles} format="number" sparkline={[0, 0, 1, 1, lbc.kpis.comptes_geles]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="red" invertVariation />
        </div>
      )}

      {/* Moteur de classification — explicatif */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Calculator size={18} className="text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-900">Moteur de classification IA</h3>
          <AiBadge variant="small" label="CBI v5" pulse />
          <span className="text-xs text-slate-500 ml-auto">Calcul du {hub.calcul_ia.date_calcul}</span>
        </div>
        <p className="text-sm text-slate-600 mb-4">{hub.calcul_ia.methode}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                <th className="pb-2 font-bold">Tranche retard</th>
                <th className="pb-2 font-bold">Classe BCEAO</th>
                <th className="pb-2 font-bold text-center">Provision</th>
                <th className="pb-2 font-bold">Signification</th>
              </tr>
            </thead>
            <tbody>
              {hub.calcul_ia.regles_appliquees.map(r => (
                <tr key={r.classe} className="border-t border-slate-50 hover:bg-slate-50">
                  <td className="py-2.5 font-mono text-slate-700">{r.tranche}</td>
                  <td className="py-2.5 font-semibold text-slate-900">{CLASSE_LABEL[r.classe]}</td>
                  <td className="py-2.5 text-center font-bold text-red-700">{r.provision_pct} %</td>
                  <td className="py-2.5 text-slate-600">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Glossaire compact */}
      <details className="bg-slate-50 rounded-xl border border-slate-200 mb-5 group">
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-xl transition-colors list-none">
          <BookOpen size={16} className="text-teal-600" />
          Comprendre les indicateurs de cette page
          <span className="text-xs font-normal text-slate-500 ml-2">(cliquer pour développer)</span>
        </summary>
        <div className="px-4 pb-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {hub.glossaire.map(g => (
            <div key={g.terme} className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-bold text-teal-700">{g.terme}</div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{g.definition}</p>
            </div>
          ))}
        </div>
      </details>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { id: 'classification' as const, label: `Classification (${k.total_dossiers})`, icon: Shield },
          { id: 'provisions' as const, label: `Provisions (${hub.provisions_agences.length} agences)`, icon: Scale },
          { id: 'lbc_ft' as const, label: `LBC/FT (${lbc.kpis.operations_suspectes_mois} alertes)`, icon: ShieldAlert },
          { id: 'exports' as const, label: `Exports (${hub.exports.length})`, icon: FileText },
        ]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setClasseFilter('') }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
              tab === t.id ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200',
            )}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'classification' && (
        <>
          <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
            <AlertTriangle size={13} />
            Cliquez une classe pour filtrer le tableau — {hub.repartition_classes.reduce((s, r) => s + r.provision_fcfa, 0) > 0 ? formatFcfa(hub.repartition_classes.reduce((s, r) => s + r.provision_fcfa, 0)) : ''} provisions totales
          </div>
          <ConformiteRepartitionBar hub={hub} activeClasse={classeFilter} onSelect={setClasseFilter} />
        </>
      )}

      <ConformiteTables
        hub={hub}
        tab={tab}
        classeFilter={classeFilter}
        onClasseFilter={setClasseFilter}
      />
    </PageWrapper>
  )
}
