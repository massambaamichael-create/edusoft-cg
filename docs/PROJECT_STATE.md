# PROJECT_STATE.md — EduSoft CG

Dernière mise à jour : 19 septembre 2026

## 1. Vue d’ensemble

| Élément | Valeur |
|---------|--------|
| Produit | EduSoft CG |
| Version PRD de référence | 2.0 |
| Stack | Next.js 16 + React 19 + TypeScript + Supabase + Tailwind 4 |
| Repo | `massambaamichael-create/edusoft-cg` (privé) |
| Phase actuelle | Core partiel (Release 1 incomplète) |
| Stratégie | Migration progressive (jamais repartir de zéro) |

## 2. Ce qui existe et fonctionne

### Authentification & Identity
- Supabase Auth (email/password)
- Table `users` liée à `auth.users` via `auth_user_id`
- Table `roles`
- Création d’enseignant avec compte Auth + profil `users` + profil `teachers` + email temporaire (Resend)

### Multi-tenant
- Colonne `school_id` sur les tables principales
- Helpers RLS : `get_my_school_id()`, `get_my_role_name()`, `is_director()`
- Policies RLS activées sur les tables existantes

### Structure pédagogique de base
- `cycles`, `levels`, `series`
- `subjects` (catalogue)
- `classes`
- `academic_years`
- `class_subjects`
- `teacher_subjects`
- `student_enrollments`
- `student_attendance`
- `assessments`, `report_cards` (schéma encore partiel)

### Interface
- Dashboard
- Page Enseignants (liste + création)
- Pédagogie → Classes
- Pédagogie → Matières
- Sidebar anticipant les futurs modules

## 3. Écarts majeurs par rapport au PRD v2.0

| Domaine PRD | État actuel | Priorité |
|-------------|-------------|----------|
| Une seule source de vérité | Partiellement respecté | Critique |
| Contextualisation année scolaire partout | Partielle | Critique |
| Distinction Catalogue / Matière-classe / Affectation | Début (`subjects` + `class_subjects` + `teacher_subjects`) | Haute |
| Rôles complets (Directeur des Études, Secrétariat, Finance, Vie scolaire, Parent, Élève…) | Très limité (surtout Directeur) | Haute |
| Parents / Tuteurs | Absent | Haute |
| Inscriptions complètes + historique | Partiel | Haute |
| Notes → Moyennes → Bulletins (source unique) | Très partiel | Haute |
| Emplois du temps | Absent | Moyenne |
| Finance + Payment Engine | Absent | Haute (après Core) |
| Programmes scolaires + Progression | Absent | Moyenne |
| Évaluations avancées (banque, sujets, variantes, corrigés) | Absent | Basse (Phase 6) |
| Documents & Workflows (signature, cachet, QR) | Absent | Moyenne |
| Portails Parent / Élève | Absent | Moyenne |
| Audit Engine complet | Minimal | Haute |
| Notifications | Absent | Moyenne |
| Interfaces adaptées par rôle | Non (sidebar unique) | Haute |
| Documentation persistante | En cours (Phase 0) | Critique |

## 4. Tables existantes (inventaire)

```
roles
users
teachers
students
cycles
levels
series
subjects
academic_years
classes
teacher_subjects
class_subjects
student_enrollments
student_attendance
assessments
report_cards
```

## 5. Points de vigilance techniques

- La clé `service_role` contourne le RLS (utilisée volontairement dans `/api/teachers`).
- Les policies sur `assessments` et `report_cards` sont encore trop permissives (SELECT true).
- Pas de table `schools` visible dans le code analysé (à confirmer côté Supabase).
- Pas de gestion explicite des parents.
- Pas de table de permissions fine (seulement `roles` + `is_director()`).

## 6. Décision de migration

Conformément au PRD §84 :

> Améliorer et migrer progressivement, pas repartir de zéro.

On conserve :
- Toute la stack Next.js + Supabase
- L’Auth existante
- Les tables et le RLS de base
- La logique de création d’enseignants
- Les pages Classes / Matières / Enseignants comme point de départ

On fait évoluer progressivement vers l’architecture cible du PRD.

## 7. Prochaine étape recommandée

Après Phase 0 (documentation) :
→ Renforcer le Core (année scolaire, parents, rôles, RLS enseignant, formalisation matières).
