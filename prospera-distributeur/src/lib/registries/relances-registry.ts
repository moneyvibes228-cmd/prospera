import { ENTREPRISE_REGISTRY } from './entreprise-registry'
import type { Relance, RelanceStatut } from '@/types'
import { getPdvById } from './pdv-registry'
import { generateRelancesBatch } from '@/lib/generators/generate-relances'

function r(
  base: Omit<Relance, 'pdv_nom' | 'zone' | 'commercial'> & { pdv_id: string },
  extra: Partial<Relance> = {},
): Relance {
  const pdv = getPdvById(base.pdv_id)!
  return {
    ...base,
    pdv_nom: pdv.nom,
    zone: pdv.zone,
    commercial: pdv.commercial,
    ...extra,
  }
}

/** Pipeline relances — impayés, réappro, prospection (scénarios nommés). */
export const REGISTRE_RELANCES_SEED: Relance[] = [
  // —— IMPAYÉS — pipeline recouvrement ——
  r({
    id: 'r-1', pdv_id: 'pdv-3', type: 'IMPAYE', canal: 'WHATSAPP',
    montant: 8_900_000, statut: 'ECHEC', date: '2026-06-11', score_succes: 12,
    facture_ref: 'FAC-2026-8821 + 2 autres', jours_retard: 78, priorite: 'CRITIQUE',
    automate: false, nb_tentatives: 10,
    message_template: `Bonjour, votre créance ${ENTREPRISE_REGISTRY.nom} de 8,9 M FCFA est en retard depuis 78j. Merci de régulariser sous 48h.`,
    prochaine_action: 'Mise en demeure + blocage livraison', prochaine_action_date: '2026-06-12',
    synthese_ia: '10 relances sans paiement · plafond 3 M dépassé (8,9 M) · passage contentieux recommandé.',
    historique: [
      { date: '2026-06-09', action: 'WhatsApp #6 — pas de réponse', auteur: 'Auto IA', canal: 'WHATSAPP' },
      { date: '2026-06-04', action: 'SMS rappel échéance', auteur: 'Auto IA', canal: 'SMS' },
      { date: '2026-05-28', action: 'Visite Komlan — client absent', auteur: 'Komlan Tetteh', canal: 'VISITE' },
      { date: '2026-05-15', action: 'Appel direct — promesse non tenue', auteur: 'Komlan Tetteh', canal: 'APPEL' },
    ],
  }),
  r({
    id: 'r-2', pdv_id: 'pdv-9', type: 'IMPAYE', canal: 'VISITE',
    montant: 5_250_000, statut: 'VISITE', date: '2026-06-11', score_succes: 35,
    facture_ref: 'FAC-2026-8828 + FAC-8831', jours_retard: 20, priorite: 'CRITIQUE',
    automate: true, nb_tentatives: 3,
    prochaine_action: 'Visite Mawuena + vérification solvabilité', prochaine_action_date: '2026-06-12',
    synthese_ia: 'Nouveau grossiste — 0 F encaissé sur 5,25 M. Visite terrain obligatoire avant relivraison.',
    historique: [
      { date: '2026-06-08', action: 'WhatsApp auto J+3 — lu, pas de réponse', auteur: 'Auto IA', canal: 'WHATSAPP' },
      { date: '2026-06-05', action: 'SMS auto J+7', auteur: 'Auto IA', canal: 'SMS' },
    ],
  }),
  r({
    id: 'r-3', pdv_id: 'pdv-2', type: 'IMPAYE', canal: 'WHATSAPP',
    montant: 3_400_000, statut: 'REPONDUE', date: '2026-06-10', score_succes: 58,
    facture_ref: 'FAC-2026-8834 + FAC-8825', jours_retard: 28, priorite: 'HAUTE',
    automate: true, nb_tentatives: 4,
    prochaine_action: 'Valider échéancier 3x1,1 M proposé par client', prochaine_action_date: '2026-06-11',
    synthese_ia: 'Client a répondu — propose paiement en 3 fois. Historique irrégulier mais relation 3 ans.',
    historique: [
      { date: '2026-06-10', action: 'Réponse WhatsApp — échéancier 3 mensualités', auteur: 'Client', canal: 'WHATSAPP' },
      { date: '2026-06-07', action: 'WhatsApp auto relance J+12', auteur: 'Auto IA', canal: 'WHATSAPP' },
      { date: '2026-06-01', action: 'SMS auto J+7', auteur: 'Auto IA', canal: 'SMS' },
    ],
  }),
  r({
    id: 'r-4', pdv_id: 'pdv-5', type: 'IMPAYE', canal: 'SMS',
    montant: 620_000, statut: 'ACCORD', date: '2026-06-10', score_succes: 72,
    facture_ref: 'FAC-2026-8841', jours_retard: 5, priorite: 'NORMALE',
    automate: true, nb_tentatives: 2,
    prochaine_action: 'Attendre solde 620 K — échéance 15/06', prochaine_action_date: '2026-06-15',
    synthese_ia: 'Accord oral solde 15/06. Client fiable zone Centrale — 50% déjà payé.',
    historique: [
      { date: '2026-06-08', action: 'Client confirme virement 15/06 par SMS', auteur: 'Client', canal: 'SMS' },
      { date: '2026-06-05', action: 'WhatsApp auto J+3 impayé partiel', auteur: 'Auto IA', canal: 'WHATSAPP' },
    ],
  }),
  r({
    id: 'r-5', pdv_id: 'pdv-7', type: 'IMPAYE', canal: 'WHATSAPP',
    montant: 180_000, statut: 'ENVOYEE', date: '2026-06-11', score_succes: 78,
    facture_ref: 'FAC-2026-8830', jours_retard: 8, priorite: 'NORMALE',
    automate: true, nb_tentatives: 1,
    message_template: 'Bonjour, il reste 180 000 FCFA sur votre facture FAC-8830. Paiement attendu cette semaine.',
    prochaine_action: 'Relance auto J+3 si pas de réponse', prochaine_action_date: '2026-06-14',
    synthese_ia: '90% déjà encaissé — reliquat faible, forte probabilité encaissement sous 7j.',
    historique: [
      { date: '2026-06-11', action: 'WhatsApp auto reliquat 180 K', auteur: 'Auto IA', canal: 'WHATSAPP' },
    ],
  }),
  r({
    id: 'r-6', pdv_id: 'pdv-3', type: 'IMPAYE', canal: 'SMS',
    montant: 2_840_000, statut: 'PLANIFIEE', date: '2026-06-12', score_succes: 15,
    facture_ref: 'FAC-2026-8821', jours_retard: 45, priorite: 'CRITIQUE',
    automate: true, nb_tentatives: 0,
    message_template: 'DERNIER RAPPEL — Facture FAC-8821 : 2,84 M FCFA impayés depuis 45 jours.',
    prochaine_action: 'Envoi SMS auto programmé 08:00', prochaine_action_date: '2026-06-12',
    synthese_ia: 'SMS #7 programmé — dernier canal avant contentieux.',
  }),
  r({
    id: 'r-7', pdv_id: 'pdv-2', type: 'IMPAYE', canal: 'VISITE',
    montant: 1_920_000, statut: 'PLANIFIEE', date: '2026-06-13', score_succes: 55,
    facture_ref: 'FAC-2026-8834', jours_retard: 12, priorite: 'HAUTE',
    automate: true, nb_tentatives: 0,
    prochaine_action: 'Visite Komlan Tetteh — négociation échéancier', prochaine_action_date: '2026-06-13',
    synthese_ia: 'Si pas d\'accord écrit sous 48h → exiger acompte 50% avant livraison CMD-4522.',
  }),
  r({
    id: 'r-8', pdv_id: 'pdv-9', type: 'IMPAYE', canal: 'WHATSAPP',
    montant: 3_200_000, statut: 'DETECTION', date: '2026-06-11', score_succes: 30,
    facture_ref: 'FAC-2026-8828', jours_retard: 20, priorite: 'HAUTE',
    automate: true, nb_tentatives: 0,
    synthese_ia: 'Détection auto — facture J+20 sans paiement. Règle : lancer séquence WhatsApp J+3.',
    prochaine_action: 'Démarrage séquence auto dans 2h', prochaine_action_date: '2026-06-11',
  }),
  r({
    id: 'r-9', pdv_id: 'pdv-1', type: 'IMPAYE', canal: 'WHATSAPP',
    montant: 4_850_000, statut: 'PAYEE', date: '2026-06-07', score_succes: 92,
    facture_ref: 'FAC-2026-8840', jours_retard: 0, priorite: 'BASSE',
    automate: true, nb_tentatives: 1,
    synthese_ia: 'Résolu — virement reçu J+16. Client fidèle, séquence standard suffisante.',
    historique: [
      { date: '2026-06-07', action: 'Paiement intégral reçu — virement', auteur: 'Comptabilité', canal: 'VIREMENT' },
      { date: '2026-06-03', action: 'WhatsApp rappel échéance J-5', auteur: 'Auto IA', canal: 'WHATSAPP' },
    ],
  }),

  // —— RÉAPPROVISIONNEMENT ——
  r({
    id: 'r-10', pdv_id: 'pdv-1', type: 'REAPPRO', canal: 'WHATSAPP',
    statut: 'ENVOYEE', date: '2026-06-10', score_succes: 85,
    priorite: 'NORMALE', automate: true,
    message_template: 'Bonjour Akossombo, votre stock eau est bas (estimé 4j). Commander maintenant ?',
    prochaine_action: 'Attendre commande — relance J+2 si pas de réponse', prochaine_action_date: '2026-06-12',
    synthese_ia: 'Rotation eau élevée — probabilité commande 85% sous 48h.',
    historique: [
      { date: '2026-06-10', action: 'WhatsApp réappro auto — stock eau < 5j', auteur: 'Auto IA', canal: 'WHATSAPP' },
    ],
  }),
  r({
    id: 'r-11', pdv_id: 'pdv-4', type: 'REAPPRO', canal: 'WHATSAPP',
    statut: 'REPONDUE', date: '2026-06-09', score_succes: 90,
    priorite: 'HAUTE', automate: true,
    synthese_ia: 'Superette Kara — a confirmé commande 6,2 M. Conversion réappro → CMD-4523.',
    historique: [
      { date: '2026-06-09', action: 'Client confirme commande riz + eau', auteur: 'Client', canal: 'WHATSAPP' },
      { date: '2026-06-08', action: 'WhatsApp réappro savon rupture réseau', auteur: 'Auto IA', canal: 'WHATSAPP' },
    ],
  }),
  r({
    id: 'r-12', pdv_id: 'mag-2', type: 'REAPPRO', canal: 'WHATSAPP',
    statut: 'PLANIFIEE', date: '2026-06-12', score_succes: 70,
    priorite: 'HAUTE', automate: true,
    message_template: 'ALERTE STOCK Atlas Shop Port — Huile 5L rupture. Transfert urgent recommandé.',
    prochaine_action: 'Notification auto gérant magasin', prochaine_action_date: '2026-06-12',
    synthese_ia: 'Rupture huile — 40% lignes commande en tension. Réappro interne prioritaire.',
  }),
  r({
    id: 'r-13', pdv_id: 'pdv-8', type: 'REAPPRO', canal: 'SMS',
    statut: 'PAYEE', date: '2026-06-08', score_succes: 88,
    priorite: 'NORMALE', automate: true,
    synthese_ia: 'Réappro convertie — commande CMD-4526 validée même jour.',
  }),

  // —— PROSPECTION ——
  r({
    id: 'r-14', pdv_id: 'pdv-6', type: 'PROSPECTION', canal: 'VISITE',
    statut: 'VISITE', date: '2026-06-11', score_succes: 48,
    priorite: 'NORMALE', automate: false,
    prochaine_action: 'Visite Mawuena — 1er contact + présentation catalogue', prochaine_action_date: '2026-06-12',
    synthese_ia: 'Prospect Bè Kpota — zone sous-exploitée. Potentiel épicerie 1,5 M/mois.',
    historique: [
      { date: '2026-06-10', action: 'RDV confirmé par téléphone', auteur: 'Mawuena Ahi', canal: 'APPEL' },
    ],
  }),
  r({
    id: 'r-15', pdv_id: 'pdv-6', type: 'PROSPECTION', canal: 'WHATSAPP',
    statut: 'ENVOYEE', date: '2026-06-09', score_succes: 55,
    priorite: 'BASSE', automate: true,
    message_template: `Découvrez le catalogue grossiste ${ENTREPRISE_REGISTRY.nom} — remises jusqu'à -8% pour dépôts.`,
    prochaine_action: 'Relance catalogue J+5', prochaine_action_date: '2026-06-14',
    synthese_ia: 'Message catalogue envoyé — taux ouverture 62%.',
  }),
  r({
    id: 'r-16', pdv_id: 'pdv-9', type: 'PROSPECTION', canal: 'VISITE',
    statut: 'DETECTION', date: '2026-06-11', score_succes: 40,
    priorite: 'NORMALE', automate: true,
    synthese_ia: 'Détection : gros volume commandé sans historique paiement → basculer en suivi recouvrement.',
  }),
  r({
    id: 'r-17', pdv_id: 'pdv-5', type: 'REAPPRO', canal: 'WHATSAPP',
    statut: 'DETECTION', date: '2026-06-11', score_succes: 65,
    priorite: 'NORMALE', automate: true,
    synthese_ia: 'Stock lait concentré Kara bas — réappro auto programmée si pas de commande sous 3j.',
    prochaine_action: 'Analyse stock PDV Sokodé', prochaine_action_date: '2026-06-12',
  }),
  r({
    id: 'r-18', pdv_id: 'pdv-3', type: 'IMPAYE', canal: 'EMAIL',
    montant: 3_520_000, statut: 'DETECTION', date: '2026-06-11', score_succes: 10,
    facture_ref: 'FAC-2026-8810', jours_retard: 62, priorite: 'CRITIQUE',
    automate: true, nb_tentatives: 0,
    synthese_ia: 'Nouvelle facture impayée détectée — ajout pipeline recouvrement. Séquence accélérée (client déjà en défaut).',
    prochaine_action: 'Mise en demeure email + copie DG', prochaine_action_date: '2026-06-12',
  }),
]

const seedKeys = new Set(REGISTRE_RELANCES_SEED.map(r => `${r.type.toLowerCase()}-${r.pdv_id}`))
const generatedRelances = generateRelancesBatch(seedKeys)

/** Registre complet — scénarios + relances générées depuis le réseau PDV. */
export const REGISTRE_RELANCES: Relance[] = [
  ...REGISTRE_RELANCES_SEED,
  ...generatedRelances,
]

export const REGLES_AUTOMATION_RELANCES = [
  { declencheur: 'Facture impayée J+3', action: 'WhatsApp automatique', canal: 'WHATSAPP', delai: '3j après échéance' },
  { declencheur: 'Pas de réponse J+7', action: 'SMS rappel', canal: 'SMS', delai: '7j après échéance' },
  { declencheur: 'Impayé J+14', action: 'Visite commercial assigné', canal: 'VISITE', delai: '14j après échéance' },
  { declencheur: 'Impayé J+30', action: 'Alerte DG + blocage crédit', canal: 'EMAIL', delai: '30j après échéance' },
  { declencheur: 'Stock PDV < 5j couverture', action: 'WhatsApp réappro', canal: 'WHATSAPP', delai: 'Temps réel' },
  { declencheur: 'Prospect sans commande J+21', action: 'Relance catalogue', canal: 'WHATSAPP', delai: '21j après contact' },
] as const

export const PIPELINE_ETAPES: { id: RelanceStatut; label: string; couleur: string }[] = [
  { id: 'DETECTION', label: 'Détection IA', couleur: 'border-violet-200 bg-violet-50' },
  { id: 'PLANIFIEE', label: 'Planifiée', couleur: 'border-slate-200 bg-slate-50' },
  { id: 'ENVOYEE', label: 'Envoyée', couleur: 'border-sky-200 bg-sky-50' },
  { id: 'REPONDUE', label: 'Réponse client', couleur: 'border-amber-200 bg-amber-50' },
  { id: 'VISITE', label: 'Visite terrain', couleur: 'border-orange-200 bg-orange-50' },
  { id: 'ACCORD', label: 'Accord paiement', couleur: 'border-teal-200 bg-teal-50' },
  { id: 'PAYEE', label: 'Résolue', couleur: 'border-emerald-200 bg-emerald-50' },
  { id: 'ECHEC', label: 'Contentieux', couleur: 'border-red-200 bg-red-50' },
]
