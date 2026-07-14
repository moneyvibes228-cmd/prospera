# GEST_ENTREPOT — Gestionnaire Entrepôt

## Identité

| | |
|---|---|
| Rôle (`UserRole`) | `GEST_ENTREPOT` |
| Libellé | Gestionnaire Entrepôt |
| Utilisateur démo | Edem Kpodo · entrepot@demo.prospera.tg · `password123` |
| Zone | Entrepôt Lomé Port |
| Couleur d'avatar | `bg-amber-600` |
| Posture | Exécute : picking, préparation, bons de livraison, expéditions. Périmètre = **son** entrepôt. |

## Menu

3 liens, identiques à ceux du RESP_STOCK.

```
PRINCIPAL
  1. Tableau de bord          /dashboard
  2. Commandes                /commandes
OPÉRATIONS
  3. Stock & Logistique       /stock
```

---

## Détail de chaque lien

### 1. Tableau de bord — `/dashboard`

**Composant** : `DashboardByRole` → [DashboardStock.tsx](../../src/components/dashboard/roles/DashboardStock.tsx) — **le même que le RESP_STOCK**, aucun écran propre.
**Contenu** : « Stock & Logistique — Entrepôts Lomé Port + Kara » · SKU en catalogue, ruptures/alertes, commandes à préparer, livraisons du jour · alertes rupture IA.
**Limite** : le titre annonce **les deux entrepôts** alors que son périmètre est « Entrepôt Lomé Port ». Aucun filtrage sur `user.zone` n'est appliqué, et les KPI de son vrai métier (délai de préparation, erreurs de picking, BL en attente) sont absents.

### 2. Commandes — `/commandes`

**Composant** : `CommandesView`, **branche « pilotage »** (GEST_ENTREPOT ∈ `ROLES_PILOTAGE`).
**Contenu** : pipeline des commandes, **flux par entrepôt** (commandes, en préparation, bloquées, taux de service, **charge picking**), **file prioritaire entrepôt**, commandes bloquées crédit à ne pas préparer.
C'est sa **file de travail du jour** — mais elle affiche les deux entrepôts, pas seulement le sien.

### 3. Stock & Logistique — `/stock`

**Composant** : `StockLogistiqueView`, 3 onglets :
- **Stock & logistique** (`StockView`) — sous-onglets *Vue globale · **Lomé Port** · Kara · Alertes & ruptures · **Préparation commandes*** ; il utilise principalement l'onglet de son entrepôt et celui de la préparation. Expéditions du jour, taux de service, couverture.
- **Sorties entrepôt** — historique des sorties.
- **Catalogue produits** — référentiel des SKU.

---

## Spec V2 — état de l'intégration

Livré :

- ✅ **Dashboard dédié `DashboardGestEntrepot`**.
- ✅ `PerformancePostePanel` : délai de préparation *(invert)* · expéditions/jour · taux d'erreur picking *(invert)* · BL en attente *(invert)* · taux de service entrepôt.
- ✅ **Réception des commandes fournisseurs** : `/approvisionnement` s'ouvre pour lui sur l'onglet *Commandes fournisseurs*. Il saisit les quantités réellement reçues ; **tout écart ouvre un litige**, et la dette est calculée sur le reçu, pas sur le commandé.
- ✅ File de picking du jour et BL à éditer en écran d'entrée.

Reste ouvert :

- ↻ **Périmètre restreint à son entrepôt** (`user.zone`) : les vues restent consolidées Lomé Port + Kara.
