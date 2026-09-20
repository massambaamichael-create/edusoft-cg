# DATABASE.md — EduSoft CG

## 1. Principes fondamentaux

1. **Une seule source de vérité** — jamais de table « élève financier » + « élève pédagogique ».
2. **Tout est rattaché à une école** (`school_id`).
3. **Les données pédagogiques et financières sont contextualisées par année scolaire** lorsque pertinent.
4. **Historique préservé** — une bascule d’année ne supprime ni n’écrase rien.
5. **RLS obligatoire** sur toutes les tables métier.

## 2. Tables actuellement présentes

| Table | Rôle | Notes |
|-------|------|-------|
| `roles` | Rôles système | Lecture authentifiée |
| `users` | Profils utilisateurs liés à Auth | `auth_user_id`, `school_id`, `role_id` |
| `teachers` | Profil enseignant | Lié à `users` |
| `students` | Élèves | `school_id` |
| `cycles` | Cycles (Primaire, Collège, Lycée…) | `school_id` |
| `levels` | Niveaux | Via `cycle_id` |
| `series` | Séries / filières | Via `cycle_id` |
| `subjects` | Catalogue de matières | `school_id` |
| `academic_years` | Années scolaires | `school_id` |
| `classes` | Classes | `school_id` |
| `class_subjects` | Matière dans une classe | Junction |
| `teacher_subjects` | Affectation enseignant | Junction |
| `student_enrollments` | Inscriptions | Via classe |
| `student_attendance` | Présences / absences | Via élève |
| `assessments` | Évaluations | Schéma encore incomplet |
| `report_cards` | Bulletins | Schéma encore incomplet |

## 3. Distinction matières (cible PRD §18)

Trois concepts distincts à ne jamais confondre :

1. **Catalogue de matières** → table `subjects`
2. **Matière dans une classe** (coefficient, année, volume…) → `class_subjects` (à enrichir)
3. **Enseignant affecté** → `teacher_subjects` (à enrichir avec année scolaire)

## 4. Relations fondamentales cibles (PRD §70)

```
ÉCOLE
 ↓
ANNÉE SCOLAIRE
 ↓
CYCLES → NIVEAUX / SÉRIES → CLASSES

ÉLÈVE → INSCRIPTION → CLASSE

MATIÈRE (catalogue)
 ↓
MATIÈRE DANS UNE CLASSE
 ↓
ENSEIGNANT AFFECTÉ
 ↓
ÉVALUATION → NOTE → MOYENNE → BULLETIN

ÉLÈVE → FRAIS → ÉCHÉANCE → PAIEMENT → RAPPROCHEMENT → REÇU

PROGRAMME → CHAPITRE → COMPÉTENCE → ÉVALUATION → RÉSULTAT
```

## 5. Programme & Progression — référentiel ajouté

Le noyau du module utilise deux nouvelles tables :

- `programs` — référentiel unique d'un programme par **école + cycle + niveau + série/filière éventuelle + matière** ;
- `program_versions` — versions historisées d'un programme.

Règles structurantes :

- un programme n'est **jamais** créé pour une classe ;
- CP1 Mathématiques et CP2 Mathématiques sont deux contextes distincts ;
- 6e Mathématiques et 3e Mathématiques sont distincts ;
- au lycée, la série/filière fait partie du contexte : général et technique ne sont pas mélangés ;
- plusieurs classes peuvent réutiliser le même programme si leur contexte pédagogique est identique ;
- l'année scolaire sera portée par l'affectation et la progression, afin de conserver le référentiel réutilisable et son historique ;
- un trigger vérifie que cycle, niveau, série/filière et matière appartiennent au même contexte d'école.

La chaîne cible reste :

`PROGRAMME → VERSION → UNITÉS/CHAPITRES → AFFECTATION CLASSE → PROGRESSION → ÉVALUATION`

La migration correspondante est `supabase/migrations/20260920090000_programmes_progression_core.sql`.

## 5. Tables manquantes prioritaires (Core)

À ajouter progressivement :

- `schools` (si absente côté Supabase)
- `parents` / `guardians` + table de liaison `student_parents`
- `enrollments` plus riche (historique, statut, année)
- Enrichissement de `class_subjects` (coefficient, academic_year_id, hours…)
- Enrichissement de `teacher_subjects` (academic_year_id obligatoire)
- Tables de notes détaillées (si pas encore présentes)
- Tables d’audit génériques

## 6. Règles de non-duplication

Avant de créer une nouvelle table :

> Cette donnée existe-t-elle déjà ?
> Si oui → comment la réutiliser ?

On ne crée jamais une deuxième source de vérité simplement parce qu’un autre module a besoin de l’information.

## 7. Gestion des années scolaires

Exemple correct :

```
2026-2027 → 3e A → Mathématiques → coef 4
2027-2028 → 3e A → Mathématiques → coef 5
```

Les deux configurations coexistent sans conflit.

## 8. Données sensibles

- Données médicales (module Santé) → accès ultra-restreint
- Données financières confirmées → considérées comme historiques (correction via opération inverse + motif + trace)
- Notes validées → historisées (ancienne + nouvelle + auteur + date + motif)
