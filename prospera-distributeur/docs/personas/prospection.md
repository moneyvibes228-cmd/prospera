# PROSPECTION — Chargé de Prospection

## Identité

| | |
|---|---|
| Rôle (`UserRole`) | `PROSPECTION` |
| Libellé | Chargé de Prospection |
| Utilisateur démo | Mawuena Ahi · prospection@demo.prospera.tg · `password123` |
| Territoires | Lomé Est (conquête) · Vogan (recensement) · Aného (abandonnée) |
| Couleur d'avatar | `bg-cyan-600` |
| Posture | Il ne gère pas un portefeuille : il travaille un **territoire**. Recenser une zone blanche, qualifier, arracher la 1ʳᵉ commande, **passer la main** au commercial de secteur. |

## Le poste, correctement modélisé

Un prospecteur n'est pas un VRP à qui on aurait retiré des clients. Son unité de travail
n'est pas le PDV, c'est **la zone et le lead**. Et surtout : ouvrir un compte ne suffit pas.
Un compte qui meurt à M+3, ou qui ne paie jamais sa 1ʳᵉ commande, a **détruit** de la valeur —
il a coûté son acquisition sans rien rapporter. C'est la redevabilité du poste, et c'est ce
que mesurent ses KPI.

Trois objets métier portent tout ça — [`prospection-registry.ts`](../../src/lib/registries/prospection-registry.ts) :

| Objet | Ce qu'il est |
|---|---|
| `ZoneConquete` | Le territoire : recensement (recensés/estimés), distance dépôt, coût de desserte, concurrent installé |
| `Prospect` | Le commerce qualifié — **pas encore un `PointDeVente`** : surface, achalandage, capacité de paiement, motif de blocage |
| `Ouverture` | Ce qu'il a ouvert, et ce que c'est devenu : réachat M+1, survie M+3, impayé, transfert au secteur |

### Garde-fous

Quatre règles, évaluées sur les données réelles par `buildAlertesConquete` — ce ne sont pas
des décorations, elles expliquent les échecs constatés :

- 1ʳᵉ commande à crédit plafonnée à **1,5 M FCFA** (sans historique, aucun crédit au-delà)
- au-delà de **35 km** du dépôt, la desserte mange la marge
- un dossier sans contact depuis **21 j** est en train de mourir
- **passation au commercial de secteur sous 45 j** — sinon le PDV n'entre dans aucune tournée et s'éteint

## Menu

```
OPÉRATIONS
  1. Tableau de bord          /dashboard
  2. Mon agenda               /mon-activite
  3. Mes commandes            /commandes
  4. Disponibilité produits   /disponibilite
  5. Mes proformas            /facturation
COMMERCIAL
  6. Mes ouvertures           /points-de-vente
  7. Ma conquête              /prospection
```

**Il n'a plus accès à `/marketing`** : campagnes, budget, ROI, marge générée sont le pilotage
du directeur marketing. Un prospecteur n'a ni budget ni compte de résultat. Ses deux onglets
utiles (pipeline leads, zones blanches) sont devenus son écran à lui, `/prospection`.

## Périmètre de données

`PROSPECTION` est un **rôle à portefeuille** (`PORTEFEUILLE_ROLES` dans
[hub-context.ts](../../src/lib/hub-context.ts)) : PDV, commandes, factures — **et désormais
zones, prospects et ouvertures** — sont filtrés sur `commercial === user.nom` via
[`getProspectionHub(ctx)`](../../src/lib/prospection-hub.ts).

Contrôle : Mawuena voit 3 zones · 11 prospects · 14 ouvertures. Le DG en voit 4 · 13 · 16.

## Ses écrans

### `/dashboard` — écran de décision

`PerformancePostePanel` en mode compact, puis **« À trancher aujourd'hui »** : les 3 règles
franchies les plus graves, avec l'action et le montant en jeu. Puis l'entonnoir (où le
travail est en panne), la survie de ses ouvertures, ses territoires, et la file de passation.

Ce n'est pas une liste de prospects triés par score : c'est ce qu'il doit décider ce matin.

### `/prospection` — Conquête & Territoires

Quatre onglets qui suivent le cycle réel du poste :

1. **Territoires** — recensement, taux de conversion, poids de la desserte sur le potentiel
2. **Carnet de prospects** — entonnoir + goulot, motifs de perte (évitable / structurel), fiche de qualification terrain
3. **Ouvertures & survie** — cohortes mensuelles (vivant / dormant / mort / impayé), valeur nette par ouverture
4. **Passation** — les PDV ouverts que plus personne ne visite

## Ce que les données racontent (juin 2026)

Le scénario est désormais **cohérent avec ce que le DG voit** (`equipe-dg-builder` : *« Mawuena
en dégradation — prospection sans conversion, plan coaching sous 7 j »*). Son score de poste
est de **57/100 — critique**, et on peut dire précisément pourquoi :

- **5,25 M d'impayés** sur Grossiste Adidogomé : 1ʳᵉ commande à crédit 30 j, plafond de 1,5 M franchi. Une seule faute a effacé six mois de conquête — **valeur nette : −3,2 M FCFA**.
- **Survie M+3 de 56 %** (5 ouvertures sur 9 jugeables). Il ouvre, mais ça ne tient pas.
- **Le goulot est « Offre envoyée »**, pas le recensement : 64 commerces recensés à Lomé Est, 9 ouverts. Deux dossiers y stagnent depuis plus de 3 semaines, dont Boutique Nouvelle (24 j), bloquée sur une demande de crédit que personne n'a arbitrée.
- **5 PDV ouverts jamais transférés**, dont 3 orphelins au-delà du délai de 45 j — ils s'éteignent faute de tournée. C'est la cause n°1 de la mortalité à M+3, et ça boucle la boucle.
- **Aného abandonnée à raison** : 45 km, au-delà du seuil de rentabilité. Une bonne décision, portée à son crédit.

## KPI du poste

[`kpi-postes-registry.ts`](../../src/lib/kpi-postes-registry.ts) — la chaîne réelle :
je convertis → ça survit → ça paie → ça m'a coûté combien → je passe la main.

| KPI | Valeur | Objectif | Poids |
|---|---|---|---|
| Survie M+3 des ouvertures | 56 % | 75 % | 30 |
| Recensé → 1ʳᵉ commande | 14 % | 25 % | 25 |
| Impayé sur 1ʳᵉ commande *(invert)* | 7 % | 2 % | 20 |
| Coût acquisition PDV *(invert)* | 34 900 F | 25 000 F | 15 |
| Ouvertures transférées | 36 % | 90 % | 10 |

Les anciens KPI mesuraient un vendeur (visites, commandes, CA) ou comptaient des comptes
ouverts sans jamais demander ce qu'ils étaient devenus.
