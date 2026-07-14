# Guide utilisateur par persona — Prospera Distributeur

> Ce guide parcourt l'application **persona par persona**. Pour chaque rôle, on documente
> **chaque écran auquel il a accès**, y compris les **onglets secondaires** et les **actions clés**
> (panier, création de proforma, clôture de visite…). Chaque écran est illustré par une **capture
> réelle** prise dans la peau du persona concerné, puis expliqué selon trois axes :
>
> - **But** — ce que l'écran est, ce qu'il montre.
> - **Objectif** — la décision ou le résultat qu'il vise pour ce persona.
> - **Workflow** — les étapes que le persona suit concrètement.

> ℹ️ **Données** : environnement de démonstration, montants en **FCFA** (`K` = millier, `M` = million,
> `Md` = milliard). Mot de passe démo commun : `password123`. Application : `http://localhost:3002`.

---

## Rappels transverses (valables pour tous les personas)

- **Périmètre** : chaque rôle ne voit que ses données. Les rôles « à portefeuille » (Commercial,
  Freelance, Prospection) ne voient **que leurs clients** (`commercial === utilisateur`) ; les rôles
  régionaux (Resp. Ventes, Superviseur) sont bornés à leur zone ; la direction voit le réseau.
- **Garde-fous** : plafond de crédit, plancher de trésorerie, remise maximale, exclusion des mauvais
  payeurs… La machine refuse de les franchir, même en mode automatique.
- **Trois niveaux de confiance de l'IA** : 🟢 *Automatique* (réversible, part seul) · 🟡 *À valider*
  (argent/remise/réputation en jeu, un clic) · 🔵 *Suggestion* (jugement humain requis).
- **Menu adaptatif** : les liens et leurs libellés changent selon le rôle ; des pastilles rouges
  signalent le travail en attente (relances critiques, commandes à valider, proformas expirantes…).

### Index des personas

| # | Persona | Rôle | Écrans documentés |
|---|---------|------|-------------------|
| 1 | [Directeur Général](#1--directeur-général-dg) | `DG` | 44 |
| 2 | [Directeur Commercial](#2--directeur-commercial-dc) | `DC` | 33 |
| 3 | [Responsable des Ventes](#3--responsable-des-ventes-resp_ventes) | `RESP_VENTES` | 21 |
| 4 | [Superviseur de Zone](#4--superviseur-de-zone-superviseur) | `SUPERVISEUR` | 16 |
| 5 | [Commercial Terrain](#5--commercial-terrain-commercial) | `COMMERCIAL` | 17 |
| 6 | [Commercial Freelance](#6--commercial-freelance-freelance) | `FREELANCE` | 13 |
| 7 | [Chargé de Prospection](#7--chargé-de-prospection-prospection) | `PROSPECTION` | 17 |
| 8 | [Responsable Stock & Logistique](#8--responsable-stock--logistique-resp_stock) | `RESP_STOCK` | 16 |
| 9 | [Gestionnaire Entrepôt](#9--gestionnaire-entrepôt-gest_entrepot) | `GEST_ENTREPOT` | 6 |
| 10 | [Directeur Administratif & Financier](#10--directeur-administratif--financier-daf) | `DAF` | 20 |
| 11 | [Comptable](#11--comptable-comptable) | `COMPTABLE` | 12 |
| 12 | [Responsable Marketing](#12--responsable-marketing-marketing) | `MARKETING` | 13 |
| 13 | [Responsable Recouvrement](#13--responsable-recouvrement-recouvrement) | `RECOUVREMENT` | 10 |

---

# 1 · Directeur Général (`DG`)

**Utilisateur démo** : Koffi Mensah · `dg@demo.prospera.tg` · **Périmètre** : réseau Togo, aucune
restriction. **Posture** : scanne les chiffres, arbitre, délègue — ne saisit rien. C'est le seul rôle
qui voit **tous** les modules. Son fil conducteur : *les chiffres qui engagent une décision*.

### 1.1 Tableau de bord — `/dashboard`

![Tableau de bord DG](img/personas/dg/01-dashboard.png)

- **But** : la vue exécutive temps réel, organisée par question de décision (Argent disponible ·
  Ce qu'on me doit / ce que je dois · Activité) plutôt que par service.
- **Objectif** : voir en 10 secondes si la journée exige un arbitrage (alertes critiques, marge sous
  objectif, dette échue) et sauter directement sur la page concernée.
- **Workflow** : lire le bandeau des 8 chiffres → ouvrir une alerte critique → cliquer *Voir la
  trésorerie / les impayés / le compte de résultat* → exporter Excel/PDF pour le comité.

### 1.2 Pilotage financier — `/pilotage-financier`

![Pilotage financier DG](img/personas/dg/02-pilotage-financier.png)

- **But** : trésorerie, rentabilité et créances, avec une **synthèse IA** et un bloc *Décisions à
  trancher* numéroté.
- **Objectif** : décider (valider une provision, anticiper un pic de décaissement, aligner
  compta + relances) sans attendre la clôture.
- **Workflow** : lire la synthèse IA → parcourir les décisions à trancher → *Valider* ou *Reporter*
  → vérifier la projection de trésorerie à 7 jours et les clients à surveiller.

### 1.3 Tournées & Cash — `/tournees`

![Tournées & Cash DG](img/personas/dg/03-tournees.png)

- **But** : plan de journée des équipes, strike rate, espèces remises et **écart de caisse**, sur carte.
- **Objectif** : détecter une anomalie d'exécution ou de caisse (premier signal de fraude) et la traiter.
- **Workflow** : filtrer par équipe → repérer un écart de caisse rouge → déclencher le rapprochement.

### 1.4 Commandes — `/commandes`

![Commandes DG](img/personas/dg/04-commandes.png)

- **But** : pilotage du carnet de commandes grossiste (pipeline Brouillon → Livrée, flux par entrepôt,
  commandes bloquées crédit).
- **Objectif** : fluidifier le passage commande → préparation → livraison et débloquer ce qui coince.
- **Workflow** : lire les KPI → suivre le pipeline → traiter les analyses IA (commande bloquée,
  tension produit) → filtrer par zone/entrepôt.

### 1.5 Opérations entrepôt — `/entrepot`

Le poste de travail physique de l'entrepôt, en 4 onglets. Le DG y entre pour superviser.

![Entrepôt — Préparation](img/personas/dg/05-entrepot-preparation.png)

- **But (Préparation)** : la charge du jour (lignes à sortir vs capacité) et les vagues de picking
  optimisées par zone.
- **Objectif** : voir si l'entrepôt tient le départ camion de 15 h 30 et arbitrer les vagues en surcharge.
- **Workflow** : lire la jauge de charge → repérer une vague qui déborde → scinder ou renforcer.

![Entrepôt — Expéditions & chargement](img/personas/dg/06-entrepot-expedition.png)

- **But (Expéditions)** : les tournées de livraison et le chargement des camions.
- **Objectif** : garantir que les bons de livraison partent dans le bon camion, à l'heure.
- **Workflow** : suivre les expéditions → contrôler le remplissage → valider le chargement.

![Entrepôt — Réceptions](img/personas/dg/07-entrepot-reception.png)

- **But (Réceptions)** : les livraisons fournisseurs attendues au quai.
- **Objectif** : réceptionner et signaler les écarts (base de la dette réelle).
- **Workflow** : ouvrir une réception attendue → saisir les quantités reçues → ouvrir un litige si écart.

![Entrepôt — Inventaire tournant](img/personas/dg/08-entrepot-inventaire.png)

- **But (Inventaire)** : les comptages tournants du jour.
- **Objectif** : maintenir la fiabilité du stock sans arrêter l'activité.
- **Workflow** : prendre les emplacements à compter → saisir le comptage → traiter les écarts.

### 1.6 Stock & Logistique — `/stock`

Vue réseau complète (le DG voit la marge), en 6 onglets.

![Stock & logistique](img/personas/dg/09-stock-stock.png)

- **But** : pilotage multi-entrepôts (valeur de stock, ruptures, couverture, taux de service) avec
  fiches produit.
- **Objectif** : repérer ruptures et surstocks qui pénalisent la vente ou immobilisent la trésorerie.
- **Workflow** : lire les KPI → filtrer par entrepôt / alertes → ouvrir une fiche produit.

![Transferts inter-entrepôts](img/personas/dg/10-stock-transferts.png)

- **But** : rééquilibrer le stock entre Lomé Port et Kara.
- **Objectif** : éviter une rupture d'un côté quand l'autre est en surstock.
- **Workflow** : repérer un déséquilibre → arbitrer un transfert.

![Santé du stock](img/personas/dg/11-stock-sante.png)

- **But** : « L'argent qui dort » — capital immobilisé, surstock, DLC menacées, obsolètes.
- **Objectif** : déclencher un plan de sortie avant décote/péremption.
- **Workflow** : filtrer (surstock / dormant / DLC / obsolète) → *Voir le plan de sortie* (5 scénarios chiffrés).

![Journal d'automatisation](img/personas/dg/12-stock-journal-auto.png)

- **But** : la trace de ce que le moteur logistique a décidé seul.
- **Objectif** : auditer et garder la main sur l'automatisation.
- **Workflow** : parcourir les déclenchements → annuler/ajuster si besoin.

![Sorties entrepôt](img/personas/dg/13-stock-sorties.png)

- **But** : historique des sorties par entrepôt.
- **Objectif** : comprendre la dynamique de sortie (produits, volumes).
- **Workflow** : filtrer par entrepôt/période → analyser.

![Catalogue produits](img/personas/dg/14-stock-catalogue.png)

- **But** : le référentiel des SKU.
- **Objectif** : disposer d'une source unique produit (prix, packaging, catégorie).
- **Workflow** : rechercher une référence → consulter sa fiche.

### 1.7 Approvisionnement — `/approvisionnement`

Réappro assisté par IA et relation fournisseurs, en 4 onglets.

![Appro — Réappro IA](img/personas/dg/15-appro-reappro.png)

- **But** : commandes fournisseurs suggérées par le moteur (produits regroupés, franco de port,
  garde-fou trésorerie).
- **Objectif** : réapprovisionner sans mettre la caisse sous le plancher.
- **Workflow** : lire l'impact trésorerie → *Valider* / *Basculer sur fournisseur de secours*.

![Appro — Commandes fournisseurs](img/personas/dg/16-appro-commandes.png)

- **But** : le carnet de commandes d'achat et leur suivi.
- **Objectif** : suivre l'engagement en cours et les réceptions.
- **Workflow** : ouvrir une commande → suivre son statut.

![Appro — Fournisseurs](img/personas/dg/17-appro-fournisseurs.png)

- **But** : la fiche fournisseur (fiabilité, délai réel, encours de dette, échéancier).
- **Objectif** : arbitrer avec qui commander et quoi payer.
- **Workflow** : comparer les fournisseurs → consulter l'échéancier.

![Appro — Règles d'automatisation](img/personas/dg/18-appro-regles.png)

- **But** : les règles de réappro par produit (seuil, couverture, mode de quantité, plafond, valideur).
- **Objectif** : cadrer ce que le moteur peut engager seul.
- **Workflow** : ouvrir une règle → ajuster seuil/plafond/niveau d'automatisation.

### 1.8 Facturation & Créances — `/facturation`

![Facturation — Factures & créances](img/personas/dg/19-facturation-factures.png)

- **But** : pilotage des créances (CA facturé, encaissé, impayés en retard, top clients impayés,
  recouvrement par commercial).
- **Objectif** : voir où est l'argent non rentré et qui doit le récupérer.
- **Workflow** : lire les KPI → repérer les plafonds dépassés → renvoyer vers relances.

![Facturation — Proformas](img/personas/dg/20-facturation-proformas.png)

- **But** : les devis proforma et leur taux d'acceptation.
- **Objectif** : suivre la transformation devis → commande.
- **Workflow** : filtrer → ouvrir une proforma → convertir/relancer.

![Facturation — E-facturation & avoirs](img/personas/dg/21-facturation-efacture.png)

- **But** : file de transmission e-facture (certification OTR, rejets, archive légale).
- **Objectif** : garantir la conformité fiscale des factures.
- **Workflow** : suivre la certification → corriger les rejets.

### 1.9 Relances & Impayés — `/relances`

Pipeline multi-canal, 4 flux.

![Relances — Recouvrement impayés](img/personas/dg/22-relances-impayes.png)

- **But** : le pipeline de recouvrement (détection → planifiée → envoyée → réponse), carte des débiteurs.
- **Objectif** : récupérer le cash avec le bon canal au bon moment.
- **Workflow** : suivre les colonnes du pipeline → lancer la tournée de recouvrement.

![Relances — Réapprovisionnement](img/personas/dg/23-relances-reappro.png)

- **But** : le flux de relances liées au réapprovisionnement.
- **Objectif** : relancer ce qui bloque la disponibilité.
- **Workflow** : basculer sur l'onglet → traiter les dossiers.

![Relances — Prospection](img/personas/dg/24-relances-prospection.png)

- **But** : le flux de relances de prospection.
- **Objectif** : ne pas laisser refroidir les leads.
- **Workflow** : parcourir → relancer.

![Relances — Tous les flux](img/personas/dg/25-relances-tous.png)

- **But** : la vue consolidée de tous les flux de relance.
- **Objectif** : avoir la charge de relance totale d'un coup d'œil.
- **Workflow** : filtrer par zone → prioriser.

### 1.10 Points de vente — `/points-de-vente`

![Points de vente — réseau](img/personas/dg/26-points-de-vente.png)

- **But** : le CRM réseau (CA, magasins enseigne, partenaires B2B, impayés, clients à risque) avec
  synthèse IA et actions prioritaires.
- **Objectif** : savoir où concentrer l'effort commercial et de recouvrement.
- **Workflow** : lire la synthèse → parcourir les actions prioritaires → ouvrir une fiche.

![Fiche point de vente](img/personas/dg/27-points-de-vente-detail.png)

- **But** : la fiche complète d'un client (score de santé, alertes, évolution CA, contexte zone).
- **Objectif** : comprendre un compte avant d'agir.
- **Workflow** : ouvrir la fiche → lire la synthèse IA → décider (relance, visite, déblocage).

### 1.11 Conquête & Territoires — `/prospection`

4 onglets suivant le cycle de conquête.

![Prospection — Territoires](img/personas/dg/28-prospection-territoires.png)

- **But** : la carte des territoires et le recensement des zones blanches.
- **Objectif** : piloter l'expansion géographique.
- **Workflow** : lire la carte → activer un recensement.

![Prospection — Carnet de prospects](img/personas/dg/29-prospection-carnet.png)

- **But** : l'entonnoir de conquête et le carnet de commerces qualifiés.
- **Objectif** : voir où le travail est en panne (goulot).
- **Workflow** : lire l'entonnoir → traiter les dossiers bloqués.

![Prospection — Ouvertures & survie](img/personas/dg/30-prospection-survie.png)

- **But** : la survie des ouvertures (cohortes vivant/dormant/mort/impayé) et la valeur nette.
- **Objectif** : mesurer si les comptes ouverts créent de la valeur.
- **Workflow** : analyser les cohortes → repérer les ouvertures qui meurent.

![Prospection — Passation](img/personas/dg/31-prospection-passation.png)

- **But** : les PDV ouverts que plus personne ne visite.
- **Objectif** : éviter la mortalité par défaut de passation.
- **Workflow** : repérer les orphelins → transférer au commercial de secteur.

### 1.12 Commercial terrain — `/commercial`

![Commercial terrain DG](img/personas/dg/32-commercial-terrain.png)

- **But** : la supervision GPS de toute la force de vente (positions, couverture, coaching).
- **Objectif** : piloter l'exécution terrain et le coaching.
- **Workflow** : lire la carte → traiter les analyses IA → prioriser le coaching.

### 1.13 Marketing & Campagnes — `/marketing`

![Marketing DG](img/personas/dg/33-marketing.png)

- **But** : la vue DG du marketing (contrôle des campagnes, ROI, combos d'écoulement, décisions).
- **Objectif** : arbitrer le marketing sans le produire.
- **Workflow** : lire l'analyse IA → contrôler les campagnes → trancher les 5 décisions.

### 1.14 Studio réseaux sociaux — `/marketing/social`

5 onglets.

![Studio — Calendrier éditorial](img/personas/dg/34-social-calendrier.png)

- **But** : le calendrier éditorial multi-réseaux (WhatsApp, Facebook, TikTok, Instagram).
- **Objectif** : superviser ce qui part au nom de l'entreprise.
- **Workflow** : parcourir le calendrier → valider/ajourner un post.

![Studio — Idées & modèles](img/personas/dg/35-social-idees.png)

- **But** : les idées de contenu issues du terrain et les modèles.
- **Objectif** : nourrir le calendrier.
- **Workflow** : choisir une idée/modèle → l'ajouter au calendrier.

![Studio — Boîte de réception](img/personas/dg/36-social-inbox.png)

- **But** : les messages entrants des réseaux (leads, commandes).
- **Objectif** : ne pas rater une demande commerciale.
- **Workflow** : traiter la boîte → convertir un message en lead.

![Studio — Ce que ça rapporte](img/personas/dg/37-social-performance.png)

- **But** : la performance des réseaux (portée, engagement, CA attribué).
- **Objectif** : mesurer le ROI social.
- **Workflow** : lire les indicateurs par réseau.

![Studio — Journal d'activité](img/personas/dg/38-social-journal.png)

- **But** : la trace horodatée et annulable de chaque décision du studio.
- **Objectif** : auditer l'activité social media.
- **Workflow** : parcourir le journal → annuler une action.

### 1.15 Automatisations — `/automatisations`

![Automatisations DG](img/personas/dg/39-automatisations.png)

- **But** : le centre de contrôle du moteur d'IA (actions parties seules, en attente, retenues).
- **Objectif** : garder la maîtrise de ce que la machine fait à sa place.
- **Workflow** : lire les compteurs → ouvrir une règle → *Valider / Ignorer* les cibles.

### 1.16 Objectifs & Quotas — `/objectifs`

![Objectifs DG](img/personas/dg/40-objectifs.png)

- **But** : l'allocation du quota par zone, l'atterrissage projeté et le mix de marge.
- **Objectif** : arbitrer l'atterrissage région au niveau du réseau.
- **Workflow** : lire l'allocation par zone → traiter les arbitrages IA.

### 1.17 Équipe & Performance — `/equipe`

3 onglets.

![Équipe — Classement & fiches](img/personas/dg/41-equipe-classement.png)

- **But** : la performance commerciale (synthèse IA, top performers, à coacher, décisions DG).
- **Objectif** : valoriser et coacher les bonnes personnes.
- **Workflow** : lire la synthèse → parcourir les classements → ouvrir une fiche.

![Équipe — Tableau comparatif](img/personas/dg/42-equipe-comparatif.png)

- **But** : la comparaison chiffrée des commerciaux.
- **Objectif** : objectiver les écarts de performance.
- **Workflow** : trier les colonnes → repérer les écarts.

![Équipe — Coaching & retours IA](img/personas/dg/43-equipe-coaching.png)

- **But** : les recommandations de coaching par l'IA.
- **Objectif** : transformer la donnée en plan d'action RH.
- **Workflow** : lire les retours → décider un plan de coaching.

### 1.18 Comptabilité — `/comptabilite`

![Comptabilité DG](img/personas/dg/44-comptabilite.png)

- **But** : la vue analytique comptable (trésorerie, balance SYSCOHADA, créances 411, résultat).
- **Objectif** : suivre la santé comptable et la clôture.
- **Workflow** : parcourir les onglets (trésorerie, journal, balance, créances, résultat, rapprochements).

---

# 2 · Directeur Commercial (`DC`)

**Utilisateur démo** : Ama Dzobo · `dc@demo.prospera.tg` · **Périmètre** : toutes zones commerciales.
**Posture** : pilote la force de vente et le chiffre (objectifs, tournées, couverture, marge). Il voit
presque tout, sauf ce qui est purement financier au DG. Contrairement au DG, son écran marketing est
la **vue opérateur**.

### 2.1 Tableau de bord — `/dashboard`

![Tableau de bord DC](img/personas/dc/01-dashboard.png)

- **But** : cockpit « Pilotage Commercial » (CA du jour, commandes, visites, commerciaux actifs).
- **Objectif** : suivre l'activité commerciale consolidée du jour.
- **Workflow** : lire les KPI et les commandes récentes → basculer vers l'écran d'action concerné.

### 2.2 Pilotage financier — `/pilotage-financier`

![Pilotage financier DC](img/personas/dc/02-pilotage-financier.png)

- **But** : trésorerie, créances et rentabilité (accès partagé avec le DG/DAF).
- **Objectif** : relier ses décisions commerciales à leur impact cash et marge.
- **Workflow** : lire la synthèse → surveiller créances à risque et marge.

### 2.3 Tournées & Cash — `/tournees`

![Tournées DC](img/personas/dc/03-tournees.png)

- **But** : exécution terrain et caisse par équipe.
- **Objectif** : garantir couverture PJP, strike rate et remises d'espèces.
- **Workflow** : filtrer par équipe → traiter alertes de caisse et de couverture.

### 2.4 Commandes — `/commandes`

![Commandes DC](img/personas/dc/04-commandes.png)

- **But** : pilotage du carnet de commandes (identique à la vue DG).
- **Objectif** : fluidifier le flux et débloquer les commandes bloquées crédit.
- **Workflow** : suivre le pipeline → traiter les analyses IA → filtrer zone/entrepôt.

### 2.5 Stock & Logistique — `/stock` (6 onglets)

Le DC consulte le stock pour ne pas promettre ce qui manque ; il a la vue complète avec marge.

![Stock & logistique](img/personas/dc/05-stock-stock.png)
- **But / Objectif / Workflow** : disponibilité et ruptures réseau → éviter les promesses intenables → lire KPI, filtrer, ouvrir une fiche produit.

![Transferts inter-entrepôts](img/personas/dc/06-stock-transferts.png)
- **But / Objectif / Workflow** : rééquilibrage entre entrepôts → limiter les ruptures locales → repérer un déséquilibre, arbitrer.

![Santé du stock](img/personas/dc/07-stock-sante.png)
- **But / Objectif / Workflow** : capital dormant / surstock → alimenter des opérations commerciales d'écoulement → filtrer et déclencher un plan de sortie.

![Journal d'automatisation](img/personas/dc/08-stock-journal-auto.png)
- **But / Objectif / Workflow** : trace des décisions logistiques auto → audit → parcourir, ajuster.

![Sorties entrepôt](img/personas/dc/09-stock-sorties.png)
- **But / Objectif / Workflow** : historique des sorties → comprendre la dynamique produit → filtrer/analyser.

![Catalogue produits](img/personas/dc/10-stock-catalogue.png)
- **But / Objectif / Workflow** : référentiel SKU → source produit unique → rechercher une référence.

### 2.6 Facturation & Créances — `/facturation` (2 onglets)

![Facturation — Factures & créances](img/personas/dc/11-facturation-factures.png)
- **But / Objectif / Workflow** : créances de sa force de vente, grille tarifaire, clients à risque → suivre l'argent non rentré → lire KPI, renvoyer vers relances.

![Facturation — Proformas](img/personas/dc/12-facturation-proformas.png)
- **But / Objectif / Workflow** : proformas de toute la force de vente + taux d'acceptation par commercial → suivre la transformation devis→commande → filtrer, convertir, relancer.

### 2.7 Relances & Impayés — `/relances` (4 flux)

![Relances — Recouvrement impayés](img/personas/dc/13-relances-impayes.png)
- **But / Objectif / Workflow** : pipeline de recouvrement → arbitrer les impayés qui bloquent des commandes → suivre les colonnes, lancer la tournée.

![Relances — Réapprovisionnement](img/personas/dc/14-relances-reappro.png)
- **But / Objectif / Workflow** : flux réappro → débloquer la disponibilité → traiter les dossiers.

![Relances — Prospection](img/personas/dc/15-relances-prospection.png)
- **But / Objectif / Workflow** : flux prospection → ne pas laisser refroidir les leads → relancer.

![Relances — Tous les flux](img/personas/dc/16-relances-tous.png)
- **But / Objectif / Workflow** : vue consolidée → charge de relance totale → filtrer par zone, prioriser.

### 2.8 Points de vente — `/points-de-vente`

![Points de vente](img/personas/dc/17-points-de-vente.png)
- **But / Objectif / Workflow** : CRM réseau complet → concentrer l'effort commercial → lire synthèse, ouvrir une fiche.

![Fiche point de vente](img/personas/dc/18-points-de-vente-detail.png)
- **But / Objectif / Workflow** : fiche client 360° → comprendre un compte avant d'agir → lire la synthèse IA, décider.

### 2.9 Conquête & Territoires — `/prospection` (4 onglets)

![Territoires](img/personas/dc/19-prospection-territoires.png)
- **But / Objectif / Workflow** : carte des territoires → piloter l'expansion → activer un recensement.

![Carnet de prospects](img/personas/dc/20-prospection-carnet.png)
- **But / Objectif / Workflow** : entonnoir de conquête → identifier le goulot → traiter les dossiers bloqués.

![Ouvertures & survie](img/personas/dc/21-prospection-survie.png)
- **But / Objectif / Workflow** : survie des ouvertures → mesurer la création de valeur → analyser les cohortes.

![Passation](img/personas/dc/22-prospection-passation.png)
- **But / Objectif / Workflow** : PDV orphelins → éviter la mortalité par défaut → transférer au secteur.

### 2.10 Commercial terrain — `/commercial`

![Commercial terrain DC](img/personas/dc/23-commercial-terrain.png)
- **But / Objectif / Workflow** : supervision GPS de l'équipe → piloter exécution & coaching → lire la carte, prioriser le coaching. **C'est l'écran central du DC.**

### 2.11 Marketing & prospection (opérations) — `/marketing`

![Marketing opérateur DC](img/personas/dc/24-marketing.png)
- **But / Objectif / Workflow** : vue **opérateur** (campagnes, pipeline leads, segmentation IA, zones blanches, combos) → piloter la génération de demande → lancer/valider un combo, suivre le ROI.

### 2.12 Studio réseaux sociaux — `/marketing/social` (5 onglets)

![Calendrier éditorial](img/personas/dc/25-social-calendrier.png)
- **But / Objectif / Workflow** : calendrier multi-réseaux → superviser la communication → valider/ajourner un post.

![Idées & modèles](img/personas/dc/26-social-idees.png)
- **But / Objectif / Workflow** : idées terrain & modèles → nourrir le calendrier → ajouter au calendrier.

![Boîte de réception](img/personas/dc/27-social-inbox.png)
- **But / Objectif / Workflow** : messages entrants → capter les demandes commerciales → convertir en lead.

![Ce que ça rapporte](img/personas/dc/28-social-performance.png)
- **But / Objectif / Workflow** : performance réseaux → mesurer le ROI social → lire les indicateurs.

![Journal d'activité](img/personas/dc/29-social-journal.png)
- **But / Objectif / Workflow** : trace des décisions → audit → annuler une action.

### 2.13 Objectifs & Quotas — `/objectifs`

![Objectifs DC](img/personas/dc/30-objectifs.png)
- **But / Objectif / Workflow** : allocation quota par zone, atterrissage, mix marge → arbitrer l'atterrissage → lire l'allocation, traiter les arbitrages IA.

### 2.14 Équipe & Performance — `/equipe` (3 onglets)

![Classement & fiches](img/personas/dc/31-equipe-classement.png)
- **But / Objectif / Workflow** : performance commerciale → valoriser/coacher → ouvrir une fiche.

![Tableau comparatif](img/personas/dc/32-equipe-comparatif.png)
- **But / Objectif / Workflow** : comparaison chiffrée → objectiver les écarts → trier les colonnes.

![Coaching & retours IA](img/personas/dc/33-equipe-coaching.png)
- **But / Objectif / Workflow** : recommandations IA → décider un plan de coaching → lire les retours.

---

# 3 · Responsable des Ventes (`RESP_VENTES`)

**Utilisateur démo** : Kodjo Agbeko · `ventes@demo.prospera.tg` · **Périmètre** : Région Grand Lomé
(4 zones, 4 superviseurs, 14 commerciaux, 447 PDV). **Posture** : porte le quota d'une **région** et
pilote le **résultat** (atterrissage, mix, marge) à travers ses superviseurs — jamais commercial par
commercial. Tous ses écrans sont **filtrés sur sa région**. Pas de Tournées & Cash (niveau du dessous).

### 3.1 Tableau de bord — `/dashboard`

![Tableau de bord RESP_VENTES](img/personas/resp_ventes/01-dashboard.png)
- **But** : l'atterrissage de la région, ses zones et leurs écarts projetés, les escalades reçues.
- **Objectif** : savoir si la région rentre dans son quota au rythme actuel.
- **Workflow** : lire l'atterrissage → repérer une zone qui décroche → trancher/escalader une validation.

### 3.2 Commandes — `/commandes`

![Commandes RESP_VENTES](img/personas/resp_ventes/02-commandes.png)
- **But / Objectif / Workflow** : carnet de commandes de sa région → suivre le flux et les blocages → pipeline, analyses IA, filtres zone.

### 3.3 Stock & Logistique — `/stock` (3 onglets)

![Stock & logistique](img/personas/resp_ventes/03-stock-stock.png)
- **But / Objectif / Workflow** : disponibilité réseau (sans levier logistique) → éviter les promesses intenables → lire KPI, ouvrir une fiche.

![Sorties entrepôt](img/personas/resp_ventes/04-stock-sorties.png)
- **But / Objectif / Workflow** : historique des sorties → comprendre la dynamique produit → filtrer/analyser.

![Catalogue produits](img/personas/resp_ventes/05-stock-catalogue.png)
- **But / Objectif / Workflow** : référentiel SKU → source produit → rechercher une référence.

### 3.4 Facturation — Proformas — `/facturation`

![Facturation — Proformas](img/personas/resp_ventes/06-facturation-proformas.png)
- **But / Objectif / Workflow** : proformas de sa région et conditions client → arbitrer devis et remises dans sa délégation (≤ 12 %, crédit ≤ 5 M) → filtrer, convertir, relancer.

### 3.5 Relances & Impayés — `/relances` (4 flux)

![Relances — Impayés](img/personas/resp_ventes/07-relances-impayes.png)
- **But / Objectif / Workflow** : impayés de sa région → débloquer les commandes bloquées → suivre le pipeline.

![Relances — Réapprovisionnement](img/personas/resp_ventes/08-relances-reappro.png)
- **But / Objectif / Workflow** : flux réappro → débloquer la disponibilité → traiter les dossiers.

![Relances — Prospection](img/personas/resp_ventes/09-relances-prospection.png)
- **But / Objectif / Workflow** : flux prospection → entretenir les leads → relancer.

![Relances — Tous les flux](img/personas/resp_ventes/10-relances-tous.png)
- **But / Objectif / Workflow** : vue consolidée → charge de relance régionale → filtrer, prioriser.

### 3.6 Points de vente — `/points-de-vente`

![Points de vente](img/personas/resp_ventes/11-points-de-vente.png)
- **But / Objectif / Workflow** : les 447 PDV de sa région → concentrer l'effort → ouvrir une fiche.

![Fiche point de vente](img/personas/resp_ventes/12-points-de-vente-detail.png)
- **But / Objectif / Workflow** : fiche client 360° → comprendre un compte → décider.

### 3.7 Conquête & Territoires — `/prospection` (4 onglets)

![Territoires](img/personas/resp_ventes/13-prospection-territoires.png)
- **But / Objectif / Workflow** : territoires de la région → piloter la couverture (DN) → activer un recensement.

![Carnet de prospects](img/personas/resp_ventes/14-prospection-carnet.png)
- **But / Objectif / Workflow** : entonnoir → identifier le goulot → traiter les blocages.

![Ouvertures & survie](img/personas/resp_ventes/15-prospection-survie.png)
- **But / Objectif / Workflow** : survie des ouvertures → mesurer la valeur créée → analyser cohortes.

![Passation](img/personas/resp_ventes/16-prospection-passation.png)
- **But / Objectif / Workflow** : PDV orphelins → assurer la passation → transférer.

### 3.8 Commercial terrain — `/commercial`

![Commercial terrain](img/personas/resp_ventes/17-commercial-terrain.png)
- **But / Objectif / Workflow** : supervision terrain de la région → piloter l'exécution via superviseurs → lire la carte, prioriser le coaching.

### 3.9 Objectifs & Quotas — `/objectifs` — **son écran principal**

![Objectifs RESP_VENTES](img/personas/resp_ventes/18-objectifs.png)
- **But** : atterrissage, allocation du quota par zone, mix produit/marge, DN.
- **Objectif** : décider qui porte quel quota et rééquilibrer en cours de mois.
- **Workflow** : lire l'atterrissage projeté → réallouer entre zones → arbitrer le mix de marge.

### 3.10 Équipe & Performance — `/equipe` (3 onglets)

![Classement & fiches](img/personas/resp_ventes/19-equipe-classement.png)
- **But / Objectif / Workflow** : performance de ses équipes → valoriser/coacher → ouvrir une fiche.

![Tableau comparatif](img/personas/resp_ventes/20-equipe-comparatif.png)
- **But / Objectif / Workflow** : comparaison chiffrée → objectiver les écarts → trier.

![Coaching & retours IA](img/personas/resp_ventes/21-equipe-coaching.png)
- **But / Objectif / Workflow** : recommandations IA → plan de coaching → lire les retours.

---

# 4 · Superviseur de Zone (`SUPERVISEUR`)

**Utilisateur démo** : Efua Koffi · `superviseur@demo.prospera.tg` · **Périmètre** : Zone Lomé Nord
(4 commerciaux, 149 PDV). **Posture** : chef d'équipe terrain — il pilote **l'activité** (visites,
couverture, cash, exécution en magasin). Il ne voit ni la marge, ni les autres zones, ni la
facturation (il arbitre les remises via les validations, il n'émet pas de facture).

### 4.1 Tableau de bord — `/dashboard`

![Tableau de bord SUPERVISEUR](img/personas/superviseur/01-dashboard.png)
- **But** : ce qu'il doit arbitrer maintenant, l'état de ses tournées, les PDV de sa zone qui décrochent.
- **Objectif** : lancer sa journée sur les bons arbitrages et les bons clients.
- **Workflow** : traiter les validations en attente → contrôler couverture/strike/écart de caisse.

### 4.2 Tournées & Cash — `/tournees` — **son écran principal**

![Tournées SUPERVISEUR](img/personas/superviseur/02-tournees.png)
- **But** : PJP, strike rate, remises d'espèces et **écart de caisse** par commercial, sur carte.
- **Objectif** : garantir l'exécution terrain et détecter la fraude (écart de caisse).
- **Workflow** : lire la couverture par commercial → traiter une alerte d'écart → exiger le rapprochement.

### 4.3 Commandes — `/commandes`

![Commandes SUPERVISEUR](img/personas/superviseur/03-commandes.png)
- **But / Objectif / Workflow** : commandes de sa zone → suivre le flux → pipeline, filtres.

### 4.4 Stock & Logistique — `/stock` (3 onglets)

![Stock & logistique](img/personas/superviseur/04-stock-stock.png)
- **But / Objectif / Workflow** : disponibilité (sans marge) → ne pas promettre l'indisponible → lire KPI, fiche produit.

![Sorties entrepôt](img/personas/superviseur/05-stock-sorties.png)
- **But / Objectif / Workflow** : historique des sorties → dynamique produit → filtrer.

![Catalogue produits](img/personas/superviseur/06-stock-catalogue.png)
- **But / Objectif / Workflow** : référentiel SKU → source produit → rechercher.

### 4.5 Relances & Impayés — `/relances` (4 flux)

![Relances — Impayés](img/personas/superviseur/07-relances-impayes.png)
- **But / Objectif / Workflow** : impayés de sa zone → intégrer la relance dans la tournée → suivre le pipeline.

![Relances — Réapprovisionnement](img/personas/superviseur/08-relances-reappro.png)
- **But / Objectif / Workflow** : flux réappro → débloquer la disponibilité → traiter.

![Relances — Prospection](img/personas/superviseur/09-relances-prospection.png)
- **But / Objectif / Workflow** : flux prospection → entretenir les leads → relancer.

![Relances — Tous les flux](img/personas/superviseur/10-relances-tous.png)
- **But / Objectif / Workflow** : vue consolidée → charge de relance de zone → prioriser.

### 4.6 Points de vente — `/points-de-vente`

![Points de vente](img/personas/superviseur/11-points-de-vente.png)
- **But / Objectif / Workflow** : les 149 PDV de sa zone → savoir chez qui aller → ouvrir une fiche.

![Fiche point de vente](img/personas/superviseur/12-points-de-vente-detail.png)
- **But / Objectif / Workflow** : fiche client 360° → comprendre un compte → décider (visite, relance).

### 4.7 Commercial terrain — `/commercial`

![Commercial terrain](img/personas/superviseur/13-commercial-terrain.png)
- **But / Objectif / Workflow** : sa carte terrain (statut de chaque commercial, alertes GPS) → piloter l'exécution et le coaching → réaffecter, coacher.

### 4.8 Équipe & Performance — `/equipe` (3 onglets)

![Classement & fiches](img/personas/superviseur/14-equipe-classement.png)
- **But / Objectif / Workflow** : performance de ses 4 commerciaux → valoriser/coacher → ouvrir une fiche.

![Tableau comparatif](img/personas/superviseur/15-equipe-comparatif.png)
- **But / Objectif / Workflow** : comparaison chiffrée → objectiver les écarts → trier.

![Coaching & retours IA](img/personas/superviseur/16-equipe-coaching.png)
- **But / Objectif / Workflow** : recommandations IA → plan de coaching → lire les retours.

---

# 5 · Commercial Terrain (`COMMERCIAL`)

**Utilisateur démo** : Komlan Tetteh · `commercial@demo.prospera.tg` · **Périmètre** : **son
portefeuille** uniquement (`commercial === lui`). **Posture** : sur le terrain, mobile, souvent hors
ligne. Il visite, prend la commande, encaisse. Ses écrans sont des écrans d'**action**, pas de pilotage.

### 5.1 Tableau de bord — `/dashboard`

![Tableau de bord COMMERCIAL](img/personas/commercial/01-dashboard.png)
- **But** : « Ma journée » — score de performance, visites/objectif, commandes, CA, tournée IA optimisée.
- **Objectif** : démarrer la journée sur la tournée la plus rentable.
- **Workflow** : lire le score → suivre la tournée optimisée → aller au premier arrêt.

### 5.2 Mon agenda — `/mon-activite` (3 onglets + action)

![Mon activité — Tournée du jour](img/personas/commercial/02-mon-activite-jour.png)
- **But** : l'agenda terrain du jour, cartographié, ordonné par priorité (mode offline).
- **Objectif** : exécuter la tournée dans le bon ordre.
- **Workflow** : *Optimiser le trajet* → *Lancer l'itinéraire* → traiter chaque arrêt.

![Mon activité — Semaine](img/personas/commercial/03-mon-activite-semaine.png)
- **But / Objectif / Workflow** : vue hebdomadaire des visites → planifier la semaine → naviguer entre semaines.

![Mon activité — Historique](img/personas/commercial/04-mon-activite-historique.png)
- **But / Objectif / Workflow** : historique des visites passées → retrouver un compte-rendu → consulter.

![Action — Clôture de visite](img/personas/commercial/05-mon-activite-cloture.png)
- **But** : la modale de clôture d'une visite en cours.
- **Objectif** : enregistrer le résultat (commande, encaissement, motif de non-vente).
- **Workflow** : cliquer *Clôturer* sur une visite en cours → saisir résultat/montant → valider.

### 5.3 Mes commandes — `/commandes` (+ action)

![Commandes terrain](img/personas/commercial/06-commandes.png)
- **But / Objectif / Workflow** : la liste de **ses** commandes (statut, priorité IA, alerte crédit) → suivre ses ventes → filtrer.

![Action — Nouvelle commande terrain](img/personas/commercial/07-commandes-nouvelle.png)
- **But** : le tiroir « Panier commande terrain ».
- **Objectif** : saisir une commande client sur le terrain (avec sync offline).
- **Workflow** : *Nouvelle commande terrain* → choisir le PDV → ajouter des lignes → *Transmettre*.

### 5.4 Disponibilité produits — `/disponibilite` (+ action)

![Disponibilité produits](img/personas/commercial/08-disponibilite.png)
- **But** : « Ce que vous pouvez vendre aujourd'hui » — dispo temps réel + prix société.
- **Objectif** : ne promettre que ce qui est réellement disponible.
- **Workflow** : filtrer par catégorie → vérifier la dispo → *Ajouter* au panier.

![Action — Panier](img/personas/commercial/09-disponibilite-panier.png)
- **But** : le tiroir panier alimenté depuis le catalogue de disponibilité.
- **Objectif** : transformer une sélection produit en commande.
- **Workflow** : *Ajouter* les produits → ouvrir *Panier* → choisir le PDV → *Transmettre la commande*.

### 5.5 Mes proformas — `/facturation` (+ action)

![Facturation — Proformas](img/personas/commercial/10-facturation-proformas.png)
- **But / Objectif / Workflow** : ses proformas et leur statut → suivre ses devis → convertir/relancer.

![Action — Créer une proforma](img/personas/commercial/11-facturation-proforma-builder.png)
- **But** : le constructeur de proforma (avec **encours crédit du client affiché avant saisie**).
- **Objectif** : produire un devis sur le terrain et l'envoyer par WhatsApp.
- **Workflow** : *Créer une proforma* → choisir le client (voir son plafond) → ajouter des produits → remise/paiement/envoi.

### 5.6 Mes relances — `/relances` (4 flux)

![Relances — Impayés](img/personas/commercial/12-relances-impayes.png)
- **But / Objectif / Workflow** : ses dossiers d'impayés → récupérer le cash pendant la tournée → suivre le pipeline.

![Relances — Réapprovisionnement](img/personas/commercial/13-relances-reappro.png)
- **But / Objectif / Workflow** : flux réappro le concernant → relancer → traiter.

![Relances — Prospection](img/personas/commercial/14-relances-prospection.png)
- **But / Objectif / Workflow** : flux prospection → entretenir les leads → relancer.

![Relances — Tous les flux](img/personas/commercial/15-relances-tous.png)
- **But / Objectif / Workflow** : vue consolidée de ses relances → tout voir → prioriser.

### 5.7 Mes clients — `/points-de-vente`

![Mes clients](img/personas/commercial/16-points-de-vente.png)
- **But / Objectif / Workflow** : **ses** PDV (CA, scoring, impayés) → connaître son portefeuille → ouvrir une fiche.

![Fiche client](img/personas/commercial/17-points-de-vente-detail.png)
- **But / Objectif / Workflow** : fiche client 360° → préparer sa visite → lire la synthèse IA.

---

# 6 · Commercial Freelance (`FREELANCE`)

**Utilisateur démo** : Kofi Agbessi · `freelance@demo.prospera.tg` · **Périmètre** : **son
portefeuille isolé**. **Posture** : indépendant — il achète au tarif grossiste et revend à **ses**
prix. Sa marge lui appartient et **n'est pas visible par la société**. La signature de ses écrans :
la distinction **CA client / coût société / marge freelance**.

### 6.1 Tableau de bord — `/dashboard`

![Tableau de bord FREELANCE](img/personas/freelance/01-dashboard.png)
- **But** : son portefeuille, ses prix client, sa marge du jour (badge *Portefeuille isolé*).
- **Objectif** : suivre son activité et sa marge propre.
- **Workflow** : lire CA client / marge du jour → consulter « Mes clients ».

### 6.2 Mon agenda — `/mon-activite` (3 onglets + action)

![Tournée du jour](img/personas/freelance/02-mon-activite-jour.png)
- **But / Objectif / Workflow** : agenda terrain cartographié → exécuter sa tournée → optimiser/lancer l'itinéraire.

![Semaine](img/personas/freelance/03-mon-activite-semaine.png)
- **But / Objectif / Workflow** : vue hebdo → planifier → naviguer.

![Historique](img/personas/freelance/04-mon-activite-historique.png)
- **But / Objectif / Workflow** : visites passées → retrouver un CR → consulter.

![Action — Clôture de visite](img/personas/freelance/05-mon-activite-cloture.png)
- **But / Objectif / Workflow** : modale de clôture → enregistrer le résultat → *Clôturer*, saisir, valider.

### 6.3 Mes commandes — `/commandes` (+ action)

![Mes commandes (mode freelance)](img/personas/freelance/06-commandes.png)
- **But** : ses commandes au tarif grossiste avec **prix société vs prix client et marge freelance**.
- **Objectif** : suivre ses achats grossiste et sa marge.
- **Workflow** : lire montant société / marge freelance → filtrer.

![Action — Nouvelle commande](img/personas/freelance/07-commandes-nouvelle.png)
- **But / Objectif / Workflow** : tiroir panier → passer une commande grossiste → choisir PDV, ajouter, transmettre.

### 6.4 Disponibilité produits — `/disponibilite` (+ action)

![Disponibilité](img/personas/freelance/08-disponibilite.png)
- **But / Objectif / Workflow** : dispo temps réel + prix société → sourcer sa revente → *Ajouter*.

![Action — Panier](img/personas/freelance/09-disponibilite-panier.png)
- **But / Objectif / Workflow** : tiroir panier → transformer la sélection en commande → ouvrir *Panier*, transmettre.

### 6.5 Mes proformas — `/facturation` (+ action)

![Proformas](img/personas/freelance/10-facturation-proformas.png)
- **But / Objectif / Workflow** : ses proformas → suivre ses devis → convertir/relancer.

![Action — Créer une proforma (avec son prix de revente)](img/personas/freelance/11-facturation-proforma-builder.png)
- **But** : constructeur de proforma avec **curseur de majoration** (prix société → prix client → sa marge).
- **Objectif** : produire un devis à ses prix, en gardant sa marge ≥ 12 %.
- **Workflow** : *Créer une proforma* → client → produits → ajuster la majoration → envoyer (alerte si marge < 12 %).

### 6.6 Mon portefeuille — `/points-de-vente`

![Mon portefeuille](img/personas/freelance/12-points-de-vente.png)
- **But / Objectif / Workflow** : **ses** PDV → connaître son portefeuille → ouvrir une fiche.

![Fiche client](img/personas/freelance/13-points-de-vente-detail.png)
- **But / Objectif / Workflow** : fiche 360° (avec sa marge jour) → préparer sa visite → lire la synthèse.

---

# 7 · Chargé de Prospection (`PROSPECTION`)

**Utilisateur démo** : Mawuena Ahi · `prospection@demo.prospera.tg` · **Périmètre** : ses zones et
prospects (portefeuille). **Posture** : il ne gère pas un portefeuille de clients, il travaille un
**territoire** — recenser une zone blanche, qualifier, arracher la 1ʳᵉ commande, **passer la main**
au commercial de secteur. Sa redevabilité : un compte ouvert doit *survivre* et *payer*.

### 7.1 Tableau de bord — `/dashboard`

![Tableau de bord PROSPECTION](img/personas/prospection/01-dashboard.png)
- **But** : « À trancher aujourd'hui » — les règles franchies les plus graves, l'entonnoir, la survie.
- **Objectif** : décider ce qu'il traite ce matin (pas une liste triée par score).
- **Workflow** : lire les 3 règles franchies → agir sur le montant en jeu → vérifier survie/passation.

### 7.2 Mon agenda — `/mon-activite` (3 onglets + action)

![Tournée du jour](img/personas/prospection/02-mon-activite-jour.png)
- **But / Objectif / Workflow** : agenda de conquête cartographié → exécuter ses visites → optimiser/lancer.

![Semaine](img/personas/prospection/03-mon-activite-semaine.png)
- **But / Objectif / Workflow** : vue hebdo → planifier → naviguer.

![Historique](img/personas/prospection/04-mon-activite-historique.png)
- **But / Objectif / Workflow** : visites passées → suivre un dossier → consulter.

![Action — Clôture de visite](img/personas/prospection/05-mon-activite-cloture.png)
- **But / Objectif / Workflow** : modale de clôture → consigner le résultat de qualification → *Clôturer*, saisir.

### 7.3 Mes commandes — `/commandes` (+ action)

![Mes commandes](img/personas/prospection/06-commandes.png)
- **But / Objectif / Workflow** : les 1ʳᵉˢ commandes qu'il ouvre → suivre ses ouvertures → filtrer.

![Action — Nouvelle commande](img/personas/prospection/07-commandes-nouvelle.png)
- **But / Objectif / Workflow** : tiroir panier → enregistrer une 1ʳᵉ commande (garde-fou crédit 1,5 M) → PDV, lignes, transmettre.

### 7.4 Disponibilité produits — `/disponibilite` (+ action)

![Disponibilité](img/personas/prospection/08-disponibilite.png)
- **But / Objectif / Workflow** : dispo temps réel + prix → ne promettre que le disponible → *Ajouter*.

![Action — Panier](img/personas/prospection/09-disponibilite-panier.png)
- **But / Objectif / Workflow** : tiroir panier → concrétiser une ouverture → ouvrir *Panier*, transmettre.

### 7.5 Mes proformas — `/facturation` (+ action)

![Proformas](img/personas/prospection/10-facturation-proformas.png)
- **But / Objectif / Workflow** : ses proformas de conquête → suivre ses devis → convertir/relancer.

![Action — Créer une proforma](img/personas/prospection/11-facturation-proforma-builder.png)
- **But / Objectif / Workflow** : constructeur (encours crédit affiché) → devis pour un prospect → client, produits, envoi WhatsApp.

### 7.6 Mes ouvertures — `/points-de-vente`

![Mes ouvertures](img/personas/prospection/12-points-de-vente.png)
- **But / Objectif / Workflow** : les PDV qu'il a ouverts → suivre leur santé → ouvrir une fiche.

![Fiche client](img/personas/prospection/13-points-de-vente-detail.png)
- **But / Objectif / Workflow** : fiche 360° → juger de la survie d'une ouverture → décider (relance, passation).

### 7.7 Ma conquête — `/prospection` (4 onglets) — **son écran central**

![Territoires](img/personas/prospection/14-prospection-territoires.png)
- **But** : recensement, conversion, poids de la desserte par zone.
- **Objectif** : concentrer l'effort sur les territoires rentables.
- **Workflow** : lire le recensement → activer/prioriser une zone (garde-fou 35 km).

![Carnet de prospects](img/personas/prospection/15-prospection-carnet.png)
- **But** : entonnoir + goulot, motifs de perte, fiche de qualification.
- **Objectif** : débloquer là où le travail est en panne.
- **Workflow** : repérer le goulot (« Offre envoyée ») → relancer les dossiers qui stagnent.

![Ouvertures & survie](img/personas/prospection/16-prospection-survie.png)
- **But** : cohortes mensuelles (vivant/dormant/mort/impayé), valeur nette par ouverture.
- **Objectif** : ouvrir des comptes qui **survivent et paient**.
- **Workflow** : analyser les cohortes → agir sur les dormants/impayés.

![Passation](img/personas/prospection/17-prospection-passation.png)
- **But** : les PDV ouverts que plus personne ne visite.
- **Objectif** : passer la main sous 45 j pour éviter la mortalité.
- **Workflow** : repérer les orphelins → transférer au commercial de secteur.

---

# 8 · Responsable Stock & Logistique (`RESP_STOCK`)

**Utilisateur démo** : Yao Mensah · `stock@demo.prospera.tg` · **Périmètre** : réseau logistique
(Lomé Port + Kara), voit la valeur d'achat mais **pas la marge commerciale**. **Posture** : garant de
la disponibilité (ruptures, couverture, taux de service) et **opérateur du moteur de réappro**.

### 8.1 Tableau de bord — `/dashboard`

![Tableau de bord RESP_STOCK](img/personas/resp_stock/01-dashboard.png)
- **But** : « Le système a travaillé cette nuit » + score logistique + décisions refusées par le garde-fou.
- **Objectif** : arbitrer ce que l'automatisation lui laisse et surveiller ruptures/rotation.
- **Workflow** : lire ce qui est parti seul / à valider → ouvrir le journal d'automatisation.

### 8.2 Commandes — `/commandes`

![Commandes RESP_STOCK](img/personas/resp_stock/02-commandes.png)
- **But / Objectif / Workflow** : la **charge de travail entrante** (pipeline, flux par entrepôt, charge picking) → anticiper la préparation → ne pas préparer les commandes bloquées crédit.

### 8.3 Opérations entrepôt — `/entrepot` (4 onglets)

![Préparation](img/personas/resp_stock/03-entrepot-preparation.png)
- **But / Objectif / Workflow** : charge du jour et vagues de picking (les 2 sites) → tenir le départ camion → arbitrer les vagues en surcharge.

![Expéditions & chargement](img/personas/resp_stock/04-entrepot-expedition.png)
- **But / Objectif / Workflow** : tournées et chargement → livrer à l'heure → contrôler le remplissage.

![Réceptions](img/personas/resp_stock/05-entrepot-reception.png)
- **But / Objectif / Workflow** : livraisons fournisseurs attendues → réceptionner et signaler les écarts → saisir le reçu, ouvrir un litige.

![Inventaire tournant](img/personas/resp_stock/06-entrepot-inventaire.png)
- **But / Objectif / Workflow** : comptages tournants → fiabiliser le stock → saisir, traiter les écarts.

### 8.4 Stock & Logistique — `/stock` (6 onglets) — **son écran central**

![Stock & logistique](img/personas/resp_stock/07-stock-stock.png)
- **But** : pilotage multi-entrepôts (ruptures, sous seuil, couverture, taux de service) + fiche produit avec bouton *Réapprovisionner*.
- **Objectif** : maintenir le taux de service en pilotant les ruptures et la rotation.
- **Workflow** : sous-onglets (Vue globale / Lomé Port / Kara / Alertes & ruptures / Préparation) → fiche produit → *Réapprovisionner*.

![Transferts inter-entrepôts](img/personas/resp_stock/08-stock-transferts.png)
- **But / Objectif / Workflow** : rééquilibrage entre sites → éviter rupture d'un côté / surstock de l'autre → arbitrer un transfert.

![Santé du stock](img/personas/resp_stock/09-stock-sante.png)
- **But / Objectif / Workflow** : capital dormant, DLC, obsolètes → limiter la décote → plan de sortie.

![Journal d'automatisation](img/personas/resp_stock/10-stock-journal-auto.png)
- **But / Objectif / Workflow** : trace des décisions auto → audit → ajuster.

![Sorties entrepôt](img/personas/resp_stock/11-stock-sorties.png)
- **But / Objectif / Workflow** : historique des sorties → dynamique produit → filtrer.

![Catalogue produits](img/personas/resp_stock/12-stock-catalogue.png)
- **But / Objectif / Workflow** : référentiel SKU → source produit → rechercher.

### 8.5 Approvisionnement — `/approvisionnement` (4 onglets)

![Réappro IA](img/personas/resp_stock/13-appro-reappro.png)
- **But** : produits en manque, quantité suggérée, **fournisseur retenu justifié**, regroupement, impact trésorerie.
- **Objectif** : réapprovisionner au meilleur coût sans casser la trésorerie.
- **Workflow** : lire la justification fournisseur → *Valider* (ligne ou bloc) / *Basculer* sur le secours.

![Commandes fournisseurs](img/personas/resp_stock/14-appro-commandes.png)
- **But / Objectif / Workflow** : carnet d'achats et suivi → suivre l'engagement et les réceptions → ouvrir une commande.

![Fournisseurs](img/personas/resp_stock/15-appro-fournisseurs.png)
- **But / Objectif / Workflow** : comparatif fournisseurs (prix/délai/fiabilité/dette) → choisir avec qui commander → comparer.

![Règles d'automatisation](img/personas/resp_stock/16-appro-regles.png)
- **But / Objectif / Workflow** : règles par produit (seuil, couverture, mode quantité, plafond, valideur) → cadrer le moteur → ajuster une règle.

---

# 9 · Gestionnaire Entrepôt (`GEST_ENTREPOT`)

**Utilisateur démo** : Edem Kpodo · `entrepot@demo.prospera.tg` · **Périmètre** : **son** entrepôt
(Lomé Port). **Posture** : il exécute le flux physique — picking, préparation, bons de livraison,
expéditions, réceptions. Aucun franc de CA ni de marge sur ses écrans : uniquement des choses à faire,
dans un ordre, avant une heure. Son menu est court (Tableau de bord, Mon entrepôt, Stock de mon site).

### 9.1 Tableau de bord — `/dashboard`

![Tableau de bord GEST_ENTREPOT](img/personas/gest_entrepot/01-dashboard.png)
- **But** : sa file de picking du jour, ses BL à éditer, son score de poste (délai prépa, erreurs picking).
- **Objectif** : savoir ce qu'il doit sortir et éditer aujourd'hui.
- **Workflow** : lire la file → traiter les BL en attente.

### 9.2 Mon entrepôt — `/entrepot` (4 onglets)

![Préparation](img/personas/gest_entrepot/02-entrepot-preparation.png)
- **But** : la charge du jour et les vagues de picking optimisées de **son** site.
- **Objectif** : tenir le cutoff camion (15 h 30).
- **Workflow** : suivre les vagues → cocher les lignes préparées.

![Expéditions & chargement](img/personas/gest_entrepot/03-entrepot-expedition.png)
- **But / Objectif / Workflow** : chargement des camions → charger le bon BL dans le bon camion → valider le chargement.

![Réceptions](img/personas/gest_entrepot/04-entrepot-reception.png)
- **But / Objectif / Workflow** : livraisons fournisseurs → réceptionner et **saisir les quantités reçues** (tout écart ouvre un litige, la dette est calculée sur le reçu) → contrôler, valider.

![Inventaire tournant](img/personas/gest_entrepot/05-entrepot-inventaire.png)
- **But / Objectif / Workflow** : comptages du jour → fiabiliser son stock → saisir, traiter les écarts.

### 9.3 Stock de mon site — `/stock`

![Stock — Lomé Port](img/personas/gest_entrepot/06-stock-stock.png)
- **But** : le stock de **son** site — emplacements, physique, réservé, disponible réel, par allée.
- **Objectif** : localiser et fiabiliser le stock physique (sans bruit de marge/réseau).
- **Workflow** : rechercher un produit/emplacement → filtrer par allée → vérifier physique/réservé/disponible.

---

# 10 · Directeur Administratif & Financier (`DAF`)

**Utilisateur démo** : Sena Fiagbe · `daf@demo.prospera.tg` · **Périmètre** : direction financière.
**Posture** : tient la trésorerie et la norme SYSCOHADA, arbitre ce qui entre et ce qui sort.
Principe : **le DG constate, le DAF arbitre** — tout sur son écran est un acte qu'il pose lui-même.

### 10.1 Tableau de bord — `/dashboard`

![Tableau de bord DAF](img/personas/daf/01-dashboard.png)
- **But** : « Ce qui attend votre signature » — chaque ligne renvoie à l'acte à poser.
- **Objectif** : traiter ses arbitrages financiers du jour.
- **Workflow** : parcourir les signatures en attente → ouvrir l'acte concerné.

### 10.2 Pilotage financier — `/pilotage-financier` — **son écran d'arbitrage**

![Pilotage financier DAF](img/personas/daf/02-pilotage-financier.png)
- **But** : run de paiement, BFR, marge nette par canal, encadrement du crédit, marge arrière, échéances fiscales.
- **Objectif** : décider quoi payer, quel crédit accorder, sans passer par le DG.
- **Workflow** : run de paiement (*Payer / Partiel / Reporter*, trésorerie recalculée) → BFR → arbitrages crédit.

### 10.3 Stock & Logistique — `/stock` (6 onglets)

Usage DAF = **valorisation** (le stock est un actif à surveiller).

![Stock & logistique](img/personas/daf/03-stock-stock.png)
- **But / Objectif / Workflow** : valeur du stock, coût immobilisé, marge produit → surveiller l'actif → fiche produit.

![Transferts inter-entrepôts](img/personas/daf/04-stock-transferts.png)
- **But / Objectif / Workflow** : coût des transferts → limiter l'immobilisation → arbitrer.

![Santé du stock](img/personas/daf/05-stock-sante.png)
- **But / Objectif / Workflow** : capital dormant → provisionner/écouler → plan de sortie.

![Journal d'automatisation](img/personas/daf/06-stock-journal-auto.png)
- **But / Objectif / Workflow** : trace des décisions auto → audit → parcourir.

![Sorties entrepôt](img/personas/daf/07-stock-sorties.png)
- **But / Objectif / Workflow** : historique des sorties → dynamique de valeur → filtrer.

![Catalogue produits](img/personas/daf/08-stock-catalogue.png)
- **But / Objectif / Workflow** : référentiel SKU → source produit → rechercher.

### 10.4 Approvisionnement — `/approvisionnement` (4 onglets)

![Réappro IA](img/personas/daf/09-appro-reappro.png)
- **But / Objectif / Workflow** : réappro suggéré → **valider au-dessus du plafond du RESP_STOCK (5 M)**, garde-fou trésorerie → valider/reporter.

![Commandes fournisseurs](img/personas/daf/10-appro-commandes.png)
- **But / Objectif / Workflow** : engagements d'achat → suivre les décaissements à venir → ouvrir une commande.

![Fournisseurs](img/personas/daf/11-appro-fournisseurs.png)
- **But** : **échéancier fournisseurs** (échu / J+7 / J+15 / J+30), encours de dette, marge arrière.
- **Objectif** : piloter ce qui sort et récupérer les ristournes.
- **Workflow** : lire l'échéancier → préparer le run de paiement.

![Règles d'automatisation](img/personas/daf/12-appro-regles.png)
- **But / Objectif / Workflow** : plafonds et valideurs → cadrer l'engagement automatique → ajuster.

### 10.5 Facturation & Créances — `/facturation` (3 onglets)

![Factures & créances](img/personas/daf/13-facturation-factures.png)
- **But / Objectif / Workflow** : créances, DSO, clients à risque, plafonds → piloter l'encaissement → analyser, renvoyer vers relances.

![Proformas](img/personas/daf/14-facturation-proformas.png)
- **But / Objectif / Workflow** : devis en cours → anticiper la facturation → suivre.

![E-facturation & avoirs](img/personas/daf/15-facturation-efacture.png)
- **But / Objectif / Workflow** : file e-facture (certification, rejets, archive) → garantir la conformité → corriger les rejets.

### 10.6 Relances & Impayés — `/relances` (4 flux)

![Relances — Impayés](img/personas/daf/16-relances-impayes.png)
- **But / Objectif / Workflow** : pipeline de recouvrement → accélérer l'encaissement → suivre les colonnes.

![Relances — Réapprovisionnement](img/personas/daf/17-relances-reappro.png)
- **But / Objectif / Workflow** : flux réappro → suivre → traiter.

![Relances — Prospection](img/personas/daf/18-relances-prospection.png)
- **But / Objectif / Workflow** : flux prospection → suivre → relancer.

![Relances — Tous les flux](img/personas/daf/19-relances-tous.png)
- **But / Objectif / Workflow** : vue consolidée → charge totale → prioriser.

### 10.7 Comptabilité — `/comptabilite`

![Comptabilité DAF](img/personas/daf/20-comptabilite.png)
- **But** : vue analytique (trésorerie & flux, journal, balance SYSCOHADA, créances 411, résultat, rapprochements) + DAF Copilot.
- **Objectif** : suivre la santé comptable et préparer la clôture.
- **Workflow** : parcourir les 6 onglets → contrôler trésorerie à 7 j et provisions.

---

# 11 · Comptable (`COMPTABLE`)

**Utilisateur démo** : Adjoa Mensah · `comptable@demo.prospera.tg` · **Périmètre** : comptabilité
siège. **Posture** : il saisit, rapproche et clôture — il travaille dans le détail des écritures, pas
dans l'arbitrage. Principe : **le DAF arbitre, le comptable produit**. Rien sur son écran n'est une
décision : ce sont des files de travail, et ce que chacune bloque en aval.

### 11.1 Tableau de bord — `/dashboard`

![Tableau de bord COMPTABLE](img/personas/comptable/01-dashboard.png)
- **But** : ses indicateurs de production (écritures saisies/jour, taux de rapprochement, suspens, clôture).
- **Objectif** : suivre sa charge et le délai de clôture.
- **Workflow** : lire le score → ouvrir la file de travail concernée.

### 11.2 Stock & Logistique — `/stock` (3 onglets)

![Stock & logistique](img/personas/comptable/02-stock-stock.png)
- **But / Objectif / Workflow** : valeur du stock (actif) → rapprocher la compta stock → consulter.

![Sorties entrepôt](img/personas/comptable/03-stock-sorties.png)
- **But / Objectif / Workflow** : historique des sorties → justifier des mouvements → filtrer.

![Catalogue produits](img/personas/comptable/04-stock-catalogue.png)
- **But / Objectif / Workflow** : référentiel SKU → source produit → rechercher.

### 11.3 Approvisionnement — `/approvisionnement` (4 onglets)

![Réappro IA](img/personas/comptable/05-appro-reappro.png)
- **But / Objectif / Workflow** : contexte réappro → comprendre l'origine des achats → consulter.

![Commandes fournisseurs](img/personas/comptable/06-appro-commandes.png)
- **But / Objectif / Workflow** : commandes réceptionnées → **passer l'écriture d'achat** (601/445/401) → saisir, avoir si écart.

![Fournisseurs](img/personas/comptable/07-appro-fournisseurs.png)
- **But / Objectif / Workflow** : encours de dette par fournisseur → rapprocher la dette 401 de sa source → pointer.

![Règles d'automatisation](img/personas/comptable/08-appro-regles.png)
- **But / Objectif / Workflow** : règles d'engagement → contexte → consulter.

### 11.4 Facturation & Créances — `/facturation` (3 onglets)

![Factures & créances](img/personas/comptable/09-facturation-factures.png)
- **But / Objectif / Workflow** : factures émises et leur encaissement → contrôler l'émission → parcourir.

![Proformas](img/personas/comptable/10-facturation-proformas.png)
- **But / Objectif / Workflow** : devis en cours → anticiper la facturation → suivre.

![E-facturation & avoirs](img/personas/comptable/11-facturation-efacture.png)
- **But / Objectif / Workflow** : file e-facture → **corriger les rejets, retransmettre, suivre la certification OTR** → traiter.

### 11.5 Comptabilité — `/comptabilite` — **son poste de travail**

![Comptabilité COMPTABLE](img/personas/comptable/12-comptabilite.png)
- **But** : lettrage du **compte 411**, remises de caisse terrain, déclaration TVA (avec bloquants),
  pièces à réclamer, checklist de clôture — plus journal, rapprochements, suspens, factures d'achat.
- **Objectif** : produire une compta juste et clôturer dans les délais.
- **Workflow** : lettrer le 411 (trancher sous 70 % de confiance) → traiter les écarts de caisse →
  préparer la TVA → réclamer les pièces manquantes → avancer la clôture.

---

# 12 · Responsable Marketing (`MARKETING`)

**Utilisateur démo** : Kossi Doheto · `marketing@demo.prospera.tg` · **Périmètre** : marketing &
campagnes. **Posture** : il **génère de la demande** (campagnes WhatsApp, promos, combos d'écoulement
de stock) ; il ne traite ni les commandes ni le terrain. Son écran central est le marketing opérateur.

### 12.1 Tableau de bord — `/dashboard`

![Tableau de bord MARKETING](img/personas/marketing/01-dashboard.png)
- **But** : prospects actifs, taux de conversion, campagnes en cours, zones à conquérir.
- **Objectif** : suivre la génération de demande.
- **Workflow** : lire les KPI → ouvrir la campagne concernée.

### 12.2 Stock & Logistique — `/stock` (3 onglets)

Usage marketing = repérer les **produits à écouler** pour monter des combos.

![Stock & logistique](img/personas/marketing/02-stock-stock.png)
- **But / Objectif / Workflow** : couverture/rotation → identifier le surstock à écouler → repérer les références.

![Sorties entrepôt](img/personas/marketing/03-stock-sorties.png)
- **But / Objectif / Workflow** : dynamique de sortie → cibler les produits qui tournent mal → filtrer.

![Catalogue produits](img/personas/marketing/04-stock-catalogue.png)
- **But / Objectif / Workflow** : référentiel SKU → construire un combo → rechercher.

### 12.3 Points de vente — `/points-de-vente`

![Points de vente](img/personas/marketing/05-points-de-vente.png)
- **But / Objectif / Workflow** : réseau et scoring IA → cibler les PDV d'une campagne → filtrer, ouvrir une fiche.

![Fiche point de vente](img/personas/marketing/06-points-de-vente-detail.png)
- **But / Objectif / Workflow** : fiche 360° → qualifier une cible → lire la synthèse.

### 12.4 Marketing & Campagnes — `/marketing` — **son écran central**

![Marketing opérateur](img/personas/marketing/07-marketing.png)
- **But** : campagnes, pipeline leads, segmentation IA, zones blanches, **combos écoulement stock à lancer**, ROI/coût d'acquisition.
- **Objectif** : lancer des campagnes rentables et écouler le surstock.
- **Workflow** : lire les combos IA → *lancer* (validation DG si remise ≥ 12 %) → suivre le ROI par campagne.

### 12.5 Studio réseaux sociaux — `/marketing/social` (5 onglets)

![Calendrier éditorial](img/personas/marketing/08-social-calendrier.png)
- **But / Objectif / Workflow** : calendrier multi-réseaux → planifier la production → programmer un post.

![Idées & modèles](img/personas/marketing/09-social-idees.png)
- **But / Objectif / Workflow** : idées terrain & modèles → nourrir le calendrier → ajouter au calendrier.

![Boîte de réception](img/personas/marketing/10-social-inbox.png)
- **But / Objectif / Workflow** : messages entrants → capter les demandes → convertir en lead.

![Ce que ça rapporte](img/personas/marketing/11-social-performance.png)
- **But / Objectif / Workflow** : performance réseaux → mesurer le ROI social → lire les indicateurs.

![Journal d'activité](img/personas/marketing/12-social-journal.png)
- **But / Objectif / Workflow** : trace des décisions → audit → annuler une action.

### 12.6 Automatisations — `/automatisations`

![Automatisations MARKETING](img/personas/marketing/13-automatisations.png)
- **But / Objectif / Workflow** : règles d'automatisation marketing (relances promo, campagnes déclenchées) → cadrer ce qui part seul → valider/ignorer les cibles.

---

# 13 · Responsable Recouvrement (`RECOUVREMENT`)

**Utilisateur démo** : Elom Adjavon · `recouvrement@demo.prospera.tg` · **Périmètre** : créances &
impayés (vue réseau). **Posture** : il récupère le cash — il priorise, relance, escalade et **bloque
le crédit**. Son écran central est Relances & Impayés (badge rouge permanent).

### 13.1 Tableau de bord — `/dashboard`

![Tableau de bord RECOUVREMENT](img/personas/recouvrement/01-dashboard.png)
- **But** : balance âgée priorisée par **valeur espérée** (montant × probabilité), impayés > 30 j, taux de recouvrement.
- **Objectif** : courir après l'argent réellement récupérable, pas seulement le plus gros montant.
- **Workflow** : lire la file priorisée IA → choisir le canal (WhatsApp/SMS/appel/visite) → lancer la relance.

### 13.2 Facturation & Créances — `/facturation`

![Factures & créances](img/personas/recouvrement/02-facturation-factures.png)
- **But / Objectif / Workflow** : reste à payer, échéance, mode de paiement, **plafond crédit** → savoir qui relancer et qui bloquer → onglets Créances ouvertes / En retard.

### 13.3 Relances & Impayés — `/relances` (4 flux) — **son écran central**

![Relances — Recouvrement impayés](img/personas/recouvrement/03-relances-impayes.png)
- **But** : le pipeline de recouvrement multi-canal (détection → planifiée → envoyée → réponse) + analyses IA.
- **Objectif** : maximiser le montant recouvré au moindre effort.
- **Workflow** : suivre les colonnes → traiter un dossier → escalader / **bloquer le crédit** (tracé) au-delà de 60 j.

![Relances — Réapprovisionnement](img/personas/recouvrement/04-relances-reappro.png)
- **But / Objectif / Workflow** : flux réappro → contexte → traiter.

![Relances — Prospection](img/personas/recouvrement/05-relances-prospection.png)
- **But / Objectif / Workflow** : flux prospection → contexte → suivre.

![Relances — Tous les flux](img/personas/recouvrement/06-relances-tous.png)
- **But / Objectif / Workflow** : vue consolidée → charge totale de relance → prioriser.

### 13.4 Points de vente — `/points-de-vente`

![Points de vente](img/personas/recouvrement/07-points-de-vente.png)
- **But / Objectif / Workflow** : impayés total & clients à risque, scoring IA → savoir chez qui aller et qui bloquer → ouvrir une fiche.

![Fiche point de vente](img/personas/recouvrement/08-points-de-vente-detail.png)
- **But / Objectif / Workflow** : fiche 360° (historique de paiement) → décider relance/blocage → lire la synthèse.

### 13.5 Automatisations — `/automatisations`

![Automatisations RECOUVREMENT](img/personas/recouvrement/09-automatisations.png)
- **But / Objectif / Workflow** : règles de relance automatique multi-canal → cadrer ce qui part seul → valider/ignorer les cibles, régler les seuils.

### 13.6 Comptabilité — `/comptabilite`

![Comptabilité RECOUVREMENT](img/personas/recouvrement/10-comptabilite.png)
- **But / Objectif / Workflow** : créances clients (411) et encaissements → rapprocher recouvrement et compta → consulter les onglets créances/trésorerie.

---

## Annexe — comment ces captures ont été produites

Toutes les images de ce guide sont des captures **réelles** de l'application, prises automatiquement
dans la peau de chaque persona (authentification injectée par rôle) via le script
[`scripts/capture-personas.mjs`](../../scripts/capture-personas.mjs). Pour les régénérer après une
évolution de l'UI :

```bash
npm run dev                 # démarre l'app sur http://localhost:3002
node scripts/capture-personas.mjs            # tous les personas
node scripts/capture-personas.mjs "DG,DAF"   # un sous-ensemble
```

Les captures sont écrites dans `docs/guide-utilisateur/img/personas/<rôle>/` et suivent la
numérotation reprise dans ce document.












