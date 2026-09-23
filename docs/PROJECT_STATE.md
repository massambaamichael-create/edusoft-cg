# PROJECT_STATE.md — EduSoft CG

Dernière mise à jour : 23 septembre 2026

## 1. Vue d’ensemble

| Élément | Valeur |
|---------|--------|
| Produit | EduSoft CG |
| Version PRD de référence | 2.0 |
| Stack | Next.js 16 + React 19 + TypeScript + Supabase + Tailwind 4 |
| Repo | `massambaamichael-create/edusoft-cg` (privé) |
| Phase actuelle | **Consolidation des espaces métiers → parcours opérationnels** |
| Stratégie | Migration progressive (jamais repartir de zéro) |

## 2. Documentation de référence (Phase 0)

| Fichier | Statut |
|---------|--------|
| AGENTS.md | ✅ |
| docs/ARCHITECTURE.md | ✅ |
| docs/DATABASE.md | ✅ |
| docs/SECURITY.md | ✅ |
| docs/ROLES_PERMISSIONS.md | ✅ |
| docs/PROJECT_STATE.md | ✅ (ce fichier) |
| docs/ROADMAP.md | ✅ |
| docs/CHANGELOG.md | ✅ |
| docs/BUSINESS_RULES.md | ✅ |
| docs/MODULES.md | ✅ |
| docs/PEDAGOGY.md | ✅ |
| docs/EVALUATIONS.md | ✅ |
| docs/PAYMENTS.md | ✅ |
| docs/DOCUMENTS.md | ✅ |
| docs/WORKFLOWS.md | ✅ |
| docs/AI.md | ✅ |

## 3. Ce qui existe et fonctionne (audit code 19/09/2026)

### Authentification & Identity
- Supabase Auth (email/password)
- Table `users` liée à `auth.users` via `auth_user_id`
- Table `roles`
- Création d’enseignant avec compte Auth + profil `users` + profil `teachers` + email temporaire (Resend)
- Rôle détecté côté UI avec espaces dédiés (`Directeur`, `Enseignant`, `Secrétaire`, `Administrateur`, `Comptable`, `Surveillant`, `RH`, `Infirmerie`, `Directeur des Études`)

### Multi-tenant & RLS
- Colonne `school_id` sur les tables principales
- Helpers : `get_my_school_id()`, `get_my_role_name()`, `is_director()`
- Policies RLS activées
- Policies sur `assessments` / `report_cards` encore trop ouvertes (SELECT true)

### Structure pédagogique (détail observé dans le code)

**cycles** — `school_id`, `name`

**levels** — `school_id`, `cycle_id`, `name`, `display_order`, `is_state_exam`

**series** — `school_id`, `cycle_id`, `name`, `description`, `category`

**academic_years** — `school_id`, `name`, `start_date`, `end_date`, `is_active`

**classes** — `school_id`, `cycle_id`, `level_id`, `series_id`, `academic_year_id`, `name`, `status` (`pending` | `approved` | `rejected`), `principal_teacher_id`, `created_by`, `validated_by`, `validated_at`

**subjects** (catalogue) — `school_id`, `name`, `coefficient`

**class_subjects** — `class_id`, `subject_id`, `academic_year_id`, `coefficient`

**teacher_subjects** — `teacher_id`, `subject_id`, `class_id`, `academic_year_id`

**Autres** : `student_enrollments`, `student_attendance`, `assessments`, `report_cards`

### Points particulièrement conformes
- Année scolaire liée aux classes et aux liaisons matières/affectations
- Distinction catalogue (`subjects`) vs matière-classe (`class_subjects`)
- Gestion explicite de **Lycée général** et **Lycée technique** dans la page Classes
- Workflow de validation de classe (`pending` / `approved` / `rejected`)
- Enseignant principal par classe
- Coefficients sur `class_subjects`

### Interface
- Dashboard
- Administration → Élèves, Parents / tuteurs, Inscriptions
- Pédagogie → Classes, Matières, Emplois du temps, Évaluations / Corrections, Programmes, Responsabilités
- Finance → Frais, Paiements, Reçus
- Vie scolaire → Présences, Discipline
- RH → Personnel
- Santé → Dossiers de santé protégés
- Page Enseignants (liste + création)
- Shells métier séparés par rôle/espace ; aucune sidebar globale ne mélange les domaines
- Les vues opérationnelles récentes privilégient les données réelles existantes, avec recherche / filtres lorsque le parcours le justifie

## 4. Écarts majeurs par rapport au PRD v2.0

| Domaine PRD | État actuel | Priorité |
|-------------|-------------|----------|
| Une seule source de vérité | Partiellement respecté | Critique |
| Contextualisation année scolaire partout | Bien avancée sur classes / class_subjects / teacher_subjects | Haute |
| Distinction Catalogue / Matière-classe / Affectation | Bon début (3 tables présentes) | Haute (formaliser + nettoyer coefficient sur subjects) |
| Rôles complets | Très limité (surtout Directeur + Enseignant) | Haute |
| Parents / Tuteurs | Présent (`parents`, `student_parents`) | En cours de consolidation |
| Inscriptions complètes + historique | Partiel (`student_enrollments`) | Haute |
| Notes → Moyennes → Bulletins (source unique) | Très partiel | Haute |
| Emplois du temps | Présent : calendrier, disponibilités, salles, génération | Haute |
| Finance + Payment Engine | Vues opérationnelles frais / paiements / reçus en consolidation | Haute |
| Programmes + Progression | Présent et versionné | Haute |
| Évaluations avancées | Présent : workflow, variantes, correction directe | Haute |
| Documents & Workflows | Absent côté UI métier | Moyenne |
| Portails Parent / Élève | Absent | Moyenne |
| Audit Engine complet | Minimal | Haute |
| Interfaces adaptées par rôle | Présent : RoleSpaceShell + espaces dédiés (Administration, Pédagogie, Finance, Vie scolaire, RH, Santé) | Critique |

## 5. Points de vigilance techniques

- La clé `service_role` contourne le RLS (utilisée volontairement dans `/api/teachers`).
- Coefficient présent à la fois sur `subjects` et sur `class_subjects` → risque de confusion.
- Policies `assessments` / `report_cards` trop permissives.
- Pas de table `parents` / `guardians`.
- Pas de helpers RLS pour les autres rôles (`is_teacher()`, etc.).
- Table `schools` non visible dans le code frontend (à confirmer côté Supabase).

## 6. Décision de migration

Conformément au PRD §84 :

> Améliorer et migrer progressivement, pas repartir de zéro.

On conserve et on fait évoluer :
- Toute la stack
- L’Auth et la création d’enseignants
- Le modèle classes / cycles / levels / series / academic_years
- Les tables `subjects` + `class_subjects` + `teacher_subjects`
- Le workflow de validation des classes
- Les pages existantes comme base

## 7. Prochaine étape

**Consolidation fonctionnelle avant validation technique** :

1. Finaliser les parcours opérationnels des espaces existants, en priorité Administration et les opérations encore en lecture seule.
2. Vérifier que chaque action / lien de navigation pointe vers une route réellement implémentée.
3. Connecter les tableaux de bord et indicateurs aux tables existantes sans inventer de données.
4. Affiner les permissions et le RLS par rôle, école, année et affectation, notamment pour les écritures métier.
5. Ajouter progressivement les briques transversales encore absentes (Documents & Workflows, Audit/Notifications complet) sans créer de seconde source de vérité.
6. Ensuite seulement : lint → typecheck/build → corrections de release.

Règle de travail : aucune nouvelle page ne doit recréer une donnée déjà portée par une autre source de vérité.
