import type { UserRole } from '@/types'

/**
 * Source de vérité unique des accès par route.
 *
 * Le menu et le garde-fou d'URL lisent tous les deux cette table : retirer une entrée
 * du menu ne suffit pas, un commercial peut taper l'URL à la main.
 * Une route absente de la table est ouverte à tous les rôles authentifiés.
 */
export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/pilotage-financier': ['DG', 'DC', 'DAF'],
  // Le gestionnaire d'entrepôt ne consulte pas les commandes clients : il reçoit des bons
  // de préparation (`/entrepot`). Le carnet de commandes est un objet commercial.
  '/commandes': ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR', 'COMMERCIAL', 'FREELANCE', 'PROSPECTION', 'RESP_STOCK'],
  '/stock': ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR', 'RESP_STOCK', 'GEST_ENTREPOT', 'DAF', 'COMPTABLE', 'MARKETING'],
  '/catalogue': ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR', 'RESP_STOCK', 'DAF', 'COMPTABLE', 'MARKETING'],
  // Le poste de travail physique : préparation, chargement, réception, inventaire.
  // Le responsable stock y entre pour superviser ; le gestionnaire y vit.
  '/entrepot': ['DG', 'RESP_STOCK', 'GEST_ENTREPOT'],
  '/disponibilite': ['COMMERCIAL', 'FREELANCE', 'PROSPECTION'],
  '/mon-activite': ['COMMERCIAL', 'FREELANCE', 'PROSPECTION'],
  // Engager la trésorerie de la société auprès d'un fournisseur n'est pas un acte d'entrepôt.
  // Le gestionnaire voit les livraisons attendues dans `/entrepot`, pas les commandes d'achat.
  '/approvisionnement': ['DG', 'RESP_STOCK', 'DAF', 'COMPTABLE'],
  // Exécution terrain : plan de journée, strike rate, remises d'espèces.
  // C'est l'écran du chef d'équipe. Le Responsable des Ventes pilote par zone,
  // via ses superviseurs — il n'a pas à suivre la caisse commercial par commercial.
  '/tournees': ['DG', 'DC', 'SUPERVISEUR'],
  // Allocation du quota par zone, atterrissage, mix de marge : décisions de
  // niveau région. Un superviseur exécute un quota, il ne le fixe pas.
  '/objectifs': ['DG', 'DC', 'RESP_VENTES'],
  // Le superviseur arbitre les remises via les validations, il n'émet pas de facture.
  '/facturation': ['DG', 'DC', 'RESP_VENTES', 'COMMERCIAL', 'FREELANCE', 'PROSPECTION', 'DAF', 'COMPTABLE', 'RECOUVREMENT'],
  '/relances': ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR', 'COMMERCIAL', 'DAF', 'RECOUVREMENT'],
  '/points-de-vente': ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR', 'COMMERCIAL', 'FREELANCE', 'PROSPECTION', 'MARKETING', 'RECOUVREMENT'],
  // Vue de supervision : carte GPS de toute l'équipe, classement, marges.
  // Réservée à l'encadrement — un commercial n'a rien à y faire.
  '/commercial': ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR'],
  // Campagnes, budgets, ROI : le pilotage du marketing. Le chargé de prospection n'a
  // ni budget ni compte de résultat — son écran est /prospection, pas celui-ci.
  '/marketing': ['DG', 'DC', 'MARKETING'],
  // Production de contenu social : le DG regarde ce qui part au nom de l'entreprise,
  // il ne le rédige pas. Le studio appartient au marketing.
  '/marketing/social': ['DG', 'DC', 'MARKETING'],
  // Le moteur d'automatisation projette les règles du poste de celui qui le consulte :
  // le marketing y voit ses campagnes, le recouvrement ses escalades, le DG les deux.
  '/automatisations': ['DG', 'MARKETING', 'RECOUVREMENT'],
  // Conquête de territoire : recensement, carnet de prospects, survie des ouvertures,
  // passation au secteur. Le poste du prospecteur ; l'encadrement le consulte.
  '/prospection': ['DG', 'DC', 'RESP_VENTES', 'PROSPECTION'],
  '/equipe': ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR'],
  '/comptabilite': ['DG', 'DAF', 'COMPTABLE', 'RECOUVREMENT'],
}

export function canAccess(role: UserRole, pathname: string): boolean {
  const entry = Object.entries(ROUTE_ACCESS)
    .filter(([route]) => pathname === route || pathname.startsWith(`${route}/`))
    // Route la plus spécifique d'abord, pour qu'un préfixe court ne l'emporte pas.
    .sort((a, b) => b[0].length - a[0].length)[0]

  return !entry || entry[1].includes(role)
}
