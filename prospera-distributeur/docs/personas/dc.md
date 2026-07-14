# DC — Directeur Commercial

## Identité

| | |
|---|---|
| Rôle (`UserRole`) | `DC` |
| Libellé | Directeur Commercial |
| Utilisateur démo | Ama Dzobo · dc@demo.prospera.tg · `password123` |
| Zone | Commercial — Toutes zones |
| Couleur d'avatar | `bg-teal-600` |
| Posture | Pilote la force de vente et le chiffre : objectifs, tournées, couverture, marge. |

## Menu

9 liens — tout sauf « Pilotage financier », réservé au DG.

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
```

---

## Détail de chaque lien

### 1. Tableau de bord — `/dashboard`

**Composant** : `DashboardByRole` → [DashboardDC.tsx](../../src/components/dashboard/roles/DashboardDC.tsx) — **partagé avec RESP_VENTES et SUPERVISEUR**.
**Contenu** : « Pilotage Commercial — Objectifs, tournées et performance équipes », badge *Temps réel*.
- 4 `KpiCard` : CA du jour (somme `ca_jour` des commerciaux), commandes du jour, visites terrain du jour, commerciaux actifs.
- Liste des **commandes récentes** (référence, PDV, montant société, statut).

C'est le dashboard le plus pauvre au regard du poste : 4 KPI statiques, ni objectif, ni tendance, ni analyse IA.

### 2. Points de vente — `/points-de-vente`

**Composant** : `PointsDeVenteView` (vue réseau complète, identique au DG).
**Contenu** : CA réseau, magasins enseigne, partenaires B2B, impayés, clients à risque, prospection · scoring IA par point · fiche rapport `/points-de-vente/[id]`.
**Périmètre** : tout le réseau.

### 3. Commercial terrain — `/commercial`

**Composant** : `CommercialTerrainView` — l'écran central du DC.
**Contenu** : équipes en tournée, visites jour/objectif, CA terrain, couverture des secteurs, impayés à relancer, alertes GPS · carte terrain temps réel · analyses IA · **coaching prioritaire** · fiche par commercial.

### 4. Commandes — `/commandes`

**Composant** : `CommandesView`, **branche « pilotage »** — vue complète identique au DG : pipeline, flux entrepôts, marges, commandes bloquées crédit, analyses IA, filtres zone/statut.

### 5. Stock & Logistique — `/stock`

**Composant** : `StockLogistiqueView` (onglets *Stock & logistique · Sorties entrepôt · Catalogue produits*).
**Usage DC** : consultation — vérifier la disponibilité avant de promettre à un client, repérer les ruptures qui pénalisent la vente. Aucune restriction technique n'est appliquée (le DC a la même vue que le RESP_STOCK).

### 6. Facturation & Créances — `/facturation`

**Composant** : `FacturationView` (vue complète).
**Usage DC** : suivre les créances de sa force de vente, la grille tarifaire par type de client, les clients à risque et les plafonds de crédit.

### 7. Relances & Impayés — `/relances`

**Composant** : `RelancesView` — pipeline multi-canal, onglets *Impayés · Réappro · Prospection · Tous les flux*, analyses IA.
**Usage DC** : arbitrer les impayés qui bloquent des commandes de son réseau.

### 8. Marketing & Prospection — `/marketing`

**Composant** : `MarketingByRole` → **`MarketingOperateurView`** (le DC fait partie de `ROLES_OPERATEUR` avec MARKETING et PROSPECTION — il ne voit **pas** la vue DG).
**Contenu** : « Marketing & prospection — opérations ».
- 8 KPI : CA généré par les campagnes, marge générée, ROI moyen, budget consommé, leads actifs, leads chauds, conversion WhatsApp, coût d'acquisition.
- 4 onglets : *Campagnes · Pipeline leads · Segmentation IA · Zones blanches*.
- **Combos d'écoulement stock à lancer** · analyses IA marketing · fiche campagne (ROI, coût/conversion, budget restant) · fiche lead (CA potentiel, source, dernier contact, téléphone).

### 9. Équipe & Performance — `/equipe`

**Composant** : `EquipeView` (vue complète).
**Contenu** : classement des commerciaux, tableau comparatif, coaching IA, commissions, clients récurrents, décisions recommandées.

---

## Spec V2 — état de l'intégration

Livré :

- ✅ `PerformancePostePanel` en haut du dashboard : CA réseau/objectif · couverture des tournées · marge brute · nouveaux PDV signés · taux de conversion prospects.
- ✅ **Proformas de toute la force de vente** + **taux d'acceptation par commercial** (onglet Proformas de `/facturation`).
- ✅ Accès à `/pilotage-financier` : trésorerie, dette fournisseurs, créances, rentabilité.
- ✅ `DashboardDC` n'est plus partagé : RESP_VENTES et SUPERVISEUR ont chacun leur dashboard dédié.
