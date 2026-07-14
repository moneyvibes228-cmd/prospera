import type { Commande } from '@distributeur/types'
import { REGISTRE_PDV, getPdvById } from './pdv-registry'
import { generateCommandes } from '@distributeur/lib/generators/generate-commandes'

function meta(pdvId: string) {
  const p = getPdvById(pdvId)!
  return {
    zone: p.zone,
    entrepot: p.entrepot_source,
    type_magasin: p.type_magasin,
  }
}

/** Commandes grossiste B2B — paniers 1,5 à 15 M FCFA (échelle distributeur Togo). */
export const REGISTRE_COMMANDES_SEED: Commande[] = [
  {
    id: 'cmd-1', reference: 'CMD-2026-4521', pdv_id: 'pdv-1', pdv_nom: 'Boutique Akossombo',
    commercial: 'Komlan Tetteh', type_commercial: 'SALARIE',
    montant_societe: 4_850_000, statut: 'LIVREE', date: '2026-06-10', lignes: 28,
    type_client: 'GROSSISTE', marge_brute_pct: 16.2, familles: ['Boissons', 'Alimentaire'],
    priorite_ia: 'NORMALE', ...meta('pdv-1'),
  },
  {
    id: 'cmd-2', reference: 'CMD-2026-4522', pdv_id: 'pdv-2', pdv_nom: 'Épicerie Mama T.',
    commercial: 'Komlan Tetteh', type_commercial: 'SALARIE',
    montant_societe: 2_840_000, statut: 'PREPARATION', date: '2026-06-10', lignes: 18,
    type_client: 'EPICERIE', marge_brute_pct: 15.8, familles: ['Boissons', 'Hygiène'],
    priorite_ia: 'NORMALE', alerte: 'Créance 340 K — livraison sous réserve',
    ...meta('pdv-2'),
  },
  {
    id: 'cmd-3', reference: 'CMD-2026-4523', pdv_id: 'pdv-4', pdv_nom: 'Superette Kara',
    commercial: 'Sena Dzobo', type_commercial: 'SALARIE',
    montant_societe: 6_200_000, statut: 'VALIDEE', date: '2026-06-10', lignes: 42,
    type_client: 'SUPERETTE', marge_brute_pct: 17.4, familles: ['Boissons', 'Alimentaire', 'Hygiène'],
    priorite_ia: 'HAUTE', ...meta('pdv-4'),
  },
  {
    id: 'cmd-7', reference: 'CMD-2026-4527', pdv_id: 'mag-4', pdv_nom: 'Atlas Shop Kara',
    commercial: '—', type_commercial: 'SALARIE',
    montant_societe: 7_400_000, statut: 'PREPARATION', date: '2026-06-10', lignes: 36,
    type_client: 'ENSEIGNE', marge_brute_pct: 14.1, familles: ['Boissons', 'Alimentaire'],
    priorite_ia: 'HAUTE', ...meta('mag-4'),
  },
  {
    id: 'cmd-8', reference: 'CMD-2026-4528', pdv_id: 'mag-1', pdv_nom: 'Atlas Shop Bé',
    commercial: '—', type_commercial: 'SALARIE',
    montant_societe: 5_600_000, statut: 'VALIDEE', date: '2026-06-10', lignes: 32,
    type_client: 'ENSEIGNE', marge_brute_pct: 14.5, familles: ['Boissons', 'Alimentaire'],
    priorite_ia: 'HAUTE', ...meta('mag-1'),
  },
  {
    id: 'cmd-9', reference: 'CMD-2026-4529', pdv_id: 'mag-3', pdv_nom: 'Atlas Shop Agoè',
    commercial: '—', type_commercial: 'SALARIE',
    montant_societe: 4_280_000, statut: 'LIVREE', date: '2026-06-10', lignes: 26,
    type_client: 'ENSEIGNE', marge_brute_pct: 14.8, familles: ['Boissons', 'Hygiène'],
    priorite_ia: 'NORMALE', ...meta('mag-3'),
  },
  {
    id: 'cmd-10', reference: 'CMD-2026-4530', pdv_id: 'mag-2', pdv_nom: 'Atlas Shop Port',
    commercial: '—', type_commercial: 'SALARIE',
    montant_societe: 3_920_000, statut: 'PREPARATION', date: '2026-06-10', lignes: 22,
    type_client: 'ENSEIGNE', marge_brute_pct: 13.9, familles: ['Alimentaire', 'Boissons'],
    priorite_ia: 'NORMALE', alerte: 'Huile 5L — 40% lignes en tension stock',
    ...meta('mag-2'),
  },
  {
    id: 'cmd-5', reference: 'CMD-2026-4525', pdv_id: 'pdv-7', pdv_nom: 'Dépôt Agoè Plage',
    commercial: 'Kofi Agbessi', type_commercial: 'FREELANCE',
    montant_societe: 3_680_000, montant_client: 4_420_000, marge_freelance: 740_000,
    statut: 'LIVREE', date: '2026-06-10', lignes: 24,
    type_client: 'DEPOT', marge_brute_pct: 16.8, familles: ['Boissons', 'Alimentaire'],
    priorite_ia: 'NORMALE', ...meta('pdv-7'),
  },
  {
    id: 'cmd-6', reference: 'CMD-2026-4526', pdv_id: 'pdv-8', pdv_nom: 'Boutique Kofi Trade',
    commercial: 'Kofi Agbessi', type_commercial: 'FREELANCE',
    montant_societe: 2_150_000, montant_client: 2_780_000, marge_freelance: 630_000,
    statut: 'VALIDEE', date: '2026-06-10', lignes: 14,
    type_client: 'EPICERIE', marge_brute_pct: 17.2, familles: ['Boissons'],
    priorite_ia: 'NORMALE', ...meta('pdv-8'),
  },
  {
    id: 'cmd-11', reference: 'CMD-2026-4531', pdv_id: 'pdv-5', pdv_nom: 'Dépôt Sokodé',
    commercial: 'Yao Ahi', type_commercial: 'SALARIE',
    montant_societe: 5_100_000, statut: 'VALIDEE', date: '2026-06-10', lignes: 30,
    type_client: 'DEPOT', marge_brute_pct: 15.5, familles: ['Alimentaire', 'Boissons'],
    priorite_ia: 'HAUTE', ...meta('pdv-5'),
  },
  {
    id: 'cmd-12', reference: 'CMD-2026-4532', pdv_id: 'pdv-1', pdv_nom: 'Boutique Akossombo',
    commercial: 'Komlan Tetteh', type_commercial: 'SALARIE',
    montant_societe: 3_200_000, statut: 'VALIDEE', date: '2026-06-10', lignes: 16,
    type_client: 'GROSSISTE', marge_brute_pct: 16.0, familles: ['Alimentaire'],
    priorite_ia: 'NORMALE', ...meta('pdv-1'),
  },
  {
    id: 'cmd-4', reference: 'CMD-2026-4524', pdv_id: 'pdv-3', pdv_nom: 'Kiosque Port',
    commercial: 'Komlan Tetteh', type_commercial: 'SALARIE',
    montant_societe: 1_280_000, statut: 'BROUILLON', date: '2026-06-10', lignes: 8,
    type_client: 'KIOSQUE', marge_brute_pct: 12.4, familles: ['Boissons'],
    priorite_ia: 'BLOQUEE', alerte: 'Crédit bloqué — impayé 890 K J+45',
    ...meta('pdv-3'),
  },
]

export const REGISTRE_COMMANDES: Commande[] = [
  ...REGISTRE_COMMANDES_SEED,
  ...generateCommandes(REGISTRE_PDV, 4600),
]
