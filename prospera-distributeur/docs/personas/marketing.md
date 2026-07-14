# MARKETING — Responsable Marketing

## Identité

| | |
|---|---|
| Rôle (`UserRole`) | `MARKETING` |
| Libellé | Responsable Marketing |
| Utilisateur démo | Kossi Doheto · marketing@demo.prospera.tg · `password123` |
| Zone | Marketing & Campagnes |
| Couleur d'avatar | `bg-pink-600` |
| Posture | Génère de la demande : campagnes WhatsApp, promos, combos d'écoulement de stock. |

## Menu

5 liens.

```
PRINCIPAL
  1. Tableau de bord          /dashboard
  2. Points de vente          /points-de-vente
OPÉRATIONS
  3. Stock & Logistique       /stock
  4. Relances & Impayés       /relances          [badge 3]
PILOTAGE
  5. Marketing & Prospection  /marketing
```

Pas d'accès à `/commandes` ni à `/commercial` : il génère la demande, il ne la traite pas.

---

## Détail de chaque lien

### 1. Tableau de bord — `/dashboard`

**Composant** : `DashboardByRole` → [DashboardMarketing.tsx](../../src/components/dashboard/roles/DashboardMarketing.tsx) — **dashboard dédié** (entièrement statique aujourd'hui).
**Contenu** : « Marketing & Prospection — Campagnes, leads et conversion », badge **WhatsApp actif**.
- 4 `KpiCard` : prospects actifs (47) · taux de conversion (34 %, +6 pts vs M-1) · campagnes en cours (3) · zones à conquérir (8, cartographie IA).
- Encart rose : campagne « Rentrée Lomé » — 124 détaillants ciblés via WhatsApp, 78 % d'ouverture, 42 commandes générées.

### 2. Points de vente — `/points-de-vente`

**Composant** : `PointsDeVenteView` (vue réseau complète, non filtrée).
**Usage marketing** : cibler les campagnes — quels PDV toucher, lesquels sont à risque, lesquels sont en prospection · scoring IA par point.

### 3. Stock & Logistique — `/stock`

**Composant** : `StockLogistiqueView`.
**Usage marketing** : identifier les **produits à écouler** (stock immobilisé, rotation lente, couverture excessive) pour monter les **combos**. Le lien entre stock et campagne est déjà matérialisé par le panneau `CombosStockPanel` de la vue marketing.

### 4. Relances & Impayés — `/relances`

**Composant** : `RelancesView`.
**Usage marketing** : l'onglet **Prospection** et les campagnes de relance automatisées multi-canal (le pipeline distingue *Impayés · Réappro · Prospection · Tous les flux*), avec le taux de réponse et les relances automatiques par jour.

### 5. Marketing & Prospection — `/marketing`

**Composant** : `MarketingByRole` → **`MarketingOperateurView`** (MARKETING ∈ `ROLES_OPERATEUR`) — **son écran central**.
**Contenu** : « Marketing & prospection — opérations ».
- 8 KPI : CA généré par les campagnes · marge générée · **ROI moyen** · budget consommé · leads actifs · leads chauds · **conversion WhatsApp** · **coût d'acquisition**.
- Bandeau **« Combos écoulement stock — à lancer »** (`CombosStockPanel`, alimenté par le stock dormant).
- 4 onglets : *Campagnes · Pipeline leads · **Segmentation IA** · Zones blanches*.
- **Analyses IA marketing**.
- Fiche campagne : CA généré, marge, coût, **ROI**, taux de conversion, coût/conversion, budget restant.
- Fiche lead : statut, CA potentiel/mois, source, dernier contact, téléphone.

---

## Spec V2 — état de l'intégration

Livré :

- ✅ `PerformancePostePanel` : ROI des campagnes · PDV touchés · taux de conversion promo · coût par PDV activé *(invert)* · CA généré par les combos.
- ✅ **Promotions fournisseurs** (`PromotionsFournisseursPanel`) : le panneau croise les remises volume du registre fournisseurs avec le **surstock réel** (couverture supérieure à 45 jours) et propose de monter une campagne d'écoulement sur les références concernées — une remise volume ne vaut que si l'on sait écouler le volume qu'elle exige.
- ✅ Accès à `/approvisionnement` (onglet Fournisseurs) pour consulter les conditions négociées.

Reste ouvert :

- ↻ Les 4 KPI du haut du dashboard (47 prospects / 34 % / 3 campagnes / 8 zones) restent **codés en dur** ; ils devraient être dérivés de `marketing-registry` comme le reste de la vue.
