# FREELANCE — Commercial Freelance

## Identité

| | |
|---|---|
| Rôle (`UserRole`) | `FREELANCE` |
| Libellé | Commercial Freelance |
| Utilisateur démo | Kofi Agbessi · freelance@demo.prospera.tg · `password123` |
| Zone | Portefeuille indépendant — Lomé Sud |
| Couleur d'avatar | `bg-lime-600` |
| Posture | Indépendant : achète au tarif grossiste, revend à **ses** prix. Sa marge lui appartient et **n'est pas visible par la société**. |

## Menu

4 liens — le menu le plus court avec celui du chargé de prospection. **Aucun lien OPÉRATIONS ni PILOTAGE.**

```
PRINCIPAL
  1. Tableau de bord          /dashboard
  2. Points de vente          /points-de-vente
  3. Commercial terrain       /commercial
  4. Commandes                /commandes
```

## Périmètre de données — la règle centrale du persona

`FREELANCE` est un **rôle à portefeuille** (`PORTEFEUILLE_ROLES` dans [hub-context.ts](../../src/lib/hub-context.ts)) : PDV, commandes, relances et factures sont filtrés sur `commercial === user.nom`. Son portefeuille est **isolé** du réseau de la société.

---

## Détail de chaque lien

### 1. Tableau de bord — `/dashboard`

**Composant** : `DashboardByRole` → [DashboardFreelance.tsx](../../src/components/dashboard/roles/DashboardFreelance.tsx) — **dashboard dédié**, le seul rôle non-DG à en avoir un vraiment spécifique.
**Contenu** : « Bonjour {prénom} — Commercial freelance : votre portefeuille, vos prix client », badge **Portefeuille isolé**.
- Encart lime : *« Vous travaillez avec les produits {entreprise} au tarif grossiste. Les prix affichés à vos clients sont les vôtres — la société ne voit pas votre marge. »*
- 4 `KpiCard` : mes points de vente · commandes du jour · **CA client (vos prix)** · **ma marge du jour** (avec le coût société en sous-titre).
- Liste **« Mes clients »** avec leur CA du mois.

La distinction **CA client / coût société / marge freelance** est la signature de ce dashboard (`getCommandesHub` renvoie `caSociete`, `caClient`, `margeFreelance`).

### 2. Points de vente — `/points-de-vente`

**Composant** : `PointsDeVenteView`, **filtré sur son portefeuille**.
**Contenu** : ses PDV uniquement — CA, scoring IA, impayés, fiche rapport `/points-de-vente/[id]`.

### 3. Commercial terrain — `/commercial`

**Composant** : `CommercialTerrainView`.
**Contenu** : carte terrain et fiches commerciales. Sa fiche affiche une ligne supplémentaire **« Marge jour »** (`selected.marge_jour`, en lime) que les salariés n'ont pas.

### 4. Commandes — `/commandes`

**Composant** : `CommandesView`, **branche « freelance »** — écran spécifique déclenché par `user.role === 'FREELANCE'`.
**Contenu** : « Mes commandes grossiste — Prix société vs vos prix client, marge calculée », badge **Mode freelance**.
- Encart : *« Vous commandez au tarif grossiste (paniers 2–4 M FCFA). Le prix client est le vôtre — marge non visible par la société. »*
- Cartes de commandes affichant montant société, marge brute % et **marge freelance** en FCFA.

---

## Spec V2 — état de l'intégration

Livré :

- ✅ `PerformancePostePanel` : marge nette dégagée · CA société · PDV en portefeuille · **% de respect de la grille de prix** · nouveaux PDV.
- ✅ **Proforma avec son prix de revente** : un curseur de majoration affiche en direct le prix société, le prix client et sa marge.
- ✅ **Alerte si la vente passe sous la marge minimale de 12 %** — signalée au DC.
- ✅ `/facturation` ouvert à ce rôle, restreint à ses propres proformas.
- ✅ Le simulateur de marge du dashboard freelance reste en place.
