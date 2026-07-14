# DAF — Directeur Administratif & Financier

## Identité

| | |
|---|---|
| Rôle (`UserRole`) | `DAF` |
| Libellé | Directeur Administratif & Financier |
| Utilisateur démo | Sena Fiagbe · daf@demo.prospera.tg · `password123` |
| Zone | Direction Financière |
| Couleur d'avatar | `bg-violet-600` |
| Posture | Tient la trésorerie et la norme SYSCOHADA. Arbitre ce qui entre et ce qui sort. |

## Menu

4 liens.

```
PRINCIPAL
  1. Tableau de bord          /dashboard
OPÉRATIONS
  2. Stock & Logistique       /stock
  3. Facturation & Créances   /facturation
PILOTAGE
  4. Comptabilité             /comptabilite
```

Le lien 4 pointe sur **la même route que le « Pilotage financier » du DG** (`/comptabilite`), avec un libellé différent. C'est ce doublon de libellé sur une route unique que la spec V2 demande de séparer.

---

## Détail de chaque lien

### 1. Tableau de bord — `/dashboard`

**Composant** : `DashboardByRole` → [DashboardFinance.tsx](../../src/components/dashboard/roles/DashboardFinance.tsx) — **partagé avec COMPTABLE**.
**Contenu** : « Finance & Comptabilité — Trésorerie, facturation et créances ».
- 4 `KpiCard` : créances totales · **en retard** · factures du mois · **encaissements Mobile Money** (89 % digitalisés).
- Liste **« Créances à suivre »** : numéro de facture, PDV, reste dû.

Dashboard très léger au regard du poste : ni solde de trésorerie, ni marge nette, ni DSO, ni écart budgétaire.

### 2. Stock & Logistique — `/stock`

**Composant** : `StockLogistiqueView`.
**Usage DAF** : **valorisation** — valeur du stock, coût immobilisé, rotation, marge par produit (visibles dans la fiche produit de `StockView`). C'est un actif à surveiller, pas un outil opérationnel.

### 3. Facturation & Créances — `/facturation`

**Composant** : `FacturationView` — écran majeur du poste.
**Contenu** : 8 KPI (CA facturé, encaissé, créances ouvertes, impayés en retard, taux de recouvrement, **délai moyen d'encaissement**, factures en retard, clients à risque) · 7 onglets : *Vue globale · Créances ouvertes · En retard · Émises (échéance future) · Payées · Partenaires B2B · Enseigne Atlas Shop* · **grille tarifaire par type de client** · analyses IA créances · fiche facture (montant TTC, payé, reste à payer, marge, échéance, mode de paiement, **plafond crédit**).

### 4. Comptabilité — `/comptabilite`

**Composant** : `ComptabiliteView` — « Comptabilité & Finance », sous-titre **« Vue DAF »**, badge *Clôture J-N*.
**Contenu** : 8 KPI (trésorerie consolidée, **encours clients — compte 411**, créances > 30 j, écritures du jour, marge brute, résultat net du mois, % de rapprochement, suspens critiques) · bandeau **« 5 décisions DG — comptabilité & trésorerie »** · 6 onglets :

| Onglet | Contenu |
|---|---|
| **Trésorerie & flux** | Comptes de trésorerie cliquables (solde, entrées/sorties du jour, flux net) · **prévision de flux à 7 jours** cliquable (entrées, sorties, flux net, solde de fin de journée) |
| **Journal** | Écritures du jour, détail par pièce |
| **Balance SYSCOHADA** | Balance générale, détail par compte (débit/crédit du mois, variation, sens) |
| **Créances clients** | Poste client 411 — détail auxiliaire : montant facturé, encaissé, reste dû, retard, **provision proposée** |
| **Compte de résultat** | Compte de résultat simplifié du mois |
| **Rapprochements** | Rapprochements bancaires & caisses : solde comptable vs relevé, écart, opérations non pointées |

Plus un panneau **« DAF Copilot — analyses »** (IA).

---

## Spec V2 — état de l'intégration

Livré :

- ✅ `PerformancePostePanel` : solde de trésorerie · marge nette · **dette fournisseurs échue** *(invert)* · **DSO** *(invert)* · écart budget vs réel.
- ✅ **Échéancier fournisseurs** : ce qui sort à échu / J+7 / J+15 / J+30, sur `/pilotage-financier` comme sur l'onglet Fournisseurs de `/approvisionnement`.
- ✅ **Impact trésorerie à J+30** : ce qu'il reste en caisse si aucune créance client ne rentre — les deux côtés du même problème, affichés ensemble.
- ✅ **Validation des commandes fournisseurs** au-dessus du plafond du Responsable Stock (5 M), et **garde-fou trésorerie** : si le solde projeté passe sous 40 M, l'envoi automatique est bloqué et escaladé au DAF.
- ✅ **Vue e-facturation** : file de transmission, rejets à corriger, taux de certification, archive légale.
- ✅ **Balance âgée client et fournisseur** — les deux, désormais.
- ✅ Menu complet : Pilotage financier · Tableau de bord · Stock · **Approvisionnement** · **Facturation & Proforma** (dont e-facturation) · Comptabilité.
- ✅ `/pilotage-financier` (décisionnel) est bien séparé de `/comptabilite` (écritures).

---

## V3 — le DAF n'est plus un DG au rabais

`/pilotage-financier` servait `ComptabiliteDGView` à tout le monde : le DAF ouvrait
littéralement l'écran du DG, sous-titré « Vue DG », avec un bloc « Décisions à trancher »
et des boutons *Valider / Reporter* qui ne sont pas les siens. La route aiguille désormais
par rôle ([PilotageFinancierShell](../../src/components/pilotage/PilotageFinancierShell.tsx)) :
le DG garde sa vue de constat, le DAF reçoit [PilotageDAFView](../../src/components/pilotage/PilotageDAFView.tsx).

Le principe : **le DG constate, le DAF arbitre.** Tout ce qui est sur son écran est un acte
qu'il pose lui-même, sans remonter au DG.

| Bloc | Ce qu'il décide |
|---|---|
| **Run de paiement** | La décision hebdomadaire du poste. Chaque ligne fournisseur affiche ce que coûte le paiement *et ce que casse le non-paiement* (couverture stock restante, surestaries portuaires, pénalité, escompte). Boutons *Payer / Partiel / Reporter*, et la trésorerie projetée se recalcule en direct. Passer sous le plancher de 40 M bloque l'envoi des ordres de virement et signale le covenant Ecobank qui sauterait. |
| **BFR** | Stock (311) + Clients (411) − Fournisseurs (401), avec rotation du stock vs crédit fournisseur. La marge de manœuvre en jours dit si le fournisseur finance encore le stock — ou si c'est la trésorerie du distributeur qui finance les rayons de ses clients. |
| **Marge nette par canal** | Marge brute − remises − commissions − transport − coût du crédit − pertes. Le DG voit « 23 % de marge brute » ; le DAF voit que le canal grossiste tombe à 0,4 % net et fait du volume, pas du résultat. |
| **Encadrement du crédit client** | Les demandes de déblocage et de relèvement de plafond que les commerciaux lui remontent. Argumentées avec le délai de paiement réel, les retards sur 12 mois et le ratio marge/crédit engagé. *Accorder / Sous condition / Refuser* — le DG n'est pas dans la boucle. |
| **Marge arrière** | Les ristournes fournisseurs acquises mais non réclamées : argent perdu passé l'échéance contractuelle. Le poste le plus oublié d'une compta de distributeur. |
| **Échéances fiscales & lignes bancaires** | TVA / CNSS / IS avec pénalités OTR, découvert et escompte disponibles, covenants rompus. |

Le dashboard `/dashboard` du DAF n'est plus la liste générique de créances : c'est
« ce qui attend votre signature », chaque ligne renvoyant vers l'acte à poser.
