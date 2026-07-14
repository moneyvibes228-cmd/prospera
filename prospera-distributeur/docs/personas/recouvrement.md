# RECOUVREMENT — Responsable Recouvrement

## Identité

| | |
|---|---|
| Rôle (`UserRole`) | `RECOUVREMENT` |
| Libellé | Responsable Recouvrement |
| Utilisateur démo | Elom Adjavon · recouvrement@demo.prospera.tg · `password123` |
| Zone | Créances & Impayés |
| Couleur d'avatar | `bg-red-600` |
| Posture | Récupère le cash. Priorise, relance, escalade, bloque le crédit. |

## Menu

4 liens.

```
PRINCIPAL
  1. Tableau de bord          /dashboard
  2. Points de vente          /points-de-vente
OPÉRATIONS
  3. Facturation & Créances   /facturation
  4. Relances & Impayés       /relances          [badge 3]
```

Aucun lien du groupe PILOTAGE.

---

## Détail de chaque lien

### 1. Tableau de bord — `/dashboard`

**Composant** : `DashboardByRole` → [DashboardRecouvrement.tsx](../../src/components/dashboard/roles/DashboardRecouvrement.tsx) — **dashboard dédié**.
**Contenu** : « Recouvrement & Impayés — Relances intelligentes multi-canal », badge *N urgences* (nombre de factures `EN_RETARD`).
- 4 `KpiCard` : impayés > 30 j · relances du jour · **taux de recouvrement** (77 %, objectif 85 %) · **WhatsApp convertis** (42 %).
- Panneau **« File de relances priorisées IA »** : PDV, canal de relance, montant, **score de succès %**.

### 2. Points de vente — `/points-de-vente`

**Composant** : `PointsDeVenteView` (vue réseau complète).
**Usage recouvrement** : les KPI **« Impayés total »** et **« À risque »**, le scoring IA par point et la fiche rapport `/points-de-vente/[id]` — pour savoir chez qui aller et qui bloquer.

### 3. Facturation & Créances — `/facturation`

**Composant** : `FacturationView`.
**Contenu utile pour le poste** : KPI **impayés en retard**, **taux de recouvrement**, **délai moyen d'encaissement**, **factures en retard**, **clients à risque** · onglets *Créances ouvertes* et *En retard* · fiche facture : montant, payé, **reste à payer**, échéance, mode de paiement, **plafond crédit**.

### 4. Relances & Impayés — `/relances`

**Composant** : `RelancesView` — **son écran central**, badge rouge permanent dans le menu.
**Contenu** : 8 KPI (dossiers en cours, **montant en jeu**, résolues, **contentieux**, **recouvré du mois**, taux de réponse, relances auto/jour, visites planifiées) · 4 onglets : ***Recouvrement impayés*** *· Réapprovisionnement · Prospection · Tous les flux* · **analyses IA recouvrement** · fiche dossier par PDV (canal, score de succès, historique de relance).

---

## Spec V2 — état de l'intégration

Livré :

- ✅ `PerformancePostePanel` : montant encaissé · taux d'encaissement · **DSO** *(invert)* · relances abouties · créances > 60 j *(invert)*.
- ✅ **Balance âgée client en écran d'entrée** (`BalanceAgeeClientPanel`), avec **priorisation par probabilité de recouvrement** : les dossiers sont triés sur la **valeur espérée** (montant × probabilité), pas sur le montant brut — courir après une grosse créance irrécouvrable coûte plus de temps qu'elle ne rapporte d'argent.
- ✅ **Blocage / déblocage du crédit client avec trace** : toute coupure est journalisée (qui, quand, pourquoi). Au-delà de 60 jours de retard, le crédit est coupé d'office.
- ✅ Chiffres dérivés du registre : encours 18,4 M · recouvrement espéré 8,7 M · **perte attendue 9,6 M** · 1 dossier en contentieux (Kiosque Port, 21 % de chances).
- ✅ Onglet **Factures & créances** de `/facturation` accessible depuis son menu.
