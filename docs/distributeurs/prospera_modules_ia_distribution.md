# PROSPERA — Cartographie des Modules & IA
## Distribution & Grossistes — Documentation des Modules
### Version 1.1 — Juin 2026
*Document confidentiel — Usage interne commercial*

---

## Rôles couverts par la plateforme (13 profils)

| # | Rôle | Modules principaux |
|---|------|-------------------|
| 1 | Directeur Général (DG) | Dashboard, Finance, CRM, Stock |
| 2 | Directeur Commercial (DC) | Dashboard, Commercial, Équipes, Marketing |
| 3 | Responsable des Ventes | CRM, Commandes, Commercial |
| 4 | Superviseur de Zone | Commercial, CRM, Relances |
| 5 | Commercial Terrain (salarié) | Terrain, Commandes, CRM, WhatsApp |
| 6 | **Commercial Freelance / Indépendant** | Terrain, Commandes, CRM *(portefeuille propre)*, Tarifs client |
| 7 | Chargé de Prospection | CRM, Marketing, Cartographie |
| 8 | Responsable Stock & Logistique | Stock, Commandes, Logistique |
| 9 | Gestionnaire Entrepôt | Stock, Commandes |
| 10 | Responsable Comptabilité / DAF | Facturation, Comptabilité, Encaissements |
| 11 | Comptable | Comptabilité, Facturation |
| 12 | Responsable Marketing | Marketing, CRM, WhatsApp |
| 13 | Responsable Recouvrement & Crédit Client | Facturation, Relances, CRM |

---

## Fonctionnalité transverse — Réseau mixte salariés & freelances

> Les grandes sociétés de distribution (BB Lomé, SNB…) emploient souvent un **réseau hybride** : commerciaux salariés **et** commerciaux **freelance / indépendants** qui ne sont pas liés contractuellement à l'entreprise mais vendent ses produits avec **leur propre portefeuille clients** et **leurs propres prix de vente** pour préserver leur marge.

| Capacité | Description |
|----------|-------------|
| **Double tarification** | Prix société (grossiste → commercial) distinct du prix client (commercial → détaillant) |
| **Grille tarifaire société** | Prix de référence BB Lomé / SNB — visible par tous, non modifiable par le freelance |
| **Grille tarifaire freelance** | Chaque indépendant fixe **ses prix client** par produit ou par PDV — marge calculée automatiquement |
| **Portefeuille isolé** | Le freelance ne voit que **ses** points de vente ; les autres freelances ne voient pas ses clients |
| **Vue société consolidée** | La direction voit volumes commandés et CA société, sans exposer les marges freelance |
| **Commande double flux** | Commande terrain au **prix société** → facturation société ; devis / facture client au **prix freelance** (hors périmètre société ou en module séparé) |
| **Commissions & reversements** | Suivi de ce que le freelance doit à la société vs ce qu'il encaisse chez son client |
| **Plafond crédit séparé** | Crédit accordé par la société au freelance (pas au PDV final) · créance PDV gérée par le freelance |

---

## TABLEAU 1 — Modules, Sous-modules & Rôles IA

| # | Module Principal | Sous-modules | IAs impliquées | Gain de temps estimé |
|---|-----------------|--------------|----------------|----------------------|
| **1** | **Dashboard & Pilotage** | • Dashboard DG (CA, créances, stock, zones)<br>• Dashboard Directeur Commercial<br>• Dashboard Responsable Ventes / Superviseur<br>• Dashboard DAF<br>• Dashboard Stock & Logistique<br>• Vue par zone / produit / commercial (drill-down)<br>• Alertes du jour par rôle | • **Copilot IA** : Q&A contextuelles par rôle<br>• **Alertes IA** : priorités commerciales et financières<br>• **Prévision CA** : 30 / 60 / 90 jours par zone et produit<br>• **Synthèse IA direction** : rapport consolidé quotidien | ⏱ **-3h/jour** par manager sur la consolidation manuelle |
| **2** | **CRM Points de Vente & Pipeline** | • Fiche point de vente 360°<br>• Pipeline : Prospection → Fidèle → À risque<br>• Historique commandes / livraisons / paiements<br>• Score potentiel & risque churn<br>• Carte couverture points de vente<br>• Segmentation clients (actifs, dormants, VIP)<br>• **Attribution portefeuille** : salarié ou freelance propriétaire<br>• **Prix client personnalisé** par PDV (freelance uniquement) | • **Scoring IA point de vente** (0–100)<br>• **Détection churn** : baisse commandes anticipée<br>• **Cartographie IA** : zones blanches à fort potentiel<br>• **Recommandation produits** selon profil d'achat<br>• **Alerte client à risque** : impayé ou inactivité<br>• **Suggestion marge optimale** pour freelances | ⏱ **-40 min/client** sur l'analyse manuelle du potentiel |
| **3** | **Commercial Terrain & Tournées** | • Carte GPS temps réel (Google Maps)<br>• Missions & tournées journalières<br>• Validation visites (géofencing + photo)<br>• Objectifs visites / commandes / CA<br>• Gamification (classements, badges, défis)<br>• Voice-to-CRM & rapport soir auto<br>• Mode offline complet | • **Optimisation tournées IA** : itinéraire + priorités<br>• **Coaching commercial IA** : écarts vs objectifs<br>• **Alerte proximité** : clients à visiter en priorité<br>• **Rapport soir IA** : synthèse visites et commandes<br>• **Zone map IA** : couverture et gaps territoriaux | ⏱ **+50 % de visites/jour** par commercial |
| **4** | **Prise de Commande & Catalogue** | • Catalogue produit numérique (photos, prix, promo)<br>• Prise de commande terrain (offline)<br>• Vérification stock avant validation<br>• Historique commandes par point de vente<br>• Bons de commande & devis auto<br>• Commande WhatsApp intégrée<br>• **Prix société** (catalogue grossiste) vs **prix client freelance**<br>• **Calcul marge** automatique par ligne de commande<br>• Devis client généré au tarif freelance (PDF / WhatsApp) | • **Recommandation panier IA** : produits à proposer<br>• **Prédiction réapprovisionnement** : moment optimal de commande<br>• **Détection erreurs commande** : quantités / références atypiques<br>• **Analyse tendances** : produits montants / déclinants<br>• **Alerte marge faible** : prix client sous seuil rentable | ⏱ **-25 min/commande** ; zéro commande perdue sur le terrain |
| **5** | **Gestion de Stock & Logistique** | • Stock multi-entrepôts temps réel<br>• Seuils de réappro & alertes rupture<br>• Inventaires & écarts stock<br>• Préparation commandes entrepôt<br>• Bons de livraison & suivi tournée livraison<br>• Réception & sorties stock | • **Prévision demande IA** par produit et zone<br>• **Alertes rupture / surstock** : seuils dynamiques<br>• **Optimisation préparation** : ordre de picking suggéré<br>• **Analyse rotation stock** : SKU lents vs rapides | ⏱ **-60 % du temps** de réconciliation stock physique / système |
| **6** | **Facturation & Créances** | • Génération factures conformes UEMOA<br>• Devis, bons de commande, avoirs<br>• Suivi créances par âge de dette<br>• Plafonds crédit par point de vente<br>• Blocage commande si dépassement crédit<br>• Tableau créances : facturé / en retard / recouvré<br>• **Facture société → freelance** (prix grossiste)<br>• **Facture freelance → client** (prix indépendant, hors livres société)<br>• **Suivi reversement** : dette freelance envers la société | • **Scoring crédit client IA** : plafond recommandé<br>• **Priorisation créances** : risque et montant<br>• **Prévision encaissement** : cash attendu 7 / 30 jours<br>• **Détection anomalies facturation** : doublons, écarts<br>• **Scoring crédit freelance** : encours max société → indépendant | ⏱ **-2h/jour** sur la facturation et le suivi manuel des impayés |
| **7** | **Encaissements & Mobile Money** | • Encaissement MoMo depuis fiche client / commande<br>• MTN, Orange, Wave, Airtel, M-Pesa<br>• Réconciliation auto facture ↔ paiement<br>• Registre encaissements terrain<br>• Vue DAF consolidée | • **Validation IA MoMo** : doublons et erreurs<br>• **Réconciliation IA** : rapprochement automatique<br>• **Détection fraude espèces** : écarts terrain / caisse<br>• **Prévision trésorerie** 7 jours | ⏱ Zéro réconciliation manuelle ; encaissement instantané |
| **8** | **Relances & Recouvrement Clients** | • Relances impayés multi-canal<br>• Escalade : WhatsApp → SMS → commercial → manager<br>• Relances réapprovisionnement (préventives)<br>• Historique relances par client<br>• Scripts de relance contextuels<br>• Calendrier recouvrement | • **Priorisation relances IA** : probabilité de paiement<br>• **Choix canal IA** : WhatsApp / SMS / visite<br>• **Messages pré-rédigés IA** : ton adapté au profil<br>• **Plan recouvrement IA** : séquence d'actions optimale | ⏱ **-75 % du temps** de relance manuelle ; -30 à 50 % créances impayées |
| **9** | **Marketing & Prospection** | • Dashboard marketing<br>• Gestion leads & prospects terrain<br>• Campagnes promotions ciblées<br>• Segmentation clients<br>• Chatbot WhatsApp acquisition<br>• Défis commerciaux gamifiés<br>• Taux conversion prospect → client actif | • **Scoring prospects IA** : priorisation prospection<br>• **Segmentation IA** : clusters comportementaux<br>• **Campagnes IA** : ciblage et timing optimaux<br>• **Copilot marketing** : analyse conversion<br>• **Cartographie prospection** : zones à conquérir | ⏱ **+35 % conversion** leads ; prospection ciblée |
| **10** | **Comptabilité & Finance** | • Comptabilité SYSCOHADA<br>• Journal & écritures auto depuis factures<br>• Rapprochements bancaires / MoMo<br>• Trésorerie multi-zones<br>• Budget & contrôle de gestion<br>• Export comptable & reporting DAF | • **DAF Copilot IA** : synthèse financière<br>• **Prévision cash IA** : pics et tensions trésorerie<br>• **Analyse marge** par produit, zone, commercial<br>• **Alertes écarts budget** : dépassements signalés | ⏱ **-5h/semaine** sur consolidation et clôture |
| **11** | **Équipes & Performance Commerciale** | • Fiche commercial & KPIs individuels<br>• Objectifs visites / CA / commandes<br>• Carte zones-commerciaux<br>• Benchmarking inter-équipes<br>• Historique performance<br>• Pilotage superviseurs<br>• **Typologie agent** : salarié vs freelance<br>• **Marge nette freelance** (visible uniquement par l'indépendant et la direction)<br>• **Classement séparé** salariés / freelances | • **Performance gap IA** : écart vs objectif<br>• **Coaching IA** : actions correctives par agent<br>• **Benchmarking IA** : meilleures pratiques identifiées<br>• **Prévision CA par commercial**<br>• **Recommandation prix client** pour optimiser marge freelance | ⏱ **-2h/semaine** par superviseur sur le suivi équipe |

---

## TABLEAU 2 — Description des Processus par Module

| # | Module | Description du processus |
|---|--------|--------------------------|
| **1** | **Dashboard & Pilotage** | Prospera centralise les indicateurs clés de la distribution — ventes, stock, créances, couverture terrain — dans des tableaux de bord adaptés à chaque niveau hiérarchique. Un assistant IA permet d'interroger les données en langage naturel et de recevoir les priorités du jour sans consolidation manuelle. |
| **2** | **CRM Points de Vente & Pipeline** | Chaque point de vente dispose d'une fiche consolidée regroupant son historique commercial, géographique et financier. Le pipeline structure le parcours du prospect jusqu'au client fidèle. Pour les freelances, chaque PDV est rattaché à un portefeuille privé avec des conditions tarifaires propres, indépendantes de la grille société. |
| **3** | **Commercial Terrain & Tournées** | Les commerciaux reçoivent chaque jour un plan de visite optimisé et travaillent en mode offline sur le terrain. Leurs visites sont validées, leurs performances suivies en temps réel et leurs comptes rendus remontés automatiquement vers le siège. |
| **4** | **Prise de Commande & Catalogue** | La prise de commande est digitalisée depuis le terrain ou WhatsApp. Le commercial salarié commande au tarif société. Le freelance commande au **prix grossiste** auprès de la société tout en proposant un **prix client différent** à son détaillant — sa marge est calculée et suivie automatiquement. |
| **5** | **Gestion de Stock & Logistique** | Le stock est piloté en temps réel entre entrepôts, préparations et livraisons. Les seuils, ruptures et surstocks sont surveillés automatiquement pour aligner l'offre disponible avec la demande terrain. |
| **6** | **Facturation & Créances** | Les documents commerciaux sont générés automatiquement à partir des commandes et livraisons. Les créances sont suivies par ancienneté, chaque client dispose d'un plafond de crédit recommandé par l'IA et les nouvelles commandes peuvent être bloquées en cas de dépassement. |
| **7** | **Encaissements & Mobile Money** | Les paiements sont digitalisés via Mobile Money et rapprochés instantanément des factures correspondantes. La direction dispose d'une vision consolidée des encaissements terrain et siège. |
| **8** | **Relances & Recouvrement Clients** | Prospera déclenche des relances préventives (réapprovisionnement) et curatives (impayés) selon le profil de chaque client. Le canal, le message et l'escalade sont déterminés par l'IA pour maximiser le taux de réponse et de paiement. |
| **9** | **Marketing & Prospection** | Le module structure l'acquisition de nouveaux points de vente et l'animation commerciale des clients existants. L'IA identifie les zones et segments prioritaires, pilote les campagnes et mesure leur efficacité. |
| **10** | **Comptabilité & Finance** | Les flux commerciaux alimentent automatiquement la comptabilité et les rapprochements financiers. Le DAF dispose d'outils de pilotage, de prévision et de reporting adaptés aux exigences locales. |
| **11** | **Équipes & Performance Commerciale** | Chaque niveau de management suit la performance des commerciaux et des zones en temps réel. L'IA identifie les écarts, propose du coaching ciblé et met en évidence les meilleures pratiques à répliquer. |

---

## Récapitulatif ROI par Module

> **Note sur la méthodologie** : Les projections ci-dessous sont des **estimations indicatives**, construites sur les benchmarks de la distribution en zone UEMOA/CEMAC. Profil retenu : distributeur type avec **5 milliards FCFA de CA annuel**, **40 commerciaux**, **2 000 points de vente actifs**, **3 entrepôts** et **8 % de créances impayées** en départ. Ces chiffres constituent un ordre de grandeur à adapter selon la taille et le contexte de chaque distributeur.

| # | Module | Levier de valeur | Heures économisées / an | Projection gain annuel (FCFA) |
|---|--------|-----------------|------------------------|-------------------------------|
| 1 | Dashboard & Pilotage | Décisions plus rapides, moins de réunions de consolidation | **~3 900 h** | **15 – 25 M FCFA** |
| 2 | CRM Points de Vente & Pipeline | Meilleure sélection clients, rétention, moins de churn | **~800 h** | **80 – 120 M FCFA** |
| 3 | Commercial Terrain & Tournées | +50 % visites, plus de commandes captées | **~2 000 h** | **120 – 180 M FCFA** |
| 4 | Prise de Commande & Catalogue | Zéro commande perdue, panier moyen augmenté | **~3 200 h** | **200 – 350 M FCFA** |
| 5 | Gestion de Stock & Logistique | Moins de ruptures et surstocks, marge préservée | **~1 500 h** | **50 – 90 M FCFA** |
| 6 | Facturation & Créances | Facturation sans erreur, créances mieux suivies | **~1 200 h** | **40 – 70 M FCFA** |
| 7 | Encaissements & Mobile Money | Fraude espèces éliminée, réconciliation instantanée | **~1 460 h** | **60 – 90 M FCFA** |
| 8 | Relances & Recouvrement | -30 à 50 % impayés, trésorerie libérée | **~2 400 h** | **80 – 150 M FCFA** |
| 9 | Marketing & Prospection | Nouveaux points de vente, campagnes plus efficaces | **~600 h** | **50 – 100 M FCFA** |
| 10 | Comptabilité & Finance | Clôture plus rapide, trésorerie mieux pilotée | **~520 h** | **25 – 45 M FCFA** |
| 11 | Équipes & Performance | Productivité commerciale, coaching ciblé | **~1 040 h** | **40 – 70 M FCFA** |
| | **TOTAL ESTIMÉ** | | **≈ 18 600 h / an** | **760 – 1 290 M FCFA / an** |

---

### Hypothèses de calcul (résumé)

| Paramètre | Valeur retenue |
|-----------|---------------|
| Chiffre d'affaires annuel | 5 000 000 000 FCFA |
| Points de vente actifs | 2 000 |
| Commerciaux terrain (dont ~30 % freelances) | 40 |
| Commandes / mois | 8 000 |
| Créances impayées initiales | 8 % du CA |
| Entrepôts | 3 |
| Coût horaire moyen équipe cadre | 3 000 FCFA/h |

> Ces projections sont établies à titre d'illustration pour accompagner la démarche commerciale. Un audit de démarrage permet d'affiner ces estimations à la situation réelle du distributeur client.

---

*Document confidentiel — Prospera © 2026*
