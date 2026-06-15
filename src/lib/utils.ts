import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { BorrowerStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRiskColor(score: number) {
  if (score < 40) return {
    bg: 'bg-red-50',    border: 'border-red-200',
    text: 'text-red-700',    badge: 'destructive',
    label: 'Critique',  dot: '#DC2626'
  }
  if (score < 70) return {
    bg: 'bg-orange-50', border: 'border-orange-200',
    text: 'text-orange-700', badge: 'warning',
    label: 'À surveiller', dot: '#EA580C'
  }
  return {
    bg: 'bg-green-50',  border: 'border-green-200',
    text: 'text-green-700',  badge: 'success',
    label: 'Sain',      dot: '#16A34A'
  }
}

export function formatFcfa(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

/** Affiche une entité API (string ou `{ id, nom }`) comme texte React. */
export function entityLabel(value: unknown, fallback = '—'): string {
  if (value == null || value === '') return fallback
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    const name = [o.prenom, o.nom, o.label, o.name, o.libelle, o.reference]
      .filter((p) => typeof p === 'string' && p.length > 0)
      .join(' ')
      .trim()
    if (name) return name
    if (o.id != null) return String(o.id)
  }
  return fallback
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function getStatusLabel(status: BorrowerStatus): string {
  const labels: Record<BorrowerStatus, string> = {
    REMBOURSEMENT: 'En remboursement',
    RETARD:        'En retard',
    DEFAUT:        'Défaut',
    RESTRUCTURE:   'Restructuré',
    EVALUATION:    'En évaluation',
    INSTRUCTION:   'En instruction',
  }
  return labels[status]
}

export function getStatusColor(status: BorrowerStatus): string {
  const colors: Record<BorrowerStatus, string> = {
    REMBOURSEMENT: 'bg-green-100 text-green-700',
    RETARD:        'bg-orange-100 text-orange-700',
    DEFAUT:        'bg-red-100 text-red-700',
    RESTRUCTURE:   'bg-purple-100 text-purple-700',
    EVALUATION:    'bg-blue-100 text-blue-700',
    INSTRUCTION:   'bg-slate-100 text-slate-700',
  }
  return colors[status]
}
