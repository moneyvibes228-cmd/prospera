# COMPTABLE

## Identité

| | |
|---|---|
| Rôle (`UserRole`) | `COMPTABLE` |
| Libellé | Comptable |
| Utilisateur démo | Adjoa Mensah · comptable@demo.prospera.tg · `password123` |
| Zone | Comptabilité — Siège |
| Couleur d'avatar | `bg-purple-600` |
| Posture | Saisit, rapproche, clôture. Travaille dans le détail des écritures, pas dans l'arbitrage. |

## Menu

3 liens — le menu le plus court avec ceux du stock.

```
PRINCIPAL
  1. Tableau de bord          /dashboard
OPÉRATIONS
  2. Facturation & Créances   /facturation
PILOTAGE
  3. Comptabilité             /comptabilite
```

---

## Détail de chaque lien

### 1. Tableau de bord — `/dashboard`

**Composant** : `DashboardByRole` → [DashboardFinance.tsx](../../src/components/dashboard/roles/DashboardFinance.tsx) — **le même que le DAF**, aucun écran propre.
**Contenu** : « Finance & Comptabilité » · créances totales, en retard, factures du mois, encaissements Mobile Money · liste des créances à suivre.
**Limite** : ce sont des KPI de **direction financière**, pas de comptable. Ses indicateurs métier (écritures saisies/jour, taux de rapprochement, suspens ouverts, délai de clôture, factures traitées) n'existent nulle part.

### 2. Facturation & Créances — `/facturation`

**Composant** : `FacturationView` (vue complète, non restreinte).
**Contenu** : 8 KPI (CA facturé, encaissé, créances ouvertes, impayés en retard, taux de recouvrement, délai d'encaissement, factures en retard, clients à risque) · 7 onglets (*Vue globale · Créances ouvertes · En retard · Émises · Payées · Partenaires B2B · Enseigne Atlas Shop*) · grille tarifaire · analyses IA · fiche facture détaillée.
**Usage comptable** : contrôle des factures émises et de leur encaissement.

### 3. Comptabilité — `/comptabilite`

**Composant** : `ComptabiliteView` — **son écran de production**, mais sous-titré **« Vue DAF »** (aucune version comptable dédiée).
**Contenu** : 8 KPI · bandeau « 5 décisions DG » (hors de son rôle) · 6 onglets :

| Onglet | Usage pour le comptable |
|---|---|
| **Journal** | Les écritures du jour, détail par pièce — son quotidien |
| **Balance SYSCOHADA** | Balance générale, débit/crédit du mois par compte, sens, variation |
| **Rapprochements** | Rapprochements bancaires & caisses : solde comptable vs relevé, **écart**, **opérations non pointées** — l'onglet qu'il vide |
| **Créances clients** | Poste 411, détail auxiliaire, provisions proposées |
| **Compte de résultat** | Résultat simplifié du mois |
| **Trésorerie & flux** | Soldes des comptes et prévisions à 7 jours (plutôt DAF) |

Panneau **« DAF Copilot — analyses »** (IA) — nommé pour le DAF, affiché au comptable.

---

## Spec V2 — état de l'intégration

Livré :

- ✅ **Dashboard dédié `DashboardComptable`** — le bandeau « décisions DG » a disparu de son écran.
- ✅ `PerformancePostePanel` : écritures saisies/jour · taux de rapprochement · suspens ouverts *(invert)* · délai de clôture *(invert)* · factures traitées/jour.
- ✅ **Saisie des factures d'achat fournisseurs** (`FacturesAchatPanel`) : chaque commande fournisseur réceptionnée propose son écriture SYSCOHADA prête (601 achats / 445 TVA déductible / 401 dette fournisseur), et signale les écarts de BL à passer en avoir plutôt qu'en charge.
- ✅ **File e-facture** : corriger les rejets, retransmettre, suivre la certification (plateforme OTR Togo, QR de vérification, archive légale 10 ans).
- ✅ Onglets **Proformas** et **E-facturation & avoirs** dans `/facturation`.
- ✅ Accès à `/approvisionnement` (onglet Fournisseurs) pour rapprocher la dette de sa source.

---

## V3 — son poste de travail, enfin

`/comptabilite` servait `ComptabiliteView` — « Vue DAF », bandeau « 5 décisions DG »,
panneau « DAF Copilot » — identiquement au DG, au DAF et au comptable. La route aiguille
maintenant par rôle ([ComptabiliteShell](../../src/components/comptabilite/ComptabiliteShell.tsx)) :
le comptable reçoit [ComptabiliteComptableView](../../src/components/comptabilite/ComptabiliteComptableView.tsx),
le DAF garde sa vue analytique.

Le principe : **le DAF arbitre, le comptable produit.** Rien sur son écran n'est une décision —
ce sont des files de travail, et ce que chacune bloque en aval.

| Bloc | Son quotidien réel |
|---|---|
| **Lettrage du compte 411** | Le cœur du poste, et ce qui manquait entièrement. L'argent est rentré — en Mobile Money, en espèces depuis le terrain, en virement groupé — reste à savoir de quelle facture il vient. Chaque ligne porte sa référence brute (`FLOOZ 90***227 — "KOMLAN"`), la facture proposée, la confiance du rapprochement automatique, et *pourquoi ça ne matche pas tout seul*. Sous 70 % de confiance, il tranche à la main. |
| **Remises de caisse terrain** | La plaie d'un distributeur : ce que le système dit que le commercial a encaissé sur sa tournée, contre ce qui est effectivement arrivé en caisse. Écarts et espèces non remises, par commercial. |
| **Déclaration TVA** | 443 collectée − 445 déductible, échéance OTR au 15. Avec les **bloquants** : déclarer sans les 3 factures d'achat manquantes, c'est payer 940 K de TVA qu'on aurait pu déduire. |
| **Pièces à réclamer** | Le BL, le bordereau de remise, la facture reçue par WhatsApp — jamais en sa possession, et sans elles l'écriture ne passe pas. Avec le détenteur, le nombre de relances, et ce que ça bloque. |
| **Clôture** | Sa checklist SYSCOHADA (saisie, rapprochement, cut-off, provisions, déclaratif). Les tâches **bloquées par quelqu'un d'autre** sont isolées : c'est ce qui explique le délai de clôture, pas sa vitesse de saisie. |
| **Journal · rapprochements · suspens · factures d'achat** | Conservés, mais sans le bandeau des décisions du DG. |
