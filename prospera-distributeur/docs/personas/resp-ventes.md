# RESP_VENTES — Responsable des Ventes

## Identité

| | |
|---|---|
| Rôle (`UserRole`) | `RESP_VENTES` |
| Libellé | Responsable des Ventes |
| Utilisateur démo | Kodjo Agbeko · ventes@demo.prospera.tg · `password123` |
| Périmètre | **Région Grand Lomé** — 4 zones, 4 superviseurs, 14 commerciaux, 447 PDV |
| Couleur d'avatar | `bg-blue-600` |
| Posture | Porte le quota d'une région. Il **pilote le résultat** : atterrissage, mix, marge. |

## Le poste

> Le superviseur pilote **l'activité** (les inputs : visites, couverture, cash, exécution).
> Le responsable des ventes pilote **le résultat** (les outputs : CA, marge, mix, quota).

Il pilote **par zone, à travers ses superviseurs** — jamais commercial par commercial.
Le détail visite-par-visite et la caisse appartiennent au niveau du dessous.

## Périmètre de données

`type: 'REGION'` — les zones de sa région, déduites du registre
(`region.resp_ventes`), pas d'un champ libre. Voir [`getPerimetre`](../../src/lib/perimetre.ts).

| Écran | Sans périmètre (avant) | Avec périmètre |
|---|---|---|
| Points de vente | 623 (réseau) | **447** (Grand Lomé) |
| Commandes | 1 834 | **1 337** |
| Relances | 430 | **307** |
| Commerciaux | 22 | **14** |

## Organigramme

```
DC (Ama Dzobo)
└── RESP_VENTES — Kodjo Agbeko · Région Grand Lomé
    ├── SUPERVISEUR — Efua Koffi       · Zone Lomé Nord   (4 commerciaux)
    ├── SUPERVISEUR — Akouvi Bediako   · Zone Lomé Sud    (4)
    ├── SUPERVISEUR — Selom Amevor     · Zone Lomé Centre (3)
    └── SUPERVISEUR — Rachidou Bawa    · Zone Lomé Est    (3)
```

## Menu

7 liens. **Pas de Tournées & Cash** : il ne suit pas la caisse commercial par commercial.

```
OPÉRATIONS
  1. Tableau de bord          /dashboard
  2. Commandes                /commandes
  3. Stock & Logistique       /stock
  4. Facturation & Proforma   /facturation     [badge]
  5. Relances & Impayés       /relances        [badge]
COMMERCIAL
  6. Points de vente          /points-de-vente
  7. Commercial terrain       /commercial
PILOTAGE
  8. Objectifs & Quotas       /objectifs       ← son écran
  9. Équipe & Performance     /equipe
```

---

## Détail

### 1. Tableau de bord — `/dashboard`

`DashboardRespVentes` — dédié. Ouvre sur **l'atterrissage de la région** (la région
rentre-t-elle dans son quota au rythme actuel ?), la liste de **ses zones** avec leur
superviseur et leur écart projeté, et les **escalades reçues** du terrain.

### 2. Objectifs & Quotas — `/objectifs` — **son écran principal**

`ObjectifsView`, alimenté par [`objectifs-builder`](../../src/lib/objectifs-builder.ts).
Trois questions qui ne se posent qu'à son niveau :

- **L'atterrissage** — au rythme actuel, où finit la région à J+30 ? C'est l'écart
  *projeté* au quota, pas le réalisé à date. Avec le rythme requis par jour ouvré pour
  rattraper.
- **L'allocation** — le quota région se découpe en quotas de zone. C'est lui qui décide
  qui porte quoi, et qui rééquilibre en cours de mois (réaffecter un commercial d'une
  zone qui surperforme vers une zone qui décroche).
- **Le mix** — vendre 100 M de riz à 9 % de marge ou 70 M de boissons à 18 %, ce n'est
  pas le même mois. Le superviseur ne voit pas la marge ; le responsable des ventes ne
  pilote que ça. Part réalisée vs part cible, par famille.

S'y ajoute la **DN** (distribution numérique) : le % de PDV du territoire ayant commandé
sur la période. C'est l'indicateur de couverture réelle qu'on présente au DC.

### 3. Validations — il tranche les escalades

Via `ValidationsPanel`. Sa **délégation** : remise ≤ 12 %, crédit ≤ 5 M F, avoir ≤ 1,5 M F.
Il reçoit ce que les superviseurs ne peuvent pas trancher, et fait remonter au DC ce qui
dépasse sa propre limite. C'est lui qui **fixe** la grille que les superviseurs appliquent.

### 4-9. Commandes, Stock, Facturation, Relances, PDV, Commercial terrain, Équipe

Écrans partagés, **filtrés sur sa région**. Il garde `/facturation` : il arbitre les
proformas et les conditions client.

---

## Ce qu'il ne voit pas, et pourquoi

- **Les tournées et la caisse au commercial** — ce n'est pas son niveau. S'il descend là,
  il court-circuite ses superviseurs et le poste de superviseur perd son sens.
- **Les autres régions** — hors périmètre.
