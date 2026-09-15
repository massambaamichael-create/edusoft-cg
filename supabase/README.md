# Supabase — EduSoft CG

## Row Level Security (RLS)

Le fichier `migrations/20260915120000_enable_rls.sql` active le RLS multi-tenant.

### Comment l'appliquer

**Option 1 — SQL Editor (recommandé pour commencer)**  
1. Ouvre ton projet Supabase → **SQL Editor**  
2. Colle le contenu du fichier de migration  
3. Clique **Run**

**Option 2 — Supabase CLI**  
```bash
supabase link --project-ref <ton-project-ref>
supabase db push
```

### Ce que font les policies

| Table | SELECT | INSERT / UPDATE / DELETE |
|-------|--------|--------------------------|
| `roles` | Tous les utilisateurs authentifiés | — (service role only) |
| `users` | Même école + soi-même | Directeur (même école) ou soi-même |
| `teachers`, `students`, `classes`, `cycles`, `levels`, `series`, `subjects`, `academic_years` | Même `school_id` | Directeur uniquement |
| `teacher_subjects`, `class_subjects`, `student_enrollments` | Via table parente (même école) | Directeur |
| `student_attendance` | Via `students.school_id` | Même école |
| `assessments`, `report_cards` | (à affiner selon colonnes) | Directeur |

### Fonctions helper

- `get_my_school_id()` → UUID de l'école de l'utilisateur connecté
- `get_my_role_name()` → nom du rôle (`Directeur`, `Enseignant`, …)
- `is_director()` → `true` si le rôle est `Directeur`

Ces fonctions sont `SECURITY DEFINER` pour pouvoir lire la table `users` même sous RLS.

### Important

- La **service_role key** (utilisée dans `lib/supabaseAdmin.ts`) **contourne le RLS**. C'est voulu pour `/api/teachers`.
- Après activation, teste **toujours** avec la clé `anon` / session utilisateur, pas avec la service role.
- Si une table n'existe pas encore ou a un nom de colonne différent, la migration peut échouer sur cette table. Adapte alors la policy concernée.

### Prochaines améliorations possibles

- Affiner les droits des enseignants (lecture seule vs écriture limitée sur notes / présence)
- Ajouter des policies plus strictes sur `assessments` et `report_cards` dès que le schéma est stabilisé
- Créer une policy `INSERT` plus fine pour les secrétaires / adjoints
