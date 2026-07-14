# SUPERVISEUR — Superviseur de Zone

## Identité

| | |
|---|---|
| Rôle (`UserRole`) | `SUPERVISEUR` |
| Libellé | Superviseur de Zone |
| Utilisateur démo | Efua Koffi · superviseur@demo.prospera.tg · `password123` |
| Périmètre | **Zone Lomé Nord** — 1 zone, 4 commerciaux, 149 PDV |
| Couleur d'avatar | `bg-indigo-600` |
| Posture | Chef d'équipe terrain. Il **pilote l'activité** : les tournées, la caisse, l'exécution en magasin. |

## Le poste

> Le superviseur pilote **l'activité** (les inputs : visites, couverture, cash, exécution).
> Le responsable des ventes pilote **le résultat** (les outputs : CA, marge, mix, quota).

C'est la ligne de partage. Le superviseur ne voit ni la marge, ni le P&L, ni les
autres zones. Il voit ses hommes, ses clients, et sa caisse.

## Périmètre de données

Tout ce qu'il consulte est restreint à sa zone par [`getPerimetre`](../../src/lib/perimetre.ts) :
`type: 'ZONE'`, une zone, l'équipe rattachée. Le rattachement fait foi — il vient du
registre des zones (`zone.superviseur`), pas d'un champ libre sur le compte.

| Écran | Sans périmètre (avant) | Avec périmètre |
|---|---|---|
| Points de vente | 623 (réseau) | **149** (Lomé Nord) |
| Commandes | 1 834 | **444** |
| Relances | 430 | **91** |
| Commerciaux | 22 | **4** |

## Menu

7 liens. **Pas de Facturation** (il arbitre les remises via les validations, il n'émet
pas de facture) et **pas d'Objectifs & Quotas** (il exécute un quota, il ne le fixe pas).

```
OPÉRATIONS
  1. Tableau de bord          /dashboard
  2. Tournées & Cash          /tournees        ← son écran
  3. Commandes                /commandes
  4. Stock & Logistique       /stock
  5. Relances & Impayés       /relances        [badge]
COMMERCIAL
  6. Points de vente          /points-de-vente
  7. Commercial terrain       /commercial
PILOTAGE
  8. Équipe & Performance     /equipe
```

---

## Détail

### 1. Tableau de bord — `/dashboard`

`DashboardSuperviseur` — dédié. Ouvre sur trois choses : ce qu'il doit **arbitrer
maintenant**, l'état de ses **tournées** (couverture PJP, strike rate, écart de caisse),
et les **PDV de sa zone** qui décrochent. Aucun agrégat réseau.

### 2. Tournées & Cash — `/tournees` — **son écran principal**

`TourneesView`, alimenté par [`tournees-builder`](../../src/lib/tournees-builder.ts).
Ce que supervise réellement un chef d'équipe chez un distributeur :

- **Le PJP** (plan de journée permanent) : visites planifiées vs réalisées, par commercial.
- **Le strike rate** : combien de visites se transforment en commande. Une visite sans
  commande, c'est du carburant brûlé.
- **Le cash** : le commercial encaisse en espèces sur le terrain et remet la caisse le
  soir. **L'écart de caisse est le premier signal de fraude**, et personne d'autre que le
  superviseur ne le voit.
- **L'exécution en magasin** : références présentes, prix affiché conforme, PLV, facing.

Aucun de ces indicateurs n'existe sur l'écran du DG. C'est ce qui fait que le poste
est un poste.

### 3. Validations — délégation et escalade

Via `ValidationsPanel`, sur son tableau de bord. Sa **délégation** :

| | Superviseur | Responsable des Ventes | Au-delà |
|---|---|---|---|
| Remise | ≤ 7 % | ≤ 12 % | DC |
| Plafond crédit | ≤ 1 M F | ≤ 5 M F | DC |
| Retour / avoir / casse | ≤ 250 K F | ≤ 1,5 M F | DC |

Ce qu'il ne peut pas trancher n'est **pas refusé : ça remonte**. Il reste responsable du
suivi du dossier escaladé. C'est ce mécanisme — et non le menu — qui relie les deux postes.
Voir [`validations-registry`](../../src/lib/registries/validations-registry.ts).

### 4-8. Commandes, Stock, Relances, PDV, Commercial terrain, Équipe

Écrans partagés, **filtrés sur sa zone**. `/commercial` est sa carte terrain : statut de
chaque commercial, alertes GPS, coaching prioritaire.

---

## Ce qu'il ne voit pas, et pourquoi

- **La marge** — il n'a aucun levier dessus. C'est le mix, et le mix est arbitré au niveau région.
- **Les autres zones** — il ne les pilote pas, et les y exposer transforme le classement
  interne en outil de comparaison plutôt qu'en outil de progrès.
- **La facturation** — il arbitre la remise en amont, il ne l'émet pas.
