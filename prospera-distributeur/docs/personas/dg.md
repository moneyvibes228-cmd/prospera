# DG — Directeur Général

> Fiche de référence. Les 12 autres personas suivent cette structure.

## Identité

| | |
|---|---|
| Rôle (`UserRole`) | `DG` |
| Libellé | Directeur Général |
| Utilisateur démo | Koffi Mensah · dg@demo.prospera.tg · `password123` |
| Zone | Réseau — Togo (aucune restriction de périmètre) |
| Couleur d'avatar | `bg-slate-700` |
| Posture | Scanne les chiffres, arbitre, délègue. Ne saisit rien. |

## Menu

Le DG est le **seul rôle à voir les 10 liens** et les 3 groupes de la Sidebar.

```
PRINCIPAL
  1. Tableau de bord          /dashboard
  2. Points de vente          /points-de-vente
  3. Commercial terrain       /commercial
  4. Commandes                /commandes
OPÉRATIONS
  5. Stock & Logistique       /stock
  6. Facturation & Créances   /facturation
  7. Relances & Impayés       /relances          [badge 3]
PILOTAGE
  8. Marketing & Prospection  /marketing
  9. Équipe & Performance     /equipe
 10. Pilotage financier       /comptabilite
```

Le lien 10 est libellé « Pilotage financier » **uniquement pour le DG** ; DAF et COMPTABLE voient le même `href` sous le libellé « Comptabilité ».

---

## Détail de chaque lien

### 1. Tableau de bord — `/dashboard`

**Composant** : `DashboardByRole` → [DashboardDG.tsx](../../src/components/dashboard/roles/DashboardDG.tsx) — le dashboard le plus riche de l'application.

Séquence de la page :

1. **Bandeau supérieur** — « Pilotage Direction Générale » + expéditions/j, commandes terrain/j, clients actifs (`PILOTAGE_CONSOLIDE_DG`), encart « Attention » et bouton clignotant *N alertes critiques*.
2. **Rapport IA global** (`RapportIAGlobal` / `RAPPORT_IA_DG`) — synthèse stratégique, insights, anomalies.
3. **KPIs 360°** — 10 cartes `KpiCardWithSparkline` issues de `KPIS_GLOBAUX_DG`, tendance 6 mois, badge de catégorie (`COMMERCIAL` / `FINANCE` / `OPERATIONS`).
4. **Cartographie & pilotage par zone** (`ZonePilotageDGPanel`).
5. **Pilotage entrepôts & canaux** — cartes `PILOTAGE_AXES_DG` cliquables (2 entrepôts + 3 canaux), score IA /100, statut SAIN/ATTENTION/CRITIQUE. Le clic filtre les insights et le graphe.
6. **Alertes opérationnelles IA** (`AiInsightPanel`, contextualisées à l'axe sélectionné).
7. **Sorties entrepôt + prévisions IA** — courbe `CA_SPARKLINE_REGISTRY` + 3 mois de forecast (confiance affichée) · **Anomalies opérationnelles IA** en colonne.
8. **Top produits** (sorties, marge, rupture) · **Expéditions du jour** (BL, entrepôt, statut, retard).
9. **Répartition des sorties par famille** · **Balance âgée créances clients B2B**.
10. **Top impayés priorisés IA** · **Pilotage équipes** (performance %, alerte, recommandation IA).

**Périmètre** : consolidé réseau, aucun filtre.

### 2. Points de vente — `/points-de-vente`

**Composant** : `PointsDeVenteView` — « Réseau clients & magasins », badge *échantillon réseau 1 847*.
**Contenu** : 6 KPI (CA réseau, magasins enseigne, partenaires B2B, impayés total, clients à risque, prospection), pipeline commercial, scoring IA par point, créances et évolution produits.
**Sous-page** : clic sur un point → `/points-de-vente/[id]` (`PdvRapportView`, fiche rapport détaillée).
**Périmètre** : tout le réseau (pas de filtrage par commercial pour le DG).

### 3. Commercial terrain — `/commercial`

**Composant** : `CommercialTerrainView` — « Pilotage commercial terrain », badge *Temps réel*.
**Contenu** : 6 KPI (équipes, visites jour/objectif, CA terrain, couverture, impayés à relancer, alertes GPS), **carte terrain** (`CarteCommercialDG`) avec statut par commercial (En tournée / Bureau / Pause / **Alerte GPS**), analyses IA, **coaching prioritaire**, fiche détaillée par commercial (CA mois, évolution, impayés, prospects).
**Périmètre** : toutes les équipes.

### 4. Commandes — `/commandes`

**Composant** : `CommandesView`, **branche « pilotage »** (DG, DC, DAF, RESP_VENTES, SUPERVISEUR, RESP_STOCK, GEST_ENTREPOT).
**Contenu** : « Pilotage commandes grossiste ».
- 8 KPI : volume jour, panier moyen, marge brute moyenne, en préparation, priorité IA, **bloquées crédit**, magasins enseigne, lignes totales.
- **Pipeline** cliquable BROUILLON → VALIDÉE → PRÉPARATION → LIVRÉE (compte + volume), barre de répartition du volume.
- **Flux par entrepôt** (Lomé Port, Kara) : commandes, en préparation, bloquées, taux de service, charge picking.
- Répartition **par type de client**, **file prioritaire entrepôt**, filtres par zone.
- **Analyses IA commandes** (sévérité + action recommandée).
- Liste des commandes en cartes : marge, priorité IA, alerte crédit, marge freelance le cas échéant.

### 5. Stock & Logistique — `/stock`

**Composant** : `StockLogistiqueView` → 3 onglets.

| Onglet | Contenu |
|---|---|
| **Stock & logistique** (`StockView`) | 8 KPI (valeur stock, ruptures actives, sous seuil, couverture moyenne, taux de service, cmd à préparer, PDV en rupture, ruptures/3 mois) · sous-onglets *Vue globale · Lomé Port · Kara · Alertes & ruptures · Préparation commandes* · expéditions du jour · analyses IA logistique · fiche produit (couverture, rotation, marge, valeur immobilisée) |
| **Sorties entrepôt** (`EntrepotSortiesHistoriquePanel`) | Historique des sorties par entrepôt |
| **Catalogue produits** (`CatalogueView`) | Référentiel des 12 SKU (cible de la redirection `/catalogue`) |

### 6. Facturation & Créances — `/facturation`

**Composant** : `FacturationView` — « Pilotage facturation & créances ».
**Contenu** : 8 KPI (CA facturé, encaissé, créances ouvertes, impayés en retard, taux de recouvrement, délai d'encaissement, factures en retard, clients à risque) · 7 onglets : *Vue globale · Créances ouvertes · En retard · Émises · Payées · Partenaires B2B · Enseigne Atlas Shop* · **grille tarifaire par type de client** · analyses IA créances · fiche facture (reste à payer, marge, échéance, mode de paiement, plafond crédit).

### 7. Relances & Impayés — `/relances`

**Composant** : `RelancesView` — « Pipeline relances & recouvrement », badge rouge *3* dans le menu.
**Contenu** : 8 KPI (en cours, montant en jeu, résolues, contentieux, recouvré du mois, taux de réponse, relances auto/jour, visites planifiées) · 4 onglets : *Recouvrement impayés · Réapprovisionnement · Prospection · Tous les flux* · analyses IA recouvrement · fiche dossier par PDV (canal, score de succès).

### 8. Marketing & Prospection — `/marketing`

**Composant** : `MarketingByRole` → **`MarketingDGView`** (le DG n'est pas un « opérateur » marketing).
**Contenu** : « Pilotage marketing — vue Directeur Général ».
- 6 KPI : CA campagnes du mois, marge générée, ROI moyen, budget consommé, marge/CA vs objectif, leads chauds.
- **Analyse IA — situation marketing**.
- **Contrôle des campagnes en cours** (le DG arbitre, il ne crée pas).
- **Combos d'écoulement stock IA** · **Suggestions de campagnes IA**.
- **5 décisions prioritaires pour le DG**.

### 9. Équipe & Performance — `/equipe`

**Composant** : `EquipeView` — « Pilotage équipe & performance commerciale ».
**Contenu** : 8 KPI (performance moyenne, CA total/mois, % objectif, clients récurrents, factures/mois, recouvrement moyen, top performers, dégradés) · **synthèse IA de l'équipe** · **décisions recommandées pour le DG** · 3 onglets : *Classement & fiches · Tableau comparatif · Coaching & retours IA* · fiche commerciale (CA, clients récurrents/portefeuille, nouveaux, factures, commissions, avantages).

### 10. Pilotage financier — `/comptabilite`

**Composant rendu aujourd'hui** : `ComptabiliteView` (« Comptabilité & Finance », **vue DAF**) — c'est un défaut : la route `/pilotage-financier` et son composant `ComptabiliteDGView` existent déjà mais **ne sont pas câblés dans la Sidebar**.

Ce que `ComptabiliteDGView` (vue DG cible) affiche : « Pilotage financier — trésorerie · rentabilité · créances · décisions à trancher », badge *Clôture dans N j*, 5 chiffres (trésorerie disponible, créances à risque, marge brute vs objectif 25 %, résultat net du mois, encours clients), **décisions à trancher**, trésorerie à 7 jours, clients à surveiller, rentabilité du mois.

---

## Spec V2 — état de l'intégration

Livré :

- ✅ **Bandeau des 8 chiffres de décision** (`SyntheseDecisionDGPanel`) en **position 1** du dashboard, avant le rapport IA — trois familles visuelles : *argent disponible* · *ce qu'on me doit / ce que je dois* · *activité*. Chaque carte porte un statut (SAIN / ATTENTION / CRITIQUE) et un bouton d'action vers la page concernée.
- ✅ **Rapport IA descendu en position 2**, KPI 360° en position 3 et **regroupés en 3 familles** (Commercial · Finance · Opérations) au lieu d'une grille plate de 10.
- ✅ **Dette fournisseurs** : chiffre réel (86,4 M dont 43,8 M échus), échéancier et **impact trésorerie à J+30** sur `/pilotage-financier`.
- ✅ **Approvisionnement** `/approvisionnement` : les commandes auto au-dessus du plafond du poste remontent au DG (badge dans le menu).
- ✅ **Matrice des scores de tous les postes** (`KPI_POSTES`) sur `/equipe`.
- ✅ Le lien « Pilotage financier » pointe désormais sur `/pilotage-financier` (`ComptabiliteDGView`) et non plus sur `/comptabilite`.
- ✅ Pas de KPI de performance personnel pour le DG — conformément à la demande explicite de la spec.
