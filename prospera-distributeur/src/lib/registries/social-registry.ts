/**
 * Registre réseaux sociaux — comptes, messages entrants, rythmes commerciaux.
 *
 * Le poids des canaux est celui du terrain togolais, pas celui d'un plan média
 * européen : WhatsApp est le canal de vente (le détaillant commande dedans),
 * Facebook est le canal de notoriété, TikTok celui de l'acquisition jeune.
 * Instagram ne pèse presque rien sur une clientèle de gérants d'épicerie et
 * n'est gardé que pour la vitrine.
 */

export type ReseauSocial = 'WHATSAPP' | 'FACEBOOK' | 'TIKTOK' | 'INSTAGRAM'

export const RESEAU_META: Record<ReseauSocial, { label: string; icone: string; couleur: string; role: string }> = {
  WHATSAPP: { label: 'WhatsApp Business', icone: '💬', couleur: 'bg-green-100 text-green-700 border-green-200', role: 'Canal de vente — le détaillant commande dedans' },
  FACEBOOK: { label: 'Facebook', icone: '📘', couleur: 'bg-blue-100 text-blue-700 border-blue-200', role: 'Notoriété & acquisition ciblée par zone' },
  TIKTOK: { label: 'TikTok', icone: '🎵', couleur: 'bg-slate-900 text-white border-slate-700', role: 'Acquisition jeunes gérants — coût par lead le plus bas' },
  INSTAGRAM: { label: 'Instagram', icone: '📸', couleur: 'bg-pink-100 text-pink-700 border-pink-200', role: 'Vitrine — faible conversion B2B, entretien minimal' },
}

export interface CompteSocial {
  reseau: ReseauSocial
  handle: string
  abonnes: number
  croissance_30j_pct: number
  portee_30j: number
  engagement_pct: number
  leads_30j: number
  commandes_30j: number
  /** Tout le CA passé par le canal — flatteur, et largement faux comme mesure du marketing. */
  ca_attribue_30j: number
  /**
   * La part réellement créée par le social : nouveaux clients et réactivations.
   * Un client fidèle qui commande son riz par WhatsApp aurait commandé de toute
   * façon — se l'attribuer, c'est facturer au marketing un chiffre qu'il n'a pas
   * produit, et fausser tous les arbitrages de budget qui en découlent.
   */
  ca_incremental_30j: number
  /** Heures où l'audience est réellement là, mesurées sur 90 jours. */
  heures_optimales: string[]
  connecte: boolean
}

export const COMPTES_SOCIAUX: CompteSocial[] = [
  {
    reseau: 'WHATSAPP', handle: 'Prospera Distribution · +228 90 00 12 12',
    abonnes: 1_284, croissance_30j_pct: 6.2, portee_30j: 4_120, engagement_pct: 38.4,
    leads_30j: 74, commandes_30j: 61, ca_attribue_30j: 34_800_000, ca_incremental_30j: 8_200_000,
    heures_optimales: ['07:30', '12:30', '19:30'], connecte: true,
  },
  {
    reseau: 'FACEBOOK', handle: '@ProsperaDistributionTogo',
    abonnes: 8_940, croissance_30j_pct: 11.8, portee_30j: 62_400, engagement_pct: 4.1,
    leads_30j: 38, commandes_30j: 12, ca_attribue_30j: 8_600_000, ca_incremental_30j: 6_400_000,
    heures_optimales: ['12:30', '20:00'], connecte: true,
  },
  {
    reseau: 'TIKTOK', handle: '@prospera.tg',
    abonnes: 3_210, croissance_30j_pct: 42.5, portee_30j: 128_000, engagement_pct: 7.8,
    leads_30j: 29, commandes_30j: 6, ca_attribue_30j: 3_200_000, ca_incremental_30j: 3_200_000,
    heures_optimales: ['21:00'], connecte: true,
  },
  {
    reseau: 'INSTAGRAM', handle: '@prospera_tg',
    abonnes: 1_450, croissance_30j_pct: 2.1, portee_30j: 9_800, engagement_pct: 2.4,
    leads_30j: 4, commandes_30j: 1, ca_attribue_30j: 420_000, ca_incremental_30j: 180_000,
    heures_optimales: ['20:30'], connecte: false,
  },
]

/**
 * Les rythmes qui font vendre — un calendrier éditorial qui les ignore publie
 * dans le vide. Ils sont datés, donc l'IA peut les anticiper.
 */
export interface RythmeCommercial {
  cle: string
  libelle: string
  explication: string
  /** Jours du mois concernés (1-31), ou jours de la semaine si `jours_semaine`. */
  jours_mois?: number[]
  jours_semaine?: number[]
  categories_poussees: string[]
}

export const RYTHMES_COMMERCIAUX: RythmeCommercial[] = [
  {
    cle: 'paie',
    libelle: 'Semaine de paie (fin de mois)',
    explication: 'Les salaires tombent entre le 25 et le 30 : les détaillants réassortissent avant, pour vendre pendant. Publier le 22 vaut trois fois publier le 27.',
    jours_mois: [22, 23, 24, 25],
    categories_poussees: ['Alimentaire', 'Boissons', 'Hygiène'],
  },
  {
    cle: 'marche',
    libelle: 'Veille de jour de marché',
    explication: 'Les gros marchés tournent le lundi et le vendredi. Le détaillant commande la veille pour être servi le matin même.',
    jours_semaine: [0, 4],
    categories_poussees: ['Boissons', 'Alimentaire'],
  },
  {
    cle: 'chaleur',
    libelle: 'Pic de chaleur (juin — septembre)',
    explication: 'La demande de boissons monte de 8 à 12% ; l\'eau en pack se vend au carton et non à l\'unité.',
    categories_poussees: ['Boissons'],
  },
  {
    cle: 'weekend',
    libelle: 'Préparation week-end',
    explication: 'Le jeudi soir, le gérant anticipe le week-end : bières, sodas, eau. C\'est le meilleur créneau WhatsApp de la semaine.',
    jours_semaine: [3],
    categories_poussees: ['Boissons'],
  },
]

/* ------------------------------------------------------------------ */
/* Boîte de réception sociale unifiée                                   */
/* ------------------------------------------------------------------ */

export type IntentionMessage = 'PRIX' | 'DISPONIBILITE' | 'COMMANDE' | 'RECLAMATION' | 'PARTENARIAT' | 'SPAM'

export const INTENTION_META: Record<IntentionMessage, { label: string; couleur: string; sla_h: number }> = {
  COMMANDE: { label: 'Intention d\'achat', couleur: 'bg-emerald-100 text-emerald-700', sla_h: 1 },
  PRIX: { label: 'Demande de prix', couleur: 'bg-sky-100 text-sky-700', sla_h: 2 },
  DISPONIBILITE: { label: 'Disponibilité', couleur: 'bg-indigo-100 text-indigo-700', sla_h: 2 },
  RECLAMATION: { label: 'Réclamation', couleur: 'bg-red-100 text-red-700', sla_h: 1 },
  PARTENARIAT: { label: 'Partenariat / dépôt', couleur: 'bg-amber-100 text-amber-700', sla_h: 24 },
  SPAM: { label: 'Indésirable', couleur: 'bg-slate-100 text-slate-500', sla_h: 999 },
}

export interface MessageSocial {
  id: string
  reseau: ReseauSocial
  auteur: string
  contenu: string
  recu_il_y_a: string
  /** Minutes écoulées — sert à mesurer le respect du SLA. */
  age_minutes: number
  intention: IntentionMessage
  /** Confiance de la classification, 0-100. */
  confiance: number
  reponse_suggeree: string
  /** L'IA peut répondre seule quand la réponse est factuelle et vérifiable. */
  auto_repondable: boolean
  /** Valeur estimée si le message se transforme en client. */
  potentiel_fcfa: number
  zone?: string
}

export const INBOX_SOCIAL: MessageSocial[] = [
  {
    id: 'msg-1', reseau: 'WHATSAPP', auteur: '+228 96 12 44 90 · Épicerie Adakpamé',
    contenu: 'Bonjour, c\'est combien le carton d\'eau 1,5L pack 12 ? Et vous livrez à Adakpamé ?',
    recu_il_y_a: 'il y a 12 min', age_minutes: 12,
    intention: 'PRIX', confiance: 96,
    reponse_suggeree: 'Bonjour ! Eau minérale 1,5L (pack 12) : 4 200 FCFA le pack au prix grossiste, à partir de 10 packs. Oui, nous livrons à Adakpamé sous 48 h (livraison offerte dès 350 000 FCFA de commande). Vous voulez que je vous prépare un devis ?',
    auto_repondable: true, potentiel_fcfa: 850_000, zone: 'Lomé Est',
  },
  {
    id: 'msg-2', reseau: 'FACEBOOK', auteur: 'Kodjo A. — commentaire sur « Combo Eau + Riz »',
    contenu: 'Je tiens une boutique à Bassar, vous pouvez livrer jusque là-bas ?',
    recu_il_y_a: 'il y a 40 min', age_minutes: 40,
    intention: 'PARTENARIAT', confiance: 88,
    reponse_suggeree: 'Bonjour Kodjo ! Nous ouvrons justement Bassar : livraison depuis notre entrepôt de Kara, 2 passages par mois. Je vous mets en relation avec Sena Dzobo, notre commercial Nord — il peut passer voir votre boutique cette semaine. Quel est votre numéro WhatsApp ?',
    auto_repondable: false, potentiel_fcfa: 6_200_000, zone: 'Bassar',
  },
  {
    id: 'msg-3', reseau: 'WHATSAPP', auteur: '+228 90 55 21 08 · Superette Tokoin',
    contenu: 'Je veux commander 40 sacs de riz 25kg et 20 cartons huile. Vous avez en stock ?',
    recu_il_y_a: 'il y a 8 min', age_minutes: 8,
    intention: 'COMMANDE', confiance: 99,
    reponse_suggeree: 'Excellent ! Riz 25 kg : disponible (890 sacs en stock Lomé Port). Huile 5L : stock tendu (180 cartons, réappro attendue). Je vous réserve 40 sacs de riz + 20 cartons d\'huile = 890 000 FCFA HT. Je génère la proforma maintenant ?',
    auto_repondable: false, potentiel_fcfa: 890_000, zone: 'Lomé Nord',
  },
  {
    id: 'msg-4', reseau: 'WHATSAPP', auteur: '+228 92 34 56 78 · Kiosque Port',
    contenu: 'Vous avez bloqué ma livraison ? J\'ai besoin de marchandise cette semaine',
    recu_il_y_a: 'il y a 2 h', age_minutes: 120,
    intention: 'RECLAMATION', confiance: 94,
    reponse_suggeree: '⚠ NE PAS RÉPONDRE AUTOMATIQUEMENT — client avec 8,9 M FCFA d\'impayés depuis 78 jours, crédit coupé. À transférer au responsable recouvrement (Elom Adjavon) : toute reprise de livraison passe par un accord d\'échéancier signé.',
    auto_repondable: false, potentiel_fcfa: 0, zone: 'Lomé Centre',
  },
  {
    id: 'msg-5', reseau: 'TIKTOK', auteur: '@yaotrade228 — commentaire',
    contenu: 'Comment devenir revendeur ? Je veux ouvrir une boutique à Agoè',
    recu_il_y_a: 'il y a 3 h', age_minutes: 180,
    intention: 'PARTENARIAT', confiance: 91,
    reponse_suggeree: 'Bonjour ! Pour devenir partenaire Prospera : aucun droit d\'entrée, commande minimum 350 000 FCFA, livraison sous 48 h à Agoè. Écrivez-nous sur WhatsApp au +228 90 00 12 12 et on ouvre votre compte en 24 h. 💪',
    auto_repondable: true, potentiel_fcfa: 1_200_000, zone: 'Lomé Sud',
  },
  {
    id: 'msg-6', reseau: 'WHATSAPP', auteur: '+228 97 88 12 45 · Dépôt Sokodé',
    contenu: 'Le savon est toujours en rupture ? Ça fait 3 semaines que j\'attends',
    recu_il_y_a: 'il y a 25 min', age_minutes: 25,
    intention: 'DISPONIBILITE', confiance: 97,
    reponse_suggeree: 'Bonjour ! Le savon ménager (carton 48) est effectivement en rupture à Kara — réapprovisionnement attendu sous 6 jours. Je vous mets en file prioritaire : vous serez livré dès l\'arrivée du stock, sans repasser commande. En attendant, le détergent 5L peut dépanner vos clients (7 800 F le bidon, marge 22%).',
    auto_repondable: true, potentiel_fcfa: 420_000, zone: 'Centrale',
  },
  {
    id: 'msg-7', reseau: 'FACEBOOK', auteur: 'Promo Business 228 — message privé',
    contenu: 'Boostez votre page ! 10 000 followers pour 15 000 FCFA, contactez-nous',
    recu_il_y_a: 'il y a 5 h', age_minutes: 300,
    intention: 'SPAM', confiance: 99,
    reponse_suggeree: 'Classé indésirable — aucune réponse, expéditeur bloqué.',
    auto_repondable: true, potentiel_fcfa: 0,
  },
  {
    id: 'msg-8', reseau: 'WHATSAPP', auteur: '+228 93 21 77 04 · Boutique Kpalimé',
    contenu: 'Bonjour, quels sont vos prix pour les boissons ? Je démarre une buvette',
    recu_il_y_a: 'il y a 1 h', age_minutes: 60,
    intention: 'PRIX', confiance: 93,
    reponse_suggeree: 'Bonjour ! Prix grossiste boissons : eau 1,5L (pack 12) 4 200 F · soda 33cl (pack 24) 9 800 F · bière locale 33cl (pack 24) 11 200 F. Pour une buvette qui démarre, le combo eau + soda est le plus rentable (marge revente ~25%). Kpalimé n\'est pas encore dans nos tournées — dites-moi votre volume mensuel et je vois avec la logistique.',
    auto_repondable: false, potentiel_fcfa: 700_000, zone: 'Plateaux',
  },
]
