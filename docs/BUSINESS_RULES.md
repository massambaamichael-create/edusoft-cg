# BUSINESS_RULES.md — EduSoft CG

Règles métier non négociables extraites du PRD v2.0.

## 1. Source unique de vérité

Une information est créée **une seule fois**, puis réutilisée partout.

Il n’existe jamais :
- un « élève financier »
- un « élève pédagogique »
- un « élève administratif »

Il existe **un seul élève**, utilisé par plusieurs domaines selon les permissions.

Même principe pour : parents, classes, matières, enseignants, affectations, paiements, documents, évaluations.

## 2. Isolation multi-tenant

Chaque établissement = un tenant.
Aucune école ne peut accéder aux données d’une autre.
Toutes les données métier sont rattachées à `SCHOOL`.

## 3. Année scolaire

Les données pédagogiques et financières sont contextualisées par année scolaire lorsque pertinent.

Règles :
- Ne jamais supprimer les données d’une année précédente
- Ne jamais écraser
- Ne jamais modifier rétroactivement

Une nouvelle année crée un **nouveau contexte**.

Exemple correct :
```
2026-2027 → 3e A → Mathématiques → coef 4
2027-2028 → 3e A → Mathématiques → coef 5
```
Les deux coexistent sans conflit.

## 4. Distinction matières (obligatoire)

Trois concepts distincts :

1. **Catalogue de matières** (`subjects`) — ex. Mathématiques, Français
2. **Matière dans une classe** (`class_subjects`) — ex. Mathématiques en 3e A, coef 4, année 2026-2027
3. **Enseignant affecté** (`teacher_subjects`) — ex. Mme X enseigne Mathématiques en 3e A pour 2026-2027

Ces trois concepts ne doivent jamais être confondus.

## 5. Rôles et responsabilités

- Le **Directeur** pilote, arbitre, valide et contrôle. Il n’effectue pas toutes les opérations quotidiennes.
- Le **Directeur des Études** est le relais pédagogique opérationnel.
- L’**Administration** gère les données de référence (élèves, parents, inscriptions).
- La **Finance** gère les opérations financières quotidiennes.
- L’**Enseignant** n’accède qu’à ses classes, matières, élèves et évaluations autorisées.

## 6. Données historiques et corrections

### Notes validées
Ancienne note + Nouvelle note + Auteur + Date + Motif + Validation.

### Paiements / écritures financières confirmées
On privilégie :
Correction → opération inverse / ajustement → motif → trace d’audit
plutôt que modification silencieuse.

### Documents importants
Doivent être vérifiables (QR) et archivables. Pas de suppression silencieuse.

## 7. IA — gouvernance

L’IA peut proposer, générer, analyser, détecter, assister.

Elle **ne doit pas** décider seule de :
- publier un examen officiel
- modifier une note définitive
- effectuer un remboursement
- modifier une écriture comptable
- signer un document officiel
- changer une permission
- supprimer une donnée historique

## 8. Workflows de validation

Les documents et les sujets d’examen importants suivent un workflow configurable (ex. Enseignant → Directeur des Études → Directeur).

La génération IA n’est jamais synonyme de publication automatique.

## 9. Variantes anti-triche

Les variantes A/B/C d’un même sujet doivent rester pédagogiquement équivalentes (mêmes compétences, même programme, même niveau, même barème, difficulté et durée comparables).

## 10. Question de conception obligatoire

Avant toute nouvelle page ou fonctionnalité, répondre aux 13 questions du PRD §69.
