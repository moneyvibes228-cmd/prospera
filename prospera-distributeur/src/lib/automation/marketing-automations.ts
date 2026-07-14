/**
 * Automatisations marketing — la machine à générer de la demande.
 *
 * Chaque règle est évaluée sur les registres : ses cibles sont les vrais points
 * de vente, les vrais leads, les vrais surstocks du moment, avec le message déjà
 * rédigé. Le responsable marketing ne compose plus de campagnes, il arbitre
 * celles que la machine lui propose.
 */

import { REGISTRE_PDV } from '@/lib/registries/pdv-registry'
import { REGISTRE_LEADS, ZONES_BLANCHES } from '@/lib/registries/marketing-registry'
import { REGISTRE_PROFORMAS } from '@/lib/registries/proformas-registry'
import { buildCombosStockIA } from '@/lib/marketing-combo-stock-builder'
import { ENTREPRISE_REGISTRY } from '@/lib/registries/entreprise-registry'
import { formatFcfa } from '@/lib/utils'
import {
  AUJOURDHUI, joursDepuis, joursAvant, exclusionsCampagne, QUOTA_MESSAGES_SEMAINE,
} from './garde-fous'
import type { CibleAutomation, RegleAutomation } from './automation-types'

const MARQUE = ENTREPRISE_REGISTRY.nom

/* ------------------------------------------------------------------ */
/* Règle 1 — le stock dormant se transforme en campagne tout seul       */
/* ------------------------------------------------------------------ */

function regleComboStock(): RegleAutomation {
  const combos = buildCombosStockIA().slice(0, 5)

  const cibles: CibleAutomation[] = combos.map(c => ({
    id: `combo-${c.id}`,
    libelle: c.nom,
    detail: `${c.lent.nom} · ${c.lent.couverture_jours} j de couverture · ${formatFcfa(c.lent.valeur_immobilisee_fcfa)} F immobilisés · ${c.contacts_cibles} PDV ciblés`,
    canal: 'WHATSAPP',
    message: `${c.offre}\n\n${c.explication}`,
    valeur_fcfa: c.ca_potentiel_fcfa,
    score: c.severite === 'CRITIQUE' ? 78 : c.severite === 'HAUTE' ? 66 : 52,
    quand: 'Prêt — attend votre validation',
  }))

  return {
    id: 'mkt-combo-stock',
    nom: 'Surstock détecté → combo d\'écoulement',
    poste: 'MARKETING',
    declencheur: 'Une référence dépasse 45 jours de couverture ou sa rotation double',
    action: 'L\'IA construit un combo (produit lent + produit moteur), calcule la remise qui préserve la marge, cible les PDV qui achètent déjà le moteur et rédige le message',
    canal: 'WHATSAPP',
    mode: 'VALIDATION',
    actif: true,
    garde_fous: [
      'Jamais de remise qui fait passer la marge combo sous 8%',
      'Le produit moteur doit être en stock suffisant, sinon on crée une rupture pour écouler un dormant',
      'Clients en défaut de paiement exclus de la cible',
    ],
    quota: 'Maximum 2 combos lancés simultanément par zone',
    cibles,
    stats: { executions_30j: 6, succes_30j: 4, taux_succes_pct: 67, impact_fcfa_30j: 18_400_000 },
    explication_ia: 'Le stock qui dort coûte deux fois : il immobilise de la trésorerie et il occupe une place en entrepôt. Le vendre seul suppose une remise forte ; l\'accrocher à un produit que le client vient chercher de toute façon ne coûte presque rien.',
    gain_temps_h_mois: 12,
  }
}

/* ------------------------------------------------------------------ */
/* Règle 2 — réactivation des clients qui s'éteignent                   */
/* ------------------------------------------------------------------ */

function regleReactivationDormants(): RegleAutomation {
  const exclus = exclusionsCampagne()

  const dormants = REGISTRE_PDV
    .filter(p => p.type_magasin === 'PARTENAIRE' && p.ca_mois > 0)
    .map(p => ({ pdv: p, jours: joursDepuis(p.derniere_commande) }))
    .filter(({ jours }) => jours >= 30 && jours <= 120)
    .sort((a, b) => b.pdv.ca_mois - a.pdv.ca_mois)
    .slice(0, 14)

  const cibles: CibleAutomation[] = dormants.map(({ pdv, jours }) => {
    const motif = exclus.get(pdv.id)?.motif
    // Un client qui commandait 2,4 M/mois et qui s'arrête vaut plus qu'un petit
    // client dormant : le manque à gagner est ce qu'on cherche à récupérer.
    const manqueAGagner = Math.round(pdv.ca_mois * (jours / 30))
    return {
      id: `react-${pdv.id}`,
      libelle: `${pdv.nom} · ${pdv.zone}`,
      detail: `Silencieux depuis ${jours} j · commandait ${formatFcfa(pdv.ca_mois)} F/mois · score ${pdv.score_ia}/100`,
      canal: 'WHATSAPP',
      message: `Bonjour ${pdv.nom}, cela fait ${jours} jours sans commande — tout va bien ? Vos produits habituels sont disponibles et livrables sous 48 h. Répondez OUI et je prépare votre panier habituel. — ${MARQUE}`,
      valeur_fcfa: manqueAGagner,
      score: Math.max(20, Math.min(85, pdv.score_ia - Math.round(jours / 4))),
      quand: motif ? 'Retenu' : 'Départ automatique demain 08:00',
      bloque_par: motif,
    }
  })

  return {
    id: 'mkt-reactivation',
    nom: 'Client silencieux 30 j → séquence de réactivation',
    poste: 'MARKETING',
    declencheur: 'Un PDV actif n\'a pas commandé depuis 30 jours',
    action: 'Séquence en 3 temps : WhatsApp « panier habituel » (J), relance avec offre −5% (J+5), passage au commercial de la zone (J+12)',
    canal: 'WHATSAPP',
    mode: 'AUTO',
    actif: true,
    garde_fous: [
      'Client en défaut de paiement : exclu, il relève du recouvrement',
      'La remise −5% n\'apparaît qu\'au 2ᵉ message — un client qui revient seul ne coûte rien',
      `Plafond de ${QUOTA_MESSAGES_SEMAINE} messages par client et par semaine, tous canaux confondus`,
    ],
    quota: `${QUOTA_MESSAGES_SEMAINE} messages / client / semaine`,
    cibles,
    stats: { executions_30j: 47, succes_30j: 16, taux_succes_pct: 34, impact_fcfa_30j: 9_200_000 },
    explication_ia: 'Un client ne prévient pas qu\'il part : il commande simplement de moins en moins. Le trentième jour de silence est le dernier moment où le rappeler coûte encore moins cher que de le reconquérir.',
    gain_temps_h_mois: 18,
  }
}

/* ------------------------------------------------------------------ */
/* Règle 3 — les leads entrants se qualifient seuls                     */
/* ------------------------------------------------------------------ */

function regleQualificationLeads(): RegleAutomation {
  const nouveaux = REGISTRE_LEADS.filter(l => l.statut === 'NOUVEAU' || l.commercial === '—')

  const cibles: CibleAutomation[] = nouveaux.map(l => {
    // Un lead à gros volume sans historique de paiement, c'est exactement le
    // profil du Grossiste Adidogomé : 5,25 M convertis, 5,25 M impayés.
    const risqueCredit = l.ca_potentiel_mois >= 3_000_000 && l.score_ia < 70
    return {
      id: `lead-${l.id}`,
      libelle: `${l.nom} · ${l.type_client} · ${l.zone}`,
      detail: `Entré par ${l.source} · potentiel ${formatFcfa(l.ca_potentiel_mois)} F/mois · score IA ${l.score_ia}/100`,
      canal: 'CHATBOT',
      message: `Bienvenue chez ${MARQUE}. Pour vous envoyer le bon catalogue, 3 questions : votre type d'activité, votre volume mensuel estimé, votre zone de livraison. Vous recevez ensuite les prix grossiste correspondants.`,
      // Le CA mensuel, pas l'annualisé : un potentiel × 12 affiché dans un tableau
      // de bord est une promesse que personne ne tient, et qui décrédibilise le reste.
      valeur_fcfa: l.ca_potentiel_mois,
      score: l.score_ia,
      quand: risqueCredit ? 'Retenu' : 'Qualification immédiate',
      bloque_par: risqueCredit
        ? `Volume ${formatFcfa(l.ca_potentiel_mois)} F/mois sans historique de paiement — scoring crédit requis avant assignation commerciale`
        : undefined,
    }
  })

  return {
    id: 'mkt-qualif-leads',
    nom: 'Lead entrant → qualification chatbot + scoring crédit',
    poste: 'MARKETING',
    declencheur: 'Un lead arrive (chatbot WhatsApp, formulaire, commentaire Facebook)',
    action: 'Le chatbot qualifie (activité, volume, zone), calcule un score, puis assigne au commercial de la zone — ou bloque si le profil demande une vérification crédit',
    canal: 'CHATBOT',
    mode: 'AUTO',
    actif: true,
    garde_fous: [
      'Aucun lead > 3 M FCFA/mois n\'est assigné sans vérification de solvabilité',
      'Aucun engagement de prix ni de remise donné par le chatbot',
      'Passage à un humain dès que le lead pose une question hors catalogue',
    ],
    cibles,
    stats: { executions_30j: 120, succes_30j: 74, taux_succes_pct: 62, impact_fcfa_30j: 12_600_000 },
    explication_ia: 'Le chatbot ne vend pas, il trie. Sa valeur n\'est pas dans les leads qu\'il fait entrer mais dans ceux qu\'il empêche d\'entrer : un gros volume sans solvabilité est une créance qui s\'ignore.',
    gain_temps_h_mois: 22,
  }
}

/* ------------------------------------------------------------------ */
/* Règle 4 — un lead chaud qui refroidit                                */
/* ------------------------------------------------------------------ */

function regleLeadsChauds(): RegleAutomation {
  const chauds = REGISTRE_LEADS
    .filter(l => (l.statut === 'CHAUD' || l.statut === 'NEGOCIATION') && joursDepuis(l.dernier_contact) >= 2)
    .sort((a, b) => b.ca_potentiel_mois - a.ca_potentiel_mois)

  const cibles: CibleAutomation[] = chauds.map(l => {
    const jours = joursDepuis(l.dernier_contact)
    return {
      id: `chaud-${l.id}`,
      libelle: `${l.nom} · ${l.commercial !== '—' ? l.commercial : 'non assigné'}`,
      detail: `${l.statut === 'NEGOCIATION' ? 'En négociation' : 'Lead chaud'} · sans contact depuis ${jours} j · ${formatFcfa(l.ca_potentiel_mois)} F/mois en jeu`,
      canal: 'WHATSAPP',
      message: `Rappel commercial — ${l.nom} : ${l.prochaine_action}. Sans reprise de contact sous 48 h, le lead retombe en froid (probabilité de signature −40%).`,
      valeur_fcfa: l.ca_potentiel_mois,
      score: l.score_ia,
      quand: jours >= 5 ? 'Escalade au superviseur' : 'Rappel commercial aujourd\'hui',
    }
  })

  return {
    id: 'mkt-leads-chauds',
    nom: 'Lead chaud sans contact → relance du commercial',
    poste: 'MARKETING',
    declencheur: 'Un lead CHAUD ou EN NÉGOCIATION reste 48 h sans contact',
    action: 'Notification au commercial assigné avec la prochaine action à faire ; au 5ᵉ jour, escalade au superviseur de zone',
    canal: 'WHATSAPP',
    mode: 'AUTO',
    actif: true,
    garde_fous: [
      'Aucun message envoyé au lead lui-même — c\'est le commercial qu\'on relance, pas le client',
      'Pas d\'escalade sur un lead non assigné : on assigne d\'abord',
    ],
    cibles,
    stats: { executions_30j: 34, succes_30j: 21, taux_succes_pct: 62, impact_fcfa_30j: 5_400_000 },
    explication_ia: 'Le marketing paie pour faire entrer le lead ; il se perd ensuite dans la boîte WhatsApp d\'un commercial en tournée. La fuite ne se voit dans aucun tableau, elle se voit ici.',
    gain_temps_h_mois: 8,
  }
}

/* ------------------------------------------------------------------ */
/* Règle 5 — la proforma qui va expirer                                 */
/* ------------------------------------------------------------------ */

function regleProformasExpirantes(): RegleAutomation {
  const exclus = exclusionsCampagne()

  const expirantes = REGISTRE_PROFORMAS
    .filter(p => ['ENVOYEE', 'VUE', 'BROUILLON'].includes(p.statut))
    .map(p => ({ p, restant: joursAvant(p.date_validite) }))
    .filter(({ restant }) => restant >= 0 && restant <= 4)
    .sort((a, b) => b.p.montant_ttc - a.p.montant_ttc)
    .slice(0, 10)

  const cibles: CibleAutomation[] = expirantes.map(({ p, restant }) => {
    const motif = exclus.get(p.pdv_id)?.motif
    return {
      id: `prof-${p.id}`,
      libelle: `${p.pdv_nom} · ${p.numero}`,
      detail: `${formatFcfa(p.montant_ttc)} F · expire dans ${restant} j · acceptation estimée ${p.score_acceptation_ia}%`,
      canal: 'WHATSAPP',
      message: `Bonjour ${p.pdv_nom}, votre devis ${p.numero} (${formatFcfa(p.montant_ttc)} F) expire dans ${restant} jour${restant > 1 ? 's' : ''}. Confirmez avant l'échéance pour garder ces prix — livraison sous 48 h. — ${MARQUE}`,
      valeur_fcfa: p.montant_ttc,
      score: p.score_acceptation_ia,
      quand: motif ? 'Retenu' : `Départ J-${Math.max(1, restant)} à 09:00`,
      bloque_par: motif,
    }
  })

  return {
    id: 'mkt-proformas',
    nom: 'Devis qui expire → relance avant échéance',
    poste: 'MARKETING',
    declencheur: 'Une proforma envoyée arrive à 48 h de sa date de validité sans réponse',
    action: 'Relance WhatsApp avec le montant, la date d\'expiration et un bouton de confirmation ; le commercial est mis en copie',
    canal: 'WHATSAPP',
    mode: 'AUTO',
    actif: true,
    garde_fous: [
      'Une seule relance par proforma — la deuxième devient du harcèlement',
      'Aucune prolongation de prix accordée automatiquement : c\'est une décision commerciale',
      'Client en défaut : exclu',
    ],
    cibles,
    stats: { executions_30j: 28, succes_30j: 11, taux_succes_pct: 39, impact_fcfa_30j: 7_800_000 },
    explication_ia: 'Un devis expiré n\'est pas un client perdu, c\'est une vente déjà faite qu\'on laisse tomber. Le coût de la relance est nul, le taux de récupération tourne autour de 40%.',
    gain_temps_h_mois: 6,
  }
}

/* ------------------------------------------------------------------ */
/* Règle 6 — conquête des zones blanches                                */
/* ------------------------------------------------------------------ */

function regleZonesBlanches(): RegleAutomation {
  const prioritaires = ZONES_BLANCHES.filter(z => z.priorite_ia >= 60)

  const cibles: CibleAutomation[] = prioritaires.map(z => ({
    id: `zone-${z.zone}`,
    libelle: `${z.zone} · ${z.partenaires_actuels} partenaire${z.partenaires_actuels > 1 ? 's' : ''}`,
    detail: `${z.population_estimee} · saturation ${z.saturation_pct}% · potentiel ${formatFcfa(z.potentiel_ca_mois)} F/mois · priorité IA ${z.priorite_ia}/100`,
    canal: 'FACEBOOK',
    message: `Campagne d'acquisition géociblée « ${z.zone} » — audience Facebook/WhatsApp dans un rayon de 5 km, message « catalogue grossiste + livraison 48 h », relais terrain par le commercial de zone. Action recommandée : ${z.action_recommandee}`,
    valeur_fcfa: z.potentiel_ca_mois,
    score: z.priorite_ia,
    quand: 'Prête — budget et remise à arbitrer',
  }))

  return {
    id: 'mkt-zones-blanches',
    nom: 'Zone sous-couverte → campagne d\'acquisition géociblée',
    poste: 'MARKETING',
    declencheur: 'Une zone descend sous 2 partenaires actifs alors que son potentiel dépasse 3 M FCFA/mois',
    action: 'Construction d\'une campagne géociblée (Facebook/WhatsApp rayon 5 km) synchronisée avec le passage du commercial terrain, budget et remise 1ʳᵉ commande pré-calculés',
    canal: 'FACEBOOK',
    mode: 'VALIDATION',
    actif: true,
    garde_fous: [
      'Aucune campagne lancée sans commercial affecté à la zone — sinon on génère des leads que personne ne traite',
      'La remise 1ʳᵉ commande au-delà de −8% demande une validation DG',
      'Coût d\'acquisition plafonné à 250 K FCFA par client signé',
    ],
    cibles,
    stats: { executions_30j: 2, succes_30j: 1, taux_succes_pct: 50, impact_fcfa_30j: 4_800_000 },
    explication_ia: 'Conquérir une zone sans y avoir de commercial revient à payer pour envoyer des clients chez le concurrent : ils appellent, personne ne livre, ils n\'appellent plus.',
    gain_temps_h_mois: 5,
  }
}

/* ------------------------------------------------------------------ */
/* Règle 7 — accueil des nouveaux clients                               */
/* ------------------------------------------------------------------ */

function regleOnboarding(): RegleAutomation {
  const nouveaux = REGISTRE_PDV
    .filter(p => p.pipeline === 'PREMIERE_COMMANDE' || (p.pipeline === 'ACTIF' && p.ca_mois > 0 && joursDepuis(p.derniere_commande) <= 20 && p.score_ia < 70))
    .slice(0, 8)

  const cibles: CibleAutomation[] = nouveaux.map(p => ({
    id: `onb-${p.id}`,
    libelle: `${p.nom} · ${p.zone}`,
    detail: `Nouveau client · 1ʳᵉ commande le ${p.derniere_commande} · ${formatFcfa(p.ca_mois)} F`,
    canal: 'WHATSAPP',
    message: `Merci pour votre première commande, ${p.nom}. Voici ce qui compte : livraison sous 48 h, commande par WhatsApp à tout moment, et un délai de paiement qui s'ouvre après 3 commandes réglées. Votre commercial ${p.commercial} passe vous voir cette semaine.`,
    valeur_fcfa: p.ca_mois,
    score: 70,
    quand: 'J+2 après livraison',
  }))

  return {
    id: 'mkt-onboarding',
    nom: 'Première commande → séquence d\'accueil 30 jours',
    poste: 'MARKETING',
    declencheur: 'Un point de vente passe sa première commande',
    action: 'Séquence de 4 messages sur 30 jours : accueil (J+2), satisfaction (J+7), suggestion de réassort basée sur ce qu\'il a acheté (J+14), ouverture du crédit si les règlements sont propres (J+30)',
    canal: 'WHATSAPP',
    mode: 'AUTO',
    actif: true,
    garde_fous: [
      'Le crédit ne s\'ouvre jamais automatiquement : la séquence propose, le DAF décide',
      'Séquence interrompue immédiatement si un incident de paiement survient',
    ],
    cibles,
    stats: { executions_30j: 19, succes_30j: 13, taux_succes_pct: 68, impact_fcfa_30j: 6_100_000 },
    explication_ia: 'La deuxième commande est la plus difficile à obtenir de toutes. Un client accompagné pendant ses 30 premiers jours en passe une dans 68% des cas, contre 41% laissé seul.',
    gain_temps_h_mois: 9,
  }
}

/* ------------------------------------------------------------------ */

export function buildReglesMarketing(): RegleAutomation[] {
  return [
    regleComboStock(),
    regleReactivationDormants(),
    regleQualificationLeads(),
    regleLeadsChauds(),
    regleProformasExpirantes(),
    regleZonesBlanches(),
    regleOnboarding(),
  ]
}

/** Ce que la machine a fait pendant la nuit — le premier écran du matin. */
export interface NuitMarketing {
  messages_envoyes: number
  leads_qualifies: number
  posts_programmes: number
  clients_proteges: number
  a_valider: number
  ca_attribue: number
}

export function buildNuitMarketing(regles: RegleAutomation[], postsProgrammes: number): NuitMarketing {
  const actives = regles.filter(r => r.actif)
  const auto = actives.filter(r => r.mode === 'AUTO')
  const cibles = actives.flatMap(r => r.cibles)

  return {
    messages_envoyes: auto.reduce((s, r) => s + r.cibles.filter(c => !c.bloque_par).length, 0),
    leads_qualifies: actives.find(r => r.id === 'mkt-qualif-leads')?.cibles.filter(c => !c.bloque_par).length ?? 0,
    posts_programmes: postsProgrammes,
    clients_proteges: cibles.filter(c => c.bloque_par).length,
    a_valider: actives.filter(r => r.mode !== 'AUTO').reduce((s, r) => s + r.cibles.filter(c => !c.bloque_par).length, 0),
    ca_attribue: actives.reduce((s, r) => s + r.stats.impact_fcfa_30j, 0),
  }
}

export { AUJOURDHUI }
