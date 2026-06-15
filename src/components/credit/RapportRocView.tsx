'use client'

import { AlertTriangle, Sparkles, TrendingUp } from 'lucide-react'
import { formatFcfa } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'
import type { RapportRocApi } from '@/types/credit-rapports-api'

interface Props {
  rapport: RapportRocApi
  source?: 'mock' | 'api'
}

export function RapportRocView({ rapport }: Props) {
  const el = rapport.expected_loss

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[10px]">
        <AiBadge variant="small" label="Rapport analyste ROC" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Synthèse exécutive</p>
        <p className="text-sm text-slate-700 leading-relaxed">{rapport.synthese_executive}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ScoreBox label="Score final" value={rapport.score_final} />
        <ScoreBox label="CBI" value={rapport.score_cbi} />
        <ScoreBox label="Ajust. Prospera IA" value={rapport.ajustement_claude} signed />
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <p className="text-[9px] font-bold text-slate-500 uppercase">Classe BCEAO</p>
          <p className="text-sm font-black text-slate-900 mt-1">{rapport.classe_bceao}</p>
          <p className="text-[10px] text-slate-500">PD {rapport.probabilite_defaut_pct}%</p>
        </div>
      </div>

      {el && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-[10px] font-bold text-indigo-800 uppercase mb-2 flex items-center gap-1">
            <TrendingUp size={12} /> Expected loss
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <p>
              EAD : <strong>{formatFcfa(el.ead)}</strong>
            </p>
            <p>
              Perte attendue : <strong>{formatFcfa(el.perte_attendue_fcfa)}</strong>
            </p>
            <p>
              Provision : <strong>{formatFcfa(el.provision_reglementaire_fcfa)}</strong> ({el.taux_provision_pct}%)
            </p>
          </div>
        </div>
      )}

      {rapport.avis_charge_credit && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm">
          <p className="text-[10px] font-bold text-violet-800 uppercase mb-1">Avis charge de crédit</p>
          <p className="font-semibold text-violet-900">{rapport.avis_charge_credit.avis}</p>
          {rapport.avis_charge_credit.montant_suggere != null && (
            <p className="text-xs text-violet-700 mt-1">
              Montant suggéré : {formatFcfa(rapport.avis_charge_credit.montant_suggere)}
            </p>
          )}
          {rapport.avis_charge_credit.notes_brutes && (
            <p className="text-xs text-violet-600 mt-2">{rapport.avis_charge_credit.notes_brutes}</p>
          )}
        </div>
      )}

      {rapport.benchmark && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
          <p className="font-bold text-slate-800 mb-2">Benchmark secteur</p>
          <p>
            {rapport.benchmark.nbDossiers} dossiers · clôture {rapport.benchmark.tauxCloturePct}% · incidents{' '}
            {rapport.benchmark.tauxIncidentPct}% — <strong>{rapport.benchmark.verdict}</strong>
          </p>
          {rapport.benchmark.echantillonFaible && (
            <p className="text-amber-700 mt-1 flex items-center gap-1">
              <AlertTriangle size={12} /> Échantillon faible
            </p>
          )}
        </div>
      )}

      {rapport.analyse_risque && (
        <div className="grid md:grid-cols-2 gap-3">
          <ListBlock title="Forces" items={rapport.analyse_risque.forces} tone="green" />
          <ListBlock title="Faiblesses" items={rapport.analyse_risque.faiblesses} tone="orange" />
          <ListBlock
            title="Recommandations"
            items={rapport.analyse_risque.recommandations_avant_decision}
            tone="slate"
          />
        </div>
      )}

      {rapport.suggestion && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-[10px] font-bold text-emerald-800 uppercase mb-2 flex items-center gap-1">
            <Sparkles size={12} /> Suggestion décision
          </p>
          <p className="text-sm font-black text-emerald-900">{rapport.suggestion.decision}</p>
          <p className="text-xs text-emerald-800 mt-2">
            {formatFcfa(rapport.suggestion.montant_recommande)} · {rapport.suggestion.duree_recommandee} mois · taux{' '}
            {rapport.suggestion.taux_recommande}%
          </p>
          <p className="text-xs text-emerald-700 mt-2">{rapport.suggestion.justification}</p>
        </div>
      )}

      {(rapport.alertes?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Alertes</p>
          {rapport.alertes!.map((a) => (
            <div
              key={a.code}
              className={`text-xs px-3 py-2 rounded-lg border ${
                a.severite === 'CRITICAL'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : a.severite === 'WARN'
                    ? 'bg-orange-50 border-orange-200 text-orange-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <strong>{a.code}</strong> — {a.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ScoreBox({ label, value, signed }: { label: string; value: number; signed?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
      <p className="text-[9px] font-bold text-slate-500 uppercase">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">
        {signed && value > 0 ? '+' : ''}
        {value}
      </p>
    </div>
  )
}

function ListBlock({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: 'green' | 'orange' | 'slate'
}) {
  const cls =
    tone === 'green'
      ? 'bg-green-50 border-green-200 text-green-900'
      : tone === 'orange'
        ? 'bg-orange-50 border-orange-200 text-orange-900'
        : 'bg-slate-50 border-slate-200 text-slate-800'
  if (!items.length) return null
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <p className="text-[10px] font-bold uppercase mb-2">{title}</p>
      <ul className="text-xs space-y-1 list-disc list-inside">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  )
}
