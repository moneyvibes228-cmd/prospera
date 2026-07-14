# Audit produit par persona — Prospera Distributeur

> Analyse complète du code (`src/app`, `src/components`, `src/lib`) menée écran par écran.
> Objectif : (1) détecter les **boutons non connectés**, (2) vérifier pour chaque persona si ses **pages importantes ont un rapport** et s'il est **générique ou spécifique**, (3) proposer les **améliorations** qui rendent l'outil indispensable dans une société de distribution.

**Date :** juillet 2026 · **Périmètre :** 13 personas, 20 routes, ~50 composants, ~60 modules de logique (`lib`).

---

## 0. Synthèse exécutive

### Le constat en une phrase
L'application possède une **couche d'intelligence et de reporting remarquable et déjà différenciée par persona** (builders + `getPerimetre` / `getPerimetreLogistique` + `kpi-postes-registry`), mais sa **couche d'exécution est largement décorative** : beaucoup de boutons d'action sont soit sans `onClick`, soit des simulations d'état local (`useState`) sans persistance.

### Ce qui est déjà excellent
- **Aucun rapport n'est purement générique “copié-collé” entre rôles.** La couche commune `PerformancePostePanel` produit un contenu **propre à chaque poste** (KPIs, score, points forts/axes) via `kpi-postes-registry.ts`.
- Le **rapport IA narratif complet** (`RapportIAGlobal`) est réservé au DG et très riche.
- Le contrôle d'accès (`route-access.ts`) est propre : le menu n'est qu'une projection de la table d'accès.
- Un seul workflow est **réellement câblé de bout en bout** : les **Combos stock** (DG → validation → marketing → création campagne, avec `ComboStockWorkflowContext` + persistance locale). C'est le modèle à généraliser.

### Les 3 problèmes transversaux
1. **La boucle terrain est cassée** : `Y aller / Clôturer`, `Ajouter au panier`, `Nouvelle commande terrain` n'ont pas de handler → un commercial ne peut pas dérouler visite → commande → clôture.
2. **Les files d'arbitrage sont décoratives** : `Valider / Refuser` (validations, décisions DG, run paiement DAF, automatisations, marketing) affichent une pastille rouge dans le menu mais **aucun bouton fonctionnel** pour traiter la dette de travail.
3. **Rapports terrain calibrés “DG”** : `PdvRapportView` et `PointsDeVenteView` affichent explicitement une « Vue DG » aux commerciaux/freelances/prospection qui y ont pourtant accès.

---

## 1. Tableau maître — Boutons non connectés

Deux catégories : **MORT** = pas de `onClick` (ou vide) ; **SIMULÉ** = `onClick` présent mais effet local seulement (perdu au refresh, aucune persistance/registry).

| # | Fichier | Bouton | Ligne ~ | Type | Persona(s) impacté(s) |
|---|---------|--------|---------|------|------------------------|
| 1 | `dashboard/roles/DashboardDG.tsx` | `{N} alertes critiques` | 167 | MORT | DG |
| 2 | `dashboard/RapportIAGlobal.tsx` | `PDF` | 263 | MORT | DG |
| 3 | `dashboard/RapportIAGlobal.tsx` | `Envoyer` | 266 | MORT | DG |
| 4 | `dashboard/roles/DashboardMarketing.tsx` | `Lancer` / `Modifier le message` / `Ignorer` | 147-153 | MORT | MARKETING |
| 5 | `dashboard/roles/DashboardRecouvrement.tsx` | `Envoyer maintenant` / `Enregistrer une promesse` / `Modifier` / `Reporter` | 127-136 | MORT | RECOUVREMENT |
| 6 | `validations/ValidationsPanel.tsx` | `Valider` / `Refuser` | 122-127 | MORT | SUPERVISEUR, RESP_VENTES |
| 7 | `terrain/MonActiviteView.tsx` | `Y aller` / `Clôturer` | 78-84 | MORT | COMMERCIAL, FREELANCE, PROSPECTION |
| 8 | `terrain/DisponibiliteView.tsx` | `Ajouter` (au panier) | 162-168 | MORT | COMMERCIAL, FREELANCE, PROSPECTION |
| 9 | `commandes/CommandesView.tsx` | `Nouvelle commande terrain` | 153-155 | MORT | COMMERCIAL, PROSPECTION |
| 10 | `prospection/ConqueteView.tsx` | `Transférer` (passation) | 483-486 | MORT | PROSPECTION |
| 11 | `logistique/TransfertsPanel.tsx` | `Lancer la navette` | 171 | MORT | RESP_STOCK |
| 12 | `logistique/PlanLiquidationPanel.tsx` | `Lancer « scénario »` | 138 | MORT | RESP_STOCK |
| 13 | `approvisionnement/ReapproIAPanel.tsx` | `Basculer sur {alternatif}` | 205 | MORT | RESP_STOCK, DG |
| 14 | `facturation/DocumentPreview.tsx` | `Imprimer / PDF` | 161 | MORT | tous (facturation) |
| 15 | `facturation/ProformasView.tsx` | `Relancer par {canal}` | 166 | MORT | COMMERCIAL, FREELANCE, PROSPECTION |
| 16 | `comptabilite/ComptabiliteComptableView.tsx` | `Télédéclarer sur le portail OTR` | 123 | MORT | COMPTABLE |
| 17 | `comptabilite/ComptabiliteComptableView.tsx` | `Relancer` (pièces manquantes) | 343 | MORT | COMPTABLE |
| 18 | `comptabilite/ComptabiliteDGView.tsx` | `Valider` / `Reporter` (décisions) | 138-143 | MORT | DG |
| 19 | `pilotage/PilotageDAFView.tsx` | `Geler le run et générer les ordres de virement` | 283 | MORT | DAF |
| 20 | `marketing/SocialStudioView.tsx` | `Valider et programmer` / `Réécrire` / `Supprimer` | 97-105 | MORT | MARKETING |
| 21 | `marketing/SocialStudioView.tsx` | `Envoyer` / `Modifier` / `Créer le lead` (inbox) | 297-306 | MORT | MARKETING |
| 22 | `marketing/MarketingDGView.tsx` | (aucun bouton sur suggestions « À valider DG ») | 58 | MANQUANT | DG |
| 23 | `automation/AutomationsView.tsx` | (aucun `Valider / Reporter` sur les cibles) | 144-174 | MANQUANT | MARKETING, RECOUVREMENT, DG |
| 24 | `entrepot/ReceptionPanel.tsx` | `Saisir le contrôle au quai` | 182 | SIMULÉ (93 % codé en dur) | GEST_ENTREPOT |
| 25 | `entrepot/InventairePanel.tsx` | `Valider` (comptage) | 158 | SIMULÉ (pas d'ajustement stock) | GEST_ENTREPOT, RESP_STOCK |
| 26 | `approvisionnement/CommandesFournisseursView.tsx` | `Valider la réception` | 83 | SIMULÉ | RESP_STOCK, GEST_ENTREPOT |
| 27 | `approvisionnement/ReapproIAPanel.tsx` | `Valider la commande` / `Valider tout` | 94, 200 | SIMULÉ | RESP_STOCK |
| 28 | `facturation/EFactureView.tsx` | `Corriger et retransmettre` | 90 | SIMULÉ | COMPTABLE, DAF |
| 29 | `facturation/ProformaBuilder.tsx` | `Envoyer au client` | 295 | SIMULÉ | COMMERCIAL, FREELANCE |
| 30 | `facturation/ProformasView.tsx` | `Convertir en commande` | 162 | SIMULÉ | terrain |
| 31 | `comptabilite/ComptabiliteComptableView.tsx` | `Lettrer` / `Mettre en suspens` / checklist clôture | 230-396 | SIMULÉ | COMPTABLE |
| 32 | `comptabilite/FacturesAchatPanel.tsx` | `Saisir la facture d'achat` | 139 | SIMULÉ | COMPTABLE |
| 33 | `pilotage/PilotageDAFView.tsx` | `Payer/Partiel/Reporter`, `Accorder/Refuser` crédit | 195-451 | SIMULÉ | DAF |
| 34 | `relances/BalanceAgeeClientPanel.tsx` | `Bloquer / Débloquer le crédit` | 152-158 | SIMULÉ | RECOUVREMENT |
| 35 | `marketing/PromotionsFournisseursPanel.tsx` | `Monter une campagne d'écoulement` | 135 | SIMULÉ + composant **orphelin** (non monté) | MARKETING |
| 36 | `automation/AutomationsView.tsx` | Toggle activer/désactiver règle | 74-81 | SIMULÉ (perdu au refresh) | MARKETING, RECOUVREMENT, DG |

> **Note importante :** `RelancesView.tsx` (kanban recouvrement) n'a **aucune action métier** dans la fiche dossier hormis `Fermer le dossier` — pas de `Envoyer relance`, `Enregistrer paiement`, `Planifier visite`, `Escalader`.

---

## 2. Verdict « rapport » par persona (générique vs spécifique)

| Persona | Rapport principal | Spécifique au persona ? |
|---------|-------------------|--------------------------|
| **DG** | `RapportIAGlobal` + `SyntheseDecisionDGPanel` + `AiInsightPanel` | ✅ Très spécifique (le plus riche de l'app) |
| **DC** | `PerformancePostePanel` (CA réseau) | ✅ Spécifique — mais pas de rapport narratif |
| **RESP_VENTES** | `PerformancePostePanel` + atterrissage quota par zone | ✅ Spécifique |
| **SUPERVISEUR** | `PerformancePostePanel` + PJP/strike-rate/caisse (`TourneesView`) | ✅ Spécifique |
| **COMMERCIAL** | `PerformancePostePanel` + tournée du jour personnalisée | ✅ Spécifique (mais fiche PDV = « Vue DG ») |
| **FREELANCE** | `PerformancePostePanel` + encours/marge portefeuille | ✅ Spécifique |
| **PROSPECTION** | Entonnoir conquête, survie M+3, passation | ✅ Très spécifique |
| **RESP_STOCK** | Journal automatisation nuit, arbitrages, capital immobilisé | ✅ Spécifique |
| **GEST_ENTREPOT** | Plan de journée entrepôt (vagues, quai, cutoff) mono-site | ✅ Spécifique |
| **DAF** | Run paiement, BFR, marge canal, crédit, fiscal (`PilotageDAFView`) | ✅ Très spécifique |
| **COMPTABLE** | Charge lettrage/TVA/clôture (`ComptabiliteComptableView`) | ✅ Spécifique |
| **MARKETING** | Synthèse opérateur + ROI incrémental social | ✅ Spécifique |
| **RECOUVREMENT** | Prévision encaissement pondérée, balance âgée | ✅ Très spécifique |

### ⚠️ Exceptions à corriger (rapports “DG” affichés à d'autres personas)
- **`PdvRapportView.tsx`** : badge « Rapport DG », builder `buildPdvRapportDG` **sans branche par rôle** → un commercial voit le rang CA zone et les « Actions prioritaires DG » au lieu de : dernière visite, relances à faire, stock PDV, objectif du mois.
- **`PointsDeVenteView.tsx`** : sous-titre « Vue DG » + KPI réseau global, même pour COMMERCIAL/FREELANCE (seules les lignes sont filtrées par périmètre).
- **`EquipeView.tsx`** : sous-titre fixe « Vue DG » et synthèse exécutive affichés aussi à RESP_VENTES et SUPERVISEUR, sans filtre par zone/équipe directe. `MatricePostesPanel` n'est visible que par DG/DC.

---

## 3. Détail et recommandations par persona

### 3.1 — DG (Directeur Général)
**Pages :** toutes. **Rapports :** les plus complets de l'app.

**Boutons à connecter :** bandeau `alertes critiques` (→ panneau anomalies/`/relances`), `PDF`/`Envoyer` du rapport IA, `Valider`/`Reporter` des décisions (`ComptabiliteDGView`), validation des suggestions marketing (`MarketingDGView`).

**Améliorations pour rendre l'outil indispensable :**
1. **Export one-pager quotidien** (PDF/email) du rapport IA pour le comité de direction — c'est le livrable attendu d'un DG.
2. **Drill-down** : rendre les KPIs 360° et les listes (impayés, zones, commandes) cliquables vers la fiche actionnable (`KpiCardWithSparkline` supporte déjà `onClick`, non exploité).
3. **Décisions tracées** : chaque « décision à trancher » validée = écriture + notification DAF/COMPTABLE/Marketing, avec horodatage et vue avant/après impact résultat.
4. **Comparatif inter-régions** (Kara vs Lomé) sur objectifs et marge.

### 3.2 — DC (Directeur Commercial)
**Pages :** pilotage, dashboard, commandes, stock, objectifs, facturation, relances, PDV, commercial, marketing, prospection, équipe.

**Améliorations :**
1. Drill-down commandes récentes → fiche commande ; carte performance par zone/commercial.
2. File des **validations escaladées** depuis les superviseurs (extension de `ValidationsPanel` au niveau DC).
3. Rapport hebdo CA vs quota réseau exportable.
4. Onglet marketing « validation équipe commerciale » distinct de la vue opérateur.

### 3.3 — RESP_VENTES (Responsable des Ventes)
**Pages :** dashboard, objectifs, commandes, stock, facturation, relances, PDV, commercial, prospection, équipe.

**Boutons à connecter :** `Valider`/`Refuser` (`ValidationsPanel`).

**Améliorations :**
1. **Drill-down zone → superviseur → `/tournees`/`/commercial`** : aujourd'hui `ObjectifsView` s'arrête à la zone.
2. Alertes « zones qui décrochent » avec actions (renfort, promo ciblée).
3. `EquipeView` filtrée sur **ses zones** (retirer le libellé « Vue DG »).
4. Simulation « et si la zone X rattrape son quota ».

### 3.4 — SUPERVISEUR de Zone
**Pages :** dashboard, tournées, commandes, stock, relances, PDV, commercial, équipe.

**Boutons à connecter :** `Valider`/`Refuser` (`ValidationsPanel`).

**Améliorations :**
1. **Actions sur alertes tournées** : valider un écart de caisse, rappeler le VRP, replanifier une visite (aujourd'hui `TourneesView` est 100 % lecture seule).
2. Clic sur ligne commercial → détail visites / carte (comme `/commercial`).
3. `EquipeView` limitée à son équipe directe (5-8 commerciaux).
4. Lien direct rapprochement caisse en cas d'écart.

### 3.5 — COMMERCIAL Terrain
**Pages :** dashboard, mon-activité, commandes, disponibilité, facturation, relances, PDV.

**Boutons MORTS bloquants :** `Y aller`/`Clôturer` (agenda), `Ajouter` (disponibilité), `Nouvelle commande terrain`, `Relancer par canal` (proformas).

**Améliorations — priorité #1 de l'app :**
1. **Boucle de visite complète** : `Y aller` → navigation GPS ; `Clôturer` → formulaire (commande, encaissement Mobile Money/espèces, photo linéaire, géoloc) ; le tout **offline-first** avec file de synchronisation visible.
2. `Ajouter` relié au **panier commande** rattaché au PDV en visite → wizard PDV → catalogue → vérif stock → validation.
3. **Fiche PDV commerciale** (`buildPdvRapportCommercial`) : dernière visite, relances à faire, stock PDV, objectif du mois — pas le rapport DG.
4. Téléphone PDV cliquable (`tel:`) + encaissement mobile depuis un impayé.

### 3.6 — FREELANCE (Commercial indépendant)
**Pages :** dashboard, mon-activité, commandes, disponibilité, facturation, PDV.

**Améliorations :**
1. **Marge personnelle partout** : aujourd'hui seul le CA société s'affiche ; le freelance raisonne en marge (prix de revente − coût société).
2. **Simulateur de marge** avant commande / dans la disponibilité.
3. Relance de ses clients en retard depuis le dashboard + relevé encours mensuel exportable.
4. Blocage d'envoi proforma si marge < seuil, avec escalade DC.

### 3.7 — PROSPECTION (Chargé de conquête)
**Pages :** dashboard, mon-activité, commandes, disponibilité, facturation, PDV, prospection.

**Boutons MORTS :** `Transférer` (passation), + absence de `Contacter`/`Planifier visite`/`Enregistrer recensement`/`Nouvelle ouverture` (uniquement du texte `prochaine_action`).

**Améliorations :**
1. **CRUD prospect complet** : recensement géolocalisé, journal de contacts, création d'ouverture.
2. `Transférer` fonctionnel → sélection commercial secteur + notification + entrée dans sa tournée.
3. Cartes « À trancher » du dashboard rendues actionnables (appeler / abandonner / passer au secteur).
4. Volet **survie post-ouverture** (M+1/M+3) dans la fiche PDV au lieu du rang CA zone.

### 3.8 — RESP_STOCK (Responsable Stock & Logistique)
**Pages :** dashboard, commandes, stock, catalogue, entrepôt, approvisionnement.

**Boutons MORTS/SIMULÉS :** `Lancer la navette`, `Lancer scénario liquidation`, `Basculer sur alternatif`, `Valider la commande`/`Valider tout` (réappro IA, simulés).

**Améliorations :**
1. **Exécuter réellement** transferts (bon + réservation stock), réappro (écriture `REGISTRE_COMMANDES_FOURNISSEURS` + impact trésorerie), scénarios de liquidation (→ promo marketing / bon transfert).
2. **Journal automatisation actionnable** : `Valider`/`Rejeter`/`Annuler` sur les entrées PROPOSE/ESCALADE.
3. Édition inline des règles de réappro (seuil, niveau AUTO) + « Déclencher maintenant ».
4. Rapport capital dormant / ruptures exportable (hebdo).

### 3.9 — GEST_ENTREPOT (Gestionnaire d'entrepôt)
**Pages :** dashboard, stock (mono-site), entrepôt.

**Boutons SIMULÉS :** `Saisir le contrôle au quai` (93 % codé en dur), `Valider` inventaire (pas d'ajustement de stock). **Absents :** `Imprimer bon`, `Valider picking ligne`, `Valider départ camion`, `Générer feuille de route`.

**Améliorations :**
1. **Workflow picking complet** : imprimer le bon, cocher chaque ligne servie, accepter un substitut, imprimer étiquettes.
2. **Réception persistante** : saisie manuelle des quantités reçues → mise en stock réelle + litige fournisseur si écart (unifier avec `CommandesFournisseursView`, aujourd'hui **double écran non synchronisé**).
3. **Expédition** : `Valider départ` horodaté chauffeur, réordonnancement des arrêts, signature de chargement.
4. Inventaire mobile (scan allée par allée) qui ajuste le stock théorique.

### 3.10 — DAF (Directeur Administratif & Financier)
**Pages :** dashboard, pilotage financier, stock, catalogue, approvisionnement, facturation, relances, comptabilité.

**Boutons MORTS/SIMULÉS :** `Geler le run et générer les ordres de virement` (mort), arbitrages run paiement, décisions crédit client (simulés).

**Améliorations :**
1. **Génération réelle d'ordres de virement** (fichier banque / Mobile Money) + export.
2. **Planification des paiements fournisseurs** par tranche d'échéance (J+7/J+15/J+30) depuis `FournisseursView`.
3. Décisions crédit client → **notification automatique au commercial** (accord/refus/condition).
4. Alerte covenant bancaire avec simulation d'impact ; pont créance 411 → pipeline relances.

### 3.11 — COMPTABLE
**Pages :** dashboard, stock, catalogue, approvisionnement, facturation, comptabilité.

**Boutons MORTS/SIMULÉS :** `Télédéclarer OTR`, `Relancer pièces` (morts) ; `Lettrer`, `Mettre en suspens`, checklist clôture, `Saisir facture d'achat`, `Corriger et retransmettre` e-facture (simulés).

**Améliorations :**
1. **Persister** lettrage 411, saisies 601/445/401 et clôture (aujourd'hui perdus au refresh).
2. **Télédéclaration TVA** pré-remplie + lien portail OTR ; archive légale téléchargeable sur e-factures certifiées.
3. `Relancer pièces` → email/SMS avec template au détenteur de la pièce.
4. Upload scan facture fournisseur + OCR ; alerte TVA déductible perdue hors délai.

### 3.12 — MARKETING (Responsable Marketing)
**Pages :** dashboard, stock (produits à écouler), catalogue, PDV (audience), marketing, marketing/social, automatisations.

**Boutons MORTS :** `Lancer`/`Modifier le message`/`Ignorer` (dashboard), les 6 boutons de `SocialStudioView`, l'absence de `Valider`/`Reporter` dans `AutomationsView`, `Monter une campagne` (`PromotionsFournisseursPanel` **orphelin, non monté**).

**Améliorations :**
1. **Brancher le Social Studio** : OAuth Meta/WhatsApp/TikTok, file de publication, `Réécrire` via IA contrainte par le stock, `Créer le lead` → pipeline CRM.
2. **Automatisations actionnables** : `Valider`/`Reporter`/`Modifier message` + persistance de l'état actif/inactif des règles + file « En attente de vous » en tête.
3. **Monter `PromotionsFournisseursPanel`** dans `/marketing` avec création de campagne réelle (même workflow que les Combos stock).
4. Preview WhatsApp/SMS avant envoi ; inbox social avec réponse rapide inline ; attribution CA campagne en drill-down.

### 3.13 — RECOUVREMENT (Responsable Recouvrement)
**Pages :** dashboard, facturation, relances, PDV (débiteurs), automatisations, comptabilité.

**Boutons MORTS/SIMULÉS :** `Envoyer maintenant`/`Enregistrer une promesse`/`Modifier`/`Reporter` (dashboard, morts) ; `Bloquer/Débloquer crédit` (simulé) ; **aucune action** dans la fiche dossier `RelancesView` hormis `Fermer`.

**Améliorations :**
1. **Workflow relance complet** dans la fiche dossier : `Envoyer relance` (WhatsApp/SMS/appel), `Enregistrer paiement` (→ lettrage 411 + déplacement kanban), `Enregistrer une promesse`, `Escalader contentieux`.
2. **Intégration téléphonie/WhatsApp** depuis `Envoyer maintenant` (Twilio dispo dans l'environnement).
3. Historique des relances par client (timeline) + mode « tournée du jour » géolocalisée pour l'agent terrain.
4. Persister le journal de blocage crédit (audit trail légal) + export dossiers à provisionner pour le DAF.

---

## 4. Cartographie — la carte manquante par persona

### État actuel
Les cartes Leaflet n'existent **que dans les vues DG / encadrement** :
- `dashboard/ZonePilotageDGPanel.tsx` et `dashboard/CarteZonesDG.tsx` (dashboard DG)
- `commercial/CommercialTerrainView.tsx` + `commercial/CarteCommercialDG.tsx` (route `/commercial`, accessible DG, DC, RESP_VENTES, SUPERVISEUR)

**Constat clé :** les personas **terrain (COMMERCIAL, FREELANCE, PROSPECTION) n'ont aucune carte**, et l'encadrement (RESP_VENTES, SUPERVISEUR, DC) n'a de carte que sur `/commercial` — jamais sur ses écrans **opérationnels** (`/tournees`, `/mon-activite`, `/objectifs`, `/points-de-vente`, `/relances`).

### Pourquoi c'est un ajout à faible effort
Tout le socle existe déjà :
- **Coordonnées présentes** : `pdv-registry.ts` porte `lat`/`lng` pour chaque point de vente ; `tournees-registry.ts` les réutilise (`lat: pdv.lat, lng: pdv.lng`).
- **Moteur de distance** : `cartographie-distance-builder.ts` (`haversineKm`, clusters, suggestions d'implantation).
- **Dépendances déjà installées** : `leaflet` + `react-leaflet` dans `package.json`.
- **Composant réutilisable** : `CarteCommercialDG` est déjà un patron de carte avec marqueurs, popups et itinéraire (polylignes).

Il s'agit donc surtout de **monter une carte filtrée par périmètre** sur les écrans qui n'en ont pas.

### Carte recommandée par persona

| Persona | Carte à ajouter | Écran cible | Contenu |
|---------|-----------------|-------------|---------|
| **COMMERCIAL** | **Ma tournée du jour** | `/mon-activite`, `/dashboard` | Itinéraire optimisé, clients du jour colorés par statut (à visiter / visité / impayé / rupture), position GPS live, bouton « Y aller » → Waze/Google Maps |
| **FREELANCE** | **Mon portefeuille** | `/dashboard`, `/points-de-vente` | Ses clients géolocalisés (taille = CA, couleur = marge/créance) + PDV « blancs » à conquérir autour de sa zone |
| **PROSPECTION** | **Heatmap zones blanches** | `/prospection`, `/dashboard` | Densité de recensement, ouvertures récentes avec survie M+1/M+3, prospects à relancer, trous de couverture |
| **SUPERVISEUR** | **Mon équipe en temps réel** | `/tournees` (en plus de `/commercial`) | Position des VRP, écarts GPS/PJP, PDV non visités, alerte conformité ; clic VRP → sa tournée |
| **RESP_VENTES** | **Atterrissage par zone (choroplèthe)** | `/objectifs`, `/dashboard` | Zones coloriées par % de quota atteint, zones en décrochage cliquables → superviseur/commerciaux |
| **DC** | **Performance réseau par zone/commercial** | `/dashboard`, `/commercial` | Couverture DN, marge par zone, comparaison inter-régions Lomé/Kara |
| **RECOUVREMENT** | **Débiteurs géolocalisés** | `/relances`, `/points-de-vente` | Impayés par PDV (taille = montant, couleur = ancienneté) → génération d'une **tournée de recouvrement** optimisée |
| **RESP_STOCK** | **Flux & entrepôts** | `/stock`, `/approvisionnement` | Entrepôts, distances PDV, clusters éloignés, suggestions micro-dépôt (données déjà produites par `cartographie-distance-builder`) |
| **GEST_ENTREPOT** | **Tournées de livraison** | `/entrepot` (onglet expédition) | Ordre des arrêts, remplissage camion, ETA par PDV, réordonnancement drag-and-drop |
| **MARKETING** | **Couverture d'audience** | `/marketing` | PDV touchés/non touchés par campagne, zones à activer, croisement engouement produit × géographie |
| **DAF** | **Créances & capital par zone** | `/pilotage-financier` (optionnel) | Concentration du risque créances et du capital immobilisé par zone/entrepôt |

**Autres éléments « qui seraient géniaux » (au-delà des cartes) :**
- **COMMERCIAL/FREELANCE** ✅ : itinéraire optimisé automatiquement (VRP plus proche voisin) + navigation turn-by-turn multi-arrêts (Google Maps) — `lib/itineraire-builder.ts`, bascule « Optimiser le trajet » + « Lancer l'itinéraire » dans `MonActiviteView`.
- **RECOUVREMENT** ✅ : tournée de recouvrement optimisée (plus gros débiteurs, trajet le plus court) tracée sur la carte + « Lancer la tournée » dans `RelancesView`.
- **Tous** ✅ : géofencing opt-in — contrôle de présence GPS à la clôture de visite (`ClotureVisiteModal`), à ~200 m du PDV, non bloquant et tracé dans le commentaire.
- **SUPERVISEUR** ✅ : rejeu de la journée — sélecteur de commercial + timeline (play/pause, curseur) qui rejoue arrêt par arrêt les positions du VRP (passé/position actuelle/à venir) pour le débrief d'équipe — `TourneesView` (bascule « Rejeu ») exploitant `REGISTRE_VISITES`.
- **PROSPECTION** ✅ : mode « recensement » — bascule « Activer le recensement » dans `ConqueteView`, un clic sur la carte crée un prospect géolocalisé persistant (`lib/prospection-workflow.ts` + `ProspectionWorkflowContext`), listé et supprimable ; carte cliquable via `onMapClick`/`useMapEvents` sur `CartePerimetreTerrain`.

---

## 5. Automatisations à ajouter par persona

### Ce qui existe déjà
Le socle d'automatisation est réel et différencié : `lib/automation/marketing-automations.ts`, `recouvrement-automations.ts`, `automation-types.ts` (modes AUTO / PROPOSE / ESCALADE), `reappro-engine.ts`, `picking-engine.ts`, `automation-journal.ts`. La page `/automatisations` projette déjà les règles du poste. **Le maillon manquant partout : l'exécution et la validation** (voir §1). Les suggestions ci-dessous étendent ce socle.

| Persona | Automatisations qui faciliteraient la vie |
|---------|--------------------------------------------|
| **DG** | • Rapport IA du matin **auto-généré et envoyé** (email/WhatsApp) à 7h · • Alertes push sur seuils critiques (trésorerie < plancher, impayé CRITIQUE, rupture SKU moteur) · • Digest hebdo comité auto-compilé |
| **DC** | • **Réallocation de quota** suggérée quand une zone décroche · • Détection auto des commerciaux en perte de régime → plan de coaching proposé · • Synthèse hebdo CA vs quota poussée automatiquement |
| **RESP_VENTES** | • Alerte « zone sous quota à J-X » + plan d'action pré-rempli · • Redistribution auto des tournées si un VRP est absent · • Relance auto des superviseurs sur PJP non couverts |
| **SUPERVISEUR** | • Rappel auto si une tournée n'est pas démarrée à H+1 · • Alerte écart de caisse en fin de journée · • Relance auto d'un VRP dont un PDV clé n'a pas été visité |
| **COMMERCIAL** | • **Préparation auto de la tournée** du matin (clients prioritaires + itinéraire) · • **Réassort prédictif** : suggestion de commande par client selon l'historique de rotation · • Rappels de visite et de relance impayé · • Génération auto de la proforma récurrente |
| **FREELANCE** | • Relance auto de ses clients en retard de commande · • Alerte marge basse avant validation d'une proforma · • Suggestion de réassort + upsell combos |
| **PROSPECTION** | • **Relance auto des prospects tièdes** selon le score · • **Passation automatique** des ouvertures orphelines > X jours vers le commercial secteur · • Planification auto des recensements par zone blanche prioritaire |
| **RESP_STOCK** | • Réappro auto (à finaliser dans `reappro-engine`) avec garde-fou trésorerie · • **Navettes de transfert** déclenchées auto sur seuil d'excédent/rupture · • Alerte de rupture **prédite** avant qu'elle survienne · • Bilan de nuit auto (déjà amorcé dans le journal) |
| **GEST_ENTREPOT** | • Affectation auto des préparateurs selon la charge par vague · • Génération auto des vagues de picking par zone d'allées · • Alerte cutoff camion avec compte à rebours · • Blocage auto d'un bon si créance client dépasse le plafond |
| **DAF** | • **Run de paiement fournisseurs** proposé automatiquement selon échéances + trésorerie · • Provisionnement auto suggéré des créances douteuses · • Relance auto des ristournes fournisseurs dues · • Alerte covenant bancaire |
| **COMPTABLE** | • **Lettrage 411 auto** au-dessus d'un seuil de confiance (socle présent) · • OCR + pré-saisie des factures d'achat · • **Télédéclaration TVA pré-remplie** + alerte pièces manquantes relancées automatiquement · • Checklist de clôture qui coche seule ce qui est fait |
| **MARKETING** | • Campagnes **combo/surstock/DLC déclenchées auto** (déjà câblé via Combos stock — à étendre) · • Publication sociale programmée sur file d'attente · • Nurturing auto des leads (séquences WhatsApp/SMS) · • Suggestion auto de budget selon le ROI observé |
| **RECOUVREMENT** | • **Escalade multi-paliers auto** (J+7 SMS → J+15 appel → J+30 blocage) — socle dans `recouvrement-automations` · • Relances multicanal programmées · • Suivi auto des promesses de paiement + rappel si non tenue · • Blocage crédit auto proposé au-delà d'un seuil d'ancienneté |

**Règle d'or (garde-fou) :** conserver le triptyque `AUTO / PROPOSE / ESCALADE` déjà présent — l'utilisateur doit toujours pouvoir voir, valider ou annuler ce que l'IA fait en son nom (`automation-journal.ts` assure la traçabilité/réversibilité).

---

## 6. Manques d'historique par persona (« je ne peux pas comprendre le passé »)

Analyse ciblée : où l'utilisateur a besoin de voir l'**évolution dans le temps** pour comprendre une donnée, mais où l'historique est **absent ou inaccessible**. Trois types de manques :
- **T1** — valeur instantanée (score, statut, KPI) sans courbe ni comparaison N vs N-1.
- **T2** — historique **déjà calculé** dans un builder/registre mais **non exposé** dans l'UI (câblage manquant).
- **T3** — événement passé **non tracé** (pas de journal des visites, relances, décisions, réceptions).

### 6.1 — Les 5 manques structurants (transversaux)
1. **`historique[]` des relances non affiché.** `relances-registry.ts` porte un journal riche par dossier (`{ date, action, auteur, canal }`), mais `RelancesView` (`DetailRelance`) et `PdvRapportView` ne l'affichent pas → impossible de comprendre pourquoi un client à 10 relances ne paie pas. **Impact : RECOUVREMENT, DG, DC, COMMERCIAL.**
2. **`REGISTRE_VISITES` sous-exploité.** ~5 semaines de visites sont générées, mais le pilotage DG/superviseur utilise une carte **statique** (`buildVisitesPdvCarteStable`) et le superviseur n'a **aucun agenda d'équipe** (`getTourneeHub` renvoie vide pour l'encadrement). **Impact : DG, SUPERVISEUR, RESP_VENTES.**
3. **Décisions DG/DAF non historisées.** Les boutons `Valider/Reporter` (compta DG), arbitrages run paiement et crédit client (DAF) n'écrivent aucun journal → aucun audit « qui a décidé quoi, quand, avec quel impact ». **Impact : DG, DAF.**
4. **Comparaisons N vs N-1 absentes** sur tous les écrans d'exécution (`TourneesView`, `ObjectifsView`, `CommandesView` pilotage, `StockView`, `PilotageDAFView`) : tout est calé sur « jour/mois en cours ».
5. **Statuts sans timeline de changement.** Pipeline PDV (ACTIF → A_RISQUE), étapes conquête, statut commande, statut e-facture : des snapshots sans journal des transitions.

### 6.2 — « Quick wins » : l'historique existe déjà, il suffit de l'exposer
Ces manques sont à **effort faible** (données présentes dans les builders/registres) :

| Donnée historique | Source (déjà calculée) | Écran cible où l'exposer |
|-------------------|------------------------|--------------------------|
| Journal relances `{date, action, canal}` | `relances-registry.ts` | `RelancesView` (DetailRelance), `PdvRapportView` |
| `evolution_ca_6m[]` par commercial | `equipe-dg-builder.ts` | Fiche membre `EquipeView`, `CommercialTerrainView` |
| `sparkline[]` + `variation_pct` par KPI de poste | `kpi-postes-registry.ts` | `MatricePostesPanel` (vue DG/DC) |
| `ca_moyen_6m` du PDV | `pdv-rapport-builder.ts` | `PdvRapportView` |
| `jours_sans_remise` | `tournees-builder.ts` | Colonne du tableau `TourneesView` |
| `reachat_m1_pct`, `en_cours`, `transfere_a` | `prospection-builder.ts` / `prospection-registry.ts` | `ConqueteView` (entonnoir, survie, passation) |
| Comptages `dernier_comptage`, `ecarts_recents` | `inventaire-engine.ts` | `InventairePanel` |
| `evolution_7j` + `variation_pct` balance/trésorerie | `comptabilite-registry.ts` | `ComptabiliteView`, `ComptabiliteDGView` |
| Sorties BL + `stock_avant`/`stock_apres` | `sorties-entrepot-builder.ts` | Lien depuis `StockView` (aujourd'hui isolé dans `EntrepotSortiesHistoriquePanel`) |
| Visites passées par commercial/PDV | `getVisitesByCommercial()` | `MonActiviteView` (historique enrichi), `TourneesView`, `CommercialTerrainView` |

### 6.3 — Détail par persona

**DG** — trésorerie/marge/résultat et balance âgée en snapshot (`ComptabiliteDGView`) alors que le dashboard a déjà des sparklines 6 mois ; ROI campagnes sans courbe ; alertes IA sans « depuis quand ». **Besoin :** tendances 6-12 mois sur les écrans de pilotage + journal des décisions validées.

**DC** — matrice des postes (`MatricePostesPanel`) affiche un score sans la sparkline pourtant disponible ; acceptation proforma par commercial sans évolution ; fiches équipe sans courbe CA. **Besoin :** exposer les sparklines existantes pour piloter sur la tendance, pas la photo.

**RESP_VENTES** — `ObjectifsView` : atterrissage, statut zone (TIENT/DÉCROCHE) et mix produit sont des snapshots « mois en cours » ; aucune trace des réallocations de quota ni des arbitrages pris. **Besoin :** courbe de rythme de quota, historique des projections (J+5 vs J+11), journal d'arbitrages.

**SUPERVISEUR** — `TourneesView` 100 % « jour en cours » : couverture PJP, strike rate, écart caisse sans N-1 → impossible de distinguer incident ponctuel vs pattern ; pas d'agenda d'équipe ni de journal des remises de caisse. **Besoin :** historique caisse/strike par VRP, drill-down visites (données présentes dans le registre).

**COMMERCIAL** — onglet Historique de `MonActiviteView` filtre les visites non terminées et masque commentaire/durée/conseil IA pourtant présents ; disponibilité produit sans « en rupture depuis X jours » ; actions `Y aller`/`Clôturer` non horodatées. **Besoin :** historique de visites complet + durée de rupture + journal de mes actions terrain.

**FREELANCE** — marge par commande sans cumul/tendance mensuelle ; pas d'historique de grille tarifaire client. **Besoin :** courbe de marge et de CA société généré, semaine sur semaine.

**PROSPECTION** — score prospect, `jours_dans_etape` et `dernier_contact` sans parcours ni journal de contacts (alors que le goulot identifié est justement « manque de relances ») ; `transfere_a` non affiché. **Besoin :** timeline contacts/relances par prospect + transitions d'étape + trace des passations.

**RESP_STOCK** — taux de service, couverture, délai fournisseur, arriéré préparation : tous en point unique ; ~65 % du catalogue hérite d'un fallback **sans mouvements ni courbe** ; `JOURNAL_DECLENCHEMENTS` réappro existe mais n'est pas relié à `ReapproIAPanel` ; modifications de règles non auditées. **Besoin :** courbes stock/service, journal mouvements filtrable, audit trail des règles.

**GEST_ENTREPOT** — exclu de l'historique des sorties sur `/stock` (redirigé vers `StockEntrepotView` seul) ; comptages, réceptions et vagues de picking non journalisés (session uniquement). **Besoin :** historique comptages (démarque), journal réceptions/litiges, archive des vagues.

**DAF** — BFR/DIO/DPO, marge nette par canal, échéancier dette en point fixe (variation textuelle « +X vs mois dernier » seulement) ; runs de paiement et décisions crédit non tracés ; prix d'achat fournisseur sans historique. **Besoin :** courbes BFR/marge, historique des runs, timeline des paiements par fournisseur.

**COMPTABLE** — pas de journal des lettrages effectués, ni des relances de pièces manquantes, ni des saisies de factures d'achat (tout en session) ; écarts de caisse sans tendance par commercial ; journal comptable non filtrable par période. **Besoin :** journaux persistés (lettrage, pièces, achats) + drill-down encaissement↔facture.

**MARKETING** — ROI campagne/social et funnel en cumul instantané, sans courbe jour par jour ; score lead sans refroidissement ; posts publiés sans tendance d'engagement. **Besoin :** séries temporelles ROI/portée/leads, historique par publication.

**RECOUVREMENT** — le manque le plus critique : `DetailRelance` n'affiche pas l'`historique[]` pourtant présent ; DSO réseau/zone sans courbe ; promesses de paiement en compteurs (rompues/total) sans timeline ; journal de blocage crédit en session uniquement. **Besoin :** timeline complète par dossier (relances, promesses, paiements, blocages) partagée avec DAF/DG.

> ⚠️ **Attention aux limites des mocks :** le `automation-journal.ts` précise lui-même qu'il est une **projection du moment**, pas un log stocké. Les « quick wins » (§6.2) exposent des historiques déjà modélisés ; les manques T3 (journaux d'événements, transitions, décisions) nécessitent de **nouveaux registres persistés**, pas seulement du câblage UI.

---

## 7. Feuille de route priorisée (impact distribution Togo)

| Priorité | Chantier | Personas | Effort |
|----------|----------|----------|--------|
| **P0** | Boucle terrain visite → commande → clôture (offline) | COMMERCIAL, FREELANCE, PROSPECTION | Élevé |
| **P0** | Files d'arbitrage fonctionnelles (`ValidationsPanel`, décisions DG, automatisations) | SUPERVISEUR, RESP_VENTES, DG, MARKETING, RECOUVREMENT | Moyen |
| **P0** | Workflow recouvrement (envoyer/paiement/promesse) + lettrage | RECOUVREMENT, COMPTABLE, DAF | Moyen |
| **P1** ✅ | **Cartes terrain filtrées par périmètre** (données `lat`/`lng` déjà présentes) | COMMERCIAL, FREELANCE, PROSPECTION, SUPERVISEUR, RECOUVREMENT | Faible/Moyen |
| **P1** ✅ | Exécution stock réelle (transferts, réappro, réception persistée) | RESP_STOCK, GEST_ENTREPOT | Élevé |
| **P1** ✅ | Chaîne documentaire proforma → commande → facture → e-facture → PDF | terrain, COMPTABLE, DAF | Élevé |
| **P1** ✅ | Fiche PDV / Équipe déclinées par persona (retirer les « Vue DG ») | COMMERCIAL, RESP_VENTES, SUPERVISEUR | Faible |
| **P1** ✅ | **Exposer les historiques déjà calculés (§6.2 « quick wins »)** : sparklines, `evolution_ca_6m`, journal relances, visites | RECOUVREMENT, DG, DC, SUPERVISEUR, COMMERCIAL | Faible |
| **P2** ✅ | Nouveaux journaux persistés (décisions, promesses, lettrages, réceptions, transitions de statut) | DAF, COMPTABLE, RECOUVREMENT, GEST_ENTREPOT | Moyen/Élevé |
| **P2** ✅ | Extension des automatisations par persona (§5) avec garde-fous | tous | Moyen |
| **P2** ✅ | Exports (PDF/Excel) des rapports décision (DG, DAF, RESP_STOCK) | DG, DAF, RESP_STOCK | Faible |
| **P2** ✅ | Social Studio + Promotions fournisseurs branchés | MARKETING | Moyen |

**Principe directeur :** répliquer le modèle **Combos stock** (le seul workflow réellement câblé, via `ComboStockWorkflowContext`) pour transformer chaque « bouton vitrine » en action persistée et tracée.
