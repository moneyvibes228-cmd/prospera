/** Données socle — entreprise distributeur (source brute, non dérivée). */

export const DEMO_EMAIL_DOMAIN = 'demo.prospera.tg'

export const ENTREPRISE_REGISTRY = {
  id: 'demo-distributeur',
  nom: 'Atlas Distribution',
  nomLegal: 'Atlas Distribution SARL',
  pays: 'Togo',
  villes: ['Lomé', 'Kara', 'Sokodé'],
  entrepots: ['Lomé Port', 'Kara'],
  ca_objectif_mois: 450_000_000,
  commerciaux_total: 38,
  freelances_actifs: 12,
  points_vente_total: 1847,
} as const

export const CA_SPARKLINE_REGISTRY = [
  { mois: 'Jan', ca: 392 },
  { mois: 'Fév', ca: 408 },
  { mois: 'Mar', ca: 401 },
  { mois: 'Avr', ca: 385 },
  { mois: 'Mai', ca: 405 },
  { mois: 'Jun', ca: 412 },
] as const

export const PIPELINE_LABELS_REGISTRY: Record<string, string> = {
  PROSPECTION: 'Prospection',
  PREMIER_CONTACT: 'Premier contact',
  PREMIERE_COMMANDE: '1ère commande',
  ACTIF: 'Client actif',
  FIDELE: 'Client fidèle',
  A_RISQUE: 'À risque',
}
