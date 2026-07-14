/**
 * Studio social — calendrier éditorial généré, contenus rédigés, attribution.
 *
 * Le principe : on ne demande pas au responsable marketing « qu'est-ce qu'on
 * publie demain ? ». On lui présente ce que l'IA publierait, avec la raison
 * commerciale derrière chaque post (un surstock à écouler, un jour de paie qui
 * arrive, une rupture qui inquiète les clients), et il valide ou il corrige.
 *
 * Toute la génération est déterministe : les posts se déduisent des registres
 * (stock, campagnes, zones), donc ils changent quand l'entreprise change, et
 * pas quand on rafraîchit la page.
 */

import {
  COMPTES_SOCIAUX, RYTHMES_COMMERCIAUX, INBOX_SOCIAL,
  type ReseauSocial, type MessageSocial,
} from './registries/social-registry'
import { buildCombosStockIA, type ComboStockIA } from './marketing-combo-stock-builder'
import { ZONES_BLANCHES } from './registries/marketing-registry'
import { ENTREPRISE_REGISTRY } from './registries/entreprise-registry'
import { AUJOURDHUI } from './automation/garde-fous'
import { formatFcfa } from './utils'

const MARQUE = ENTREPRISE_REGISTRY.nom
const WHATSAPP_CTA = 'https://wa.me/22890001212'

export type AnglePost =
  | 'ECOULEMENT' | 'PROMO' | 'PREUVE_SOCIALE' | 'EDUCATION' | 'DISPONIBILITE' | 'ACQUISITION'

export const ANGLE_META: Record<AnglePost, { label: string; couleur: string; but: string }> = {
  ECOULEMENT: { label: 'Écoulement stock', couleur: 'bg-violet-100 text-violet-700', but: 'Vider un surstock qui coûte de la trésorerie' },
  PROMO: { label: 'Promotion', couleur: 'bg-amber-100 text-amber-700', but: 'Déclencher la commande maintenant' },
  PREUVE_SOCIALE: { label: 'Preuve sociale', couleur: 'bg-emerald-100 text-emerald-700', but: 'Rassurer le détaillant qui hésite encore' },
  EDUCATION: { label: 'Contenu utile', couleur: 'bg-sky-100 text-sky-700', but: 'Construire l\'autorité — le contenu qui fait suivre la page' },
  DISPONIBILITE: { label: 'Stock & livraison', couleur: 'bg-slate-100 text-slate-700', but: 'Répondre à la question que tous posent en privé' },
  ACQUISITION: { label: 'Conquête de zone', couleur: 'bg-pink-100 text-pink-700', but: 'Faire entrer des détaillants d\'une zone non couverte' },
}

export type StatutPost = 'BROUILLON_IA' | 'A_VALIDER' | 'PROGRAMME' | 'PUBLIE'

export const STATUT_POST_STYLE: Record<StatutPost, string> = {
  BROUILLON_IA: 'bg-slate-100 text-slate-600',
  A_VALIDER: 'bg-amber-100 text-amber-800',
  PROGRAMME: 'bg-sky-100 text-sky-800',
  PUBLIE: 'bg-emerald-100 text-emerald-800',
}

export interface PostSocial {
  id: string
  date: string
  jour_label: string
  heure: string
  reseau: ReseauSocial
  angle: AnglePost
  statut: StatutPost
  accroche: string
  corps: string
  hashtags: string[]
  cta: string
  visuel_suggere: string
  produit?: string
  /** La raison commerciale : pourquoi ce post, pourquoi ce jour. */
  pourquoi: string
  score_engagement: number
  /** Renseigné une fois publié. */
  resultats?: {
    portee: number
    clics: number
    leads: number
    commandes: number
    ca_attribue: number
  }
}

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

function dateDecalee(jours: number): string {
  const d = new Date(AUJOURDHUI)
  d.setDate(d.getDate() + jours)
  return d.toISOString().slice(0, 10)
}

function libelleJour(date: string): string {
  const d = new Date(date)
  return `${JOURS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Libellé « Lundi 14/07 » pour une date ISO — utilisé par le composer et la vue semaine. */
export function formatJourLabel(date: string): string {
  return libelleJour(date)
}

/** Les N prochains jours à partir d'aujourd'hui, pour proposer une date de publication. */
export function prochainsJours(n = 14): { date: string; label: string }[] {
  return Array.from({ length: n }, (_, j) => {
    const date = dateDecalee(j)
    return { date, label: libelleJour(date) }
  })
}

/** Créneaux de publication récurrents, alignés sur les heures où l'audience est là. */
export const CRENEAUX_PUBLICATION = ['07:30', '12:30', '19:30', '21:00']

/** Le rythme commercial qui tombe ce jour-là — la raison de publier maintenant. */
function rythmeDuJour(date: string): string | undefined {
  const d = new Date(date)
  const jourMois = d.getDate()
  const jourSemaine = d.getDay()

  const paie = RYTHMES_COMMERCIAUX.find(r => r.jours_mois?.includes(jourMois))
  if (paie) return paie.libelle

  const hebdo = RYTHMES_COMMERCIAUX.find(r => r.jours_semaine?.includes(jourSemaine))
  return hebdo?.libelle
}

/* ------------------------------------------------------------------ */
/* Génération des contenus                                             */
/* ------------------------------------------------------------------ */

function postEcoulement(combo: ComboStockIA, date: string, index: number): PostSocial {
  const lent = combo.lent
  return {
    id: `post-eco-${index}`,
    date,
    jour_label: libelleJour(date),
    heure: '07:30',
    reseau: 'WHATSAPP',
    angle: 'ECOULEMENT',
    statut: 'A_VALIDER',
    accroche: `${lent.nom} — prix cassé cette semaine`,
    corps: `Détaillants, ${combo.offre}\n\nStock disponible immédiatement à ${lent.entrepot}, livraison sous 48 h.\nMarge revente estimée : ${Math.round(combo.marge_combo_pct)}%.\n\nRépondez « COMBO » et je vous prépare le devis.`,
    hashtags: ['#Prospera', '#GrossisteTogo', '#Lomé', '#PrixGrossiste'],
    cta: `Commander : ${WHATSAPP_CTA}`,
    visuel_suggere: `Photo produit ${lent.nom} sur palette, étiquette prix barrée → prix promo, logo ${MARQUE} en bas à droite. Format carré, fond neutre.`,
    produit: lent.nom,
    pourquoi: `${lent.couverture_jours} jours de couverture en entrepôt · ${formatFcfa(lent.valeur_immobilisee_fcfa)} F immobilisés · ${formatFcfa(lent.cout_stock_lent_mois_fcfa)} F/mois de coût de portage`,
    score_engagement: combo.severite === 'CRITIQUE' ? 82 : 68,
  }
}

function postEducation(date: string, index: number): PostSocial {
  const sujets = [
    {
      accroche: '3 erreurs de stock qui coûtent 50 000 F par mois à une épicerie',
      corps: '1. Commander à la rupture → vous vendez 0 pendant 2 jours.\n2. Stocker 2 mois de savon → votre argent dort au lieu de tourner.\n3. Ne pas connaître vos 5 produits qui font 60% du chiffre.\n\nLa règle simple : 15 jours de stock sur vos produits qui tournent, jamais plus de 30 sur le reste.',
      visuel: 'Carrousel 3 slides, fond couleur marque, un chiffre géant par slide.',
    },
    {
      accroche: 'Combien vous rapporte réellement un pack d\'eau ?',
      corps: 'Achat grossiste : 4 200 F le pack de 12.\nRevente : 500 F la bouteille → 6 000 F.\nMarge : 1 800 F, soit 43% — sur un produit qui tourne en 4 jours.\n\nC\'est le produit qui fait revenir le client toutes les semaines. Ne le mettez jamais en rupture.',
      visuel: 'Infographie calcul de marge, pack d\'eau photographié, flèches et chiffres.',
    },
    {
      accroche: 'Vendre à crédit à vos clients : la règle des 3 commandes',
      corps: 'N\'ouvrez jamais un crédit à un client qui n\'a pas payé comptant 3 fois de suite.\n\nC\'est la règle que nous appliquons nous-mêmes, et elle nous a évité l\'essentiel des impayés. Un client qui refuse de payer comptant 3 fois ne paiera pas à crédit non plus.',
      visuel: 'Texte sur fond uni, typographie forte. Pas de photo — le conseil se suffit.',
    },
  ]
  const sujet = sujets[index % sujets.length]

  return {
    id: `post-edu-${index}`,
    date,
    jour_label: libelleJour(date),
    heure: '12:30',
    reseau: 'FACEBOOK',
    angle: 'EDUCATION',
    statut: 'PROGRAMME',
    accroche: sujet.accroche,
    corps: sujet.corps,
    hashtags: ['#CommerceTogo', '#GestionBoutique', '#Prospera', '#Détaillants'],
    cta: `Catalogue grossiste : ${WHATSAPP_CTA}`,
    visuel_suggere: sujet.visuel,
    pourquoi: 'Le contenu utile fait suivre la page par les gérants qui n\'achètent pas encore. C\'est ce qui alimente le vivier — un post promo ne convertit que des gens qui nous connaissent déjà.',
    score_engagement: 74,
  }
}

function postPreuveSociale(date: string, index: number): PostSocial {
  return {
    id: `post-preuve-${index}`,
    date,
    jour_label: libelleJour(date),
    heure: '19:30',
    reseau: 'FACEBOOK',
    angle: 'PREUVE_SOCIALE',
    statut: 'A_VALIDER',
    accroche: 'Superette Kara : de 900 K à 3,2 M de chiffre mensuel en 8 mois',
    corps: `« Avant, je commandais chez trois grossistes différents et je passais mes matinées au marché. Aujourd'hui je commande sur WhatsApp le soir, je suis livré le surlendemain, et je sais ce que je gagne sur chaque carton. »\n\n— Superette Kara, partenaire ${MARQUE} depuis octobre.\n\nVous tenez une boutique ? Ouvrez votre compte grossiste en 24 h.`,
    hashtags: ['#Témoignage', '#Prospera', '#Kara', '#Réussite'],
    cta: `Ouvrir un compte : ${WHATSAPP_CTA}`,
    visuel_suggere: 'Photo du gérant devant sa boutique, en situation, lumière naturelle. Citation en surimpression. Surtout pas de photo de stock générique.',
    pourquoi: 'Un détaillant ne croit pas une marque, il croit un autre détaillant. Le témoignage est le contenu qui convertit le mieux en B2B de proximité (leads × 2,4 vs post produit).',
    score_engagement: 88,
  }
}

function postAcquisition(date: string, index: number): PostSocial {
  const zone = ZONES_BLANCHES.filter(z => z.priorite_ia >= 80)[index % 2] ?? ZONES_BLANCHES[0]
  return {
    id: `post-acq-${index}`,
    date,
    jour_label: libelleJour(date),
    heure: '21:00',
    reseau: 'TIKTOK',
    angle: 'ACQUISITION',
    statut: 'BROUILLON_IA',
    accroche: `${zone.zone} — on arrive chez vous`,
    corps: `Vidéo 20 s : le camion qui charge à l'entrepôt → la route → la livraison devant une boutique de ${zone.zone} → le gérant qui range ses cartons.\n\nVoix off : « Commandez le soir, vous êtes livré le surlendemain. Prix grossiste, sans minimum impossible. ${zone.zone}, on vous livre maintenant. »`,
    hashtags: ['#Togo', `#${zone.zone.replace(/\s/g, '')}`, '#Grossiste', '#Business228'],
    cta: `WhatsApp en bio : ${WHATSAPP_CTA}`,
    visuel_suggere: 'Vidéo verticale 9:16, plans courts (2 s max), son tendance + voix off en français. Filmé au téléphone — le sur-produit tue la crédibilité sur TikTok.',
    pourquoi: `Zone à ${zone.saturation_pct}% de saturation, ${zone.partenaires_actuels} partenaire(s), potentiel ${formatFcfa(zone.potentiel_ca_mois)} F/mois. Ciblage géographique 5 km — le coût par lead TikTok est le plus bas de tous les canaux.`,
    score_engagement: zone.priorite_ia,
  }
}

function postDisponibilite(date: string, index: number): PostSocial {
  return {
    id: `post-dispo-${index}`,
    date,
    jour_label: libelleJour(date),
    heure: '07:30',
    reseau: 'WHATSAPP',
    angle: 'DISPONIBILITE',
    statut: 'PROGRAMME',
    accroche: 'Le point stock de la semaine',
    corps: 'Disponible immédiatement : eau 1,5L · riz 25 kg · soda 33cl · sucre · farine.\nStock tendu : huile 5L (réappro sous 6 j).\nEn rupture : savon ménager — vous êtes prévenus dès l\'arrivée, sans repasser commande.\n\nOn préfère vous le dire que vous le laisser découvrir.',
    hashtags: ['#Prospera', '#Stock'],
    cta: `Commander : ${WHATSAPP_CTA}`,
    visuel_suggere: 'Liste visuelle simple : pastilles vertes / oranges / rouges par produit. Lisible en 3 secondes sur un statut WhatsApp.',
    pourquoi: 'La rupture non annoncée est ce qui fait partir un détaillant chez le concurrent. Annoncée, elle devient une preuve d\'honnêteté — et elle désengorge la boîte de réception (6 messages « vous avez du savon ? » cette semaine).',
    score_engagement: 71,
  }
}

/* ------------------------------------------------------------------ */
/* Calendrier                                                          */
/* ------------------------------------------------------------------ */

/** Les 7 prochains jours, remplis à partir de ce que l'entreprise a réellement à écouler. */
export function buildCalendrierSocial(): PostSocial[] {
  const combos = buildCombosStockIA()
  const posts: PostSocial[] = []

  for (let j = 0; j < 7; j++) {
    const date = dateDecalee(j)
    const jourSemaine = new Date(date).getDay()

    // Le WhatsApp du matin part tous les jours ouvrés : c'est le canal de vente.
    if (jourSemaine !== 0) {
      const combo = combos[j % Math.max(1, combos.length)]
      posts.push(combo && j % 2 === 0
        ? postEcoulement(combo, date, j)
        : postDisponibilite(date, j))
    }

    // Facebook : un contenu utile, un témoignage — en alternance.
    if (jourSemaine === 1 || jourSemaine === 4) {
      posts.push(postEducation(date, j))
    }
    if (jourSemaine === 2) {
      posts.push(postPreuveSociale(date, j))
    }
    // TikTok le soir, quand l'audience jeune est là.
    if (jourSemaine === 3 || jourSemaine === 5) {
      posts.push(postAcquisition(date, j))
    }
  }

  return posts.map(p => {
    const rythme = rythmeDuJour(p.date)
    return rythme ? { ...p, pourquoi: `${rythme} — ${p.pourquoi}` } : p
  })
}

/** Les publications récentes et ce qu'elles ont rapporté — l'attribution, pas la portée. */
export function buildPostsPublies(): PostSocial[] {
  return [
    {
      id: 'pub-1', date: dateDecalee(-2), jour_label: libelleJour(dateDecalee(-2)), heure: '07:30',
      reseau: 'WHATSAPP', angle: 'PROMO', statut: 'PUBLIE',
      accroche: 'Combo Eau + Riz — 3 jours seulement',
      corps: 'Pack eau 1,5L + sac riz 25 kg à 21 400 F au lieu de 22 200 F.',
      hashtags: ['#Prospera'], cta: WHATSAPP_CTA,
      visuel_suggere: 'Photo combo sur palette.',
      produit: 'Eau 1,5L + Riz 25 kg',
      pourquoi: 'Surstock eau — 62 jours de couverture.',
      score_engagement: 84,
      resultats: { portee: 1_180, clics: 214, leads: 18, commandes: 14, ca_attribue: 6_400_000 },
    },
    {
      id: 'pub-2', date: dateDecalee(-3), jour_label: libelleJour(dateDecalee(-3)), heure: '12:30',
      reseau: 'FACEBOOK', angle: 'EDUCATION', statut: 'PUBLIE',
      accroche: 'Pourquoi votre boutique perd de l\'argent en stockant trop',
      corps: 'Le stock qui dort, c\'est de l\'argent qui ne travaille pas.',
      hashtags: ['#GestionBoutique'], cta: WHATSAPP_CTA,
      visuel_suggere: 'Infographie.',
      pourquoi: 'Contenu d\'autorité — alimente le vivier.',
      score_engagement: 79,
      resultats: { portee: 24_600, clics: 890, leads: 22, commandes: 5, ca_attribue: 3_100_000 },
    },
    {
      id: 'pub-3', date: dateDecalee(-5), jour_label: libelleJour(dateDecalee(-5)), heure: '21:00',
      reseau: 'TIKTOK', angle: 'ACQUISITION', statut: 'PUBLIE',
      accroche: 'Une journée dans notre entrepôt de Lomé Port',
      corps: 'Vidéo coulisses — chargement, tournée, livraison.',
      hashtags: ['#Togo', '#Business228'], cta: WHATSAPP_CTA,
      visuel_suggere: 'Vertical 9:16.',
      pourquoi: 'Notoriété + recrutement de jeunes gérants.',
      score_engagement: 91,
      resultats: { portee: 64_200, clics: 1_420, leads: 17, commandes: 3, ca_attribue: 1_800_000 },
    },
    {
      id: 'pub-4', date: dateDecalee(-6), jour_label: libelleJour(dateDecalee(-6)), heure: '19:30',
      reseau: 'FACEBOOK', angle: 'PREUVE_SOCIALE', statut: 'PUBLIE',
      accroche: 'Boutique Akossombo — 3 ans avec nous',
      corps: 'Témoignage gérant.',
      hashtags: ['#Témoignage'], cta: WHATSAPP_CTA,
      visuel_suggere: 'Portrait gérant.',
      pourquoi: 'Preuve sociale — meilleur convertisseur B2B.',
      score_engagement: 88,
      resultats: { portee: 18_400, clics: 620, leads: 14, commandes: 6, ca_attribue: 4_200_000 },
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Performance & attribution                                           */
/* ------------------------------------------------------------------ */

export interface PerfSocial {
  abonnes_total: number
  portee_30j: number
  leads_30j: number
  commandes_30j: number
  /** Tout le CA passé par les canaux sociaux — dont l'essentiel serait rentré sans eux. */
  ca_attribue_30j: number
  /** La part réellement créée : nouveaux clients et réactivations. C'est elle qui porte le ROI. */
  ca_incremental_30j: number
  /** Le budget réellement dépensé — publicité + production de contenu. */
  cout_30j: number
  marge_incrementale_30j: number
  roi_pct: number
  cout_par_lead: number
  /** Ce que la file d'attente ferait gagner si elle partait aujourd'hui. */
  ca_en_attente: number
}

const COUT_SOCIAL_MENSUEL = 420_000

/** Marge brute moyenne du distributeur — le ROI se calcule dessus, jamais sur le CA. */
const TAUX_MARGE = 0.13

export function buildPerfSocial(calendrier: PostSocial[]): PerfSocial {
  const leads = COMPTES_SOCIAUX.reduce((s, c) => s + c.leads_30j, 0)
  const incremental = COMPTES_SOCIAUX.reduce((s, c) => s + c.ca_incremental_30j, 0)
  const marge = Math.round(incremental * TAUX_MARGE)

  return {
    abonnes_total: COMPTES_SOCIAUX.reduce((s, c) => s + c.abonnes, 0),
    portee_30j: COMPTES_SOCIAUX.reduce((s, c) => s + c.portee_30j, 0),
    leads_30j: leads,
    commandes_30j: COMPTES_SOCIAUX.reduce((s, c) => s + c.commandes_30j, 0),
    ca_attribue_30j: COMPTES_SOCIAUX.reduce((s, c) => s + c.ca_attribue_30j, 0),
    ca_incremental_30j: incremental,
    cout_30j: COUT_SOCIAL_MENSUEL,
    marge_incrementale_30j: marge,
    roi_pct: Math.round(((marge - COUT_SOCIAL_MENSUEL) / COUT_SOCIAL_MENSUEL) * 100),
    cout_par_lead: leads > 0 ? Math.round(COUT_SOCIAL_MENSUEL / leads) : 0,
    ca_en_attente: calendrier
      .filter(p => p.statut === 'A_VALIDER' || p.statut === 'BROUILLON_IA')
      .length * 1_200_000,
  }
}

/* ------------------------------------------------------------------ */
/* Réécriture — variantes d'accroche générées par angle                */
/* ------------------------------------------------------------------ */

export interface VariantePost {
  /** L'intention de la réécriture — pourquoi cette version peut mieux marcher. */
  ton: string
  accroche: string
  note: string
}

const cible = (p: PostSocial): string => p.produit ?? MARQUE

/**
 * Banque de réécritures par angle. On ne réécrit que l'accroche (le levier le
 * plus rentable) : c'est le premier mot qui décide qu'on lit la suite ou qu'on
 * scrolle. Chaque variante porte un ton différent pour que le responsable
 * marketing arbitre en connaissance de cause plutôt qu'au hasard.
 */
const VARIANTES: Record<AnglePost, { ton: string; make: (p: PostSocial) => string; note: string }[]> = {
  ECOULEMENT: [
    { ton: 'Urgence', make: p => `${cible(p)} — dernier lot à ce prix, jusqu'à épuisement`, note: 'La rareté déclenche la commande immédiate sur un détaillant qui hésite.' },
    { ton: 'Bénéfice marge', make: p => `${cible(p)} : reconstituez votre marge, prix grossiste cassé`, note: 'Parle au portefeuille du gérant plutôt qu\'au produit.' },
    { ton: 'Question', make: p => `Combien vous coûte un carton de ${cible(p)} qui ne tourne pas ?`, note: 'La question implique le lecteur et ouvre sur la promo comme réponse.' },
  ],
  PROMO: [
    { ton: 'Chiffré', make: p => `${cible(p)} : l'offre qui rembourse votre commande en 3 jours`, note: 'Un chiffre concret bat un adjectif comme « exceptionnel ».' },
    { ton: 'Compte à rebours', make: () => `72 h seulement — après, retour au prix normal`, note: 'La date de fin crée l\'action ; sans échéance, on remet à plus tard.' },
    { ton: 'Direct', make: p => `Commandez ${cible(p)} aujourd'hui, payez moins`, note: 'Verbe d\'action + bénéfice immédiat, sans détour.' },
  ],
  PREUVE_SOCIALE: [
    { ton: 'Résultat', make: () => `« J'ai doublé mon chiffre en 8 mois » — un gérant comme vous`, note: 'Le résultat chiffré à la première personne est le plus crédible.' },
    { ton: 'Identification', make: () => `Elle tenait une petite boutique. Aujourd'hui elle fournit son quartier.`, note: 'Le détaillant se projette dans une trajectoire, pas dans une pub.' },
    { ton: 'Objection levée', make: () => `« Je croyais que c'était réservé aux gros. » Puis j'ai testé.`, note: 'Répond à l\'objection tacite du petit commerçant qui n\'ose pas.' },
  ],
  EDUCATION: [
    { ton: 'Chiffré', make: () => `Ce détail de gestion vous coûte 50 000 F par mois sans que vous le voyiez`, note: 'La perte évitée motive plus que le gain hypothétique.' },
    { ton: 'Liste', make: () => `3 réflexes de stock que les boutiques qui durent ont en commun`, note: 'Le format « X points » promet une lecture courte et utile.' },
    { ton: 'Contre-intuitif', make: () => `Stocker plus ne vous rend pas plus riche — voici pourquoi`, note: 'Casser une croyance répandue arrête le scroll.' },
  ],
  DISPONIBILITE: [
    { ton: 'Rassurant', make: () => `Le point stock de la semaine — pour commander sans mauvaise surprise`, note: 'Transforme une info logistique en preuve de fiabilité.' },
    { ton: 'Direct', make: () => `Disponible aujourd'hui, tendu demain : ce qu'il faut commander maintenant`, note: 'Crée une hiérarchie d\'urgence dans la liste.' },
    { ton: 'Transparence', make: () => `On vous dit ce qui manque avant que vous le découvriez en rayon`, note: 'L\'honnêteté sur la rupture fidélise plus qu\'un catalogue parfait.' },
  ],
  ACQUISITION: [
    { ton: 'Proximité', make: p => `${cible(p)} : on livre chez vous, prix grossiste, sans minimum impossible`, note: 'Lève les deux freins classiques : distance et volume minimum.' },
    { ton: 'Preuve visuelle', make: p => `Le camion charge, prend la route, vous livre — ${cible(p)}, c'est parti`, note: 'La vidéo « coulisses » crédibilise mieux qu\'un slogan.' },
    { ton: 'Invitation', make: p => `Vous tenez une boutique à ${cible(p)} ? Ouvrez votre compte en 24 h`, note: 'Un appel à l\'action ciblé sur la zone convertit mieux.' },
  ],
}

/** Les 3 réécritures que l'IA proposerait pour ce post, déterministes par angle. */
export function buildVariantesPost(post: PostSocial): VariantePost[] {
  return (VARIANTES[post.angle] ?? []).map(v => ({
    ton: v.ton,
    accroche: v.make(post),
    note: v.note,
  }))
}

/* ------------------------------------------------------------------ */
/* Mix éditorial & répartition par réseau                              */
/* ------------------------------------------------------------------ */

export interface MixCalendrier {
  total: number
  a_valider: number
  programmes: number
  par_angle: { angle: AnglePost; n: number; part_pct: number }[]
  par_reseau: { reseau: ReseauSocial; n: number; part_pct: number }[]
}

/** Ce que le calendrier dit de la stratégie : trop de promo tue la promo. */
export function buildMixCalendrier(posts: PostSocial[]): MixCalendrier {
  const total = posts.length || 1
  const compte = <K extends string>(get: (p: PostSocial) => K) => {
    const map = new Map<K, number>()
    for (const p of posts) map.set(get(p), (map.get(get(p)) ?? 0) + 1)
    return [...map.entries()].map(([k, n]) => ({ k, n, part_pct: Math.round((n / total) * 100) }))
  }

  return {
    total: posts.length,
    a_valider: posts.filter(p => p.statut === 'A_VALIDER' || p.statut === 'BROUILLON_IA').length,
    programmes: posts.filter(p => p.statut === 'PROGRAMME' || p.statut === 'PUBLIE').length,
    par_angle: compte(p => p.angle).sort((a, b) => b.n - a.n).map(x => ({ angle: x.k, n: x.n, part_pct: x.part_pct })),
    par_reseau: compte(p => p.reseau).sort((a, b) => b.n - a.n).map(x => ({ reseau: x.k, n: x.n, part_pct: x.part_pct })),
  }
}

export interface ImpactProjete {
  portee_estimee: number
  interactions_estimees: number
  leads_estimes: number
  /** Le canal de référence sur lequel la projection s'appuie. */
  base_reseau: ReseauSocial
}

/**
 * Ce qu'un post devrait produire, projeté depuis la performance réelle du canal
 * (portée quotidienne moyenne × engagement mesuré) et pondéré par son score.
 * Déterministe : deux posts identiques projettent le même impact.
 */
export function projeterImpactPost(post: PostSocial): ImpactProjete {
  const c = COMPTES_SOCIAUX.find(x => x.reseau === post.reseau)
  if (!c) return { portee_estimee: 0, interactions_estimees: 0, leads_estimes: 0, base_reseau: post.reseau }
  // 70 = score de référence d'un post « correct ». Au-dessus, on projette plus large.
  const facteur = post.score_engagement / 70
  const portee = Math.round((c.portee_30j / 30) * facteur)
  const interactions = Math.round(portee * (c.engagement_pct / 100))
  const leads = Math.max(1, Math.round(interactions * 0.02 * facteur))
  return { portee_estimee: portee, interactions_estimees: interactions, leads_estimes: leads, base_reseau: post.reseau }
}

export interface RepartitionReseau {
  reseau: ReseauSocial
  connecte: boolean
  abonnes: number
  croissance_30j_pct: number
  portee_30j: number
  engagement_pct: number
  leads_30j: number
  ca_incremental_30j: number
  part_leads_pct: number
  ca_par_lead: number
}

/** Où va réellement le résultat, réseau par réseau — pour arbitrer le budget. */
export function buildRepartitionReseau(): RepartitionReseau[] {
  const totalLeads = COMPTES_SOCIAUX.reduce((s, c) => s + c.leads_30j, 0) || 1
  return [...COMPTES_SOCIAUX]
    .sort((a, b) => b.ca_incremental_30j - a.ca_incremental_30j)
    .map(c => ({
      reseau: c.reseau,
      connecte: c.connecte,
      abonnes: c.abonnes,
      croissance_30j_pct: c.croissance_30j_pct,
      portee_30j: c.portee_30j,
      engagement_pct: c.engagement_pct,
      leads_30j: c.leads_30j,
      ca_incremental_30j: c.ca_incremental_30j,
      part_leads_pct: Math.round((c.leads_30j / totalLeads) * 100),
      ca_par_lead: c.leads_30j > 0 ? Math.round(c.ca_incremental_30j / c.leads_30j) : 0,
    }))
}

/* ------------------------------------------------------------------ */
/* Boîte de réception                                                  */
/* ------------------------------------------------------------------ */

export interface SyntheseInbox {
  total: number
  a_traiter: number
  auto_repondables: number
  hors_sla: number
  potentiel_fcfa: number
  messages: MessageSocial[]
}

/** Le SLA est la seule métrique qui compte ici : un message d'achat non répondu en 1 h est un client perdu. */
export function buildInboxSocial(): SyntheseInbox {
  const messages = [...INBOX_SOCIAL]
    .filter(m => m.intention !== 'SPAM')
    .sort((a, b) => b.potentiel_fcfa - a.potentiel_fcfa)

  const horsSla = messages.filter(m => {
    const sla = m.intention === 'COMMANDE' || m.intention === 'RECLAMATION' ? 60 : 120
    return m.age_minutes > sla
  })

  return {
    total: INBOX_SOCIAL.length,
    a_traiter: messages.filter(m => !m.auto_repondable).length,
    auto_repondables: messages.filter(m => m.auto_repondable).length,
    hors_sla: horsSla.length,
    potentiel_fcfa: messages.reduce((s, m) => s + m.potentiel_fcfa, 0),
    messages,
  }
}

export { COMPTES_SOCIAUX, RYTHMES_COMMERCIAUX }
