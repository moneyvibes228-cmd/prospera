# CAHIER DES CHARGES — PROSPERA

## Plateforme de Pilotage Microfinance AI-Native

| Champ | Valeur |
|-------|--------|
| **Projet** | Prospera — Plateforme microfinance (frontend + backend) |
| **Composant frontend** | `prospera-web` (Next.js) |
| **Composant backend** | API REST `/api/v1` (Node.js / Prisma) |
| **Version document** | 2.1 |
| **Date** | 15 juin 2026 |
| **Statut** | Document de référence technique projet |

---

## Table des matières

1. [Objet et périmètre du projet](#1-objet-et-périmètre-du-projet)
2. [Architecture globale](#2-architecture-globale)
3. [Organisation modulaire par bundles](#3-organisation-modulaire-par-bundles)
   - [3.1 Référentiel des processus IA](#31-référentiel-des-processus-ia)
4. [Bundle Crédit](#4-bundle-crédit)
5. [Bundle Terrain & Collecte](#5-bundle-terrain--collecte)
6. [Bundle Risque & Conformité](#6-bundle-risque--conformité)
7. [Bundle Croissance & Opérations](#7-bundle-croissance--opérations)
8. [Fonctionnalités transverses](#8-fonctionnalités-transverses)
9. [Exigences non fonctionnelles](#9-exigences-non-fonctionnelles)
10. [Phasage technique et jalons](#10-phasage-technique-et-jalons)
11. [Critères d'acceptation](#11-critères-dacceptation)
12. [Annexes](#12-annexes)

---

## 1. Objet et périmètre du projet

### 1.1 Objet

Le présent cahier des charges définit **ce que doit faire la plateforme Prospera** pour une Institution de Microfinance (IMF) en zone UEMOA/CEMAC : processus métier, comportement attendu du **frontend** (`prospera-web`) et du **backend** (API REST), règles de données et interactions entre les deux couches.

Prospera couvre le cycle complet : prospection client → demande de crédit → instruction → décaissement → remboursement → recouvrement → conformité réglementaire.

### 1.2 Périmètre inclus

| Couche | Périmètre |
|--------|-----------|
| **Frontend** | Application web Next.js — dashboards par rôle, workflows, cartographie, exports PDF, mode offline terrain |
| **Backend** | API REST JWT, persistance Prisma, workflows crédit, transactions, agrégats dashboards, moteurs IA |
| **Intégrations** | WhatsApp (relances), Mobile Money (Flooz/Mixx v1 Togo), cartographie GPS |
| **IA** | Scoring, alertes, Copilot contextuel, rapports enrichis (CC, ROC, DAF) |

### 1.3 Hors périmètre

- Application mobile native agents (projet parallèle — consomme les mêmes APIs terrain)
- Verticale Distribution & Grossistes (`prospera-distributeur`)
- Hébergement production et DevOps (document séparé)
- Migration de données client en production (procédure déploiement)

### 1.4 Utilisateurs et rôles (15 profils)

| Rôle système | Persona métier |
|--------------|----------------|
| `MANAGER` | Directeur Général |
| `GESTIONNAIRE` | Responsable d'Agence |
| `GESTIONNAIRE_PORTEFEUILLE` | Gestionnaire de Portefeuille |
| `AGENT_TERRAIN` | Agent terrain |
| `COLLECTRICE` | Collectrice / tontinière |
| `COMMERCIAL` | Commercial agence |
| `RESPONSABLE_COMMERCIAL` | Responsable Commercial & Collecte |
| `CREDIT` | Chargé de Crédit |
| `RESPONSABLE_CREDIT` | Responsable Opérations Crédit (ROC) |
| `RISQUE` | Analyste risque |
| `RELANCE` / `COMPTABLE` | Recouvrement / Comptable |
| `DAF` | Directeur Administratif & Financier |
| `AUDITEUR` | Auditeur interne |
| `COMMUNICATION` | Responsable marketing |
| `PAIE` | RH / Paie (périmètre limité équipes) |

Chaque rôle dispose d'un **menu**, d'un **dashboard** et d'un **périmètre de données** filtré (réseau, agence, zone ou portefeuille personnel).

---

## 2. Architecture globale

### 2.1 Schéma d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND — prospera-web (Next.js 16 / React 19)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Dashboard │ │  Crédit  │ │ Terrain  │ │  Caisse  │  …modules  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘            │
│       │            │            │            │                   │
│  ┌────┴────────────┴────────────┴────────────┴─────┐            │
│  │  Couche API clients (axios) + React Query        │            │
│  │  Feature flags : mock ↔ API (api-config.ts)      │            │
│  └──────────────────────┬──────────────────────────┘            │
└─────────────────────────┼───────────────────────────────────────┘
                          │ HTTPS — JWT Bearer
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND — API REST /api/v1                                     │
│  ┌────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────────┐   │
│  │  Auth  │ │  Workflows │ │ Transactions│ │  Agrégats    │   │
│  │  JWT   │ │  Crédit    │ │  Caisse/MoMo│ │  Dashboards  │   │
│  └────────┘ └────────────┘ └─────────────┘ └──────────────┘   │
│  ┌────────┐ ┌────────────┐ ┌─────────────┐                     │
│  │ Prisma │ │   Redis    │ │  Moteur IA  │                     │
│  │  ORM   │ │ (sessions) │ │  Scoring    │                     │
│  └────────┘ └────────────┘ └─────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    WhatsApp API    Flooz/Mixx MoMo    Service carto
```

### 2.2 Principes d'intégration frontend ↔ backend

| Principe | Description |
|----------|-------------|
| **API-first** | Toute action métier persistante passe par l'API ; le frontend ne calcule pas seul les statuts réglementaires |
| **Workflow piloté par le backend** | Le frontend interroge `GET …/workflow` et affiche uniquement les `actions_disponibles` et `sections_visibles` retournées |
| **Filtrage par rôle côté backend** | Le JWT contient `role`, `agenceId` ; le backend filtre les listes (un GP ne voit que son portefeuille) |
| **Bascule mock/API** | Variables `NEXT_PUBLIC_USE_API_PHASE1`, `NEXT_PUBLIC_USE_CREDIT_API`, `NEXT_PUBLIC_USE_API_PHASES_AD` |
| **Idempotence transactions** | Les paiements MoMo et caisse utilisent des identifiants uniques pour éviter les doublons |
| **Offline terrain** | Le frontend stocke localement visites/collectes ; le backend expose `POST /visites` (multipart) et sync batch |

### 2.3 Phases d'implémentation API

| Phase | Périmètre backend | Documentation |
|-------|-------------------|---------------|
| **Phase 1** | Auth, agences, users, zones, visites, prospects | `docs/API_MICROFINANCE_PHASE1.md` |
| **Phase 2** | Processus crédit complet, dossiers, workflow, rapports IA | `docs/API_PHASE2_CREDIT.md` |
| **Phases A–D** | Dashboards agrégés, pipeline, collecte, transactions, recouvrement réseau | `docs/API_PHASES_A_D.md` |

---

## 3. Organisation modulaire par bundles

La plateforme complète regroupe **13 modules** en **4 bundles métier**. Chaque bundle est un ensemble cohérent de capacités déployables ensemble.

```
PLATEFORME COMPLÈTE (13 modules · 15 rôles)
│
├── ★ BUNDLE CRÉDIT — Cœur métier IMF
│   ├── M1 — Dashboard & Pilotage
│   ├── M2 — CRM Emprunteurs
│   └── M3 — Crédit (Pipeline & Dossiers)
│
├── BUNDLE TERRAIN & COLLECTE
│   ├── M4 — Terrain & Agents
│   ├── M5 — Relances Intelligentes
│   └── M6 — Caisse & Mobile Money
│
├── BUNDLE RISQUE & CONFORMITÉ
│   ├── M7 — Recouvrement
│   ├── M8 — Finance & Comptabilité
│   └── M9 — Conformité & Audit
│
└── BUNDLE CROISSANCE & OPÉRATIONS
    ├── M10 — Marketing & Acquisition
    ├── M11 — Épargne
    ├── M12 — Équipes & Réseau d'Agences
    └── M13 — Produits Financiers
```

| Bundle | Modules | Rôles principaux |
|--------|---------|------------------|
| **Crédit** | M1, M2, M3 | DG, RA, CC, ROC, Commercial |
| **Terrain & Collecte** | M4, M5, M6 | Agent terrain, Collectrice, GP, Comptable |
| **Risque & Conformité** | M7, M8, M9 | ROC, DAF, Auditeur, Risque |
| **Croissance & Opérations** | M10, M11, M12, M13 | DG, Commercial, Communication, RA |

#### Processus métier transversal — vue bout en bout

Ce schéma montre comment les modules s'enchaînent du point de vue métier (lecture de gauche à droite) :

```
PROSPECTION          DEMande CRÉDIT           GESTION PRÊT           FIN DE CYCLE
(M10 Marketing)      (M2 CRM + M3 Crédit)     (M4-M6 Terrain)        (M7-M9 Risque)
     │                      │                      │                      │
     ▼                      ▼                      ▼                      ▼
 Lead WhatsApp ──► Prospect ──► Dossier ──► Décaissement ──► Échéances ──► Clôture
 Chatbot IA       Wizard KYC   Instruction    Comité           Collecte      ou
 Scoring lead     Score client  CC→ROC→Comité  MoMo/Caisse     Relances IA   Recouvrement
                       │              │              │              │
                       └──────────────┴──────────────┴──────────────┘
                                    M1 Dashboard (pilotage)
                                    M12 Équipes (performance)
                                    M13 Produits (conditions)
```

**Exemple concret — parcours client « Afi K. »**

| Jour | Module | Événement |
|------|--------|-----------|
| J0 | M10 | Afi contacte via WhatsApp → lead score 82 → commercial assigné |
| J2 | M2 | Commercial complète wizard KYC → score client 75 |
| J5 | M3 | Agent soumet demande 300 000 FCFA → dossier `SOUMIS` |
| J8 | M3 | CC instruit, visites OK, avis favorable → `EN_ANALYSE_ROC` |
| J10 | M3 | ROC approuve → comité valide → décaissement → `EN_GESTION` |
| J10 | M12 | GP Mensah assigné au portefeuille |
| M1–M12 | M4/M6 | Agent collecte échéances terrain (tontine/MoMo) |
| M6 | M5 | Relances auto J-3 avant chaque échéance |
| M12 | M1 | RA pilote performance agent via dashboard |
| Clôture | M3 | Dernière échéance payée → `CLOTURE` → M10 propose renouvellement |

---

### 3.1 Référentiel des processus IA

L'IA Prospera n'est pas un module isolé : elle intervient **à des moments précis** de chaque processus métier. Trois niveaux d'intervention sont distingués :

| Niveau | Symbole | Description | Exemple |
|--------|---------|-------------|---------|
| **Assistance** | 🔵 | L'IA analyse et recommande ; l'humain décide | Décision crédit suggérée par le CC |
| **Automatisation** | 🟢 | L'IA exécute sans intervention si règle claire | Relance WhatsApp J-3 |
| **Alerte** | 🟠 | L'IA détecte une anomalie et notifie | PAR agence en hausse > 2 pts |

#### Cycle de vie d'un traitement IA

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│ DÉCLENCHEUR │ →  │ COLLECTE     │ →  │ MOTEUR IA   │ →  │ SORTIE       │
│ (event/cron)│    │ DONNÉES      │    │ (scoring/   │    │ (score/      │
│             │    │ (API/DB)     │    │  LLM/règles)│    │  alerte/msg) │
└─────────────┘    └──────────────┘    └─────────────┘    └──────┬───────┘
                                                                   │
                    ┌──────────────────────────────────────────────┘
                    ▼
         ┌─────────────────────┐    ┌─────────────────────┐
         │ VALIDATION HUMAINE  │ ou │ ACTION AUTOMATIQUE  │
         │ (si niveau 🔵)      │    │ (si niveau 🟢)      │
         └─────────────────────┘    └─────────────────────┘
```

#### Données d'entrée communes aux moteurs IA

| Source | Données utilisées |
|--------|-------------------|
| **Client** | Historique crédit, retards, visites, score, classe BCEAO, géolocalisation |
| **Dossier crédit** | Montant, produit, garanties, pièces, visites instruction, statut workflow |
| **Transactions** | Paiements MoMo/caisse, fréquence, montants, doublons |
| **Terrain** | Visites GPS, fréquence, photos, voice-to-CRM |
| **Réseau** | KPIs agence, PAR zone, benchmarking inter-agences |
| **Contexte utilisateur** | Rôle, page active, entité consultée (pour Copilot) |

#### Règle fondamentale

> **Aucune décision réglementaire ou financière définitive n'est prise par l'IA seule.**  
> L'IA produit des scores, rapports et recommandations. Les statuts de dossier, validations comité, décaissements et écritures comptables restent **validés par un utilisateur habilité** ou par une **règle métier explicite** codée côté backend.

#### Cartographie IA par module

| Module | Capacités IA | Niveau dominant |
|--------|-------------|-----------------|
| M1 Dashboard | Copilot, alertes, prévision PAR, synthèse DG | 🔵 + 🟠 |
| M2 CRM | Score client, PD, classe BCEAO, signaux faibles | 🔵 + 🟠 |
| M3 Crédit | Scoring dossier, CBI, décision suggérée, rapports CC/ROC | 🔵 |
| M4 Terrain | Optimisation tournées, voice-to-CRM, rapport soir | 🟢 + 🔵 |
| M5 Relances | Priorisation, choix canal, messages pré-rédigés | 🟢 + 🔵 |
| M6 Caisse | Détection doublons/fraude, réconciliation | 🟠 + 🟢 |
| M7 Recouvrement | Score recouvrement, BlocAnalyse, stratégie agence | 🔵 + 🟠 |
| M8 Finance | DAF Copilot, prévision cash, provisions | 🔵 + 🟢 |
| M9 Conformité | Score conformité, anomalies, rapport BCEAO | 🟢 + 🟠 |
| M10 Marketing | Scoring leads, segmentation, chatbot | 🟢 + 🔵 |
| M11 Épargne | Comptes dormants, recommandation produit | 🟠 + 🔵 |
| M12 Équipes | Performance gap, coaching, benchmarking | 🔵 + 🟠 |
| M13 Produits | Recommandation produit, simulation échéancier | 🔵 |

---

## 4. Bundle Crédit

> Piloter le réseau, connaître chaque emprunteur, instruire et décaisser les crédits avec l'IA.

---

### M1 — Dashboard & Pilotage

#### Définition

Module de **centralisation des KPIs** et de **navigation drill-down** du réseau jusqu'à la transaction individuelle. Chaque rôle voit un tableau de bord adapté à ses responsabilités.

#### Processus métier détaillé

**Objectif** : Permettre à chaque responsable de consulter en un coup d'œil l'état de son périmètre et d'identifier les actions prioritaires sans consolidation manuelle Excel.

**Acteurs** : DG, RA, CC, ROC, GP, Agent terrain, RCC, DAF, Auditeur.

**Déclencheur** : Connexion utilisateur ou rafraîchissement dashboard (auto toutes les 5 min en production).

| Étape | Acteur | Action | Données | Règle métier | Résultat |
|-------|--------|--------|---------|--------------|----------|
| 1 | Système | Authentifie l'utilisateur | JWT (role, agenceId) | Un token expiré → redirection login | Session active |
| 2 | Backend | Charge agrégats du périmètre | KPIs filtrés par rôle | DG = réseau entier ; RA = 1 agence ; GP = portefeuille | Payload dashboard JSON |
| 3 | Frontend | Affiche dashboard dédié | Composant selon rôle | Menu sidebar filtré par `UserRole` | Écran KPIs + graphiques |
| 4 | Utilisateur | Consulte alertes du jour | Liste `alertes` priorisées | Alertes rouges = action sous 24h | Bandeau priorités |
| 5 | Utilisateur | Drill-down (optionnel) | Clic agence → zone → agent → client | Chaque niveau vérifie habilitation | Navigation hiérarchique |
| 6 | Utilisateur | Interroge le Copilot | Question en langage naturel | Contexte page envoyé avec la question | Réponse IA structurée |

**Drill-down DG — niveaux de navigation**

```
Réseau (PAR global, collecte, pipeline)
  └── Agence (KPIs agence, carte zones)
        └── Zone / Secteur (agents, clients)
              └── Agent (visites, collecte, PAR portefeuille)
                    └── Client (fiche 360°, dossiers, transactions)
                          └── Transaction (détail paiement, réconciliation)
```

#### Processus IA — M1 Dashboard & Pilotage

| Élément | Détail |
|---------|--------|
| **Rôle IA** | Synthétiser des volumes de données, détecter anomalies, répondre aux questions métier |
| **Déclencheurs** | Cron quotidien 06h00 ; événement PAR > seuil ; question Copilot utilisateur |
| **Entrées** | Agrégats PAR/collecte/pipeline, historique 90 jours, objectifs agence, benchmarks réseau |
| **Traitement alertes** | Règles : PAR agence +2 pts vs M-1 → alerte 🟠 ; collecte < 80 % objectif → alerte ; dossier bloqué > 30j → alerte |
| **Traitement Copilot** | 1) Détection intent 2) Requête données API 3) Génération réponse markdown |
| **Sorties** | Liste alertes priorisées ; prévision PAR 30/60/90j ; synthèse DG quotidienne ; réponse Copilot |
| **Validation humaine** | 🔵 Copilot = assistance ; 🟠 alertes = l'utilisateur choisit l'action |
| **Exemple** | DG demande « Quelle agence a le PAR le plus élevé ? » → Copilot : « Agence Adidogomé : PAR 30j = 14,2 % (+3,1 pts). 12 dossiers concentrent 68 % du retard. » |

#### Frontend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Routes** | `/dashboard`, `/dashboard/secteurs/[slug]`, `/agences`, `/zones` |
| **Composants** | `DashboardManager`, `DashboardResponsableAgence`, `DashboardChargeCredit`, `DashboardResponsableCredit`, `DashboardTerrain`, `DashboardGestionnairePortefeuille`, `DashboardResponsableCommercial` |
| **Navigation DG** | Menu épuré `DG_NAV` — 11 entrées stratégiques |
| **Drill-down** | Onglets Commercial, Crédit, Terrain, Opérationnel, Financier sur vue DG |
| **Carte couverture** | Visualisation zones clients/agents avec gaps identifiés |
| **Alertes** | Bandeau priorités du jour — badge sur menu Relances |
| **Copilot** | Tiroir latéral — suggestions par rôle, questions libres |
| **États UI** | Loading (spinner), erreur API (`ApiStates`), mode mock (bannière `ApiPhase1Banner`) |

#### Backend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Endpoints dashboards** | `GET /dashboard/terrain`, `/dashboard/charge-credit`, `/dashboard/roc`, `/dashboard/responsable-agence`, `/dashboard/responsable-commercial`, `/dashboard/gestionnaire-portefeuille` |
| **Agrégats** | PAR 30/60/90j, collecte jour/mois, pipeline crédit par statut, effectifs agents |
| **Filtrage** | Paramètre `agence_id` optionnel ; sans paramètre = périmètre autorisé par le JWT |
| **Alertes IA** | Job planifié analyse anomalies (PAR hausse, agence sous-objectif) → table `alertes` |
| **Prévision PAR** | Service IA calcule tendance + forecast 30/60/90j à partir historique échéances |
| **Synthèse DG** | `GET /dashboard/dg/synthese` — rapport consolidé quotidien (à implémenter si absent) |

#### Flux frontend ↔ backend

```
Login → GET /auth/me
     → GET /dashboard/{role} (selon rôle connecté)
     → Affichage KPIs + graphiques (Recharts)
     → Clic drill-down → GET /agences/{id} ou /kpis/agents/{id}
     → Copilot → POST /ia/copilot (question + contexte page) → réponse structurée
```

#### Dépendances

- M2 (clients), M3 (pipeline), M6 (transactions), M7 (recouvrement) alimentent les agrégats

---

### M2 — CRM Emprunteurs

#### Définition

**Référentiel client** de l'IMF : fiche 360°, KYC, groupes solidaires, historique crédit, score risque IA.

#### Processus métier détaillé

**Objectif** : Constituer et maintenir une fiche client fiable, traçable et enrichie, utilisable par tous les modules (crédit, terrain, recouvrement).

**Acteurs** : Agent terrain, Commercial, CC, GP, Auditeur (lecture KYC).

**Déclencheur** : Prospection terrain, demande crédit, ou mise à jour manuelle.

| Étape | Acteur | Action | Données saisies | Règle métier | Résultat |
|-------|--------|--------|-----------------|--------------|----------|
| 1 | Agent terrain | Crée un **prospect** | Nom, téléphone, zone GPS, activité | Téléphone unique par IMF | Client statut `PROSPECT` |
| 2 | Commercial / CC | Complète la fiche (wizard 7 étapes) | Identité, adresse, activité, revenus | Wizard : `IDENTITE` → `CONTACT` → `ACTIVITE` → `REVENUS` → `GARANTIES` → `DOCUMENTS` → `VALIDATION` | Progression % affichée |
| 3 | Commercial | Upload pièces KYC | CNI, justificatif domicile, photo | Formats PDF/JPG, max 20 Mo | Documents statut `EN_ATTENTE` |
| 4 | CC / Auditeur | Valide ou rejette KYC | Motif si rejet | KYC validé requis avant décaissement | Statut `KYC_VALIDE` ou `KYC_REJETE` |
| 5 | Système | Recalcule score client | Event : KYC validé, retard, paiement, visite | Score 0–100 + classe BCEAO + PD | Historique score horodaté |
| 6 | CC / Admin | Crée groupe solidaire (optionnel) | Nom groupe, membres, responsable | Min. 5 membres pour produit groupe | Groupe lié aux dossiers |
| 7 | ROC / Admin | Assigne GP au client | `gestionnaire_portefeuille_id` | Un client actif = 1 GP responsable post-décaissement | Portefeuille GP mis à jour |

**Wizard client — étapes et champs**

| Étape | Champs obligatoires | Rôle autorisé à modifier |
|-------|--------------------|-----------------------|
| IDENTITE | nom, prénom, sexe, date naissance, CNI | Agent, Commercial |
| CONTACT | téléphone, adresse, GPS | Agent, Commercial |
| ACTIVITE | secteur, activité, ancienneté | Commercial, CC |
| REVENUS | revenu mensuel, charges, autre crédit | Commercial, CC |
| GARANTIES | type garantie, valeur estimée | CC |
| DOCUMENTS | pièces uploadées | Agent, Commercial, CC |
| VALIDATION | checklist complète | CC, Auditeur |

#### Processus IA — M2 CRM Emprunteurs

| Élément | Détail |
|---------|--------|
| **Rôle IA** | Évaluer le risque client en continu et alerter avant dégradation |
| **Déclencheurs** | Création client ; validation KYC ; paiement/retard échéance ; visite terrain ; nouvelle demande crédit |
| **Entrées** | Historique remboursements, retards passés, revenus déclarés, secteur activité, fréquence visites, CBI inter-agences |
| **Traitement score** | Modèle score 0–100 : pondération historique paiement (40 %), capacité remboursement (30 %), stabilité activité (20 %), signaux terrain (10 %) |
| **Classe BCEAO** | Mapping automatique : score ≥ 80 → Classe 0 ; 60–79 → Classe 1 ; 40–59 → Classe 2 ; < 40 → Classe 3 |
| **PD (Probabilité de Défaut)** | Calculée à partir classe + historique retards |
| **Signaux faibles** | 🟠 Alerte si : baisse fréquence visites, 2 retards consécutifs, baisse collecte tontine, changement adresse |
| **Sorties** | `score_actuel`, `classe_bceao`, `pd`, `facteurs[]`, `alertes[]` |
| **Validation humaine** | 🔵 Score affiché au CC/GP — ne bloque pas seul une décision ; peut déclencher revue manuelle si score < seuil |
| **Exemple** | Client M. Koffi : 3 retards sur 12 mois → score passe de 72 à 58 → alerte 🟠 « Signal faible : dégradation comportement paiement » → GP notifié |

#### Frontend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Routes** | `/emprunteurs`, `/emprunteurs/[id]`, `/clients/nouveau`, `/clients/[id]`, `/kyc`, `/groupes`, `/portefeuille` |
| **Liste** | Filtres : statut, zone, score, PAR, agence — pagination |
| **Fiche 360°** | Onglets : profil, crédits, épargne, visites, relances, score IA, carte GPS |
| **KYC** | Upload documents, statut validation (en attente / validé / rejeté) |
| **Groupes** | CRUD groupe solidaire, liste membres, responsable groupe |
| **Vue GP** | `GpPortefeuilleView` — uniquement clients assignés au GP connecté |
| **Carte** | `MapGpClients` — positions clients sur carte Leaflet |
| **Score affiché** | Jauge 0–100 + classe BCEAO + alertes signaux faibles |

#### Backend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **CRUD clients** | `GET/POST /clients`, `GET/PATCH /clients/:id` |
| **Prospects** | `POST /clients/prospects` — création minimale terrain |
| **KYC** | `POST /clients/:id/documents` (multipart), `PATCH /clients/:id/kyc/valider` |
| **Groupes** | `GET/POST /groupes`, `POST /groupes/:id/membres` |
| **Score IA** | `GET /clients/:id/score` — score, PD, classe BCEAO, facteurs |
| **Calendrier risque** | `GET /clients/:id/calendrier-risque` — échéances + alertes |
| **Filtrage GP** | Liste filtrée par `gestionnaire_portefeuille_id` du JWT |
| **Recalcul score** | Event-driven : paiement échéance, retard, nouvelle demande crédit |

#### Flux frontend ↔ backend

```
Agent terrain → POST /clients/prospects { nom, tel, zone, gps }
Commercial    → PATCH /clients/:id { données complètes }
              → POST /clients/:id/documents (CNI, justificatif domicile)
Backend       → recalcule score → stocke historique score
GP            → GET /clients?gp_id=me → fiche + GET /clients/:id/score
```

#### Dépendances

- M3 (dossiers liés au client), M4 (visites), M5 (relances), M11 (comptes épargne)

---

### M3 — Crédit (Pipeline & Dossiers)

#### Définition

**Cycle de vie complet du prêt** : de la demande au décaissement, instruction CC, validation ROC, comité crédit, puis gestion post-décaissement.

#### Processus métier détaillé — cycle crédit complet

**Objectif** : Traiter une demande de prêt de la soumission terrain jusqu'à la clôture, avec séparation des pouvoirs (CC → ROC → Comité) et traçabilité complète.

**Acteurs** : Agent terrain, Commercial, CC, ROC, DG/RA (comité), GP, Comptable (décaissement).

**Déclencheur** : Agent terrain soumet une demande pour un client éligible (KYC en cours ou validé, ancienneté client ≥ 3 mois selon produit).

---

**PHASE A — Demande et constitution du dossier**

| Étape | Acteur | Action | Statut BD | API | Règle métier |
|-------|--------|--------|-----------|-----|--------------|
| A1 | Agent terrain | Soumet demande crédit | `SOUMIS` | `POST /dossiers-credit` | Client doit exister ; montant ≤ plafond produit |
| A2 | Agent / CC | Programme RDV client | `RDV_PROGRAMME` | `PATCH …/rdv` | Créneau proposé, CC notifié |
| A3 | CC | Signale documents manquants | `EN_ATTENTE_DOCUMENTS` | `PATCH …/documents-manquants` | Liste pièces requises générée selon produit |
| A4 | Agent / CC | Upload pièces + cautionnaires | `DOSSIER_COMPLET` | `POST …/documents/upload`, `PATCH …/cautionnaires` | Min. 1 cautionnaire si montant > seuil |
| A5 | Système | Recalcule score dossier (CBI) | — | `POST …/score/recalculer` | Score déclenché à chaque étape clé |

---

**PHASE B — Instruction et analyse (Chargé de Crédit)**

| Étape | Acteur | Action | Statut BD | API | Règle métier |
|-------|--------|--------|-----------|-----|--------------|
| B1 | CC | Planifie visites domicile/activité | `VISITES_PLANIFIEES` | `PATCH …/disponibilites` | Min. 2 visites pour montant > 500 000 FCFA |
| B2 | CC / Agent | Réalise et clôture visites | `EN_ANALYSE` | `POST/PATCH …/visites` | Photo + GPS obligatoires ; audio optionnel |
| B3 | CC | Consulte rapport IA + checklist | — | `GET …/rapport-cc`, `GET …/instruction-cc` | Checklist 100 % avant avis |
| B4 | CC | Émet avis favorable ou défavorable | `VALIDE_CHARGE` ou `REFUSE_CHARGE` | `PATCH …/avis-charge` | Avis défavorable = fin du dossier (sauf appel ROC) |
| B5 | Système | Transmet au ROC si favorable | `EN_ANALYSE_ROC` | Automatique post-avis CC | Génère `rapport-roc` |

---

**PHASE C — Décision ROC (Responsable Opérations Crédit)**

| Étape | Acteur | Action | Statut BD | API | Règle métier |
|-------|--------|--------|-----------|-----|--------------|
| C1 | ROC | Consulte rapport ROC + score IA | — | `GET …/rapport-roc`, `GET …/score` | Décision IA affichée en recommandation uniquement |
| C2 | ROC | Approuve avec proposition | `EN_COMITE_CREDIT` | `PATCH …/decision-roc` { approuve: true, montant, duree, taux, gp_id } | **Pas de décaissement à cette étape** |
| C3 | ROC | Refuse définitivement | `REFUSE` | `PATCH …/decision-roc` { approuve: false } | Notification agent + client |
| C4 | ROC | Demande garanties supplémentaires | `EN_ATTENTE_DOCUMENTS` | `PATCH …/decision-roc` { demander_garanties: true } | Retour phase A |

> **Règle impérative** : ROC approuve → `EN_COMITE_CREDIT` sans générer échéancier. Seul le comité déclenche le décaissement.

---

**PHASE D — Comité de crédit**

| Étape | Acteur | Action | Statut BD | API | Règle métier |
|-------|--------|--------|-----------|-----|--------------|
| D1 | ROC / DG / RA | Tient comité | `EN_COMITE_CREDIT` | — | Quorum : ROC + 1 membre direction |
| D2 | Comité | Décision favorable | `EN_GESTION` | `PATCH …/comite-credit` { favorable: true } | Génère échéancier + `date_decaissement` + `conditions_finales` |
| D3 | Comité | Décision défavorable | `REFUSE` | `PATCH …/comite-credit` { favorable: false } | Motif obligatoire |
| D4 | Système | Notifie parties prenantes | — | Email/SMS | Client, GP assigné, agent terrain, RCC |
| D5 | Comptable | Enregistre décaissement | — | Transaction liée au dossier | MoMo ou virement selon mode choisi |

---

**PHASE E — Gestion du prêt (Gestionnaire de Portefeuille)**

| Étape | Acteur | Action | Statut BD | API | Règle métier |
|-------|--------|--------|-----------|-----|--------------|
| E1 | GP | Consulte vue portefeuille | `EN_GESTION` | `GET …/vue-portefeuille` | Accès dossiers assignés uniquement |
| E2 | GP / Agent | Encaisse échéances | — | `POST …/echeancier/:eid/payer` | Paiement partiel autorisé si règle produit |
| E3 | Système | Met à jour échéancier | — | Automatique | Échéance `PAYEE` si montant ≥ dû |
| E4 | Système | Clôture dossier | `CLOTURE` | Automatique | Toutes échéances payées |
| E5 | GP / Commercial | Propose renouvellement | Nouveau dossier | `POST /dossiers-credit` | Client `CLOTURE` + bon historique |

---

**Schéma du flux de statuts**

```
SOUMIS → RDV_PROGRAMME → EN_ATTENTE_DOCUMENTS → DOSSIER_COMPLET
  → VISITES_PLANIFIEES → EN_ANALYSE → VALIDE_CHARGE → EN_ANALYSE_ROC
  → EN_COMITE_CREDIT → EN_GESTION → CLOTURE
                    ↘ REFUSE (à tout moment via annulation)
```

#### Processus IA — M3 Crédit

| Élément | Détail |
|---------|--------|
| **Rôle IA** | Aider l'instruction, scorer le risque, suggérer une décision — sans remplacer le comité |
| **Déclencheurs recalcul CBI** | Soumission (`SOUMIS`) · Dossier complet (`DOSSIER_COMPLET`) · Visites OK (`EN_ANALYSE`) · Avis CC (`VALIDE_CHARGE`) · Proposition ROC (`EN_COMITE_CREDIT`) |
| **Entrées scoring dossier** | Score client, revenus, garanties, visites, historique CBI, secteur activité, montant/durée demandés, ratio d'endettement |
| **Traitement** | 1) Calcul score consolidé 0–100 2) Calcul PD et Expected Loss 3) Comparaison seuils produit 4) Génération narrative rapport |
| **Décision suggérée** | `APPROUVER` · `APPROUVER_RÉDUIT` (montant réduit) · `DEMANDER_GARANTIES` · `REFUSER` |
| **Alertes actives** | Fraude suspectée · Garanties insuffisantes · Non-conformité BCEAO · Endettement > plafond |
| **Rapport CC** | Narrative IA : forces/faiblesses dossier, points d'attention, recommandation instruction |
| **Rapport ROC** | Synthèse risque + proposition montant/taux/durée + comparaison portefeuille agence |
| **CBI (Credit Bureau Investigation)** | Vérification inter-agences : crédits en cours ailleurs, incidents passés |
| **Sorties API** | `GET …/score`, `GET …/rapport-cc`, `GET …/rapport-roc` |
| **Validation humaine** | 🔵 **Obligatoire** — CC donne avis, ROC décide, Comité valide. L'IA ne change jamais le statut seule. |
| **Exemple** | Dossier 250 000 FCFA, score 67, 1 retard passé résorbé → IA suggère `APPROUVER_RÉDUIT` à 200 000 FCFA · CC peut suivre ou demander 250 000 avec garantie supplémentaire |

#### Frontend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Routes** | `/credit`, `/credit/pipeline`, `/credit/dossiers`, `/credit/dossiers/[id]`, `/credit/analyse`, `/credit/cycle` |
| **Pipeline Kanban** | `PipelineCreditKanban` — colonnes par étape, drag & drop (dnd-kit) |
| **Fiche dossier** | Onglets conditionnels via `sections_visibles` du workflow |
| **Boutons actions** | Rendus uniquement si présents dans `actions_disponibles` |
| **Timeline** | Stepper visuel des jalons (`timeline` + `jalons` du workflow) |
| **Analyse CC** | `DossierScorePanel`, checklist instruction, rapport IA |
| **Rapport ROC** | `RapportRocView` — export PDF |
| **Décision IA** | Affichage : APPROUVER / APPROUVER_RÉDUIT / DEMANDER_GARANTIES / REFUSER |
| **Mauvais payeurs** | `/credit/mauvais-payeurs` — liste dossiers à risque |
| **Modales** | `PipelineAddDossierModal`, `DemandeCreditModal` |

#### Backend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **CRUD dossiers** | `GET/POST /dossiers-credit`, `GET /dossiers-credit/:id` |
| **Workflow** | `GET /dossiers-credit/:id/workflow` — source de vérité UI |
| **Pipeline agrégé** | `GET /dossiers-credit/pipeline?agence_id=` |
| **Transitions** | `PATCH …/rdv`, `…/documents-manquants`, `…/cautionnaires`, `…/avis-charge`, `…/decision-roc`, `…/comite-credit`, `…/annuler` |
| **Rapports IA** | `GET …/rapport-cc`, `GET …/rapport-roc`, `GET …/score` |
| **Échéancier** | Génération auto à la validation comité ; `GET …/echeancier`, `POST …/echeancier/:eid/payer` |
| **Vue portefeuille GP** | `GET …/vue-portefeuille` — dossier + client + échéancier consolidé |
| **Scoring IA** | Service calcule score 0–100, décision suggérée, alertes (fraude, garanties) |
| **CBI** | Vérification historique crédit inter-agences (intégration bureau crédit) |
| **Notifications** | Email/SMS à la validation comité : client, GP, agent terrain, RCC |

#### Flux frontend ↔ backend (exemple instruction dossier)

```
CC ouvre /credit/dossiers/:id
  → GET /dossiers-credit/:id/workflow
  → Affiche onglets selon sections_visibles
  → GET /dossiers-credit/:id/instruction-cc (checklist)
  → GET /dossiers-credit/:id/score (panel IA)
  → CC complète visites → PATCH …/visites/:vid
  → CC donne avis → PATCH …/avis-charge { favorable, notes }
  → Backend passe EN_ANALYSE_ROC, génère rapport-roc
ROC → GET …/rapport-roc → PATCH …/decision-roc { approuve: true, montant, duree, taux, gp_id }
  → Backend passe EN_COMITE_CREDIT
Comité → PATCH …/comite-credit { favorable: true }
  → Backend génère échéancier, EN_GESTION, date_decaissement, notifications
```

#### Dépendances

- M2 (client), M13 (produit crédit, conditions), M6 (décaissement MoMo), M7 (si retard)

---

## 5. Bundle Terrain & Collecte

> Couvrir le terrain, relancer les clients, encaisser et réconcilier les flux financiers.

---

### M4 — Terrain & Agents

#### Définition

**Pilotage et exécution des activités terrain** : missions, visites GPS, collecte, mode offline, synchronisation différée.

#### Processus métier détaillé

**Objectif** : Organiser, exécuter et tracer les activités terrain pour maximiser la couverture client et la qualité des données remontées.

**Acteurs** : Agent terrain, Collectrice, RA (supervision), GP (consultation missions liées à son portefeuille).

**Déclencheur** : Début de journée agent OU création mission manuelle par RA OU mission auto (retard J+7, relance).

| Étape | Acteur | Action | Données | Règle métier | Résultat |
|-------|--------|--------|---------|--------------|----------|
| 1 | Système / IA | Génère plan de missions du jour | Liste clients priorisés | Priorité : retards > échéances J-3 > prospects > visites routinières | `GET /missions/jour` |
| 2 | Agent | Consulte carte + itinéraire | GPS agent, positions clients | Itinéraire optimisé affiché | Mission ordonnée |
| 3 | Agent | Se rend chez le client | GPS temps réel | Alerte proximité si client retard à < 200 m | Notification optionnelle |
| 4 | Agent | Remplit formulaire visite | Type visite, compte-rendu, photo, GPS | Photo obligatoire ; GPS écart < 100 m du client | Visite `BROUILLON` |
| 5 | Agent | Voice-to-CRM (optionnel) | Audio → texte structuré | Transcription enrichit le compte-rendu | Champs pré-remplis |
| 6 | Agent | Collecte paiement (optionnel) | Montant, canal tontine/MoMo | Lié à échéance si dossier actif | Transaction créée (M6) |
| 7 | Système | Enregistre visite | `POST /visites` multipart | Géofencing validé côté backend | Visite `VALIDEE` ou `REJETEE` |
| 8 | RA | Supervise carte agents | Positions temps réel | RA voit toute l'agence | Dashboard terrain agence |
| 9 | Système / IA | Génère rapport de fin de journée | Synthèse visites, écarts objectifs | Envoyé 18h00 à l'agent et RA | Rapport IA |

**Mode offline — processus parallèle**

| Étape | Condition | Action frontend | Action à la reconnexion |
|-------|-----------|-----------------|-------------------------|
| O1 | Pas de réseau | Saisie visite/collecte → IndexedDB | Queue locale avec `client_uuid` |
| O2 | Réseau retrouvé | Détection auto connectivité | `POST /visites/batch` |
| O3 | Backend | Vérifie idempotence + géofencing | Accepte ou rejette avec motif |
| O4 | Frontend | Affiche résultat sync | Succès / erreurs par visite |

#### Processus IA — M4 Terrain

| Élément | Détail |
|---------|--------|
| **Optimisation tournées** | 🟢 Entrées : positions clients, créneaux, durée visite moyenne, priorités · Sortie : ordre de visite optimal (TSP + contraintes métier) |
| **Alerte proximité** | 🟠 Si agent à < 200 m d'un client en retard → notification « Client X : 45 000 FCFA impayés » |
| **Voice-to-CRM** | 🔵 Audio → transcription → extraction entités (montant, promesse, date) → pré-remplissage formulaire |
| **Rapport soir** | 🟢 Cron 18h : synthèse « 12 visites, 8 réussies, 3 collectes (125 000 FCFA), 2 clients non trouvés » + coaching si objectif non atteint |
| **Zone map IA** | 🔵 Identifie zones sous-couvertes (peu de visites / km²) pour RA |
| **Validation humaine** | Agent valide toujours le formulaire avant envoi ; IA ne crée pas de visite seule |

#### Frontend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Routes** | `/terrain`, `/terrain/offline`, `/terrain-with-api` |
| **Carte** | `AgentMissionsPanel` — positions agents + clients (Leaflet) |
| **Missions** | Liste journalière ordonnée par priorité IA |
| **Formulaire visite** | Champs guidés, photo (capture caméra), GPS auto |
| **Offline** | Page `/terrain/offline` — queue locale, indicateur sync |
| **Alerte proximité** | `ProximityAlert` — client en retard à < X mètres |
| **Voice-to-CRM** | Saisie vocale → texte structuré (Web Speech API ou service IA) |
| **Historique** | Journal visites par agent et par client |
| **Zones RA** | Carte zones-agents pour supervision (`/zones`) |

#### Backend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Zone agent** | `GET /zones/me`, `PUT /zones/agents/:id` (assignation polygone) |
| **Visites** | `GET /visites`, `POST /visites` (multipart : photo + métadonnées GPS) |
| **Validation visite** | Vérification géofencing : distance agent ↔ client < seuil configurable |
| **Missions** | `GET /missions/jour` — liste priorisée (retards, échéances J-3, prospects) |
| **Optimisation IA** | Service calcule ordre de visite (TSP simplifié + priorités métier) |
| **Sync offline** | `POST /visites/batch` — accepte lot de visites avec `client_created_at` local |
| **Dashboard terrain** | `GET /dashboard/terrain` — KPIs agent connecté |
| **Rapport soir** | Job ou endpoint `GET /agents/me/rapport-jour` — synthèse IA |

#### Flux frontend ↔ backend

```
Matin : GET /zones/me + GET /missions/jour
      → Carte + liste missions ordonnées
Visite : formulaire + photo + GPS
      → POST /visites (FormData) si online
      → sinon stockage IndexedDB
Reconnecté : POST /visites/batch [{ … }, { … }]
RA : GET /zones/agents?agenceId= → carte temps réel
```

#### Dépendances

- M2 (clients visités), M3 (demandes crédit terrain), M5 (relances déclenchées par visite), M6 (collecte)

---

### M5 — Relances Intelligentes

#### Définition

**Surveillance des échéances** et **déclenchement automatique** de relances multi-canal (WhatsApp, SMS, visite terrain, escalade hiérarchique).

#### Processus métier détaillé

**Objectif** : Anticiper les impayés et déclencher des relances au bon moment, sur le bon canal, avec escalade progressive.

**Acteurs** : Système (jobs), GP, Agent terrain, RA, ROC (escalade).

**Déclencheur** : Échéance approchant ou dépassée ; promesse de paiement non honorée.

| Phase | Délai | Événement | Action système | Canal | Responsable suivi |
|-------|-------|-----------|----------------|-------|-------------------|
| **Préventif** | J-3 | Échéance dans 3 jours | Crée relance `PREVENTIVE` | WhatsApp + lien MoMo | GP (monitoring) |
| **Courtois** | J+1 à J+3 | 1er retard | Crée relance `RAPPEL` | WhatsApp puis SMS si pas de réponse 24h | GP |
| **Ferme** | J+7 | Retard persistant | Crée relance `FERME` + mission terrain | Visite prioritaire agent | Agent + GP |
| **Escalade** | J+7 + score risque élevé | Retard + score client < 50 | Alerte ROC + superviseur | Alerte in-app + email | ROC |
| **Promesse** | Date promesse dépassée | Promesse non honorée | Re-relance `PROMESSE_NON_HONOREE` | Multi-canal | GP → ROC si J+3 |

**Processus manuel GP (complémentaire)**

| Étape | Acteur | Action | API |
|-------|--------|--------|-----|
| 1 | GP | Consulte liste relances priorisées | `GET /relances?gp_id=me` |
| 2 | GP | Envoie relance immédiate | `POST /relances/:id/envoyer` |
| 3 | GP | Enregistre promesse de paiement | `POST /promesses-paiement` |
| 4 | Client | Paie via MoMo (lien dans message) | Transaction M6 → rapprochement échéance |
| 5 | Système | Clôture relances ouvertes du dossier | Event `echeance.payee` |

#### Processus IA — M5 Relances

| Élément | Détail |
|---------|--------|
| **Priorisation** | 🟢 Score = f(probabilité paiement, montant dû, ancienneté retard, historique réponses) — ordre de traitement GP |
| **Choix canal** | 🟢 Si client répond souvent WhatsApp → WhatsApp ; sinon SMS ; si 3 échecs → visite terrain |
| **Rédaction message** | 🟢 Template IA personnalisé : « Bonjour {nom}, votre échéance de {montant} FCFA du {date} est {statut}. Payez ici : {lien_momo} » |
| **Déclenchement auto** | 🟢 Job cron 06h00 et 14h00 scanne échéances et crée relances selon matrice ci-dessus |
| **Score relance** | Probabilité de succès par canal (historique client) |
| **Validation humaine** | GP peut modifier message ou annuler relance avant envoi ; envoi auto seulement si règle activée par paramétrage IMF |
| **Exemple** | Mme Afi : 2 retards passés réglés après WhatsApp → IA choisit WhatsApp J-3 → taux réponse historique 78 % |

#### Frontend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Routes** | `/relances`, `/calendrier` |
| **Liste relances** | Statut (en attente, envoyée, répondue, escaladée), priorité IA, canal |
| **Actions manuelles** | Relancer maintenant, changer canal, marquer promesse de paiement |
| **Calendrier CC** | Comités crédit planifiés |
| **Calendrier recouvrement** | Actions programmées par agence |
| **Badge menu** | Compteur relances urgentes (`useAlertes`) |
| **Historique** | Fil relances par client avec résultat (payé / ignoré / promesse) |

#### Backend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Job planifié** | Cron scan échéances → crée entrées `relances` selon règles |
| **Endpoints** | `GET /relances`, `POST /relances/:id/envoyer`, `PATCH /relances/:id/statut` |
| **Hub opérations** | `GET /operations/relances?agence_id=` — agrégats pour dashboard |
| **Priorisation IA** | Score probabilité paiement par client × montant × ancienneté retard |
| **Choix canal IA** | Historique réponses client → WhatsApp préféré si taux réponse élevé |
| **Messages** | Templates pré-rédigés IA, personnalisés (nom, montant, lien MoMo) |
| **WhatsApp** | `POST /integrations/whatsapp/send` — envoi via API Business |
| **Escalade** | Création automatique `action_recouvrement` + notification superviseur |
| **Promesses** | `POST /promesses-paiement` — suivi et re-déclenchement si non honorée |

#### Flux frontend ↔ backend

```
Job backend (nuit) → scan échéances J-3, J+1, J+7
                 → crée relances priorisées
GP ouvre /relances → GET /relances?gp_id=me
                 → tri par score priorité
Clic "Envoyer" → POST /relances/:id/envoyer
              → backend appelle WhatsApp API
              → PATCH statut ENVOYEE
Paiement reçu → event échéance payée → clôture relances ouvertes
```

#### Dépendances

- M3 (échéancier), M4 (missions terrain J+7), M6 (lien paiement MoMo), M7 (escalade recouvrement)

---

### M6 — Caisse & Mobile Money

#### Définition

**Centralisation des flux financiers journaliers** : guichet caisse, validation Mobile Money, réconciliation, vue trésorerie consolidée.

#### Processus métier détaillé

**Objectif** : Enregistrer, valider et réconcilier tous les flux financiers journaliers de l'IMF.

**Acteurs** : Agent terrain, Collectrice, Comptable, RA, DAF (consolidation).

| Canal | Processus détaillé |
|-------|-------------------|
| **TONTINE (collecte terrain)** | Agent saisit dépôt → `POST /transactions` type `TONTINE` → statut `VALIDE` immédiat → solde client crédité → écriture comptable auto |
| **AGENCE (guichet)** | Comptable saisit dépôt/retrait espèces → type `AGENCE` → `VALIDE` immédiat → registre caisse mis à jour |
| **MOBILE (Flooz/Mixx)** | Agent/client initie paiement → type `MOBILE`, statut `EN_ATTENTE` → comptable vérifie référence opérateur → `valider` ou `rejeter` → si validé : solde crédité + rapprochement échéance |

**Processus validation MoMo (détaillé)**

| Étape | Acteur | Action | Règle |
|-------|--------|--------|-------|
| 1 | Agent | Crée transaction MoMo | `operateur_mobile: FLOOZ_MIXX` obligatoire (v1 Togo) |
| 2 | Backend | Enregistre `EN_ATTENTE` | Solde client **non** modifié |
| 3 | Comptable | Consulte file d'attente | `GET /transactions?type=MOBILE&statut=EN_ATTENTE` |
| 4 | Comptable | Vérifie sur console Flooz | Montant, numéro, référence correspondent |
| 5 | Comptable | Valide ou rejette | Motif obligatoire si rejet |
| 6 | Backend | Si validé : crédite solde | Rapproche échéance si `dossier_id` lié |
| 7 | Système | Génère écriture SYSCOHADA | Alimente M8 |

#### Processus IA — M6 Caisse & Mobile Money

| Élément | Détail |
|---------|--------|
| **Détection doublons** | 🟠 Même client + même montant + fenêtre 5 min → alerte « Doublon suspect » — bloque validation auto |
| **Réconciliation IA** | 🟢 Rapprochement auto transaction ↔ échéance si montant exact ou écart < 1 % |
| **Fraude espèces** | 🟠 Écart collecte terrain déclarée vs transactions validées > seuil → alerte auditeur |
| **Prévision cash 7j** | 🔵 DAF Copilot : projection sorties (décaissements prévus + charges) |
| **Validation humaine** | MoMo **toujours** validé par comptable ; IA assiste la détection, ne valide pas seule |

#### Frontend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Routes** | `/caisse`, `/operations-bancaires`, `/caisse-with-api` |
| **Guichet** | `CaisseGuichetPanel` — saisie dépôt/retrait espèces |
| **Validation MoMo** | `MomoValidationPanel` — file d'attente `EN_ATTENTE` |
| **Actions** | Valider / Rejeter avec motif |
| **Stats jour** | Widgets montants validés, en attente, rejetés |
| **Vue DG** | Consolidation multi-agences |
| **Registre** | Historique filtrable par type, statut, agent |
| **Core banking** | `CoreBankingView` — opérations bancaires complémentaires |

#### Backend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Création** | `POST /transactions` — body selon canal (cf. API Phases A–D §3) |
| **Validation MoMo** | `PATCH /transactions/:id/valider` — crédite solde client |
| **Rejet** | `PATCH /transactions/:id/rejeter` — motif obligatoire |
| **Stats** | `GET /transactions/stats/momo`, `GET /transactions/stats/caisse` |
| **Liste** | `GET /transactions?type=&statut=&agence_id=` |
| **Réconciliation** | Job rapproche transaction ↔ échéance crédit si `dossier_id` lié |
| **Détection doublons IA** | Même montant + même client + fenêtre 5 min → alerte |
| **Opérateur v1 Togo** | `operateur_mobile: "FLOOZ_MIXX"` uniquement (autres → 400) |
| **Trésorerie** | Agrégat soldes caisse par agence — alimente M8 |

#### Flux frontend ↔ backend (validation MoMo)

```
Agent terrain → POST /transactions { type: MOBILE, montant, operateur_mobile, … }
             → statut EN_ATTENTE (solde client non crédité)
Comptable → GET /transactions/stats/momo
         → GET /transactions?type=MOBILE&statut=EN_ATTENTE
         → vérifie référence Flooz
         → PATCH /transactions/:id/valider
Backend → statut VALIDE → crédite solde → rapproche échéance si liée
```

#### Dépendances

- M3 (paiement échéances), M4 (collecte terrain), M8 (écritures comptables auto)

---

## 6. Bundle Risque & Conformité

> Maîtriser le recouvrement, piloter la finance et garantir la conformité BCEAO.

---

### M7 — Recouvrement

#### Définition

**Vision consolidée des créances en retard** à l'échelle du réseau, priorisation IA, gestion des équipes ROC, dossiers bloqués et mauvais payeurs.

#### Processus métier détaillé

**Objectif** : Récupérer les créances en retard de manière structurée, priorisée et tracée à l'échelle du réseau.

**Acteurs** : ROC, Agents recouvrement, GP, RA, Auditeur (dossiers bloqués).

| Étape | Acteur | Action | Règle métier |
|-------|--------|--------|--------------|
| 1 | Système | Identifie dossiers en retard | Échéance impayée > 0 après J+7 |
| 2 | Système / IA | Calcule score recouvrement par dossier | Probabilité récupération 0–100 |
| 3 | ROC | Consulte vue réseau | Tri par PAR agence décroissant |
| 4 | ROC | Drill-down agence → agent → client → dossier | Habilitation ROC = réseau entier |
| 5 | ROC | Définit stratégie agence | Plan d'action IA modifiable |
| 6 | Agent recouvrement | Exécute action (appel, visite, plan paiement) | `POST /recouvrement/actions` |
| 7 | GP | Suit dossiers de son portefeuille | Actions coordonnées avec relances M5 |
| 8 | ROC | Bloque dossier contentieux | Statut `BLOQUE` — transition manuelle uniquement |
| 9 | ROC | Débloque ou transfère contentieux | Motif + traçabilité obligatoires |

**Fiche mauvais payeur — contenu attendu**

| Bloc | Données affichées |
|------|-------------------|
| Identité | Client, agence, GP, agent terrain |
| Situation | Montant impayé, ancienneté retard, nb échéances impayées |
| Historique | Paiements passés, retards antérieurs, promesses non honorées |
| Actions | Fil chronologique : relances, visites, appels |
| BlocAnalyse IA | Narrative comportementale + recommandation stratégie |
| Score | Probabilité récupération + facteurs explicatifs |

#### Processus IA — M7 Recouvrement

| Élément | Détail |
|---------|--------|
| **Score recouvrement** | 🔵 Entrées : ancienneté retard, montant, historique paiements, garanties, visites récentes · Sortie : score 0–100 + facteurs |
| **Stratégie agence** | 🔵 Agrège scores par agence → propose plan : « Prioriser 15 dossiers > 100 000 FCFA, envoyer 2 agents zone Vogan » |
| **BlocAnalyse** | 🔵 Narrative : « Client habituellement bon payeur, retard atypique depuis 45 jours, corrélé à baisse activité commerce (visite 12/05). Recommandation : plan étalement 3 mois. » |
| **Scripts relance** | 🔵 Suggestions messages selon profil (premier retard vs récidive) |
| **Priorisation réseau** | 🟠 Alerte ROC si concentration retard sur 1 agent ou 1 zone |
| **Validation humaine** | ROC et agents valident chaque action ; IA ne passe pas en contentieux seule |

#### Frontend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Routes** | `/credit/recouvrement`, `/credit/reseau`, `/credit/recouvrement/agents/[id]`, `/credit/recouvrement/clients/[id]`, `/credit/recouvrement/dossiers-bloques`, `/credit/recouvrement/mauvais-payeurs` |
| **Vue réseau ROC** | `RecouvrementReseauView` — carte + tableaux par agence |
| **Fiche agent** | Performance recouvrement, dossiers assignés |
| **Fiche client** | Historique retards, échanges, plan d'action |
| **Dossiers bloqués** | Liste + actions (débloquer, transférer contentieux) |
| **Mauvais payeurs** | Fiche enrichie `mauvais-payeur-fiche.ts` — statuts, BlocAnalyse IA |
| **Calendrier** | Actions recouvrement programmées |
| **Score affiché** | Probabilité récupération 0–100 par dossier |

#### Backend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Vue réseau** | `GET /recouvrement/reseau`, `…/agences/:id`, `…/agents/:id`, `…/clients/:id`, `…/dossiers/:id` |
| **Agrégats** | PAR par agence, montant impayé, taux recouvrement, dossiers bloqués count |
| **Score IA** | `GET /dossiers-credit/:id/score-recouvrement` — facteurs : ancienneté, historique, garanties |
| **Stratégie agence** | `GET /recouvrement/agences/:id/strategie` — plan IA personnalisé |
| **Actions** | `POST /recouvrement/actions` — visite, appel, promesse, contentieux |
| **Dossiers bloqués** | Statut `BLOQUE` — transition manuelle ROC uniquement |
| **BlocAnalyse** | Service IA génère narrative comportementale à partir historique paiements |
| **Équipes** | Assignation dossiers aux agents recouvrement par zone |

#### Flux frontend ↔ backend

```
ROC → GET /recouvrement/reseau
    → tri agences par PAR décroissant
    → clic agence → GET /recouvrement/reseau/agences/:id
    → clic dossier → GET /recouvrement/reseau/dossiers/:id
    → affiche BlocAnalyse IA + historique actions
Agent → POST /recouvrement/actions { type: VISITE, notes, promesse_montant }
     → backend met à jour plan recouvrement
```

#### Dépendances

- M3 (dossiers, échéancier), M5 (relances amont), M8 (provisions, EL)

---

### M8 — Finance & Comptabilité

#### Définition

**Pilotage financier de l'IMF** : comptabilité SYSCOHADA, rapprochements, provisions BCEAO, trésorerie multi-agences, Expected Loss.

#### Processus métier détaillé

**Objectif** : Assurer la tenue comptable SYSCOHADA, le pilotage de trésorerie et le calcul des provisions réglementaires.

| Étape | Acteur | Déclencheur | Action | Résultat |
|-------|--------|-------------|--------|----------|
| 1 | Système | Transaction M6 validée | Génère écriture comptable auto | Journal alimenté |
| 2 | Comptable | Opération manuelle | Saisie écriture | Écriture `VALIDEE` |
| 3 | DAF | Quotidien | Consulte dashboard trésorerie | Vue 7 agences |
| 4 | Comptable | Hebdomadaire | Rapprochement bancaire / MoMo | Flux externes ↔ écritures |
| 5 | Système | Mensuel (1er du mois) | Calcul provisions BCEAO | Par classe risque × encours |
| 6 | DAF | Mensuel | Calcul Expected Loss portefeuille | PD × LGD × EAD |
| 7 | DAF | Fin de mois | Clôture comptable | Vérifie suspens = 0, exporte |
| 8 | DAF | Trimestriel | Contrôle de gestion | Écarts budget signalés |

**Provisions BCEAO — règle de calcul**

| Classe risque | Taux provision (indicatif) | Source encours |
|---------------|---------------------------|----------------|
| Classe 0 (sain) | 1 % | Portefeuille à jour |
| Classe 1 (30j) | 10 % | Retard 1–30 jours |
| Classe 2 (90j) | 25 % | Retard 31–90 jours |
| Classe 3 (180j+) | 100 % | Retard > 90 jours ou contentieux |

#### Processus IA — M8 Finance

| Élément | Détail |
|---------|--------|
| **DAF Copilot** | 🔵 Questions : trésorerie, provisions, cash 7j, rentabilité agence — réponses depuis agrégats réels |
| **Prévision cash 7j** | 🟢 Identifie pic de sortie (décaissements prévus + charges récurrentes) |
| **Analyse provisions** | 🟢 Calcule écart provisions comptabilisées vs exigence BCEAO |
| **Expected Loss** | 🟢 Agrège PD dossiers actifs × exposition |
| **Alertes budget** | 🟠 Dépassement poste budget > 10 % → notification DAF |
| **Validation humaine** | Écritures et clôtures validées par DAF/comptable ; IA ne comptabilise pas seule |

#### Frontend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Routes** | `/finance`, `/comptabilite` |
| **Dashboard DAF** | Trésorerie 7 agences, provisions, EL, rentabilité par agence |
| **Journal comptable** | Liste écritures, filtres date/compte |
| **Rapprochements** | Interface rapprochement bancaire / MoMo |
| **Suspens** | Comptes en attente d'imputation |
| **Budget** | Contrôle de gestion — écarts vs budget |
| **DAF Copilot** | Questions trésorerie, provisions, cash 7j |
| **Exports** | Export écritures SYSCOHADA (CSV/Excel) |

#### Backend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Écritures auto** | Event sur `transaction VALIDE` → génère écriture débit/crédit |
| **Plan comptable** | Référentiel SYSCOHADA paramétrable par IMF |
| **Provisions BCEAO** | Job mensuel : classe risque × encours × taux provision |
| **Expected Loss** | `GET /finance/expected-loss` — PD × LGD × EAD par segment |
| **Trésorerie** | `GET /finance/tresorerie?agence_id=` — soldes caisse + banque |
| **Rapprochement** | `POST /comptabilite/rapprochements` — lier flux externe ↔ écriture |
| **Ratios** | Calcul automatique ratios BCEAO (alimente M9) |
| **DAF Copilot** | `POST /ia/copilot` avec contexte finance |

#### Flux frontend ↔ backend

```
Transaction validée (M6) → event backend
                        → écriture comptable auto
DAF → GET /finance/dashboard
    → affiche trésorerie, provisions, EL
    → GET /comptabilite/ecritures?mois=2026-06
Clôture → POST /comptabilite/cloture-mois
       → vérifie suspens = 0
       → génère export
```

#### Dépendances

- M6 (transactions source), M3 (encours crédit), M9 (ratios conformité)

---

### M9 — Conformité & Audit

#### Définition

**Surveillance réglementaire BCEAO/UEMOA** et **audit interne** : ratios, rapports officiels, traçabilité, détection d'anomalies.

#### Processus métier détaillé

**Objectif** : Garantir le respect des normes BCEAO/UEMOA et permettre les audits internes/externes.

| Étape | Acteur | Fréquence | Action |
|-------|--------|-----------|--------|
| 1 | Système | Continu | Calcule ratios réglementaires (PAR, solvabilité, liquidité…) |
| 2 | Système | Quotidien | Met à jour score conformité 0–100 |
| 3 | Système | Si écart | Crée alerte avec sévérité et délai action |
| 4 | DG / DAF | Mensuel | Consulte tableau conformité |
| 5 | Auditeur | À la demande | Export rapport BCEAO PDF/HTML |
| 6 | Auditeur | Continu | Consulte 6 sous-modules audit |
| 7 | Système | Continu | Journalise toute action utilisateur |

**6 sous-modules audit**

| Sous-module | Périmètre contrôlé | Contrôles typiques |
|-------------|---------------------|-------------------|
| Audit agences | Opérations par agence | Écarts caisse, dossiers sans instruction |
| Audit caisse | Flux caisse / MoMo | Transactions non rapprochées |
| Audit crédit | Portefeuille prêts | Dossiers sans visite, dépassement plafonds |
| Conformité BCEAO | Ratios réglementaires | PAR > seuil, provisions insuffisantes |
| Traçabilité | Logs utilisateurs | Actions suspectes, modifications hors heures |
| Anomalies | Détection croisée | Règles métier + IA |

#### Processus IA — M9 Conformité & Audit

| Élément | Détail |
|---------|--------|
| **Score conformité** | 🟢 Pondération ratios : PAR (30 %), provisions (25 %), liquidité (20 %), documentation (15 %), traçabilité (10 %) |
| **Alertes réglementaires** | 🟠 Ex : PAR réseau > 12 % → alerte critique, délai action 15 jours |
| **Génération rapport BCEAO** | 🟢 Compile ratios, graphiques, commentaires IA, export PDF |
| **Détection anomalies** | 🟠 Croise : visites manquantes + décaissement récent ; caisse ≠ écritures ; agent avec collecte anormale |
| **Traçabilité IA** | 🔵 Corrèle événements suspects (ex. même user valide MoMo + modifie échéance même client) |
| **Validation humaine** | Rapport soumis à validation DG avant transmission BCEAO |

#### Frontend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Routes** | `/conformite`, `/audit`, `/audit/agences`, `/audit/caisse`, `/audit/credit`, `/audit/bceao`, `/audit/tracabilite`, `/audit/anomalies` |
| **Conformité** | Tableau ratios, jauge score 0–100, tendances |
| **Export** | Bouton export PDF et HTML rapport BCEAO |
| **Audit agences** | Contrôle opérations par agence |
| **Audit caisse** | Vérification cohérence caisse ↔ écritures |
| **Audit crédit** | Contrôle portefeuille, classes BCEAO |
| **Traçabilité** | Journal actions utilisateurs filtrable |
| **Anomalies** | Liste irrégularités détectées (IA + règles) |

#### Backend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Ratios** | `GET /conformite/ratios` — PAR, taux couverture, etc. |
| **Score** | `GET /conformite/score` — calcul pondéré des ratios |
| **Rapport BCEAO** | `GET /conformite/rapport-bceao` — génération PDF serveur ou payload pour frontend jsPDF |
| **Classes BCEAO** | Répartition portefeuille par classe risque (0, 30, 90, 180 jours…) |
| **Audit logs** | `GET /audit/tracabilite` — table `audit_logs` (user, action, entity, timestamp) |
| **Anomalies IA** | Job détection : écarts caisse, dossiers sans visite, PAR anormal |
| **Alertes** | `GET /conformite/alertes` — non-conformités avec sévérité |

#### Flux frontend ↔ backend

```
DG/Auditeur → GET /conformite/ratios + GET /conformite/score
            → affiche jauge + tableau ratios
            → si score < seuil → GET /conformite/alertes
Export → GET /conformite/rapport-bceao?format=pdf
      → téléchargement ou génération jsPDF côté front
Auditeur → GET /audit/tracabilite?user_id=&date_debut=
        → analyse corrélation événements suspects (IA)
```

#### Dépendances

- M3 (portefeuille crédit), M6 (caisse), M8 (provisions, écritures)

---

## 7. Bundle Croissance & Opérations

> Développer le portefeuille clients, gérer l'épargne, piloter les équipes et paramétrer les produits.

---

### M10 — Marketing & Acquisition

#### Définition

**Captation et qualification des prospects** : leads, campagnes ciblées, chatbot WhatsApp, gamification commerciale.

#### Processus métier détaillé

| Étape | Acteur | Action | Résultat |
|-------|--------|--------|----------|
| 1 | Prospect | Contacte via WhatsApp / terrain / campagne | Lead créé |
| 2 | Système / Chatbot IA | Qualifie le lead (activité, besoin, zone) | Score prospect 0–100 |
| 3 | Commercial | Consulte leads priorisés | Contacte score > 70 en priorité |
| 4 | Commercial | Visite / RDV prospect | Lead → `QUALIFIE` |
| 5 | Commercial / Agent | Convertit en client | Lead → `CONVERTI` → fiche M2 |
| 6 | Responsable marketing | Lance campagne ciblée | Segment → envoi WhatsApp batch |
| 7 | Système | Mesure conversion | KPIs campagne mis à jour |

#### Processus IA — M10 Marketing

| Élément | Détail |
|---------|--------|
| **Chatbot WhatsApp** | 🟢 Qualifie automatiquement : nom, activité, montant souhaité → crée lead |
| **Scoring prospects** | 🟢 Score basé sur : zone couverte, secteur porteur, réponse rapidité |
| **Segmentation** | 🔵 Clustering comportemental clients existants → cibles campagnes |
| **Campagnes** | 🔵 Recommandation timing + message optimal par segment |
| **Gamification** | 🟢 Classements agents basés sur KPIs réels (conversion, volume) |

#### Frontend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Route** | `/marketing` |
| **Dashboard** | Leads entrants, taux conversion, campagnes actives |
| **Leads** | Pipeline prospect → client actif |
| **Campagnes** | Création, ciblage segment, suivi résultats |
| **Chatbot WhatsApp** | Interface config + monitoring conversations |
| **Gamification** | Défis commerciaux, classements |
| **Segmentation** | Clusters comportementaux visualisés |

#### Backend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Leads** | `GET/POST /marketing/leads`, `PATCH /marketing/leads/:id/qualifier` |
| **Scoring prospects** | Service IA score 0–100 à la création lead |
| **Campagnes** | `POST /marketing/campagnes` — cible segment, déclenche envois WhatsApp |
| **Chatbot** | Webhook WhatsApp → `POST /integrations/whatsapp/inbound` → qualification IA |
| **Conversion** | Event `lead → client` met à jour métriques campagne |
| **Segments** | Job clustering comportemental sur base clients |

#### Flux frontend ↔ backend

```
Lead WhatsApp entrant → webhook backend → création lead + scoring IA
Commercial → GET /marketing/leads?score_min=70
          → contacte prioritaires
Campagne → POST /marketing/campagnes { segment, message, canal }
        → job envoi WhatsApp batch
        → suivi taux ouverture / conversion
```

---

### M11 — Épargne

#### Définition

**Gestion des comptes épargne** : produits, encours, détection comptes dormants, vue consolidée DG.

#### Processus métier détaillé

| Étape | Acteur | Action | Résultat |
|-------|--------|--------|----------|
| 1 | Commercial / Agent | Ouvre compte épargne | Compte lié au client M2 |
| 2 | Client / Agent | Effectue dépôt | Transaction M6 → mouvement épargne |
| 3 | Client | Retrait (si produit le permet) | Transaction + mise à jour solde |
| 4 | Système | Surveille inactivité | Alerte si aucun mouvement > N mois |
| 5 | GP / Commercial | Relance compte dormant | Campagne réactivation |
| 6 | DG | Consulte encours réseau | Vue consolidée par produit |

#### Processus IA — M11 Épargne

| Élément | Détail |
|---------|--------|
| **Comptes dormants** | 🟠 Détection auto inactivité > 6 mois → alerte GP + recommandation produit réactivation |
| **Recommandation produit** | 🔵 Selon profil client : « Client collectrice active → proposer DAT 12 mois » |
| **Scoring fidélité épargne** | 🔵 Mesure régularité dépôts → input marketing M10 |

#### Frontend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Routes** | `/epargne`, `/epargne/[id]` |
| **Liste comptes** | Filtres produit, statut, agence |
| **Détail compte** | Historique mouvements, solde, client lié |
| **Produits épargne** | Catalogue (DAT, compte à vue, tontine…) |
| **Vue DG** | Encours total réseau, répartition par produit |
| **Dormants** | Liste comptes inactifs > seuil — alerte IA |

#### Backend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Comptes** | `GET/POST /epargne/comptes`, `GET /epargne/comptes/:id` |
| **Mouvements** | `POST /epargne/comptes/:id/mouvements` — lié aux transactions M6 |
| **Produits** | `GET /produits?type=EPARGNE` |
| **Dormants** | Job détecte inactivité > N mois → crée alerte + recommandation produit |
| **Agrégats DG** | `GET /epargne/stats/reseau` |

---

### M12 — Équipes & Réseau d'Agences

#### Définition

**Pilotage des performances** : KPIs agents, zones géographiques, benchmarking inter-agences, coaching IA.

#### Processus métier détaillé

| Étape | Acteur | Action | Résultat |
|-------|--------|--------|----------|
| 1 | Admin / RA | Crée agence et affecte agents | Structure réseau à jour |
| 2 | RA | Définit zones terrain (polygones GPS) | `PUT /zones/agents/:id` |
| 3 | RA / RCC | Fixe objectifs mensuels agents | Visites, collecte, nouveaux clients |
| 4 | Système | Agrège KPIs réels | `GET /kpis/agents` |
| 5 | RA | Compare performance vs objectifs | Performance gap affiché |
| 6 | RA | Coache agents sous-performants | Actions correctives |
| 7 | DG | Benchmarking inter-agences | Meilleures pratiques identifiées |

#### Processus IA — M12 Équipes

| Élément | Détail |
|---------|--------|
| **Performance gap** | 🟠 Écart objectif vs réalisé visualisé par agent |
| **Benchmarking** | 🔵 Compare agences similaires : « Lomé Centre vs Adidogomé : +23 % visites, -8 % PAR » |
| **Coaching IA** | 🔵 « Agent Kossi : 40 % sous objectif visites — recommander tournée zone Bè, mentorat avec agent Mensah » |
| **Prévision PAR zone** | 🟠 Zones à risque signalées avant dégradation réseau |
| **Carte zones** | 🔵 Identifie zones sous-couvertes (peu d'agents / km²) |

#### Frontend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Routes** | `/equipe`, `/agences`, `/zones` |
| **Liste équipe** | KPIs par agent : visites, collecte, PAR portefeuille |
| **Fiche agent** | `/dashboard/agents/[id]` — historique performance |
| **Zones** | Carte découpage zones ↔ agents assignés |
| **Benchmarking** | Comparaison inter-agences, inter-agents |
| **Performance gap** | Écart vs objectif visualisé |
| **Coaching IA** | Recommandations actions correctives |

#### Backend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **KPIs agents** | `GET /kpis/agents`, `GET /kpis/agents/:id` |
| **Objectifs** | `GET/PUT /objectifs/agents/:id` — objectifs mensuels visites/CA |
| **Agences** | `GET/POST /agences`, `GET /agences/:id/objectifs` |
| **Zones** | `GET /zones/agents`, `PUT /zones/agents/:id` |
| **Benchmarking IA** | Service compare agences similaires → identifie écarts |
| **Coaching** | `GET /kpis/agents/:id/coaching` — suggestions IA |

---

### M13 — Produits Financiers

#### Définition

**Catalogue et paramétrage** des produits crédit et épargne, simulation échéancier, conditions finales adaptées au score.

#### Processus métier détaillé

| Étape | Acteur | Action | Résultat |
|-------|--------|--------|----------|
| 1 | Admin / DAF | Crée produit crédit ou épargne | Taux, durée, montants min/max, garanties requises |
| 2 | Agent / CC | Sélectionne produit à la demande | Produit lié au dossier M3 |
| 3 | CC | Simule échéancier | Tableau mensualités prévisionnel |
| 4 | Système / IA | Ajuste conditions selon score | Taux majoré si score < seuil |
| 5 | Comité | Valide conditions finales | Objet `conditions_finales` sur dossier |
| 6 | Frontend | Affiche bannière conditions | Montant, taux, durée, GP assigné |

#### Processus IA — M13 Produits

| Élément | Détail |
|---------|--------|
| **Recommandation produit** | 🔵 Selon profil emprunteur : activité, montant demandé, historique → « Produit Micro-Entrepreneur 12 mois recommandé » |
| **Simulation échéancier** | 🟢 Calcul amortissement : mensualité, total intérêts, TAEG |
| **Ajustement risque** | 🟢 Score < 60 → taux +2 pts ou durée max réduite (paramétrable par IMF) |
| **Validation humaine** | Comité valide conditions finales ; IA ne modifie pas seule le taux approuvé |

#### Frontend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **Routes** | `/produits`, `/credit/cycle` |
| **Catalogue** | Liste produits crédit/épargne — taux, durée, montants min/max |
| **Configuration** | Formulaire création/modification produit (admin) |
| **Échéancier builder** | Simulation interactif : montant × durée × taux → tableau échéances |
| **Conditions finales** | Bannière post-comité : montant, taux, durée validés |
| **Recommandation IA** | Suggestion produit selon profil emprunteur à la demande |

#### Backend — comportement attendu

| Élément | Spécification |
|---------|---------------|
| **CRUD produits** | `GET/POST/PATCH /produits` |
| **Simulation** | `POST /produits/:id/simuler` — calcule échéancier sans persister |
| **Conditions finales** | Objet `conditions_finales` retourné par `comite-credit` |
| **Ajustement score** | Taux majoré si score IA < seuil — règle paramétrable |
| **Hub cycle** | `GET /operations/credit-cycle` — vue agrégée cycle de vie prêts |

#### Flux frontend ↔ backend

```
CC crée demande → sélectionne produit → POST /produits/:id/simuler
                 → affiche échéancier prévisionnel
Comité valide → conditions_finales dans réponse comite-credit
             → frontend affiche bannière conditions sur fiche dossier
```

---

## 8. Fonctionnalités transverses

### 8.1 Authentification et sessions

| Couche | Comportement |
|--------|-------------|
| **Frontend** | Pages `/login`, `/mot-de-passe-oublie` ; stockage token ; middleware protection routes dashboard |
| **Backend** | `POST /auth/login` (email ou téléphone), `GET /auth/me`, `POST /auth/logout` ; JWT 15 min + refresh ; blacklist Redis |
| **Règle** | Toute route métier exige `Authorization: Bearer <token>` ; 401 → redirection login frontend |

### 8.2 Copilot IA — processus transverse détaillé

Le Copilot est l'**interface unifiée** vers tous les moteurs IA. Il est accessible depuis n'importe quelle page dashboard.

#### Processus d'une requête Copilot

| Étape | Composant | Action |
|-------|-----------|--------|
| 1 | Frontend | Utilisateur ouvre tiroir ou clique suggestion |
| 2 | Frontend | Construit payload : `{ question, role, pageContext, entityIds }` |
| 3 | Backend / Moteur | Détecte **intent** (priorités, PAR, client, dossier, trésorerie…) |
| 4 | Moteur | Résout entités mentionnées (nom client, agence, agent) |
| 5 | Moteur | Interroge APIs agrégats selon intent |
| 6 | Moteur | Génère réponse markdown + actions suggérées |
| 7 | Frontend | Affiche réponse + boutons action (« Voir dossier », « Ouvrir agence ») |

#### Intents Copilot par rôle

| Rôle | Suggestions pré-configurées | Intents supportés |
|------|----------------------------|-------------------|
| DG | Priorités jour, PAR réseau, agences alerte, trésorerie | `priorites_jour`, `par_evolution_reseau`, `agences_alerte`, `tresorerie` |
| RA | KPI agence, équipe, PAR payeurs | `objectifs`, `agent_commercial`, `ra_par_payeurs` |
| GP | Client prioritaire, retards, renouvellement | `client`, `retard_raison`, `par_collecte` |
| CC | Dossiers à instruire, analyse risque | `dossier`, `synthese_role` |
| DAF | Trésorerie, provisions, BCEAO, cash 7j | `daf_treso`, `daf_provisions`, `daf_bceao`, `daf_cash_7j` |
| ROC | Recouvrement réseau, dossiers bloqués | `dossier`, `par_evolution_reseau` |

#### Règles Copilot

- Ne jamais exécuter d'action destructive (validation comité, décaissement) — propose uniquement des liens
- Citer les chiffres avec source (date de calcul, périmètre)
- Si données insuffisantes → réponse explicite « Données non disponibles pour {entité} »
- Mode actuel : moteur mock frontend (`copilot-engine.ts`) — cible production : `POST /ia/copilot` backend LLM

| Couche | Comportement |
|--------|-------------|
| **Frontend** | Tiroir latéral global ; envoie `{ question, pageContext, role, entityIds }` |
| **Backend** | `POST /ia/copilot` — route vers moteur selon intent détecté ; réponse markdown structurée |

### 8.3 Mode offline terrain

| Couche | Comportement |
|--------|-------------|
| **Frontend** | IndexedDB pour visites, collectes, photos ; page `/terrain/offline` ; indicateur sync |
| **Backend** | `POST /visites/batch` ; idempotence via `client_uuid` ; validation géofencing à la sync |
| **Règle** | Les données offline ne modifient pas les soldes tant que non synchronisées et validées |

### 8.4 Traçabilité et audit

| Couche | Comportement |
|--------|-------------|
| **Backend** | Middleware log toute mutation : `user_id`, `action`, `entity_type`, `entity_id`, `payload`, `ip` |
| **Frontend** | Module M9 `/audit/tracabilite` consomme ces logs |

### 8.5 Notifications

| Événement | Canaux |
|-----------|--------|
| Validation comité crédit | Email client, GP, agent, RCC |
| Relance échéance | WhatsApp, SMS |
| Alerte PAR agence | Notification in-app + email DG |
| Transaction MoMo validée | SMS client |

---

## 9. Exigences non fonctionnelles

### 9.1 Performance

| Exigence | Cible |
|----------|-------|
| Chargement dashboard (LCP) | < 3 s sur 4G |
| Réponse API liste (p95) | < 500 ms |
| Export PDF rapport BCEAO | < 10 s |
| Sync batch offline (50 visites) | < 30 s |

### 9.2 Sécurité

| Exigence | Implémentation |
|----------|----------------|
| Authentification | JWT Bearer, expiration courte |
| RBAC | Filtrage backend par rôle + agence |
| HTTPS | Obligatoire production |
| Données sensibles | Pas de mots de passe en clair ; tokens httpOnly (cible) |
| Upload fichiers | Validation MIME, taille max, scan antivirus (production) |

### 9.3 Disponibilité

| Exigence | Cible |
|----------|-------|
| API production | 99,5 % |
| Mode dégradé | Frontend offline terrain fonctionnel sans API |

### 9.4 Compatibilité

Navigateurs : Chrome 120+, Firefox 120+, Edge 120+, Safari iOS 16+ (tablettes terrain).

---

## 10. Phasage technique et jalons

### 10.1 Ordre de développement recommandé

| Sprint / Phase | Bundle / Module | Frontend | Backend |
|----------------|-----------------|----------|---------|
| **P0 — Socle** | Auth, agences, users | Login, admin users | Phase 1 API complète |
| **P1 — Crédit** | M2, M3 | Pipeline, fiches dossier, workflow UI | Phase 2 crédit complète |
| **P2 — Terrain** | M4, M6 | Carte, visites, caisse, MoMo | Visites, transactions |
| **P3 — Pilotage** | M1, M7 | Dashboards API, recouvrement réseau | Phases A–D agrégats |
| **P4 — Conformité** | M8, M9 | Finance, conformité, audit | Écritures, ratios BCEAO |
| **P5 — Croissance** | M10–M13 | Marketing, épargne, équipes, produits | Endpoints dédiés |
| **P6 — IA prod** | Transverse | Copilot API | Moteur LLM + scoring prod |
| **P7 — Offline prod** | M4 | Sync robuste, conflits | Batch idempotent |

### 10.2 Jalons techniques

| Jalon | Critère de complétion |
|-------|----------------------|
| J1 — Socle | Login JWT + CRUD agences/users fonctionnel |
| J2 — Crédit bout en bout | Demande → comité → échéancier → paiement sur API réelle |
| J3 — Terrain | Visite GPS enregistrée et visible côté RA |
| J4 — Caisse | Validation MoMo bout en bout |
| J5 — Dashboards | Tous rôles sur données API (plus de mock) |
| J6 — Conformité | Export rapport BCEAO PDF depuis données réelles |
| J7 — Recette | 5 scénarios métier validés (cf. §11) |

---

## 11. Critères d'acceptation

### 11.1 Scénarios de recette bout en bout

**Scénario 1 — Cycle crédit complet**
```
Agent crée prospect → commercial complète KYC → agent soumet demande
→ CC instruit (visites, avis favorable) → ROC approuve → comité valide
→ échéancier généré → GP voit dossier EN_GESTION
```

**Scénario 2 — Collecte et paiement MoMo**
```
Agent collecte terrain (TONTINE) → comptable voit transaction VALIDE
Agent enregistre paiement MoMo → EN_ATTENTE → comptable valide
→ solde client crédité → échéance rapprochée
```

**Scénario 3 — Relance et recouvrement**
```
Échéance J+7 impayée → relance auto créée → WhatsApp envoyé
→ GP consulte /relances → mission terrain créée
→ ROC consulte vue réseau → dossier priorisé par score IA
```

**Scénario 4 — Pilotage direction**
```
DG se connecte → dashboard réseau → drill-down agence Lomé
→ consulte PAR, collecte, pipeline → Copilot répond sur PAR agence
```

**Scénario 5 — Conformité**
```
DAF consulte provisions → auditeur génère rapport BCEAO PDF
→ vérifie traçabilité action comité crédit
```

### 11.2 Critères techniques par couche

| Couche | Critère |
|--------|---------|
| **Frontend** | `npm run build` sans erreur ; 15 rôles naviguent sans accès non autorisé |
| **Backend** | Swagger `/api/docs` à jour ; tests intégration workflow crédit passent |
| **Intégration** | Feature flags mock désactivés — 5 scénarios sur API réelle |
| **Sécurité** | Token expiré → 401 → redirect login ; GP ne voit pas portefeuille autre GP |

---

## 12. Annexes

### Annexe A — Correspondance rôles frontend ↔ backend

| Frontend (`UserRole`) | Backend (JWT `role`) |
|-----------------------|----------------------|
| `MANAGER` | `DIRECTEUR_GENERAL` |
| `GESTIONNAIRE` | `RESPONSABLE_AGENCE` |
| `GESTIONNAIRE_PORTEFEUILLE` | `GESTIONNAIRE_PORTEFEUILLE` |
| `AGENT_TERRAIN` | `AGENT_TERRAIN` |
| `CREDIT` | `CHARGE_CREDIT` |
| `RESPONSABLE_CREDIT` | `RESPONSABLE_OPERATION_CREDIT` |
| `RESPONSABLE_COMMERCIAL` | `RESPONSABLE_COMMERCIAL_COLLECTE` |
| `COMPTABLE` | `COMPTABLE` |

### Annexe B — Index des routes frontend par bundle

| Bundle | Routes principales |
|--------|-------------------|
| Crédit | `/dashboard`, `/emprunteurs`, `/credit/*`, `/kyc`, `/groupes` |
| Terrain & Collecte | `/terrain`, `/terrain/offline`, `/relances`, `/caisse`, `/operations-bancaires` |
| Risque & Conformité | `/credit/recouvrement/*`, `/finance`, `/comptabilite`, `/conformite`, `/audit/*` |
| Croissance | `/marketing`, `/epargne`, `/equipe`, `/agences`, `/zones`, `/produits` |

### Annexe C — Index endpoints backend par phase

| Phase | Préfixe / domaine | Fichier référence |
|-------|-------------------|-------------------|
| 1 | `/auth`, `/agences`, `/users`, `/zones`, `/visites`, `/clients` | `API_MICROFINANCE_PHASE1.md` |
| 2 | `/dossiers-credit/*` | `API_PHASE2_CREDIT.md` |
| A–D | `/dashboard/*`, `/transactions`, `/recouvrement/*`, `/kpis/*` | `API_PHASES_A_D.md` |

### Annexe D — Glossaire

| Terme | Définition |
|-------|------------|
| **IMF** | Institution de Microfinance |
| **PAR** | Portefeuille à Risque — créances en retard / portefeuille brut |
| **ROC** | Responsable des Opérations Crédit |
| **CC** | Chargé de Crédit |
| **GP** | Gestionnaire de Portefeuille |
| **RA** | Responsable d'Agence |
| **CBI** | Credit Bureau Investigation |
| **SYSCOHADA** | Norme comptable OHADA |
| **BCEAO** | Banque Centrale des États de l'Afrique de l'Ouest |
| **Workflow** | Machine à états d'un dossier crédit pilotée par le backend |

### Annexe E — Documents de référence projet

| Document | Emplacement |
|----------|-------------|
| API Phase 1 | `docs/API_MICROFINANCE_PHASE1.md` |
| API Phase 2 Crédit | `docs/API_PHASE2_CREDIT.md` |
| API Phases A–D | `docs/API_PHASES_A_D.md` |
| Modules & IA (inventaire code) | `prospera-web/docs/prospera_modules_ia.md` |
| Annexe métier microfinance | `prospera-web/docs/prospera_microfinance.md` |

---

*Document de référence technique — Prospera © 2026*
