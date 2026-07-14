import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFcfa(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} Md`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K`
  return n.toLocaleString('fr-FR')
}

export function formatFcfaFull(n: number): string {
  return `${n.toLocaleString('fr-FR')} FCFA`
}

export function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

export function scoreBg(score: number): string {
  if (score >= 70) return 'bg-emerald-100 text-emerald-700'
  if (score >= 40) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}
