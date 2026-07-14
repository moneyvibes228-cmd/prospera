# Prospera Distribution — Spécification V2

Refonte pilotage DG · KPI par poste · E-facture & Proforma · Fournisseurs & réappro automatique · Menu & personas

---

## 1. Diagnostic de l'existant

| Sujet | État actuel | Verdict |
|---|---|---|
| Rapport IA DG | `RapportIAGlobal` + 9 insights + anomalies | Bon, mais placé **avant** les chiffres de décision |
| KPI DG | 10 KPI dans `mock-dg-kpis-builder.ts` | Manquent : **solde caisse, dette fournisseurs, bénéfice, CA jour/an, encours crédit client** |
| Distinction visuelle | 10 cartes identiques en grille 5 colonnes | Aucune hiérarchie : le DG ne sait pas où regarder |
| KPI autres postes | 4 `KpiCard` statiques, sans objectif ni tendance | Pas de KPI de performance réel |
| Dashboards | 8 dashboards pour 13 rôles | 5 rôles sans vue propre |
| Facturation | `Facture` uniquement (émise → payée) | Pas de **proforma**, pas d'**e-facture** |
| Fournisseurs | Une seule ligne comptable `401100` (22,4 M) | Pas de registre, pas de dette pilotable, pas de réappro |
| Menu | Principal → Opérations → Pilotage | Pilotage financier en **dernier** groupe |

---

## 2. Bloc A — Dashboard DG : les chiffres avant le rapport

### 2.1 Principe

Le DG ne lit pas un rapport, il **scanne des chiffres puis décide**. Nouvelle séquence de la page :

```
1. Bandeau décision        ← LES 8 CHIFFRES (nouveau, en premier)
2. Alertes critiques       ← ce qui bloque aujourd'hui
3. Rapport IA              ← descendu en position 3
4. KPI 360° par famille    ← regroupés visuellement (nouveau)
5. Cartographie / zones    ← inchangé
6. Reste                   ← inchangé
```

### 2.2 Les 8 chiffres du DG (`SyntheseDecisionDG`)

Fichier à créer : `src/lib/dg-synthese-decision-builder.ts`

| # | Chiffre | Source de calcul | Sous-texte |
|---|---|---|---|
| 1 | **Solde caisse & banque** | `Σ COMPTES_TRESORERIE.solde` | Détail : caisse / banque / mobile money |
| 2 | **Crédit client (encours)** | `Σ CREANCES_COMPTABLES.reste` | dont **X en retard** (> 30 j) |
| 3 | **Dette fournisseurs** | `Σ FOURNISSEURS.encours_du` (nouveau) | dont **X échue** · prochaine échéance J+n |
| 4 | **CA journalier** | `Σ commandes du jour` | vs moyenne 30 j (%) |
| 5 | **CA mensuel** | `RESEAU_CONSOLIDE_DIST.ca_mois` | % de l'objectif mensuel |
| 6 | **CA annuel (cumul)** | `Σ CA_SPARKLINE_REGISTRY` × 1 M | % de l'objectif annuel |
| 7 | **Bénéfice net (mois)** | `COMPTE_RESULTAT` section `RESULTAT` | marge nette % · vs M-1 |
| 8 | **Total commandes** | `commandes_jour` + `commandes_mois` | **X cmd/jour** · **Y cmd terrain** ce mois |

### 2.3 Type à créer

```ts
// src/lib/dg-synthese-decision-builder.ts
export type FamilleChiffre = 'TRESORERIE' | 'CREANCE' | 'DETTE' | 'REVENU' | 'RESULTAT' | 'ACTIVITE'

export interface ChiffreDecisionDG {
  cle: string
  label: string                       // "Solde caisse & banque"
  valeur: number
  format: 'fcfa' | 'number' | 'pct'
  famille: FamilleChiffre
  /** Ce qui rend le chiffre actionnable */
  detail_principal: string            // "dont 43,8 M échus > 30j"
  detail_secondaire?: string          // "prochaine échéance J+5 : 28,6 M"
  variation_pct: number
  variation_label: string             // "vs M-1"
  /** true si une hausse est mauvaise (dette, créance) */
  invert: boolean
  statut: 'SAIN' | 'ATTENTION' | 'CRITIQUE'
  seuil_alerte?: string               // "Objectif ≥ 85%"
  /** Action directe depuis la carte */
  action_label?: string               // "Voir les impayés"
  action_href?: string                // "/facturation?tab=impayes"
}

export function buildSyntheseDecisionDG(): ChiffreDecisionDG[]
```

### 2.4 Distinction visuelle — la règle

Le problème actuel : 10 cartes identiques. La solution : **3 rangées séparées, chacune avec sa couleur de famille et son titre.**

```
┌─ ARGENT DISPONIBLE ─────────────── (bordure gauche verte) ────┐
│  Solde caisse & banque    Bénéfice net (mois)                  │
└────────────────────────────────────────────────────────────────┘

┌─ CE QU'ON ME DOIT / CE QUE JE DOIS ─ (bordure gauche ambre) ──┐
│  Crédit client            Dette fournisseurs                   │
└────────────────────────────────────────────────────────────────┘

┌─ ACTIVITÉ ────────────────────────── (bordure gauche bleue) ──┐
│  CA jour    CA mois    CA annuel    Total commandes            │
└────────────────────────────────────────────────────────────────┘
```

Règles de style à appliquer dans le composant `SyntheseDecisionDGPanel` :

- **Chiffre en `text-3xl font-black`** (aujourd'hui `text-lg` — trop petit pour un DG).
- **Bordure gauche 4px** de couleur famille (`border-l-4`), fond blanc.
- **Pastille de statut** en haut à droite : vert `SAIN` / ambre `ATTENTION` / rouge `CRITIQUE`.
- **Bouton d'action** en bas de carte (`action_label` → `action_href`) : le DG regarde puis **agit**.
- Les cartes `CRITIQUE` remontent visuellement (ring rouge + fond `bg-red-50/40`).

Composant à créer : `src/components/dashboard/SyntheseDecisionDGPanel.tsx`
Modification : `src/components/dashboard/roles/DashboardDG.tsx` (insérer en position 1, descendre `RapportIAGlobal` en position 3).

### 2.5 Regroupement des 10 KPI existants

Ne pas les supprimer — les **grouper** par `categorie` (le champ existe déjà : `COMMERCIAL` / `FINANCE` / `OPERATIONS`) en 3 sections titrées au lieu d'une grille plate de 10.

---

## 3. Bloc B — KPI de performance par poste (tous sauf DG)

### 3.1 Principe

Chaque poste voit **son propre score de performance** : 4 à 5 KPI avec *valeur / objectif / % atteinte / tendance*, plus un **score global de poste sur 100**. Le DG les voit tous agrégés (déjà partiellement dans `buildEquipesPilotageDG`).

### 3.2 Type unique à créer

Fichier : `src/lib/kpi-postes-registry.ts`

```ts
export interface KpiPoste {
  cle: string
  label: string
  valeur: number
  objectif: number
  unite: 'FCFA' | '%' | 'j' | '' | 'cmd' | 'visites'
  format: 'fcfa' | 'number' | 'pct' | 'jours'
  /** true = plus bas est meilleur (délai, impayés, ruptures) */
  invert: boolean
  sparkline: number[]        // 6 derniers mois/semaines
  variation_pct: number
  poids: number              // pondération dans le score de poste (Σ = 100)
}

export interface PerformancePoste {
  role: UserRole
  titre: string              // "Performance — Responsable Stock"
  periode: string            // "Juin 2026"
  score_global: number       // 0-100, calculé par pondération
  kpis: KpiPoste[]
  points_forts: string[]
  axes_progres: string[]
}

export const KPI_POSTES: Record<Exclude<UserRole, 'DG'>, PerformancePoste>
export function buildPerformancePoste(role: UserRole): PerformancePoste | null
export function calculScorePoste(kpis: KpiPoste[]): number
```

### 3.3 Le KPI de chaque poste

| Poste | KPI 1 | KPI 2 | KPI 3 | KPI 4 | KPI 5 |
|---|---|---|---|---|---|
| **DC** | CA réseau / objectif | Couverture tournées % | Marge brute % | Nouveaux PDV signés | Taux conversion prospects |
| **RESP_VENTES** | CA zone / quota | Commandes terrain / j | Panier moyen | PDV actifs / portefeuille | Taux rupture commande |
| **SUPERVISEUR** | Couverture visites zone % | Commerciaux ≥ quota | PDV à risque churn *(invert)* | Délai traitement litige *(invert)* | CA zone |
| **COMMERCIAL** | Visites / objectif jour | Commandes prises | CA généré | Taux transformation visite→cmd | Encaissement terrain % |
| **FREELANCE** | Marge nette dégagée | CA société | PDV portefeuille | Respect grille prix % | Nouveaux PDV |
| **PROSPECTION** | Prospects qualifiés | Taux 1re commande % | Zones blanches couvertes | Coût acquisition PDV *(invert)* | Délai prospect→client *(invert)* |
| **RESP_STOCK** | Taux service entrepôts % | Ruptures SKU *(invert)* | Rotation stock (j) *(invert)* | Taux réappro dans délai % | Valeur stock immobilisé *(invert)* |
| **GEST_ENTREPOT** | Délai préparation (j) *(invert)* | Expéditions / jour | Taux erreur picking *(invert)* | BL en attente *(invert)* | Taux service entrepôt % |
| **DAF** | Solde trésorerie | Marge nette % | Dette fournisseurs échue *(invert)* | DSO — délai encaissement (j) *(invert)* | Écart budget vs réel |
| **COMPTABLE** | Écritures saisies / j | Taux rapprochement % | Suspens ouverts *(invert)* | Délai clôture (j) *(invert)* | Factures traitées / j |
| **MARKETING** | ROI campagnes % | PDV touchés | Taux conversion promo % | Coût / PDV activé *(invert)* | CA généré par combos |
| **RECOUVREMENT** | Montant encaissé | Taux encaissement % | DSO (j) *(invert)* | Relances abouties % | Créances > 60j *(invert)* |

### 3.4 Où l'afficher

1. **En haut du dashboard de chaque rôle** : composant `PerformancePostePanel` (bandeau score + 4-5 cartes KPI avec barre objectif).
2. **Page `/equipe`** : le DG/DC voit la matrice de tous les postes (score global + top/flop).
3. Composant à créer : `src/components/dashboard/PerformancePostePanel.tsx`
4. Dashboards à créer (les 5 rôles sans vue propre) : `DashboardRespVentes`, `DashboardSuperviseur`, `DashboardGestEntrepot`, `DashboardComptable`, `DashboardProspection` — puis étendre le `switch` de `DashboardByRole.tsx`.

---

## 4. Bloc C — E-facture & Facture proforma

### 4.1 Cycle de vie du document commercial

```
DEVIS ──▶ PROFORMA ──▶ (acceptation client) ──▶ COMMANDE ──▶ BL ──▶ FACTURE ──▶ E-FACTURE (transmise/certifiée)
   │           │                                                          │
   └── refus   └── expiration (J+15)                          AVOIR ◀─────┘
```

### 4.2 Types à ajouter dans `src/types/index.ts`

```ts
export type TypeDocument = 'DEVIS' | 'PROFORMA' | 'FACTURE' | 'AVOIR' | 'FACTURE_ACHAT'

export type ProformaStatut =
  | 'BROUILLON' | 'ENVOYEE' | 'VUE' | 'ACCEPTEE' | 'REFUSEE' | 'EXPIREE' | 'CONVERTIE'

export interface Proforma {
  id: string
  numero: string                    // PRO-2026-0142
  pdv_id: string
  pdv_nom: string
  commercial: string
  zone: string
  date_emission: string
  date_validite: string             // par défaut J+15
  lignes: LigneFacture[]
  montant_ht: number
  tva_pct: number                   // 18% (Togo)
  montant_ttc: number
  remise_globale_pct: number
  statut: ProformaStatut
  conditions_paiement: ModePaiementFacture
  /** Renseigné après conversion */
  commande_ref?: string
  facture_ref?: string
  /** Aide IA */
  score_acceptation_ia: number      // 0-100 : probabilité que le client signe
  suggestion_ia?: string            // "Remise 3% → +22 pts d'acceptation"
  canal_envoi: 'WHATSAPP' | 'EMAIL' | 'SMS' | 'IMPRESSION'
  vue_le?: string
  relances_envoyees: number
}

// ── E-facture ────────────────────────────────────────────────
export type EFactureStatut =
  | 'NON_TRANSMISE' | 'EN_ATTENTE' | 'TRANSMISE' | 'CERTIFIEE' | 'REJETEE'

export interface EFactureMeta {
  facture_id: string
  statut: EFactureStatut
  numero_certification?: string     // identifiant retourné par la plateforme fiscale
  date_transmission?: string
  qr_code_payload?: string          // contenu du QR à imprimer sur la facture
  hash_document?: string            // empreinte d'intégrité
  motif_rejet?: string
  plateforme: 'OTR_TOGO' | 'INTERNE'   // Office Togolais des Recettes / mode interne
  tentatives: number
  archive_legale_url?: string       // conservation 10 ans
}
```

Extension de `Facture` : ajouter `type_document: TypeDocument`, `proforma_ref?: string`, `efacture?: EFactureMeta`, `montant_ht`, `tva_pct`, `montant_ttc`.

### 4.3 Écrans

**Page `/facturation` — nouveaux onglets :**

| Onglet | Contenu | Rôles |
|---|---|---|
| **Proformas** | Liste + statut + score IA d'acceptation + relance + bouton **« Convertir en commande »** | DG, DC, RESP_VENTES, COMMERCIAL, FREELANCE, DAF, COMPTABLE |
| **Factures** | Existant + colonne **statut e-facture** (pastille) | DG, DAF, COMPTABLE, RECOUVREMENT, DC |
| **E-facturation** | File de transmission, rejets à corriger, taux de certification, archive légale | DG, DAF, COMPTABLE |
| **Avoirs** | Notes de crédit liées aux retours | DAF, COMPTABLE |

**Générateur de proforma** (`ProformaBuilder`) : sélection PDV → lignes catalogue (tarif grossiste appliqué automatiquement) → remise → conditions de paiement → aperçu PDF → envoi WhatsApp/email.

**Nouveaux fichiers :**
- `src/lib/registries/proformas-registry.ts`
- `src/lib/proforma-builder.ts` (calcul HT/TVA/TTC, score IA, conversion → commande)
- `src/lib/efacture-builder.ts` (file de transmission, statuts, QR payload)
- `src/components/facturation/ProformasView.tsx`
- `src/components/facturation/ProformaBuilder.tsx`
- `src/components/facturation/EFactureView.tsx`
- `src/components/facturation/DocumentPreview.tsx` (rendu imprimable proforma/facture + QR)

### 4.4 KPI e-facture (bandeau page)

`Proformas en attente` · `Taux d'acceptation %` · `Délai moyen proforma → commande` · `E-factures certifiées %` · `Rejets à corriger`

---

## 5. Bloc D — Fournisseurs & réappro automatique

C'est le bloc à plus forte valeur : il ferme la boucle **rupture détectée → commande fournisseur → réception → dette → paiement**.

### 5.1 Registre fournisseurs

Fichier : `src/lib/registries/fournisseurs-registry.ts`

```ts
export type StatutFournisseur = 'ACTIF' | 'PREFERENTIEL' | 'SUSPENDU' | 'EN_EVALUATION'

export interface Fournisseur {
  id: string
  code: string                      // FRN-001
  nom: string                       // "Huiles de l'Ouest SA"
  categories: string[]              // ['Alimentaire'] — familles fournies
  contact: { nom: string; telephone: string; email: string }
  pays: string
  statut: StatutFournisseur

  // ── Conditions commerciales ──
  delai_livraison_j: number         // 5
  delai_paiement_j: number          // 30 (crédit fournisseur)
  franco_de_port: number            // montant mini pour livraison gratuite
  minimum_commande: number
  remise_volume_pct: number

  // ── Dette (alimente le KPI DG « Dette fournisseurs ») ──
  encours_du: number                // total dû
  encours_echu: number              // dont échu
  prochaine_echeance: string
  montant_prochaine_echeance: number
  plafond_credit_accorde: number

  // ── Performance (scoring IA de sélection) ──
  score_fiabilite: number           // 0-100
  taux_livraison_conforme_pct: number
  delai_reel_moyen_j: number        // vs délai annoncé
  taux_litige_pct: number
  competitivite_prix: number        // 0-100 vs marché
  ca_annuel_avec_fournisseur: number
}

export interface ProduitFournisseur {
  produit_ref: string               // PRD-HUILE-5L
  fournisseur_id: string
  prix_achat: number
  delai_j: number
  quantite_min: number
  quantite_lot: number              // conditionnement (multiple de commande)
  prioritaire: boolean              // fournisseur principal du produit
  dernier_prix_negocie?: number
  date_dernier_achat?: string
}
```

**Règle importante** : chaque produit du catalogue doit avoir **au moins 2 fournisseurs référencés** (1 prioritaire + 1 de secours) pour que l'automatisation puisse basculer.

### 5.2 Le moteur de réappro automatique

Fichier : `src/lib/reappro-engine.ts`

**Détection — quand déclencher ?**

```ts
export interface RegleReappro {
  id: string
  produit_ref: string
  actif: boolean
  /** Déclencheurs — le premier qui saute lance la procédure */
  seuil_stock: number               // stock ≤ seuil (déjà dans ProduitStock.seuil)
  couverture_min_jours: number      // ou : stock / vitesse de vente < N jours
  /** Combien commander */
  mode_quantite: 'STOCK_CIBLE' | 'QUANTITE_FIXE' | 'PREVISION_IA'
  stock_cible: number               // pour STOCK_CIBLE
  quantite_fixe?: number
  /** Automatisation */
  niveau_auto: NiveauAutomatisation
  fournisseur_prefere_id?: string   // sinon : sélection IA
  plafond_auto_fcfa: number         // au-delà → validation humaine obligatoire
  valideur_role: UserRole           // 'RESP_STOCK' | 'DAF' | 'DG'
}

export type NiveauAutomatisation =
  | 'ALERTE_SEULE'        // notifie, ne fait rien
  | 'PROPOSITION'         // génère un brouillon de commande à valider  ← défaut recommandé
  | 'AUTO_SI_SOUS_PLAFOND'// envoie seul si montant < plafond_auto_fcfa
  | 'AUTO_TOTAL'          // envoie systématiquement
```

**Calcul de la quantité (mode `PREVISION_IA`) :**

```
vitesse_vente_jour = ventes_30j / 30
stock_securite     = vitesse_vente_jour × delai_livraison_fournisseur × coeff_securite(1,3)
point_commande     = (vitesse_vente_jour × delai_livraison_j) + stock_securite
quantite_a_commander = arrondi_lot( (vitesse_vente_jour × horizon_couverture_j) + stock_securite − stock_actuel )
```

**Sélection du fournisseur (scoring) :**

```ts
score_fournisseur =
    0.30 × score_prix           // le moins cher, normalisé
  + 0.25 × score_delai          // délai réel, pas annoncé
  + 0.25 × score_fiabilite      // taux de livraison conforme
  + 0.10 × score_dette          // pénalise si encours échu élevé
  + 0.10 × score_franco         // bonus si la commande atteint le franco de port
```

Le moteur retourne **le fournisseur retenu + le suivant en réserve**, avec la justification affichée à l'écran (« Huiles de l'Ouest retenu : −8% prix, délai réel 5,2 j vs 7,1 j pour Sotra ; 240 K d'encours échu, sous plafond »).

**Regroupement intelligent** : si plusieurs produits en manque partagent le même fournisseur, le moteur **fusionne en une seule commande** pour atteindre le franco de port et la remise volume. C'est le gain économique réel de l'automatisation — à afficher explicitement (« 3 produits regroupés → franco atteint, économie 45 000 F de transport »).

### 5.3 Commande fournisseur

```ts
export type StatutCommandeFournisseur =
  | 'SUGGEREE_IA'      // proposée par le moteur, non validée
  | 'BROUILLON'
  | 'EN_VALIDATION'    // attend le valideur (RESP_STOCK / DAF / DG selon montant)
  | 'ENVOYEE'          // transmise au fournisseur
  | 'CONFIRMEE'        // accusé de réception fournisseur
  | 'EN_TRANSIT'
  | 'RECUE_PARTIELLE'
  | 'RECUE'            // → génère l'entrée en stock + la dette fournisseur
  | 'ANNULEE'
  | 'LITIGE'

export interface CommandeFournisseur {
  id: string
  reference: string                 // CF-2026-0087
  fournisseur_id: string
  fournisseur_nom: string
  entrepot_destination: string
  statut: StatutCommandeFournisseur
  origine: 'AUTO_IA' | 'MANUELLE'
  regle_declenchee?: string         // id de la RegleReappro
  lignes: LigneCommandeFournisseur[]
  montant_ht: number
  montant_ttc: number
  date_creation: string
  date_envoi?: string
  date_livraison_prevue: string
  date_livraison_reelle?: string
  echeance_paiement: string         // = date réception + delai_paiement_j
  statut_paiement: 'NON_DUE' | 'A_PAYER' | 'PARTIEL' | 'PAYEE' | 'ECHUE'
  montant_paye: number
  /** Traçabilité de l'automatisation */
  justification_ia?: string
  fournisseur_alternatif_id?: string
  economie_regroupement?: number
  valide_par?: string
  valide_le?: string
}

export interface LigneCommandeFournisseur {
  produit_ref: string
  produit_nom: string
  quantite_commandee: number
  quantite_recue?: number
  prix_achat_unitaire: number
  total: number
  motif: 'SEUIL_ATTEINT' | 'PREVISION_RUPTURE' | 'REGROUPEMENT' | 'MANUEL' | 'PROMO_FOURNISSEUR'
}
```

### 5.4 API du moteur

```ts
// src/lib/reappro-engine.ts
export function detecterProduitsEnManque(): AlerteReappro[]
export function selectionnerFournisseur(produitRef: string, quantite: number): SelectionFournisseur
export function calculerQuantiteReappro(produitRef: string, regle: RegleReappro): number
export function genererCommandesSuggerees(): CommandeFournisseur[]   // avec regroupement
export function simulerImpactTresorerie(cmds: CommandeFournisseur[]): ImpactTresorerie
export function validerCommandeFournisseur(id: string, valideur: AuthUser): CommandeFournisseur
export function receptionner(id: string, lignes: LigneReception[]): { stock: ProduitStock[]; dette: number }
```

**Garde-fou trésorerie** : avant d'envoyer une commande auto, le moteur vérifie `solde_tresorerie_projete − montant_commande > seuil_plancher`. Si le seuil est franchi → escalade au DAF au lieu d'envoi automatique. Sans ce garde-fou, l'automatisation peut vider la caisse.

### 5.5 Écrans — nouvelle rubrique « Approvisionnement »

Route : `/approvisionnement` — 4 onglets :

| Onglet | Contenu |
|---|---|
| **Réappro IA** | Produits en manque · quantité suggérée · fournisseur retenu + justification · regroupements · bouton **Valider tout / Valider la ligne** · impact trésorerie simulé |
| **Commandes fournisseurs** | Pipeline `SUGGEREE → ENVOYEE → EN_TRANSIT → RECUE` · réception avec écarts · litiges |
| **Fournisseurs** | Fiche par fournisseur : conditions, **encours & échéancier de dette**, score fiabilité, historique, produits fournis, comparatif prix |
| **Règles d'automatisation** | Par produit : seuil, couverture min, mode quantité, **niveau d'automatisation**, plafond auto, valideur · journal des déclenchements |

**Bandeau KPI de la page** : `Produits sous seuil` · `Commandes auto en attente de validation` · `Dette fournisseurs (dont échue)` · `Délai réappro moyen` · `Taux de service fournisseur %`

**Fichiers à créer :**
- `src/lib/registries/fournisseurs-registry.ts`
- `src/lib/registries/commandes-fournisseurs-registry.ts`
- `src/lib/registries/regles-reappro-registry.ts`
- `src/lib/reappro-engine.ts`
- `src/lib/fournisseurs-hub.ts`
- `src/app/(dashboard)/approvisionnement/page.tsx`
- `src/components/approvisionnement/ApprovisionnementView.tsx`
- `src/components/approvisionnement/ReapproIAPanel.tsx`
- `src/components/approvisionnement/CommandesFournisseursView.tsx`
- `src/components/approvisionnement/FournisseursView.tsx`
- `src/components/approvisionnement/FicheFournisseur.tsx`
- `src/components/approvisionnement/ReglesReapproView.tsx`

**Fichiers à modifier :**
- `src/types/index.ts` — ajouter `fournisseur_principal_id` et `ventes_30j` sur `ProduitStock`
- `src/lib/registries/stock-registry.ts` — rattacher chaque produit à ses fournisseurs
- `src/components/stock/StockView.tsx` — bouton « Réapprovisionner » sur toute ligne sous seuil
- `src/lib/registries/comptabilite-registry.ts` — la dette `401100` doit être **dérivée** de `Σ FOURNISSEURS.encours_du` (source unique de vérité)

---

## 6. Bloc E — Menu réorganisé

### 6.1 Nouvelle structure (`src/components/layout/Sidebar.tsx`)

Le groupe **Opérations** passe en premier, **Pilotage financier** en tête de ce groupe.

```
┌── OPÉRATIONS ──────────────────────────────────────────────┐
│ 1. Pilotage financier      /pilotage-financier             │  ← EN PREMIER
│ 2. Tableau de bord         /dashboard                      │
│ 3. Commandes               /commandes                      │
│ 4. Stock & Logistique      /stock                          │
│ 5. Approvisionnement       /approvisionnement       [NEW]  │
│ 6. Facturation & Proforma  /facturation             [MAJ]  │
│ 7. Relances & Impayés      /relances                       │
└────────────────────────────────────────────────────────────┘
┌── COMMERCIAL ──────────────────────────────────────────────┐
│ 8.  Points de vente        /points-de-vente                │
│ 9.  Commercial terrain     /commercial                     │
│ 10. Marketing & Prospection /marketing                     │
└────────────────────────────────────────────────────────────┘
┌── PILOTAGE ────────────────────────────────────────────────┐
│ 11. Équipe & Performance   /equipe                         │
│ 12. Comptabilité           /comptabilite                   │
└────────────────────────────────────────────────────────────┘
```

**Note** : aujourd'hui `/comptabilite` sert deux libellés différents (« Pilotage financier » pour le DG, « Comptabilité » pour DAF/COMPTABLE) sur la **même route**, ce qui casse le surlignage de l'élément actif. À séparer : `/pilotage-financier` (vue DG/DAF, décisionnelle) et `/comptabilite` (vue COMPTABLE, écritures).

### 6.2 Badges dynamiques à ajouter

- Approvisionnement : nombre de commandes auto en attente de validation
- Facturation : nombre de proformas expirant sous 48 h
- Relances : nombre d'impayés critiques (existant, à rendre dynamique)

---

## 7. Bloc F — Menu & contenu par persona

> Légende : **✚** = à créer · **↻** = à modifier · (rien) = existe déjà

### 7.1 DG — Directeur Général
**Menu** : tout, sans restriction.
**Contenu clé :**
- ✚ Bandeau **8 chiffres de décision** en position 1 (§2.2)
- ↻ Rapport IA descendu en position 3
- ↻ 10 KPI regroupés en 3 familles visuelles
- ✚ Vue **Dette fournisseurs** : échéancier + impact trésorerie J+30
- ✚ Vue **Approvisionnement** : commandes auto > plafond DG à valider
- ✚ Matrice **score de tous les postes** (issue de `KPI_POSTES`)
- Pas de KPI de performance personnel (demande explicite)

### 7.2 DC — Directeur Commercial
**Menu** : Pilotage financier (lecture) · Tableau de bord · Commandes · Stock · Facturation & Proforma · Relances · PDV · Commercial terrain · Marketing · Équipe
**Contenu :**
- ✚ `PerformancePostePanel` : CA réseau/objectif · couverture · marge · nouveaux PDV · conversion
- ✚ Proformas de toute la force de vente + taux d'acceptation par commercial
- Pilotage par canal (VRP / freelance / prospection) — existant
- Classement commerciaux — existant

### 7.3 RESP_VENTES — Responsable des Ventes ✚ *dashboard dédié*
**Menu** : Tableau de bord · Commandes · Facturation & Proforma · Relances · PDV · Commercial terrain · Équipe
**Contenu :**
- ✚ `PerformancePostePanel` : CA zone/quota · cmd terrain/j · panier moyen · PDV actifs · taux rupture commande
- ✚ Ses commerciaux : qui est sous quota, qui décroche
- ✚ Proformas de sa zone à relancer
- Commandes de sa zone (filtre auto sur `user.zone`)

### 7.4 SUPERVISEUR — Superviseur de Zone ✚ *dashboard dédié*
**Menu** : Tableau de bord · Commandes · Relances · PDV · Commercial terrain · Équipe
**Contenu :**
- ✚ `PerformancePostePanel` : couverture visites · commerciaux ≥ quota · PDV à risque · délai litige · CA zone
- ✚ **Validations en attente** : dépassements de plafond crédit, remises hors grille
- Carte des tournées du jour + PDV non visités depuis 15 j
- Escalades des commerciaux

### 7.5 COMMERCIAL — Commercial Terrain
**Menu** : Tableau de bord · Commandes · PDV · Commercial terrain · Relances · Stock (consultation)
**Contenu :**
- ✚ `PerformancePostePanel` : visites/objectif · commandes prises · CA · transformation · encaissement
- ✚ **Créer une proforma sur le terrain** → envoi WhatsApp au client (mode offline avec file d'attente)
- ✚ Encours crédit du PDV visité affiché **avant** la prise de commande
- Tournée du jour + prochaine visite — existant

### 7.6 FREELANCE — Commercial Freelance
**Menu** : Tableau de bord · Commandes · PDV · Commercial terrain · Facturation (ses proformas)
**Contenu :**
- ✚ `PerformancePostePanel` : marge nette · CA société · portefeuille · **respect grille prix %** · nouveaux PDV
- ✚ Alerte si vente sous la marge minimale (12%)
- ✚ Proforma avec son prix de revente (marge affichée en direct)
- Simulateur de marge — existant

### 7.7 PROSPECTION — Chargé de Prospection ✚ *dashboard dédié*
**Menu** : Tableau de bord · PDV · Commercial terrain · Marketing · Commandes (1re commande)
**Contenu :**
- ✚ `PerformancePostePanel` : prospects qualifiés · taux 1re commande · zones blanches · coût acquisition · délai prospect→client
- ✚ Carte des **zones blanches** (aucun PDV dans un rayon)
- ✚ Proforma « offre découverte » (remise 1re commande) — le blocage identifié par l'IA sur Boutique Nouvelle
- Pipeline prospects — existant

### 7.8 RESP_STOCK — Responsable Stock & Logistique
**Menu** : Tableau de bord · Stock · **Approvisionnement** · Commandes · Catalogue
**Contenu :**
- ✚ `PerformancePostePanel` : taux service · ruptures · rotation stock · réappro dans les délais · stock immobilisé
- ✚ **Écran principal = Réappro IA** : valide les commandes fournisseurs suggérées (c'est son poste central)
- ✚ Configure les **règles d'automatisation** par produit
- ✚ Comparatif fournisseurs (prix / délai / fiabilité)
- Stock multi-entrepôts, transferts internes — existant

### 7.9 GEST_ENTREPOT — Gestionnaire Entrepôt ✚ *dashboard dédié*
**Menu** : Tableau de bord · Stock (son entrepôt) · Commandes à préparer · Approvisionnement (réceptions)
**Contenu :**
- ✚ `PerformancePostePanel` : délai préparation · expéditions/j · taux erreur picking · BL en attente · taux service
- ✚ **Réception des commandes fournisseurs** : saisie des écarts quantité/qualité → déclenche un litige si écart
- File de picking du jour, BL à éditer — existant
- Périmètre restreint à son entrepôt (`user.zone`)

### 7.10 DAF — Directeur Administratif & Financier
**Menu** : **Pilotage financier** · Tableau de bord · Facturation & Proforma · E-facturation · Comptabilité · Relances · Approvisionnement (validation paiements) · Stock (valorisation)
**Contenu :**
- ✚ `PerformancePostePanel` : trésorerie · marge nette · dette échue · DSO · écart budget
- ✚ **Échéancier fournisseurs** : ce qui sort à J+7 / J+15 / J+30
- ✚ **Validation des commandes fournisseurs** au-dessus du plafond
- ✚ Vue e-facturation : conformité, rejets, archive légale
- ✚ Balance âgée **client ET fournisseur** (aujourd'hui : client seulement)
- Trésorerie, compte de résultat — existant

### 7.11 COMPTABLE ✚ *dashboard dédié*
**Menu** : Tableau de bord · Comptabilité · Facturation & Proforma · E-facturation
**Contenu :**
- ✚ `PerformancePostePanel` : écritures/j · rapprochement % · suspens · délai clôture · factures traitées
- ✚ **Saisie des factures d'achat fournisseurs** (le pendant achat des factures de vente)
- ✚ File e-facture : corriger les rejets, transmettre
- Journal, balance, rapprochement, suspens — existant

### 7.12 MARKETING — Responsable Marketing
**Menu** : Tableau de bord · Marketing · PDV · Stock (combos) · Relances (campagnes)
**Contenu :**
- ✚ `PerformancePostePanel` : ROI campagnes · PDV touchés · conversion promo · coût/PDV activé · CA combos
- ✚ **Promotions fournisseurs** : quand un fournisseur propose une remise volume, monter une campagne d'écoulement
- Campagnes, combos stock — existant

### 7.13 RECOUVREMENT — Responsable Recouvrement
**Menu** : Tableau de bord · Relances · Facturation (impayés) · PDV (à risque)
**Contenu :**
- ✚ `PerformancePostePanel` : montant encaissé · taux encaissement · DSO · relances abouties · créances > 60 j
- ✚ **Balance âgée client** en écran d'entrée + priorisation IA par probabilité de recouvrement
- ✚ Blocage/déblocage du crédit client (avec trace)
- Pipeline de relances — existant

### 7.14 Matrice de synthèse — accès par route

| Route | DG | DC | R.VENTES | SUPERV | COMM | FREEL | PROSP | R.STOCK | ENTREPOT | DAF | COMPTA | MKTG | RECOUV |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| /pilotage-financier | ✅ | 👁 | — | — | — | — | — | — | — | ✅ | — | — | — |
| /dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| /commandes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁 | 👁 | — | — |
| /stock | ✅ | 👁 | — | — | 👁 | 👁 | — | ✅ | ✅ | 👁 | — | 👁 | — |
| **/approvisionnement** | ✅ | — | — | — | — | — | — | ✅ | ✅ | ✅ | 👁 | 👁 | — |
| /facturation (+proforma) | ✅ | ✅ | ✅ | 👁 | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | — | ✅ |
| /facturation?tab=efacture | ✅ | — | — | — | — | — | — | — | — | ✅ | ✅ | — | — |
| /relances | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ | — | ✅ | ✅ |
| /points-de-vente | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ | ✅ |
| /commercial | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| /marketing | ✅ | ✅ | — | — | — | — | ✅ | — | — | — | — | ✅ | — |
| /equipe | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — |
| /comptabilite | ✅ | — | — | — | — | — | — | — | — | ✅ | ✅ | — | — |

✅ = accès complet · 👁 = lecture seule · — = pas d'accès

---

## 8. Bloc G — Modèle de données : récapitulatif des ajouts

### Types (`src/types/index.ts`)
```ts
+ TypeDocument, ProformaStatut, Proforma
+ EFactureStatut, EFactureMeta
+ StatutFournisseur, Fournisseur, ProduitFournisseur
+ StatutCommandeFournisseur, CommandeFournisseur, LigneCommandeFournisseur
+ NiveauAutomatisation, RegleReappro, AlerteReappro, SelectionFournisseur
+ KpiPoste, PerformancePoste
+ ChiffreDecisionDG, FamilleChiffre

↻ ProduitStock  += fournisseur_principal_id, ventes_30j, vitesse_vente_jour, couverture_jours
↻ Facture       += type_document, montant_ht, tva_pct, montant_ttc, proforma_ref, efacture
```

### Registres
```
+ src/lib/registries/fournisseurs-registry.ts          (8-10 fournisseurs)
+ src/lib/registries/produits-fournisseurs-registry.ts (2+ fournisseurs par produit)
+ src/lib/registries/commandes-fournisseurs-registry.ts
+ src/lib/registries/regles-reappro-registry.ts
+ src/lib/registries/proformas-registry.ts
+ src/lib/kpi-postes-registry.ts
```

### Cohérence des chiffres (à respecter impérativement)
- `Dette fournisseurs (KPI DG)` = `Σ FOURNISSEURS.encours_du` = `solde compte 401100`
- `Crédit client (KPI DG)` = `Σ CREANCES_COMPTABLES.reste` = `Σ (facture.montant − facture.paye)`
- `Solde caisse (KPI DG)` = `Σ COMPTES_TRESORERIE.solde`
- `Bénéfice net (KPI DG)` = `COMPTE_RESULTAT` section `RESULTAT`

Sans cette règle, le DG verra trois chiffres différents pour la même réalité selon la page — c'est le défaut le plus coûteux en démo.

---

## 9. Bloc H — Plan de réalisation (5 lots)

| Lot | Contenu | Fichiers | Dépendances |
|---|---|---|---|
| **1** | Menu réorganisé + route `/pilotage-financier` séparée | `Sidebar.tsx`, nouvelle route | aucune |
| **2** | Bandeau 8 chiffres DG + regroupement visuel des KPI | `dg-synthese-decision-builder.ts`, `SyntheseDecisionDGPanel.tsx`, `DashboardDG.tsx` | Lot 4 pour la dette réelle (sinon valeur provisoire depuis `401100`) |
| **3** | KPI de poste + 5 dashboards manquants | `kpi-postes-registry.ts`, `PerformancePostePanel.tsx`, 5 `Dashboard*.tsx`, `DashboardByRole.tsx` | aucune |
| **4** | Fournisseurs + moteur de réappro + rubrique Approvisionnement | 12 fichiers (§5.5) | types + registres |
| **5** | Proforma + e-facture | 7 fichiers (§4.3) | types + registre proformas |

**Ordre recommandé** : 1 → 3 → 4 → 2 → 5.
Le lot 4 avant le lot 2 : la dette fournisseurs est l'un des 8 chiffres du DG, autant qu'elle soit vraie dès l'affichage plutôt que codée en dur puis rebranchée.
