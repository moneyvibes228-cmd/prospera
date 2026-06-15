'use client'

import type { SyntheseAgenceIA, MembreEquipeSynthese } from '@/lib/synthese-agences-dg'

const BCEAO_BADGE: Record<string, string> = {
  CONFORME: 'bg-green-500/20 text-green-300 border-green-500/30',
  ATTENTION: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  NON_CONFORME: 'bg-red-500/20 text-red-300 border-red-500/30',
}

const BCEAO_BADGE_LIGHT: Record<string, string> = {
  CONFORME: 'bg-green-50 text-green-700 border-green-200',
  ATTENTION: 'bg-orange-50 text-orange-700 border-orange-200',
  NON_CONFORME: 'bg-red-50 text-red-700 border-red-200',
}

const TENDANCE_DOT: Record<string, string> = {
  POSITIF: 'bg-green-400',
  STABLE: 'bg-slate-400',
  ALERTE: 'bg-red-400',
}

const ROLE_STYLE: Record<string, { label: string; dark: string; light: string }> = {
  RA: { label: 'RA', dark: 'text-teal-300 bg-teal-400/10 border-teal-400/20', light: 'text-teal-700 bg-teal-50 border-teal-200' },
  COM: { label: 'COM', dark: 'text-indigo-300 bg-indigo-400/10 border-indigo-400/20', light: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  GP: { label: 'GP', dark: 'text-violet-300 bg-violet-400/10 border-violet-400/20', light: 'text-violet-700 bg-violet-50 border-violet-200' },
}

function scoreColor(score: number, dark: boolean): string {
  if (score >= 80) return dark ? 'text-green-300' : 'text-green-600'
  if (score >= 65) return dark ? 'text-orange-300' : 'text-orange-600'
  return dark ? 'text-red-300' : 'text-red-600'
}

interface Props {
  ag: SyntheseAgenceIA
  variant?: 'dark' | 'light'
  /** Masquer l'en-tête (nom, BCEAO) quand déjà affiché ailleurs */
  showHeader?: boolean
}

export function SyntheseAgenceBlock({ ag, variant = 'dark', showHeader = true }: Props) {
  const dark = variant === 'dark'
  const bceaoBadge = dark ? BCEAO_BADGE : BCEAO_BADGE_LIGHT
  const ra = (ag.equipe ?? []).filter(e => e.role === 'RA')
  const commerciaux = (ag.equipe ?? []).filter(e => e.role === 'COM')
  const gps = (ag.equipe ?? []).filter(e => e.role === 'GP')
  const hasEquipe = ag.equipe && ag.equipe.length > 0
  const hasEvolution = !!ag.evolution_6m

  const textMuted = dark ? 'text-slate-400' : 'text-slate-500'
  const textBody = dark ? 'text-slate-300' : 'text-slate-600'
  const textTitle = dark ? 'text-white' : 'text-slate-900'
  const sectionBg = dark ? 'bg-black/20 rounded-lg p-2.5' : 'bg-slate-50 rounded-lg p-2.5 border border-slate-100'
  const evoBg = dark ? 'bg-white/5 rounded-lg px-2.5 py-2' : 'bg-white rounded-lg px-2.5 py-2 border border-slate-100'

  function MembreRow({ m }: { m: MembreEquipeSynthese }) {
    const rs = ROLE_STYLE[m.role]
    return (
      <div className="flex items-start gap-2 min-w-0">
        <span className={`text-[8px] px-1 py-0.5 rounded border font-bold shrink-0 mt-0.5 ${dark ? rs.dark : rs.light}`}>
          {rs.label}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[11px] font-bold truncate ${textTitle}`}>{m.nom}</span>
            <span className={`text-[10px] font-bold tabular-nums ${scoreColor(m.score, dark)}`}>{m.score}/100</span>
          </div>
          <p className={`text-[10px] leading-snug mt-0.5 ${textMuted}`}>{m.evolution}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {showHeader && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold ${textTitle}`}>{ag.nom}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${bceaoBadge[ag.statut_bceao]}`}>
            {ag.statut_bceao === 'NON_CONFORME' ? 'NON CONFORME' : ag.statut_bceao}
          </span>
          <span className={`text-[10px] ${textMuted}`}>Santé {ag.score_sante}/100</span>
          {ag.clients_actifs != null && (
            <span className={`text-[10px] ${textMuted}`}>· {ag.clients_actifs} clients</span>
          )}
        </div>
      )}

      {hasEquipe && (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 ${sectionBg}`}>
        <div>
          <div className={`text-[9px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}>Responsable</div>
          {ra.map(m => <MembreRow key={m.nom} m={m} />)}
        </div>
        <div>
          <div className={`text-[9px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}>
            Commerciaux ({commerciaux.length})
          </div>
          <div className="space-y-2">
            {commerciaux.map(m => <MembreRow key={m.nom} m={m} />)}
          </div>
        </div>
        <div>
          <div className={`text-[9px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}>
            GP ({gps.length})
          </div>
          {gps.map(m => <MembreRow key={m.nom} m={m} />)}
        </div>
      </div>
      )}

      {hasEvolution && ag.evolution_6m && (
      <div>
        <div className={`text-[9px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}>Évolution (5 mois)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {[ag.evolution_6m.par, ag.evolution_6m.remboursement, ag.evolution_6m.collecte, ag.evolution_6m.encours].map(
            (line, i) => (
              <div key={i} className={evoBg}>
                <p className={`text-[10px] leading-snug ${textBody}`}>{line}</p>
              </div>
            ),
          )}
        </div>
      </div>
      )}

      <p className={`text-xs leading-relaxed ${textBody}`}>{ag.resume}</p>
    </div>
  )
}

export { TENDANCE_DOT, BCEAO_BADGE }
