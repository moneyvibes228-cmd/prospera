# Personas Prospera Distribution — menu & contenu par lien

Un fichier par persona. Chaque fiche décrit **le menu réellement affiché** (filtré par `src/components/layout/Sidebar.tsx`) et, **pour chaque lien du menu**, la route, le composant rendu, le contenu de l'écran et le périmètre des données.

Le fichier **DG** est la fiche de référence : les 12 autres suivent la même structure.

> **État : les 5 lots de la spec V2 sont livrés** — menu réorganisé, KPI par poste et 13 dashboards, fournisseurs & réappro automatique, 8 chiffres de décision DG, proforma & e-facture ([plan de réalisation](../spec-v2-pilotage-personas-fournisseurs.md#9-bloc-h--plan-de-réalisation-5-lots)).
>
> Chaque fiche se termine par une section « Spec V2 — état de l'intégration » qui distingue ce qui est **livré** de ce qui **reste ouvert**. Cinq points restent ouverts, tous documentés : le **filtrage par zone** (RESP_VENTES, SUPERVISEUR, GEST_ENTREPOT) n'est pas activé car le registre de démonstration ne compte que 13 PDV — filtrer viderait les écrans au lieu de les préciser ; les 4 KPI d'en-tête du dashboard Marketing restent codés en dur ; le Catalogue n'est pas un lien de menu à part entière.

## Index

| # | Persona | Rôle (`UserRole`) | Utilisateur démo | Fiche |
|---|---|---|---|---|
| 1 | Directeur Général | `DG` | Koffi Mensah — dg@demo.prospera.tg | [dg.md](dg.md) |
| 2 | Directeur Commercial | `DC` | Ama Dzobo — dc@demo.prospera.tg | [dc.md](dc.md) |
| 3 | Responsable des Ventes | `RESP_VENTES` | Kodjo Agbeko — ventes@demo.prospera.tg | [resp-ventes.md](resp-ventes.md) |
| 4 | Superviseur de Zone | `SUPERVISEUR` | Efua Koffi — superviseur@demo.prospera.tg | [superviseur.md](superviseur.md) |
| 5 | Commercial Terrain | `COMMERCIAL` | Komlan Tetteh — commercial@demo.prospera.tg | [commercial.md](commercial.md) |
| 6 | Commercial Freelance | `FREELANCE` | Kofi Agbessi — freelance@demo.prospera.tg | [freelance.md](freelance.md) |
| 7 | Chargé de Prospection | `PROSPECTION` | Mawuena Ahi — prospection@demo.prospera.tg | [prospection.md](prospection.md) |
| 8 | Responsable Stock & Logistique | `RESP_STOCK` | Yao Mensah — stock@demo.prospera.tg | [resp-stock.md](resp-stock.md) |
| 9 | Gestionnaire Entrepôt | `GEST_ENTREPOT` | Edem Kpodo — entrepot@demo.prospera.tg | [gest-entrepot.md](gest-entrepot.md) |
| 10 | Directeur Administratif & Financier | `DAF` | Sena Fiagbe — daf@demo.prospera.tg | [daf.md](daf.md) |
| 11 | Comptable | `COMPTABLE` | Adjoa Mensah — comptable@demo.prospera.tg | [comptable.md](comptable.md) |
| 12 | Responsable Marketing | `MARKETING` | Kossi Doheto — marketing@demo.prospera.tg | [marketing.md](marketing.md) |
| 13 | Responsable Recouvrement | `RECOUVREMENT` | Elom Adjavon — recouvrement@demo.prospera.tg | [recouvrement.md](recouvrement.md) |

Mot de passe démo commun : `password123`.

## Matrice menu → personas (état du code)

| Lien | Route | DG | DC | R.VENTES | SUPERV | COMM | FREEL | PROSP | R.STOCK | ENTREPOT | DAF | COMPTA | MKTG | RECOUV |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **OPÉRATIONS** |
| Pilotage financier | `/pilotage-financier` | ✅ | ✅ | — | — | — | — | — | — | — | ✅ | — | — | — |
| Tableau de bord | `/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Commandes | `/commandes` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| Stock & Logistique | `/stock` | ✅ | ✅ | — | — | ✅ | — | — | ✅ | ✅ | ✅ | — | ✅ | — |
| **Approvisionnement** | `/approvisionnement` | ✅ | — | — | — | — | — | — | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Facturation & Proforma | `/facturation` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | — | ✅ |
| Relances & Impayés | `/relances` | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — | — | — | ✅ | ✅ |
| **COMMERCIAL** |
| Points de vente | `/points-de-vente` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ | ✅ |
| Commercial terrain | `/commercial` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| Marketing & Prospection | `/marketing` | ✅ | ✅ | — | — | — | — | ✅ | — | — | — | — | ✅ | — |
| **PILOTAGE** |
| Équipe & Performance | `/equipe` | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — | — |
| Comptabilité | `/comptabilite` | ✅ | — | — | — | — | — | — | — | — | ✅ | ✅ | — | — |

Nombre de liens visibles : DG 12 · DC 10 · RESP_VENTES 6 · SUPERVISEUR 7 · COMMERCIAL 7 · FREELANCE 5 · PROSPECTION 6 · RESP_STOCK 4 · GEST_ENTREPOT 4 · DAF 6 · COMPTABLE 4 · MARKETING 6 · RECOUVREMENT 4.

### Badges dynamiques du menu

| Lien | Badge | Source |
|---|---|---|
| Relances & Impayés | impayés critiques non soldés | `REGISTRE_RELANCES` |
| Approvisionnement | commandes auto en attente de validation | `commandesEnAttenteValidation()` — [reappro-engine.ts](../../src/lib/reappro-engine.ts) |
| Facturation & Proforma | proformas expirant sous 48 h | `countProformasExpirantes()` — [proformas-registry.ts](../../src/lib/registries/proformas-registry.ts) |

## Onglets internes par persona

Deux rubriques ouvrent l'onglet correspondant au poste de l'utilisateur.

| Route | Onglets | Onglet d'entrée selon le rôle |
|---|---|---|
| `/approvisionnement` | Réappro IA · Commandes fournisseurs · Fournisseurs · Règles d'automatisation | RESP_STOCK & DG → *Réappro IA* · GEST_ENTREPOT → *Commandes* (réceptions) · DAF, COMPTABLE, MARKETING → *Fournisseurs* |
| `/facturation` | Factures & créances · Proformas · E-facturation & avoirs | Rôles terrain (COMMERCIAL, FREELANCE, PROSPECTION, RESP_VENTES, SUPERVISEUR) → *Proformas* · DG, DC, DAF, COMPTABLE, RECOUVREMENT → *Factures* |

## Routes hors menu

| Route | Composant | Accès |
|---|---|---|
| `/catalogue` | redirection → `/stock?tab=catalogue` | via l'onglet « Catalogue produits » de `/stock` |
| `/points-de-vente/[id]` | `PdvRapportView` | clic sur une fiche depuis `/points-de-vente` |

## Quatre mécanismes de différenciation dans le code

1. **Filtrage du menu** — `filterNav(role)` dans [Sidebar.tsx](../../src/components/layout/Sidebar.tsx) : chaque item porte une liste `roles[]`.
2. **Dispatch de composant** — un même route rend un composant différent selon le rôle :
   - `/dashboard` → `DashboardByRole` (13 dashboards, un par rôle)
   - `/marketing` → `MarketingByRole` (`MarketingOperateurView` pour MARKETING/DC/PROSPECTION, sinon `MarketingDGView`)
   - `/commandes` → branches internes à `CommandesView` (freelance / pilotage / terrain)
3. **Onglets filtrés par rôle** — `FacturationShell` et `ApprovisionnementView` n'affichent que les onglets autorisés, et ouvrent celui du poste.
4. **Filtrage des données** — `useHubContext()` + `filterByCommercial()` dans [hub-context.ts](../../src/lib/hub-context.ts) : pour `FREELANCE`, `COMMERCIAL` et `PROSPECTION`, les hubs PDV / commandes / relances / factures / proformas ne renvoient **que les lignes dont `commercial === user.nom`**. Tous les autres rôles voient l'intégralité du réseau.

## Le socle commun ajouté par la V2

Ces briques servent plusieurs personas à la fois — chaque fiche renvoie ici plutôt que de les redécrire.

| Brique | Fichier | Qui la voit |
|---|---|---|
| **KPI de poste** — 4-5 KPI valeur/objectif/tendance + score /100 | [kpi-postes-registry.ts](../../src/lib/kpi-postes-registry.ts) · `PerformancePostePanel` | les 12 postes (pas le DG, par choix de la spec) ; matrice agrégée sur `/equipe` pour DG/DC |
| **8 chiffres de décision** — trésorerie, créance, dette, revenus, résultat, activité | [dg-synthese-decision-builder.ts](../../src/lib/dg-synthese-decision-builder.ts) · `SyntheseDecisionDGPanel` | DG, en position 1 du dashboard |
| **Moteur de réappro** — détection, quantité, scoring fournisseur, regroupement, garde-fou trésorerie | [reappro-engine.ts](../../src/lib/reappro-engine.ts) | RESP_STOCK (poste central), DG, DAF, GEST_ENTREPOT |
| **Registre fournisseurs** — source unique de vérité de la dette | [fournisseurs-registry.ts](../../src/lib/registries/fournisseurs-registry.ts) | alimente le compte `401100`, le KPI DG « Dette fournisseurs » et l'échéancier DAF |
| **Proforma** — cycle devis → commande, score d'acceptation IA | [proforma-builder.ts](../../src/lib/proforma-builder.ts) · `ProformasView`, `ProformaBuilder` | toute la force de vente + DG/DC/DAF/COMPTABLE |
| **E-facture** — file de transmission, certification, rejets, archive légale | [efacture-builder.ts](../../src/lib/efacture-builder.ts) · `EFactureView` | DG, DAF, COMPTABLE |

### Cohérence des chiffres

Une même réalité affiche la même valeur sur toutes les pages, parce qu'elle n'est écrite qu'une fois :

- `Dette fournisseurs` (KPI DG) = `Σ FOURNISSEURS.encours_du` = solde du compte `401100` = **86,4 M**, dont **43,8 M échus**
- `Crédit client` (KPI DG) = `Σ CREANCES_COMPTABLES.reste` = **18,4 M**
- `Solde caisse` (KPI DG) = `Σ COMPTES_TRESORERIE.solde` = **128,4 M**
- `Bénéfice net` (KPI DG) = section `RESULTAT` du `COMPTE_RESULTAT`
