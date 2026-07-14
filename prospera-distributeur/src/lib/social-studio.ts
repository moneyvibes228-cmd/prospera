/**
 * Studio réseaux sociaux — création manuelle, idées de contenu, modèles.
 *
 * Cette couche complète la génération automatique (`social-builder`) par ce que
 * l'utilisateur produit lui-même : posts rédigés à la main, idées suggérées par
 * l'IA à partir du terrain (stock, zones, rythmes), et modèles réutilisables.
 *
 * Rien n'est stocké ici : la persistance passe par le journal marketing
 * (`marketing-workflow`), ces fonctions ne font que produire/transformer des
 * objets `PostSocial` déterministes à partir de ce journal.
 */
import {
  formatJourLabel,
  type PostSocial, type AnglePost,
} from './social-builder'
import { buildCombosStockIA } from './marketing-combo-stock-builder'
import { ZONES_BLANCHES } from './registries/marketing-registry'
import { ENTREPRISE_REGISTRY } from './registries/entreprise-registry'
import type { ReseauSocial } from './registries/social-registry'
import type { MarketingActionEntry } from './marketing-workflow'
import { formatFcfa } from './utils'

const WHATSAPP_CTA = 'https://wa.me/22890001212'
const MARQUE = ENTREPRISE_REGISTRY.nom

/* ------------------------------------------------------------------ */
/* Brouillon — le format d'un post rédigé/édité par l'utilisateur      */
/* ------------------------------------------------------------------ */

export interface PostBrouillonInput {
  reseau: ReseauSocial
  angle: AnglePost
  date: string
  heure: string
  accroche: string
  corps: string
  hashtags: string[]
  cta: string
  visuel_suggere: string
}

/** Reconstruit un PostSocial complet depuis un brouillon persisté. */
export function postFromBrouillon(id: string, input: PostBrouillonInput): PostSocial {
  return {
    id,
    date: input.date,
    jour_label: formatJourLabel(input.date),
    heure: input.heure,
    reseau: input.reseau,
    angle: input.angle,
    statut: 'A_VALIDER',
    accroche: input.accroche,
    corps: input.corps,
    hashtags: input.hashtags,
    cta: input.cta || `Commander : ${WHATSAPP_CTA}`,
    visuel_suggere: input.visuel_suggere || 'À définir — brief visuel à préparer.',
    pourquoi: 'Post créé manuellement par l\'équipe communication.',
    score_engagement: 60,
  }
}

/** Applique une replanification (date/heure) à un post, en recalculant le libellé du jour. */
export function appliquerReprogrammation(
  post: PostSocial,
  override?: { date?: string; heure?: string },
): PostSocial {
  if (!override) return post
  const date = override.date ?? post.date
  return {
    ...post,
    date,
    jour_label: formatJourLabel(date),
    heure: override.heure ?? post.heure,
  }
}

/**
 * Reconstitue les posts créés par l'utilisateur depuis le journal marketing.
 * On ignore ceux qui ont été supprimés.
 */
export function postsCreesDepuisJournal(journal: MarketingActionEntry[]): PostSocial[] {
  return journal
    .filter(e => (e.kind === 'POST_CREE' || e.kind === 'POST_DUPLIQUE') && e.payload)
    .map(e => postFromBrouillon(e.refId, e.payload as unknown as PostBrouillonInput))
}

/* ------------------------------------------------------------------ */
/* Duplication vers un autre réseau                                    */
/* ------------------------------------------------------------------ */

/** Adapte le format d'un texte au réseau cible (longueur, ton, appel à l'action). */
export function adapterPourReseau(post: PostSocial, cible: ReseauSocial): PostBrouillonInput {
  const base: PostBrouillonInput = {
    reseau: cible,
    angle: post.angle,
    date: post.date,
    heure: post.heure,
    accroche: post.accroche,
    corps: post.corps,
    hashtags: post.hashtags,
    cta: post.cta,
    visuel_suggere: post.visuel_suggere,
  }

  if (cible === 'WHATSAPP') {
    return {
      ...base,
      heure: '07:30',
      corps: `${post.corps}\n\nRépondez à ce message et je vous prépare le devis.`,
      hashtags: [],
      cta: `Commander : ${WHATSAPP_CTA}`,
      visuel_suggere: 'Statut WhatsApp — visuel lisible en 3 s, prix bien visible.',
    }
  }
  if (cible === 'TIKTOK') {
    return {
      ...base,
      heure: '21:00',
      corps: `Vidéo courte (20 s) : ${post.accroche}. Montrez le produit, la livraison, un gérant satisfait. Voix off en français, son tendance.`,
      hashtags: Array.from(new Set([...post.hashtags, '#Togo', '#Business228'])),
      cta: `WhatsApp en bio : ${WHATSAPP_CTA}`,
      visuel_suggere: 'Vidéo verticale 9:16, plans courts (2 s max), filmé au téléphone.',
    }
  }
  if (cible === 'FACEBOOK') {
    return {
      ...base,
      heure: '12:30',
      hashtags: Array.from(new Set([...post.hashtags, '#Prospera', '#Togo'])),
      cta: `Catalogue grossiste : ${WHATSAPP_CTA}`,
      visuel_suggere: 'Image paysage 1200×630, texte court en surimpression.',
    }
  }
  return {
    ...base,
    heure: '20:30',
    hashtags: Array.from(new Set([...post.hashtags, '#Prospera'])),
    visuel_suggere: 'Visuel carré 1080×1080 soigné, cohérent avec la charte.',
  }
}

/* ------------------------------------------------------------------ */
/* Générateur d'idées — à partir du terrain réel                       */
/* ------------------------------------------------------------------ */

export interface IdeeContenu {
  id: string
  titre: string
  source: string
  angle: AnglePost
  reseau_suggere: ReseauSocial
  accroche: string
  corps: string
  hashtags: string[]
  visuel: string
}

/**
 * Des idées de posts déduites de ce que l'entreprise vit maintenant :
 * un surstock à écouler, une zone à conquérir, un rythme commercial qui arrive.
 * Le but est de ne jamais être « en panne d'idées » — l'actualité de la boîte
 * suffit à alimenter la page.
 */
export function buildIdeesContenu(): IdeeContenu[] {
  const idees: IdeeContenu[] = []

  // 1. Écoulement — depuis les combos stock IA
  const combos = buildCombosStockIA().slice(0, 2)
  combos.forEach((c, i) => {
    idees.push({
      id: `idee-eco-${i}`,
      titre: `Écouler ${c.lent.nom.split(' ').slice(0, 3).join(' ')}`,
      source: `Surstock : ${c.lent.couverture_jours} j de couverture · ${formatFcfa(c.lent.valeur_immobilisee_fcfa)} F immobilisés`,
      angle: 'ECOULEMENT',
      reseau_suggere: 'WHATSAPP',
      accroche: `${c.lent.nom.split(' ').slice(0, 3).join(' ')} — prix cassé cette semaine`,
      corps: `Détaillants, ${c.offre}\n\nStock disponible à ${c.lent.entrepot}, livraison sous 48 h. Marge revente estimée : ${Math.round(c.marge_combo_pct)}%.`,
      hashtags: ['#Prospera', '#PrixGrossiste', '#Togo'],
      visuel: `Photo ${c.lent.nom.split(' ').slice(0, 2).join(' ')} sur palette, étiquette prix barrée.`,
    })
  })

  // 2. Conquête — depuis les zones blanches prioritaires
  ZONES_BLANCHES
    .filter(z => z.priorite_ia >= 80)
    .slice(0, 2)
    .forEach((z, i) => {
      idees.push({
        id: `idee-acq-${i}`,
        titre: `Conquérir ${z.zone}`,
        source: `Zone à ${z.saturation_pct}% de saturation · potentiel ${formatFcfa(z.potentiel_ca_mois)} F/mois`,
        angle: 'ACQUISITION',
        reseau_suggere: 'TIKTOK',
        accroche: `${z.zone} — on arrive chez vous`,
        corps: `Commandez le soir, vous êtes livré le surlendemain. Prix grossiste, sans minimum impossible. ${z.zone}, on vous livre maintenant.`,
        hashtags: ['#Togo', `#${z.zone.replace(/\s/g, '')}`, '#Grossiste'],
        visuel: 'Vidéo verticale : le camion qui livre une boutique de la zone.',
      })
    })

  // 3. Preuve sociale — evergreen
  idees.push({
    id: 'idee-preuve-0',
    titre: 'Témoignage d\'un détaillant',
    source: 'La preuve sociale convertit le mieux en B2B de proximité (leads × 2,4)',
    angle: 'PREUVE_SOCIALE',
    reseau_suggere: 'FACEBOOK',
    accroche: 'De 900 K à 3,2 M de chiffre mensuel en 8 mois',
    corps: `« Aujourd'hui je commande sur WhatsApp le soir, je suis livré le surlendemain, et je sais ce que je gagne sur chaque carton. » — partenaire ${MARQUE}.`,
    hashtags: ['#Témoignage', '#Prospera', '#Réussite'],
    visuel: 'Portrait du gérant devant sa boutique, citation en surimpression.',
  })

  // 4. Contenu utile — evergreen
  idees.push({
    id: 'idee-edu-0',
    titre: 'Conseil de gestion de stock',
    source: 'Le contenu utile fait suivre la page par les gérants qui n\'achètent pas encore',
    angle: 'EDUCATION',
    reseau_suggere: 'FACEBOOK',
    accroche: '3 erreurs de stock qui coûtent 50 000 F par mois à une épicerie',
    corps: '1. Commander à la rupture.\n2. Stocker 2 mois de savon.\n3. Ne pas connaître ses 5 produits qui font 60% du chiffre.\n\nLa règle : 15 jours de stock sur ce qui tourne, jamais plus de 30 sur le reste.',
    hashtags: ['#GestionBoutique', '#CommerceTogo', '#Prospera'],
    visuel: 'Carrousel 3 slides, un chiffre géant par slide.',
  })

  return idees
}

/* ------------------------------------------------------------------ */
/* Bibliothèque de modèles réutilisables                               */
/* ------------------------------------------------------------------ */

export interface ModeleContenu {
  id: string
  nom: string
  categorie: string
  angle: AnglePost
  reseau: ReseauSocial
  accroche: string
  corps: string
  hashtags: string[]
  cta: string
  visuel: string
}

/** Modèles prêts à remplir — la trame reste, on change le produit / le chiffre. */
export const MODELES_CONTENU: ModeleContenu[] = [
  {
    id: 'modele-promo-combo',
    nom: 'Promo combo produit',
    categorie: 'Vente',
    angle: 'PROMO',
    reseau: 'WHATSAPP',
    accroche: '[Produit] + [Produit] — l\'offre de la semaine',
    corps: 'Détaillants, cette semaine :\n[Produit A] + [Produit B] à [prix] F au lieu de [prix barré] F.\n\nStock disponible, livraison sous 48 h. Marge revente estimée : [X]%.',
    hashtags: ['#Prospera', '#PrixGrossiste'],
    cta: `Commander : ${WHATSAPP_CTA}`,
    visuel: 'Photo des deux produits ensemble, prix bien visible.',
  },
  {
    id: 'modele-dispo',
    nom: 'Point stock hebdomadaire',
    categorie: 'Fiabilité',
    angle: 'DISPONIBILITE',
    reseau: 'WHATSAPP',
    accroche: 'Le point stock de la semaine',
    corps: 'Disponible immédiatement : [liste].\nStock tendu : [produit] (réappro sous [X] j).\nEn rupture : [produit] — vous êtes prévenus dès l\'arrivée.',
    hashtags: ['#Prospera', '#Stock'],
    cta: `Commander : ${WHATSAPP_CTA}`,
    visuel: 'Liste à pastilles vertes / oranges / rouges par produit.',
  },
  {
    id: 'modele-temoignage',
    nom: 'Témoignage client',
    categorie: 'Preuve sociale',
    angle: 'PREUVE_SOCIALE',
    reseau: 'FACEBOOK',
    accroche: '[Nom boutique] : [résultat chiffré] en [durée]',
    corps: '« [Citation du gérant sur ce qui a changé]. »\n\n— [Nom], partenaire depuis [date].\n\nVous tenez une boutique ? Ouvrez votre compte grossiste en 24 h.',
    hashtags: ['#Témoignage', '#Prospera'],
    cta: `Ouvrir un compte : ${WHATSAPP_CTA}`,
    visuel: 'Portrait du gérant en situation, lumière naturelle.',
  },
  {
    id: 'modele-conseil',
    nom: 'Conseil de gestion',
    categorie: 'Contenu utile',
    angle: 'EDUCATION',
    reseau: 'FACEBOOK',
    accroche: '[N] erreurs qui coûtent de l\'argent à une boutique',
    corps: '1. [Erreur].\n2. [Erreur].\n3. [Erreur].\n\nLa règle simple : [conseil actionnable].',
    hashtags: ['#GestionBoutique', '#CommerceTogo'],
    cta: `Catalogue grossiste : ${WHATSAPP_CTA}`,
    visuel: 'Carrousel, un point par slide, chiffres en gros.',
  },
  {
    id: 'modele-conquete',
    nom: 'Ouverture de zone',
    categorie: 'Conquête',
    angle: 'ACQUISITION',
    reseau: 'TIKTOK',
    accroche: '[Zone] — on arrive chez vous',
    corps: 'Vidéo 20 s : le camion charge → la route → la livraison à [zone] → le gérant qui range.\nVoix off : « Commandez le soir, livré le surlendemain. Prix grossiste, sans minimum impossible. »',
    hashtags: ['#Togo', '#Grossiste', '#Business228'],
    cta: `WhatsApp en bio : ${WHATSAPP_CTA}`,
    visuel: 'Vidéo verticale 9:16, plans courts, son tendance.',
  },
]

/** Pré-remplit un brouillon depuis une idée. */
export function brouillonFromIdee(idee: IdeeContenu, date: string): PostBrouillonInput {
  return {
    reseau: idee.reseau_suggere,
    angle: idee.angle,
    date,
    heure: idee.reseau_suggere === 'TIKTOK' ? '21:00' : idee.reseau_suggere === 'FACEBOOK' ? '12:30' : '07:30',
    accroche: idee.accroche,
    corps: idee.corps,
    hashtags: idee.hashtags,
    cta: `Commander : ${WHATSAPP_CTA}`,
    visuel_suggere: idee.visuel,
  }
}

/** Pré-remplit un brouillon depuis un modèle. */
export function brouillonFromModele(modele: ModeleContenu, date: string): PostBrouillonInput {
  return {
    reseau: modele.reseau,
    angle: modele.angle,
    date,
    heure: modele.reseau === 'TIKTOK' ? '21:00' : modele.reseau === 'FACEBOOK' ? '12:30' : '07:30',
    accroche: modele.accroche,
    corps: modele.corps,
    hashtags: modele.hashtags,
    cta: modele.cta,
    visuel_suggere: modele.visuel,
  }
}
