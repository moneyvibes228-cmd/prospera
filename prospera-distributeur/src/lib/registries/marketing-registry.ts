/**
 * Registre marketing & prospection — campagnes, leads, segmentation distributeur.
 */

export type StatutCampagne = 'EN_COURS' | 'PLANIFIEE' | 'TERMINEE' | 'PAUSE'
export type CanalCampagne = 'WHATSAPP' | 'SMS' | 'TERRAIN' | 'MIXTE' | 'CHATBOT'
export type StatutLead = 'NOUVEAU' | 'QUALIFIE' | 'CHAUD' | 'NEGOCIATION' | 'CONVERTI' | 'PERDU'

export interface ProduitCampagneDetail {
  reference: string
  nom: string
  prix_grossiste_fcfa: number
  prix_promo_fcfa?: number
  remise_pct?: number
  unite: string
  role: string
  vendu_unites?: number
  objectif_unites?: number
  marge_pct: number
}

export interface CampagneMarketing {
  id: string
  nom: string
  objectif: string
  but_campagne: string
  offre?: string
  produits_detail: ProduitCampagneDetail[]
  canal: CanalCampagne
  statut: StatutCampagne
  zone: string
  segment: string
  produits_cibles: string[]
  date_debut: string
  date_fin?: string
  cibles: number
  contactes: number
  ouverts: number
  repondus: number
  convertis: number
  ca_genere: number
  cout_campagne: number
  marge_generee: number
  budget_max: number
  commercial_assigne?: string
  synthese_ia: string
  recommandation_ia: string
  alerte?: string
}

export interface LeadProspection {
  id: string
  nom: string
  zone: string
  type_client: string
  telephone: string
  statut: StatutLead
  score_ia: number
  ca_potentiel_mois: number
  source: string
  campagne_id?: string
  commercial: string
  dernier_contact: string
  prochaine_action: string
  synthese_ia: string
}

export interface SegmentIA {
  id: string
  nom: string
  description: string
  nb_clients: number
  ca_moyen_mois: number
  potentiel_ca: number
  canal_recommande: CanalCampagne
  action_ia: string
  priorite: 'CRITIQUE' | 'HAUTE' | 'NORMALE'
}

export interface ZoneBlanche {
  zone: string
  partenaires_actuels: number
  population_estimee: string
  potentiel_ca_mois: number
  saturation_pct: number
  priorite_ia: number
  action_recommandee: string
}

export const REGISTRE_CAMPAGNES: CampagneMarketing[] = [
  {
    id: 'camp-1', nom: 'Rentrée Lomé Nord — Juin', objectif: 'Cross-sell boissons + alimentaire sur clients actifs',
    but_campagne: 'Fidéliser et grossir le panier des 186 épiceries et grossistes déjà actifs à Lomé Nord — sans budget acquisition. Chaque contact reçoit une offre personnalisée « panier rentrée » autour de 3 SKU moteurs. But business : générer 28 M FCFA de CA additionnel avec un panier moyen cible de 458 K et un taux de conversion ≥ 30%.',
    offre: 'Pas de remise globale — le message met en avant le combo eau + riz (+ soda en cross-sell). Le combo alimentaire + boisson génère +22% de réponses vs message mono-produit.',
    produits_detail: [
      { reference: 'PRD-EAU-1.5L', nom: 'Eau minérale 1,5L (pack 12)', prix_grossiste_fcfa: 4_200, unite: 'pack', role: 'Produit d\'appel — accroche du message WhatsApp', objectif_unites: 8_000, vendu_unites: 6_240, marge_pct: 14.2 },
      { reference: 'PRD-RIZ-25KG', nom: 'Riz parfumé 25 kg', prix_grossiste_fcfa: 18_000, unite: 'sac', role: 'Volume alimentaire — cœur du panier rentrée', objectif_unites: 1_200, vendu_unites: 980, marge_pct: 11.5 },
      { reference: 'PRD-COCA-33CL', nom: 'Soda 33cl (pack 24)', prix_grossiste_fcfa: 9_800, unite: 'pack', role: 'Cross-sell marge — complément boisson été', objectif_unites: 2_500, vendu_unites: 1_860, marge_pct: 16.8 },
    ],
    canal: 'WHATSAPP', statut: 'EN_COURS', zone: 'Lomé Nord', segment: 'Épiceries & grossistes actifs',
    produits_cibles: ['Eau 1,5L', 'Riz 25kg', 'Soda 33cl'], date_debut: '2026-06-01', date_fin: '2026-06-30',
    cibles: 186, contactes: 172, ouverts: 148, repondus: 89, convertis: 62,
    ca_genere: 28_400_000, cout_campagne: 680_000, marge_generee: 4_560_000, budget_max: 1_200_000,
    commercial_assigne: 'Komlan Tetteh',
    synthese_ia: 'Meilleure campagne du mois — taux conversion 36% (objectif 30%). Eau + riz combo le plus performant. 62 commandes générées, panier moyen 458 K.',
    recommandation_ia: 'Prolonger 15j · ajouter huile 5L en cross-sell (rupture = urgence client).',
  },
  {
    id: 'camp-2', nom: 'Promo Boissons Kara — Été', objectif: 'Pousser soda + eau avant saison chaude',
    but_campagne: 'Anticiper la saison chaude à Kara en poussant les boissons à forte rotation avant saturation concurrente. Cibler superettes et dépôts avec un message mixte SMS puis WhatsApp.',
    offre: 'Pack soda 24 = prix préférentiel 9 400 FCFA (-4%) si commande eau + soda ensemble.',
    produits_detail: [
      { reference: 'PRD-COCA-33CL', nom: 'Soda 33cl (pack 24)', prix_grossiste_fcfa: 9_800, prix_promo_fcfa: 9_400, remise_pct: 4, unite: 'pack', role: 'Produit star promo été', objectif_unites: 1_800, vendu_unites: 1_120, marge_pct: 16.8 },
      { reference: 'PRD-EAU-1.5L', nom: 'Eau minérale 1,5L (pack 12)', prix_grossiste_fcfa: 4_200, unite: 'pack', role: 'Combo obligatoire avec soda', objectif_unites: 2_200, vendu_unites: 1_540, marge_pct: 14.2 },
      { reference: 'PRD-BIERE-33CL', nom: 'Bière locale 33cl (pack 24)', prix_grossiste_fcfa: 11_200, unite: 'pack', role: 'Testé — sous-performe, retiré du prochain envoi', objectif_unites: 400, vendu_unites: 86, marge_pct: 12.5 },
    ],
    canal: 'MIXTE', statut: 'EN_COURS', zone: 'Kara', segment: 'Superettes & dépôts Kara',
    produits_cibles: ['Soda 33cl', 'Eau 1,5L', 'Bière 33cl'], date_debut: '2026-06-05', date_fin: '2026-07-15',
    cibles: 92, contactes: 88, ouverts: 72, repondus: 41, convertis: 28,
    ca_genere: 18_200_000, cout_campagne: 520_000, marge_generee: 3_100_000, budget_max: 800_000,
    commercial_assigne: 'Sena Dzobo',
    synthese_ia: 'SMS ouverture 82% mais conversion 32% — inférieur à WhatsApp Lomé. Bière 33cl sous-performe vs soda.',
    recommandation_ia: 'Basculer 100% WhatsApp Kara · retirer bière du message · focus soda pack 24.',
  },
  {
    id: 'camp-3', nom: 'Zones blanches Centrale', objectif: 'Prospection terrain Sokodé — Bassar — nouveaux dépôts',
    but_campagne: 'Ouvrir le corridor Centrale (Sokodé, Bassar) où le réseau est quasi absent. Visites terrain + présentation catalogue complet pour signer des dépôts récurrents 2–5 M/mois.',
    offre: 'Remise -8% sur la 1ère commande si engagement volume ≥ 2 M/mois.',
    produits_detail: [
      { reference: 'PRD-EAU-1.5L', nom: 'Eau minérale 1,5L (pack 12)', prix_grossiste_fcfa: 4_200, prix_promo_fcfa: 3_864, remise_pct: 8, unite: 'pack', role: 'Entrée gamme — 1er produit présenté', vendu_unites: 420, marge_pct: 14.2 },
      { reference: 'PRD-RIZ-25KG', nom: 'Riz parfumé 25 kg', prix_grossiste_fcfa: 18_000, prix_promo_fcfa: 16_560, remise_pct: 8, unite: 'sac', role: 'Ancrage alimentaire dépôt', vendu_unites: 180, marge_pct: 11.5 },
      { reference: 'PRD-HUILE-5L', nom: 'Huile végétale 5L', prix_grossiste_fcfa: 8_500, unite: 'carton', role: 'Upsell 2e commande', vendu_unites: 92, marge_pct: 9.8 },
    ],
    canal: 'TERRAIN', statut: 'EN_COURS', zone: 'Centrale', segment: 'Prospects non couverts',
    produits_cibles: ['Catalogue complet'], date_debut: '2026-05-20', date_fin: '2026-07-31',
    cibles: 34, contactes: 28, ouverts: 28, repondus: 18, convertis: 6,
    ca_genere: 4_800_000, cout_campagne: 1_400_000, marge_generee: 820_000, budget_max: 2_500_000,
    commercial_assigne: 'Yao Ahi',
    synthese_ia: 'Conversion terrain 21% — lent mais CA potentiel élevé (dépôts 2-5 M/mois). 6 premières commandes dont Dépôt Sokodé récurrent.',
    recommandation_ia: 'Doubler visites Bassar (0 partenaire) · coût acquisition 233 K/client acceptable si fidélisation.',
  },
  {
    id: 'camp-4', nom: 'Cross-sell Hygiène — Ruptures réseau', objectif: 'Convertir 67 PDV en rupture savon → commande hygiène',
    but_campagne: '67 points de vente sont en rupture savon ou couches — demande latente non satisfaite. Message WhatsApp « urgence réappro » pour convertir en commande immédiate dès stock Kara disponible.',
    offre: 'Livraison prioritaire sous 48h si commande hygiène ≥ 120 K — frais transport offerts.',
    produits_detail: [
      { reference: 'PRD-SAVON-PACK', nom: 'Savon ménager (carton 48)', prix_grossiste_fcfa: 12_000, unite: 'carton', role: 'SKU urgence — 34 PDV Lomé + 12 Kara en rupture', objectif_unites: 890, marge_pct: 18.4 },
      { reference: 'PRD-COUCHE-PK', nom: 'Couches bébé (pack 6)', prix_grossiste_fcfa: 14_500, unite: 'pack', role: 'Cross-sell forte marge (+15% demande)', objectif_unites: 320, marge_pct: 11.7 },
    ],
    canal: 'WHATSAPP', statut: 'PLANIFIEE', zone: 'Multi-zones', segment: 'PDV en rupture savon/couches',
    produits_cibles: ['Savon carton 48', 'Couches bébé'], date_debut: '2026-06-14', date_fin: '2026-06-28',
    cibles: 67, contactes: 0, ouverts: 0, repondus: 0, convertis: 0,
    ca_genere: 0, cout_campagne: 0, marge_generee: 0, budget_max: 450_000,
    synthese_ia: 'Opportunité IA détectée — 12 PDV Kara + 34 PDV Lomé en rupture savon. Marge hygiène 18,4% = ROI attendu > 500%.',
    recommandation_ia: 'Lancer 14/06 · message urgence rupture + transfert Kara→réseau · priorité sur Superette Kara modèle.',
    alerte: 'Dépend livraison savon Kara — coordonner avec stock',
  },
  {
    id: 'camp-5', nom: 'Chatbot WhatsApp — Catalogue grossiste', objectif: 'Qualifier leads entrants chatbot distributeur',
    but_campagne: 'Automatiser la qualification des leads entrants (WhatsApp, site) avant passage au commercial. Le chatbot présente le catalogue grossiste et filtre par volume, zone et type client.',
    offre: 'Catalogue complet aux prix grossiste affichés — pas de remise chatbot (négociation commerciale ensuite).',
    produits_detail: [
      { reference: 'PRD-EAU-1.5L', nom: 'Eau minérale 1,5L (pack 12)', prix_grossiste_fcfa: 4_200, unite: 'pack', role: 'Top demande chatbot (42% des leads)', vendu_unites: 2_100, marge_pct: 14.2 },
      { reference: 'PRD-HUILE-5L', nom: 'Huile végétale 5L', prix_grossiste_fcfa: 8_500, unite: 'carton', role: 'Gros paniers convertis', vendu_unites: 680, marge_pct: 9.8 },
      { reference: 'PRD-RIZ-25KG', nom: 'Riz parfumé 25 kg', prix_grossiste_fcfa: 18_000, unite: 'sac', role: 'Dépôts & grossistes', vendu_unites: 420, marge_pct: 11.5 },
    ],
    canal: 'CHATBOT', statut: 'EN_COURS', zone: 'National', segment: 'Leads entrants digitaux',
    produits_cibles: ['Catalogue complet'], date_debut: '2026-05-01',
    cibles: 120, contactes: 120, ouverts: 98, repondus: 74, convertis: 18,
    ca_genere: 12_600_000, cout_campagne: 180_000, marge_generee: 2_100_000, budget_max: 300_000,
    synthese_ia: 'Chatbot qualifie 74 leads (62%) — 18 convertis en 6 semaines. Coût acquisition 10 K/lead = excellent. Grossiste Adidogomé issu de ce canal (à risque crédit).',
    recommandation_ia: 'Ajouter scoring crédit dans chatbot avant validation commercial · filtrer dépôts > 5 M sans historique.',
  },
  {
    id: 'camp-6', nom: 'Réactivation clients dormants', objectif: 'Relancer clients sans commande > 30j',
    but_campagne: 'Réactiver les clients historiquement bons payeurs sans commande depuis 30–60 jours. Éviter tout contact aux clients A_RISQUE (créances > plafond).',
    offre: 'Bundle entrée gamme -5% si commande avant le 20/06.',
    produits_detail: [
      { reference: 'BUNDLE-5', nom: 'Bundle entrée gamme (-5%)', prix_grossiste_fcfa: 0, remise_pct: 5, unite: 'panier', role: 'Offre de réactivation — composition libre ≥ 350 K', vendu_unites: 3, marge_pct: 13.5 },
    ],
    canal: 'WHATSAPP', statut: 'PAUSE', zone: 'Lomé', segment: 'Clients dormants 30-60j',
    produits_cibles: ['Offre bundle -5%'], date_debut: '2026-05-15', date_fin: '2026-06-10',
    cibles: 24, contactes: 22, ouverts: 18, repondus: 8, convertis: 3,
    ca_genere: 2_100_000, cout_campagne: 120_000, marge_generee: 280_000, budget_max: 400_000,
    synthese_ia: 'Pause demandée — Kiosque Port dans la liste (créance 8,9 M). 3 réactivations OK mais ROI faible vs risque crédit.',
    recommandation_ia: 'Reprendre sans clients A_RISQUE · cibler Mama T. + Kofi Trade uniquement.',
    alerte: 'Exclure pipeline A_RISQUE avant relance',
  },
  {
    id: 'camp-7', nom: 'Bundle Huile + Riz — Mai', objectif: 'Promo bundle alimentaire grossistes',
    but_campagne: 'Campagne terminée — bundle huile + riz à prix pack pour grossistes volume. ROI record 945%. Ne pas relancer tant que huile en rupture.',
    offre: 'Huile 5L + Riz 25 kg = 24 500 FCFA au lieu de 26 500 (-7,5%).',
    produits_detail: [
      { reference: 'PRD-HUILE-5L', nom: 'Huile végétale 5L', prix_grossiste_fcfa: 8_500, prix_promo_fcfa: 8_000, remise_pct: 6, unite: 'carton', role: 'Bundle alimentaire — pilier', vendu_unites: 880, marge_pct: 9.8 },
      { reference: 'PRD-RIZ-25KG', nom: 'Riz parfumé 25 kg', prix_grossiste_fcfa: 18_000, prix_promo_fcfa: 16_500, remise_pct: 8, unite: 'sac', role: 'Bundle alimentaire — volume', vendu_unites: 620, marge_pct: 11.5 },
    ],
    canal: 'SMS', statut: 'TERMINEE', zone: 'Lomé + Kara', segment: 'Grossistes volume',
    produits_cibles: ['Huile 5L', 'Riz 25kg'], date_debut: '2026-05-01', date_fin: '2026-05-31',
    cibles: 48, contactes: 48, ouverts: 38, repondus: 28, convertis: 22,
    ca_genere: 22_800_000, cout_campagne: 290_000, marge_generee: 2_740_000, budget_max: 500_000,
    synthese_ia: 'ROI 945% — bundle star. Attention : huile maintenant en rupture, ne pas reproduire avant réappro.',
    recommandation_ia: 'Version été : Eau + Soda bundle à la place · lancer juillet.',
  },
  {
    id: 'camp-8', nom: 'Prospection Lomé Est — Bè Kpota', objectif: 'Convertir 8 épiceries non partenaires',
    but_campagne: 'Conquérir Lomé Est (saturation 12%, 85 000 hab.) en convertissant 8 épiceries non partenaires identifiées à Bè Kpota. Approche terrain + offre 1ère commande.',
    offre: '-10% sur la 1ère commande si volume ≥ 800 K — validation DG requise.',
    produits_detail: [
      { reference: 'PRD-EAU-1.5L', nom: 'Eau minérale 1,5L (pack 12)', prix_grossiste_fcfa: 4_200, prix_promo_fcfa: 3_780, remise_pct: 10, unite: 'pack', role: 'Porte d\'entrée gamme boissons', objectif_unites: 200, marge_pct: 14.2 },
      { reference: 'PRD-COCA-33CL', nom: 'Soda 33cl (pack 24)', prix_grossiste_fcfa: 9_800, unite: 'pack', role: '2e référence présentée en visite', objectif_unites: 80, marge_pct: 16.8 },
    ],
    canal: 'TERRAIN', statut: 'EN_COURS', zone: 'Lomé Est', segment: 'Zones blanches urbaines',
    produits_cibles: ['Entrée gamme boissons'], date_debut: '2026-06-08', date_fin: '2026-06-30',
    cibles: 8, contactes: 5, ouverts: 5, repondus: 3, convertis: 0,
    ca_genere: 0, cout_campagne: 280_000, marge_generee: 0, budget_max: 600_000,
    commercial_assigne: 'Mawuena Ahi',
    synthese_ia: 'Zone sous-exploitée — Boutique Nouvelle en prospection. 0 conversion encore, 3 leads chauds identifiés.',
    recommandation_ia: 'DG valide remise -10% 1ère commande Lomé Est · visite conjointe Mawuena + Komlan semaine prochaine.',
  },
]

export const REGISTRE_LEADS: LeadProspection[] = [
  { id: 'lead-1', nom: 'Boutique Nouvelle', zone: 'Lomé Est', type_client: 'Épicerie', telephone: '+228 95 67 89 01', statut: 'CHAUD', score_ia: 72, ca_potentiel_mois: 1_500_000, source: 'Terrain Mawuena', campagne_id: 'camp-8', commercial: 'Mawuena Ahi', dernier_contact: '2026-06-10', prochaine_action: 'Visite + offre 1ère commande -10%', synthese_ia: 'Prospect chaud — emplacement Bè Kpota, passage élevé. Pas encore commandé.' },
  { id: 'lead-2', nom: 'Dépôt Bassar', zone: 'Kara', type_client: 'Dépôt', telephone: '+228 97 00 11 22', statut: 'QUALIFIE', score_ia: 68, ca_potentiel_mois: 3_200_000, source: 'Terrain Sena', campagne_id: 'camp-3', commercial: 'Sena Dzobo', dernier_contact: '2026-06-08', prochaine_action: 'Envoi catalogue WhatsApp + RDV 18/06', synthese_ia: 'Gros potentiel Nord Kara — 0 concurrent direct identifié.' },
  { id: 'lead-3', nom: 'Épicerie Aného', zone: 'Maritime', type_client: 'Épicerie', telephone: '+228 96 55 44 33', statut: 'NOUVEAU', score_ia: 55, ca_potentiel_mois: 800_000, source: 'Chatbot WA', campagne_id: 'camp-5', commercial: '—', dernier_contact: '2026-06-11', prochaine_action: 'Qualification chatbot — type client + volume', synthese_ia: 'Lead entrant hier — zone côtière non couverte, faible score initial.' },
  { id: 'lead-4', nom: 'Supermarché Tokoin', zone: 'Lomé Nord', type_client: 'Superette', telephone: '+228 90 88 77 66', statut: 'NEGOCIATION', score_ia: 85, ca_potentiel_mois: 5_500_000, source: 'Chatbot WA', campagne_id: 'camp-5', commercial: 'Komlan Tetteh', dernier_contact: '2026-06-09', prochaine_action: 'RDV DG — contrat cadre volume', synthese_ia: 'Gros compte potentiel — négociation remise -8% et plafond 15 M. Validation DG requise.' },
  { id: 'lead-5', nom: 'Grossiste Adidogomé', zone: 'Lomé Nord', type_client: 'Grossiste', telephone: '+228 98 88 77 66', statut: 'CONVERTI', score_ia: 38, ca_potentiel_mois: 4_000_000, source: 'Chatbot WA', campagne_id: 'camp-5', commercial: 'Mawuena Ahi', dernier_contact: '2026-05-18', prochaine_action: '⚠ Recouvrement — pas nouveau marketing', synthese_ia: 'Converti mais 5,25 M impayés — NE PAS inclure dans campagnes promo. Leçon scoring crédit.' },
  { id: 'lead-6', nom: 'Kiosque Marché Djidjolé', zone: 'Lomé Centre', type_client: 'Kiosque', telephone: '+228 91 11 22 33', statut: 'QUALIFIE', score_ia: 48, ca_potentiel_mois: 600_000, source: 'Terrain Komlan', commercial: 'Komlan Tetteh', dernier_contact: '2026-06-07', prochaine_action: 'WhatsApp catalogue entrée gamme', synthese_ia: 'Petit volume — qualifier si paiement comptant uniquement.' },
  { id: 'lead-7', nom: 'Dépôt Dapaong', zone: 'Savanes', type_client: 'Dépôt', telephone: '+228 93 22 11 00', statut: 'NOUVEAU', score_ia: 62, ca_potentiel_mois: 2_800_000, source: 'Chatbot WA', campagne_id: 'camp-5', commercial: '—', dernier_contact: '2026-06-10', prochaine_action: 'Assigner commercial Nord — logistique Kara', synthese_ia: 'Zone éloignée — vérifier coût livraison vs marge avant engagement.' },
  { id: 'lead-8', nom: 'Pharmacie du Port', zone: 'Lomé Centre', type_client: 'Superette', telephone: '+228 92 33 44 55', statut: 'CHAUD', score_ia: 78, ca_potentiel_mois: 2_200_000, source: 'Campagne hygiène', campagne_id: 'camp-4', commercial: 'Komlan Tetteh', dernier_contact: '2026-06-11', prochaine_action: 'Présentation gamme couches + savon', synthese_ia: 'Cible campagne cross-sell hygiène — fort intérêt couches bébé (+15% engouement).' },
  { id: 'lead-9', nom: 'Épicerie Vogan', zone: 'Maritime', type_client: 'Épicerie', telephone: '+228 94 00 55 66', statut: 'PERDU', score_ia: 25, ca_potentiel_mois: 400_000, source: 'SMS Mai', commercial: '—', dernier_contact: '2026-05-20', prochaine_action: 'Archiver — concurrent local exclusif', synthese_ia: 'Perdu face à distributeur local — ne pas réinvestir.' },
  { id: 'lead-10', nom: 'Mini-dépôt Adawlato', zone: 'Lomé Nord', type_client: 'Dépôt', telephone: '+228 97 66 55 44', statut: 'NEGOCIATION', score_ia: 80, ca_potentiel_mois: 4_500_000, source: 'Rentrée Lomé camp-1', campagne_id: 'camp-1', commercial: 'Komlan Tetteh', dernier_contact: '2026-06-10', prochaine_action: '1ère commande 3,8 M — validation crédit 5 M', synthese_ia: 'Conversion campagne rentrée — gros panier, solvabilité à vérifier (historique OK zone Bé).' },
]

export const SEGMENTS_IA: SegmentIA[] = [
  { id: 'seg-1', nom: 'Moteurs CA — Fidèles volume', description: 'Grossistes & superettes > 2 M/mois, paiement régulier', nb_clients: 8, ca_moyen_mois: 3_800_000, potentiel_ca: 30_400_000, canal_recommande: 'WHATSAPP', action_ia: 'Cross-sell nouveautés · pas de promo agressive', priorite: 'NORMALE' },
  { id: 'seg-2', nom: 'Engouement produit — Boissons été', description: 'Clients achetant soda+eau, évolution +8-12%', nb_clients: 42, ca_moyen_mois: 1_200_000, potentiel_ca: 18_500_000, canal_recommande: 'WHATSAPP', action_ia: 'Campagne bundle eau+soda juillet', priorite: 'HAUTE' },
  { id: 'seg-3', nom: 'À risque crédit — Exclure promos', description: 'Pipeline A_RISQUE ou créance > plafond', nb_clients: 3, ca_moyen_mois: 950_000, potentiel_ca: 0, canal_recommande: 'TERRAIN', action_ia: 'Recouvrement uniquement — pas de marketing', priorite: 'CRITIQUE' },
  { id: 'seg-4', nom: 'Dormants 30-60j', description: 'Pas de commande depuis 30j, historique OK', nb_clients: 14, ca_moyen_mois: 680_000, potentiel_ca: 9_520_000, canal_recommande: 'WHATSAPP', action_ia: 'Réactivation avec offre -5% limitée', priorite: 'NORMALE' },
  { id: 'seg-5', nom: 'Rupture réseau — Hygiène', description: 'PDV en rupture savon/couches, demande latente', nb_clients: 67, ca_moyen_mois: 420_000, potentiel_ca: 14_280_000, canal_recommande: 'WHATSAPP', action_ia: 'Campagne urgence cross-sell hygiène 14/06', priorite: 'HAUTE' },
  { id: 'seg-6', nom: 'Zones blanches — Prospection', description: 'Zones < 2 partenaires, potentiel non exploité', nb_clients: 0, ca_moyen_mois: 0, potentiel_ca: 22_000_000, canal_recommande: 'TERRAIN', action_ia: 'Renforcer terrain Lomé Est + Bassar', priorite: 'HAUTE' },
]

export const ZONES_BLANCHES: ZoneBlanche[] = [
  { zone: 'Lomé Est', partenaires_actuels: 1, population_estimee: '~85 000 hab.', potentiel_ca_mois: 8_500_000, saturation_pct: 12, priorite_ia: 92, action_recommandee: '2 commerciaux terrain + remise 1ère commande -10%' },
  { zone: 'Bassar', partenaires_actuels: 0, population_estimee: '~45 000 hab.', potentiel_ca_mois: 6_200_000, saturation_pct: 0, priorite_ia: 88, action_recommandee: 'Dépôt relais Kara→Bassar · visite Efua 2x/mois' },
  { zone: 'Aného', partenaires_actuels: 0, population_estimee: '~28 000 hab.', potentiel_ca_mois: 3_800_000, saturation_pct: 0, priorite_ia: 65, action_recommandee: 'Évaluer coût logistique maritime avant engagement' },
  { zone: 'Dapaong', partenaires_actuels: 0, population_estimee: '~120 000 hab.', potentiel_ca_mois: 12_000_000, saturation_pct: 0, priorite_ia: 72, action_recommandee: 'Partenariat dépôt Kara · lead Dapaong en qualification' },
  { zone: 'Vogan', partenaires_actuels: 0, population_estimee: '~22 000 hab.', potentiel_ca_mois: 2_100_000, saturation_pct: 0, priorite_ia: 35, action_recommandee: 'Faible priorité — concurrent local fort (lead perdu)' },
]

export const DECISIONS_IA_DG = [
  { priorite: 1, titre: 'Lancer cross-sell hygiène 14/06', impact: '+14 M CA potentiel', risque: 'Dépend stock savon Kara', decision: 'Valider lancement + coordonner stock' },
  { priorite: 2, titre: 'Exclure clients A_RISQUE des campagnes', impact: 'Éviter 8,9 M créance aggravée', risque: 'Faible', decision: 'Règle auto chatbot + filtre campagnes' },
  { priorite: 3, titre: 'Doubler effort Lomé Est', impact: '+8,5 M/mois potentiel', risque: 'Coût terrain 600 K', decision: 'Approuver remise -10% 1ère commande' },
  { priorite: 4, titre: 'Reproduire bundle été (eau+soda)', impact: 'ROI estimé 400%+', risque: 'Stock soda été', decision: 'Planifier campagne juillet' },
  { priorite: 5, titre: 'Scoring crédit obligatoire chatbot', impact: 'Filtrer Adidogomé-type', risque: 'Réduction leads 15%', decision: 'Implémenter avant scaling chatbot' },
]
