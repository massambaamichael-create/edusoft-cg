# PROGRAMMES_PROGRESSION.md — EduSoft CG

## 1. Mission

**Programme & Progression** est le référentiel pédagogique qui permet au Directeur des Études / Censeur de définir et suivre les programmes scolaires de l'établissement.

Principe : le programme est créé une seule fois dans son contexte pédagogique, puis référencé par les classes et enseignants concernés. On ne recopie pas le contenu du programme dans chaque classe.

## 2. Responsabilité métier

### Directeur des Études / Censeur
- crée, importe et versionne les programmes ;
- rattache un programme au bon contexte pédagogique ;
- organise chapitres, notions, compétences et objectifs ;
- définit la progression prévue ;
- suit la progression réellement enseignée ;
- identifie couverture, retards et éléments à renforcer.

### Enseignant
- consulte le programme qui lui est attribué dans son contexte ;
- renseigne ce qui a effectivement été enseigné ;
- associe les évaluations aux éléments du programme lorsque le modèle d'évaluation le permettra.

Le Directeur conserve un rôle de supervision ; le Censeur / Directeur des Études est le propriétaire fonctionnel de la gestion pédagogique du programme.

## 3. Contexte obligatoire

Un programme doit toujours être interprété avec :

**École → Cycle → Niveau → Série/Filière → Matière → Version**

Le Lycée général et le Lycée technique restent des contextes distincts. Un programme ne doit jamais être proposé ou appliqué dans l'autre contexte par simple correspondance de nom.

L'année scolaire intervient dans l'utilisation et le suivi de la progression. Le contenu d'un programme peut être versionné afin de préserver l'historique lorsqu'il évolue.

## 4. Modèle métier cible

```
PROGRAMME / VERSION
        ↓
UNITÉS DU PROGRAMME
        ↓
CHAPITRES / NOTIONS / COMPÉTENCES / OBJECTIFS
        ↓
PROGRESSION PRÉVUE
        ↓
AFFECTATION AU CONTEXTE CLASSE
        ↓
PROGRESSION RÉELLEMENT ENSEIGNÉE
        ↓
ÉVALUATIONS / RÉSULTATS
```

### Concepts à conserver séparés

- **Programme** : référentiel pédagogique.
- **Version du programme** : état historisé du référentiel.
- **Unité / chapitre / compétence / objectif** : contenu structuré du programme.
- **Affectation du programme** : utilisation d'une version par un contexte pédagogique / une classe, sans recopier son contenu.
- **Progression prévue** : ordre et calendrier pédagogique attendu.
- **Progression réelle** : ce que l'enseignant a effectivement traité.

## 5. Réutilisation des données existantes

Le module doit réutiliser les tables déjà existantes :

- `cycles` : contexte Primaire / Collège / Lycée général / Lycée technique ;
- `levels` : niveau ;
- `series` : série / filière ;
- `subjects` : catalogue unique des matières ;
- `classes` : classe et année scolaire ;
- `academic_years` : année scolaire ;
- `class_subjects` : matière réellement configurée dans la classe ;
- `teacher_assignments` : enseignant officiellement affecté.

Aucune nouvelle table ne doit recréer ces référentiels.

## 6. Règle d'alignement

Le chemin métier cible est :

**Programme → Contexte pédagogique → Matière → Classe → Enseignant affecté → Progression → Évaluation**

Cela permet ensuite de mesurer :

- taux de couverture du programme ;
- chapitres prévus mais non traités ;
- retard par rapport à la progression ;
- notions/compétences travaillées ;
- éléments à renforcer ;
- cohérence entre progression et évaluations.

## 7. Année scolaire et historique

Les données de progression sont liées à une année scolaire.

Un changement d'année ne doit jamais écraser la progression précédente.

Une modification importante du contenu pédagogique doit produire une nouvelle version du programme plutôt que modifier silencieusement un référentiel déjà utilisé dans l'historique.

## 8. Permissions

Le futur module devra utiliser des permissions métier dédiées plutôt que des tests de rôle dispersés dans les composants.

Cible fonctionnelle :

- Directeur des Études / Censeur : gestion complète du programme et de la progression ;
- Directeur : lecture/supervision et validations selon les workflows ;
- Enseignant : lecture des programmes autorisés + écriture de sa progression dans ses classes/matières affectées ;
- autres rôles : aucun accès global par défaut.

Les permissions et politiques RLS seront ajoutées avec le schéma correspondant, après validation des tables et relations.

## 9. Première implémentation

La première étape technique ne doit pas créer immédiatement toute la chaîne.

Ordre prévu :

1. référentiel du programme/version ;
2. unités et contenu structuré ;
3. rattachement à une matière et à son contexte pédagogique ;
4. affectation/référence vers la classe ;
5. progression prévue ;
6. progression réelle ;
7. intégration aux évaluations.

Chaque étape doit réutiliser les données existantes et être testée avant la suivante.
