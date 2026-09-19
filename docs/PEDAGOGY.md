# PEDAGOGY.md — EduSoft CG

## 1. Structure pédagogique cible

```
École
 ↓
Année scolaire
 ↓
Cycle (Primaire / Collège / Lycée général / Lycée technique)
 ↓
Niveau
 ↓
Série / Filière (surtout Lycée)
 ↓
Classe
```

Séparation stricte entre **Lycée général** et **Lycée technique**.

## 2. État actuel dans le code (audit 19/09/2026)

### Tables et champs observés

**cycles**
- `id`, `school_id`, `name`, `created_at`

**levels**
- `id`, `school_id`, `cycle_id`, `name`, `display_order`, `is_state_exam`, `created_at`

**series**
- `id`, `school_id`, `cycle_id`, `name`, `description`, `category`, `created_at`

**academic_years**
- `id`, `school_id`, `name`, `start_date`, `end_date`, `is_active`, `created_at`

**classes**
- `id`, `school_id`, `cycle_id`, `level_id`, `series_id`, `academic_year_id`
- `name`, `status` (`pending` | `approved` | `rejected`)
- `principal_teacher_id`, `created_by`, `validated_by`, `validated_at`, `created_at`

**subjects** (catalogue)
- `id`, `school_id`, `name`, `coefficient`, `created_at`

**class_subjects** (matière dans une classe)
- `id`, `class_id`, `subject_id`, `academic_year_id`, `coefficient`, `created_at`

**teacher_subjects** (affectation)
- `id`, `teacher_id`, `subject_id`, `class_id`, `academic_year_id`, `created_at`

### Points conformes

- Année scolaire liée aux classes et aux `class_subjects` / `teacher_subjects`
- Distinction catalogue (`subjects`) vs liaison classe (`class_subjects`)
- Gestion explicite de « Lycée général » et « Lycée technique » dans la page Classes
- Workflow de validation de classe (`pending` / `approved` / `rejected`)
- Enseignant principal (`principal_teacher_id`)
- Coefficients sur `class_subjects`

### Points à améliorer / migrer

- Le coefficient existe aussi sur `subjects` (catalogue) → risque de confusion avec le coefficient par classe/année
- Pas encore de formalisation complète « 3 concepts matières » dans l’UI et la documentation métier
- Les enseignants n’ont pas encore de restriction RLS fine sur leurs seules affectations
- Emplois du temps absents
- Notes / moyennes / bulletins encore très partiels

## 3. Spécificités par cycle (cible)

**Primaire**
- Une classe = un enseignant principal (principe fort)

**Collège**
- Classe → Matières → Enseignants multiples

**Lycée**
- Séparation stricte Général / Technique
- Séries et filières gérées dans leurs contextes respectifs

## 4. Progression pédagogique (cible future)

Pour chaque matière :
Prévu → Enseigné → Évalué → Maîtrisé → À renforcer

Calculs : couverture du programme, retard, chapitres non traités, compétences faibles.
