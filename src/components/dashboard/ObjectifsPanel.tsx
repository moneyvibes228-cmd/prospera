'use client'
import { useState } from 'react'
import { Target, ChevronDown, ChevronUp, Zap, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { AiBadge } from './AiBadge'
import type { Objectif, StatutObjectif } from '@/lib/types'

export type { Objectif, StatutObjectif }

interface ObjectifsPanelProps {
  objectifs: Objectif[]
  prenom?: string
  collapsed_by_default?: boolean
}

const STATUT_CONFIG: Record<StatutObjectif, {
  bg: string; border: string; badge: string; icon: typeof CheckCircle; label: string; barColor: string
}> = {
  EN_AVANCE:       { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700 border-green-200',   icon: TrendingUp,     label: 'En avance',        barColor: '#16a34a' },
  DANS_LES_TEMPS:  { bg: 'bg-teal-50',   border: 'border-teal-200',   badge: 'bg-teal-100 text-teal-700 border-teal-200',      icon: CheckCircle,    label: 'Dans les temps',   barColor: '#14b8a6' },
  EN_RETARD:       { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock,          label: 'En retard',        barColor: '#f97316' },
  CRITIQUE:        { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700 border-red-200',          icon: AlertTriangle,  label: 'Critique',         barColor: '#dc2626' },
}

function ObjectifCard({ obj, expanded }: { obj: Objectif; expanded: boolean }) {
  const cfg = STATUT_CONFIG[obj.statut]
  const Icon = cfg.icon
  const pct = Math.min(Math.max(obj.progression, 0), 100)

  return (
    <div className={`rounded-xl border p-3 transition-all ${cfg.bg} ${cfg.border}`}>
      {/* Titre + badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Icon size={13} style={{ color: cfg.barColor }} className="flex-shrink-0 mt-0.5" />
          <span className="text-xs font-semibold text-slate-800 leading-tight">{obj.titre}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold flex-shrink-0 whitespace-nowrap ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      {/* Valeurs */}
      <div className="flex items-center justify-between text-xs mb-1.5">
        <div>
          <span className="font-black text-base text-slate-900">{obj.valeur_actuelle}</span>
          <span className="text-slate-400 ml-0.5">{obj.unite}</span>
        </div>
        <div className="text-right text-slate-400">
          <span>Cible : </span>
          <span className="font-bold text-slate-600">{obj.valeur_cible}{obj.unite}</span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="bg-white/60 rounded-full h-2.5 mb-2 overflow-hidden border border-white/50">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: cfg.barColor }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
        <span>Progression : <span className="font-bold" style={{ color: cfg.barColor }}>{pct}%</span></span>
        <span>Échéance : {obj.echeance}</span>
      </div>

      {/* Conseil IA — toujours visible pour CRITIQUE/RETARD, collapse pour les autres */}
      {(expanded || obj.statut === 'CRITIQUE' || obj.statut === 'EN_RETARD') && (
        <div className="mt-1.5 space-y-1.5">
          <div className="bg-white/70 rounded-lg p-2 border border-white/50 flex items-start gap-1.5">
            <Zap size={10} className="text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-800 leading-relaxed">{obj.ia_conseil}</p>
          </div>
          {obj.ia_action_urgente && (
            <div className="bg-red-100/60 rounded-lg p-2 border border-red-200/50 flex items-start gap-1.5">
              <AlertTriangle size={10} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-700 font-medium leading-relaxed">{obj.ia_action_urgente}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ObjectifsPanel({ objectifs, prenom, collapsed_by_default = false }: ObjectifsPanelProps) {
  const [open, setOpen] = useState(!collapsed_by_default)
  const [detaille, setDetaille] = useState(false)

  const critiques  = objectifs.filter(o => o.statut === 'CRITIQUE').length
  const retards    = objectifs.filter(o => o.statut === 'EN_RETARD').length
  const avance     = objectifs.filter(o => o.statut === 'EN_AVANCE').length
  const scoreGlobal = Math.round(objectifs.reduce((s, o) => s + o.progression, 0) / (objectifs.length || 1))

  const scoreColor = scoreGlobal >= 80 ? '#16a34a' : scoreGlobal >= 60 ? '#f97316' : '#dc2626'

  return (
    <div className="bg-white rounded-xl border-2 border-indigo-100 shadow-sm overflow-hidden">
      {/* Header — toujours visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <Target size={15} className="text-indigo-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-slate-900">
            Mes objectifs du mois{prenom ? ` — ${prenom}` : ''}
          </span>
          <AiBadge label="IA Coach" pulse={critiques > 0 || retards > 0} />
          {/* Résumé rapide */}
          <div className="flex items-center gap-1.5 ml-1">
            {critiques > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
                {critiques} critique{critiques > 1 ? 's' : ''}
              </span>
            )}
            {retards > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold border border-orange-200">
                {retards} en retard
              </span>
            )}
            {avance > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold border border-green-200">
                {avance} en avance
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="relative w-8 h-8">
              <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle cx="18" cy="18" r="15" fill="none" strokeWidth="4"
                  stroke={scoreColor}
                  strokeDasharray={`${scoreGlobal * 0.94} 100`}
                  strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black" style={{ color: scoreColor }}>
                {scoreGlobal}
              </span>
            </div>
            <span className="text-xs text-slate-400">score</span>
          </div>
          {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
        </div>
      </button>

      {/* Corps — objectifs */}
      {open && (
        <div className="border-t border-slate-100">
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {objectifs.map(obj => (
              <ObjectifCard key={obj.id} obj={obj} expanded={detaille} />
            ))}
          </div>

          {/* Footer IA */}
          <div className="px-5 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between gap-4">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Zap size={13} className="text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700 leading-relaxed">
                {critiques > 0
                  ? `⚠ ${critiques} objectif${critiques > 1 ? 's' : ''} critique${critiques > 1 ? 's' : ''} — une action immédiate est nécessaire pour éviter les pénalités.`
                  : retards > 0
                  ? `${retards} objectif${retards > 1 ? 's' : ''} en retard — consulte les conseils IA ci-dessous pour rattraper le retard avant la fin du mois.`
                  : `Tu es sur la bonne voie (score ${scoreGlobal}%). L'IA surveille tes indicateurs et t'alertera si nécessaire.`}
              </p>
            </div>
            <button
              onClick={() => setDetaille(v => !v)}
              className="text-xs text-indigo-600 font-semibold whitespace-nowrap hover:text-indigo-800 flex items-center gap-1"
            >
              {detaille ? 'Masquer conseils' : 'Tous les conseils IA'}
              {detaille ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
