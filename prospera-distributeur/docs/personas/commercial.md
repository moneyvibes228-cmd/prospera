# COMMERCIAL — Commercial Terrain

## Identité

| | |
|---|---|
| Rôle (`UserRole`) | `COMMERCIAL` |
| Libellé | Commercial Terrain |
| Utilisateur démo | Komlan Tetteh · commercial@demo.prospera.tg · `password123` |
| Zone | Marché Bé — Lomé |
| Couleur d'avatar | `bg-emerald-600` |
| Posture | Sur le terrain, mobile, souvent hors ligne. Visite, prend la commande, encaisse. |

## Menu

6 liens.

```
PRINCIPAL
  1. Tableau de bord          /dashboard
  2. Points de vente          /points-de-vente
  3. Commercial terrain       /commercial
  4. Commandes                /commandes
OPÉRATIONS
  5. Stock & Logistique       /stock
  6. Relances & Impayés       /relances          [badge 3]
```

Aucun lien du groupe PILOTAGE.

## Périmètre de données — important

`COMMERCIAL` fait partie des **rôles à portefeuille** (`PORTEFEUILLE_ROLES` dans [hub-context.ts](../../src/lib/hub-context.ts), avec FREELANCE et PROSPECTION). Les hubs **PDV, commandes, relances et factures ne renvoient que les lignes dont `commercial === user.nom`**. Il ne voit donc que *ses* clients et *ses* commandes — contrairement à tous les rôles de pilotage.

---

## Détail de chaque lien

### 1. Tableau de bord — `/dashboard`

**Composant** : `DashboardByRole` → [DashboardCommercial.tsx](../../src/components/dashboard/roles/DashboardCommercial.tsx) — **partagé avec PROSPECTION**.
**Contenu** : « Bonjour {prénom} — Tournée du jour · {zone} », badge **Mode offline OK**.
- 4 `KpiCard` : visites aujourd'hui (28 / 25, objectif dépassé), commandes prises, CA généré, prochaine visite (heure + PDV).
- Encart vert **Tournée IA optimisée** : PDV prioritaires du matin, dont relances impayés et prospect à convertir.

### 2. Points de vente — `/points-de-vente`

**Composant** : `PointsDeVenteView`, **filtré sur son portefeuille**.
**Contenu** : ses PDV, leur CA, leur scoring IA, leurs impayés · fiche rapport détaillée en `/points-de-vente/[id]`.

### 3. Commercial terrain — `/commercial`

**Composant** : `CommercialTerrainView` (vue non filtrée par rôle).
**Contenu** : carte terrain, visites/objectif, couverture, impayés à relancer, coaching prioritaire.
**Remarque** : cet écran est conçu pour le pilotage d'équipe ; le commercial y voit toutes les équipes, ce qui dépasse son besoin.

### 4. Commandes — `/commandes`

**Composant** : `CommandesView`, **branche « terrain »** (ni freelance, ni pilotage).
**Contenu** : « Prise de commande terrain — Catalogue · vérif. stock · sync offline ».
- Liste de **ses** commandes en cartes (référence, statut, priorité IA, PDV, zone, entrepôt, montant, marge, alerte crédit).
- Bouton **« Nouvelle commande terrain »**.

C'est son écran de production : pas de KPI, pas de pipeline — l'action.

### 5. Stock & Logistique — `/stock`

**Composant** : `StockLogistiqueView` (onglets *Stock & logistique · Sorties entrepôt · Catalogue produits*).
**Usage** : vérifier la disponibilité et le catalogue **avant de promettre une commande** à un client. Consultation uniquement dans l'intention, mais techniquement il voit la vue de pilotage complète (aucune restriction dans le code).

### 6. Relances & Impayés — `/relances`

**Composant** : `RelancesView`, **filtré sur son portefeuille**.
**Contenu** : ses dossiers de relance, montant en jeu, canal, score de succès IA — les impayés qu'il doit récupérer pendant sa tournée.

---

## Spec V2 — état de l'intégration

Livré :

- ✅ `PerformancePostePanel` : visites/objectif du jour · commandes prises · CA généré · taux de transformation visite→commande · % d'encaissement terrain.
- ✅ **Créer une proforma sur le terrain** (`ProformaBuilder`) → envoi WhatsApp, avec mise en file d'attente si le terrain est hors réseau.
- ✅ **Encours crédit du PDV affiché avant la saisie** : le plafond et le dépassement éventuel s'affichent dès la sélection du client, avant même d'ajouter la première ligne.
- ✅ Ses données restent filtrées sur son portefeuille (`filterByCommercial`) — PDV, commandes, relances, factures **et proformas**.

Reste ouvert :

- ↻ `/commercial` affiche encore le pilotage de toutes les équipes plutôt que sa seule tournée.
- ↻ `/stock` n'est pas marqué explicitement en lecture seule.
