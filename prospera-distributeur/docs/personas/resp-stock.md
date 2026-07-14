# RESP_STOCK — Responsable Stock & Logistique

## Identité

| | |
|---|---|
| Rôle (`UserRole`) | `RESP_STOCK` |
| Libellé | Responsable Stock & Logistique |
| Utilisateur démo | Yao Mensah · stock@demo.prospera.tg · `password123` |
| Zone | Entrepôts Lomé + Kara |
| Couleur d'avatar | `bg-orange-600` |
| Posture | Garant de la disponibilité : ruptures, couverture, taux de service, réapprovisionnement. |

## Menu

3 liens seulement.

```
PRINCIPAL
  1. Tableau de bord          /dashboard
  2. Commandes                /commandes
OPÉRATIONS
  3. Stock & Logistique       /stock
```

Pas de Points de vente, pas de Commercial terrain, pas de Pilotage.

---

## Détail de chaque lien

### 1. Tableau de bord — `/dashboard`

**Composant** : `DashboardByRole` → [DashboardStock.tsx](../../src/components/dashboard/roles/DashboardStock.tsx) — **partagé avec GEST_ENTREPOT**.
**Contenu** : « Stock & Logistique — Entrepôts Lomé Port + Kara ».
- 4 `KpiCard` : SKU en catalogue · **ruptures / alertes** · commandes à préparer (statuts `PREPARATION` + `VALIDEE`) · livraisons du jour.
- Panneau rouge **« Alertes rupture IA »** : produit, stock actuel / seuil, entrepôt.

### 2. Commandes — `/commandes`

**Composant** : `CommandesView`, **branche « pilotage »** (RESP_STOCK ∈ `ROLES_PILOTAGE`).
**Contenu** : pipeline complet BROUILLON → VALIDÉE → PRÉPARATION → LIVRÉE avec volumes · **flux par entrepôt** (commandes, en préparation, bloquées, taux de service, charge picking) · **file prioritaire entrepôt** · analyses IA · commandes bloquées crédit (à ne pas préparer).
C'est sa vision de la **charge de travail entrante**.

### 3. Stock & Logistique — `/stock`

**Composant** : `StockLogistiqueView` — **son écran central**, 3 onglets :

| Onglet | Contenu |
|---|---|
| **Stock & logistique** (`StockView`) | 8 KPI : valeur du stock, **ruptures actives**, **sous seuil**, couverture moyenne (jours), **taux de service**, commandes à préparer, PDV en rupture, ruptures sur 3 mois. Sous-onglets : *Vue globale · Lomé Port · Kara · **Alertes & ruptures** · **Préparation commandes***. Expéditions du jour. **Analyses IA logistique**. Fiche produit : stock total, couverture, taux de service, sorties/mois, valeur immobilisée, coût immobilisé, marge, rotation. |
| **Sorties entrepôt** (`EntrepotSortiesHistoriquePanel`) | Historique des sorties par entrepôt |
| **Catalogue produits** (`CatalogueView`) | Référentiel des SKU (cible de la redirection `/catalogue`) |

---

## Spec V2 — état de l'intégration

Ce persona est le **plus transformé** par la V2 : le moteur de réappro fait de lui son opérateur.

Livré :

- ✅ **Rubrique `/approvisionnement`** dans son menu, avec ses 4 onglets — *Réappro IA · Commandes fournisseurs · Fournisseurs · Règles d'automatisation*. Il atterrit directement sur **Réappro IA**, son poste de travail.
- ✅ **Écran Réappro IA** : produits en manque détectés (seuil ou couverture insuffisante), quantité suggérée, **fournisseur retenu avec sa justification** (« Sotra Négoce retenu : délai réel 5,2 j vs 19,4 j · 89 % de livraisons conformes »), **regroupement** des produits partageant un fournisseur, et **impact trésorerie simulé** avant tout engagement.
- ✅ **Validation** ligne par ligne ou en bloc, avec bascule possible sur le fournisseur de secours.
- ✅ **Règles d'automatisation** par produit : seuil, couverture minimale, mode de quantité (`STOCK_CIBLE` / `QUANTITE_FIXE` / `PREVISION_IA`), **niveau d'automatisation**, plafond, valideur — plus le **journal des déclenchements**.
- ✅ **Comparatif fournisseurs** (prix / délai réel / fiabilité / encours de dette) sur chaque fiche.
- ✅ `PerformancePostePanel` : taux de service · ruptures SKU *(invert)* · rotation *(invert)* · % de réappro dans les délais · stock immobilisé *(invert)*.
- ✅ Bouton **« Réapprovisionner »** sur la fiche produit de `/stock` dès que le produit passe sous son seuil.

Reste ouvert :

- ↻ **Catalogue** n'est toujours pas un lien de menu à part entière (accessible via l'onglet de `/stock`).
