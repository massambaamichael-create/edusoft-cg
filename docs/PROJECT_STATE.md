# PROJECT_STATE.md — EduSoft CG

Dernière mise à jour : 23 septembre 2026 (après consolidation Documents / Audit / Identity)

## 1. Vue d’ensemble

| Élément | Valeur |
|---------|--------|
| Produit | EduSoft CG |
| Version PRD de référence | 2.0 |
| Stack | Next.js 16 + React 19 + TypeScript + Supabase + Tailwind 4 |
| Repo | `massambaamichael-create/edusoft-cg` |
| Supabase | Projet **EduSoft CG** (`vnnjbjzecnuvslppclfi`) |
| Phase actuelle | **Consolidation des espaces métiers → parcours opérationnels** |
| Stratégie | Migration progressive (jamais repartir de zéro) — PRD §84 |

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
| docs/CHANGELOG.md | ✅ à jour 23/09 |
| docs/BUSINESS_RULES.md | ✅ |
| docs/MODULES.md | ✅ |
| docs/PEDAGOGY.md | ✅ |
| docs/EVALUATIONS.md | ✅ |
| docs/PAYMENTS.md | ✅ |
| docs/DOCUMENTS.md | ✅ aligné code + Supabase |
| docs/WORKFLOWS.md | ✅ aligné 23/09 |
| docs/AI.md | ✅ |
| docs/IDENTITY_ACCESS.md | ✅ |

## 3. Ce qui existe et fonctionne

### Authentification & Identity
- Supabase Auth (email / password + `login_identifier`)
- Table `users` liée à `auth.users` via `auth_user_id`
- `must_change_password` **serveur-authoritative** (middleware)
- Rôles : Directeur, Directeur des Études, Enseignant, Secrétaire, Comptable, Surveillant, RH, Infirmerie, Parent, Élève, etc.
- Provisioning enseignant + Parent/Élève (mot de passe temporaire, pas stocké en clair métier)
- Espaces dédiés par rôle (pas d’interface universelle surchargée — PRD §73)

### Multi-tenant & RLS
- `school_id` sur les tables métier
- Helpers : `get_my_school_id()`, `get_my_role_name()`, `is_director()` (+ extensions en cours)
- RLS activé sur le catalogue public
- Vigilance : certaines policies historiques (`assessments` / `report_cards`) à re-vérifier

### Structure pédagogique
- `cycles`, `levels`, `series`, `academic_years`, `classes` (workflow pending/approved/rejected)
- Catalogue `subjects` vs `class_subjects` (coefficient côté classe) vs `teacher_assignments` (source de vérité affectations)
- Legacy : `teacher_classes`, `teacher_subjects` (conservés jusqu’à migration complète)
- Séparation Lycée général / Lycée technique
- Emplois du temps : calendrier, salles, contraintes, scoring, génération

### Administration
- Élèves, Parents/Tuteurs, Inscriptions
- **Documents** : registre + workflow + archivage (`/administration/documents`)
- **Audit** : journal (`/administration/audit`, `audit.read`)
- Accès / Identity admin

### Pédagogie / Enseignant
- Classes, matières, affectations, emplois du temps
- Évaluations : création, sujets, variantes, correction, workflow notes
- Programmes & progression (espace enseignant)
- Responsabilités matières

### Finance
- Tables + vues frais / paiements / reçus (Payment Engine encore partiel)

### Portails
- `/parent` et `/eleve` : premiers espaces connectés aux données réelles (API filtrée par identité)

### Services transversaux
| Service | État |
|---------|------|
| Identity & Access | ✅ Avancé |
| Documents & Workflows | 🟡 Socle livré (registre, transitions, archivage, notifs) |
| Notifications | 🟡 Centre personnel + notifs workflow |
| Audit | 🟡 Journal admin + table `audit_logs` |
| Payment Engine | 🟠 Partiel |

## 4. Écarts majeurs par rapport au PRD v2.0

| Domaine PRD | État actuel | Priorité |
|-------------|-------------|----------|
| Une seule source de vérité | Bien respecté (règle rappelée partout) | Critique — maintenir |
| Contextualisation année scolaire | Avancée (classes, class_subjects, affectations, programmes) | Haute |
| Catalogue / Matière-classe / Affectation | Présent ; nettoyer coefficient sur `subjects` + fin legacy | Haute |
| Rôles complets + RBAC | Fortement enrichi (Directeur des Études, Parent, Élève…) | Haute — continuer RLS |
| Parents / Tuteurs / Inscriptions | Présents ; données de test encore faibles | Haute |
| Notes → Moyennes → Bulletins | Partiel | Haute |
| Emplois du temps | Structure riche | Haute — parcours opérateur |
| Finance + Payment Engine | Vues + tables ; Mobile Money / rapprochement incomplets | **Haute** |
| Programmes + Progression | Présent (tables + UI enseignant) | Haute |
| Évaluations avancées | Workflow, variantes, correction ; banque + IA limités | Haute |
| Documents & Workflows | **Socle présent** (plus « absent ») ; PDF/QR/signature multi-niveaux à finaliser | Moyenne |
| Portails Parent / Élève | Premiers espaces ; parcours complets à enrichir | Moyenne |
| Audit / Notifications | Journal + centre notifs ; couverture événements à élargir | Haute |
| Interfaces par rôle | RoleSpaceShell + espaces dédiés | Critique — maintenir |

## 5. Points de vigilance techniques

- `service_role` contourne le RLS (usage volontaire APIs sensibles — à documenter et limiter).
- Coefficient encore présent sur `subjects` **et** `class_subjects` → risque de confusion (source de vérité = `class_subjects`).
- Policies `assessments` / `report_cards` : re-audit RLS.
- Tables legacy `teacher_classes` / `teacher_subjects` : ne plus écrire dedans ; migrer les lectures restantes vers `teacher_assignments`.
- Peu de données métier de test (0 élèves/parents au moment de l’audit) → valider les parcours bout-en-bout avec jeux de données contrôlés.

## 6. Décision de migration (PRD §84)

> Améliorer et migrer progressivement, pas repartir de zéro.

On conserve et on fait évoluer : stack, Auth, modèle pédagogique, tables documents/audit/notifications, shells par rôle, pages existantes.

## 7. Prochaine étape (ordre recommandé)

1. **Finaliser les parcours opérationnels** déjà ouverts (Administration documents/audit, Enseignant évaluations/programmes) — zéro lien mort.
2. **Jeux de données de test** (école, année, classes, 1–2 enseignants, élèves, parents) pour valider RLS et workflows.
3. **Durcir RLS** (enseignants, assessments, report_cards, documents) selon rôle + école + année + affectation.
4. **Payment Engine** (échéances, confirmation prestataire, reçus, rapprochement, audit financier) — Release 3.
5. Enrichir portails Parent/Élève (finances, bulletins, absences) sans 2ᵉ source de vérité.
6. Compléter Documents Release 7 (templates → PDF, QR public, workflows multi-niveaux).
7. Ensuite seulement : lint → typecheck/build → stabilisation release.

Règle de travail : aucune nouvelle page ne doit recréer une donnée déjà portée par une autre source de vérité (PRD §71, §87.13).

## Identity & Access — rappel état

- `users.must_change_password` serveur-authoritative
- `users.login_identifier` central
- Rôles Parent / Élève en base ; `parents.user_id` / `students.user_id`
- API sécurisée d’accès temporaire
- Middleware bloque l’accès métier tant que le MDP temporaire n’est pas changé
- `/parent` et `/eleve` : premier espace métier réel

## Documents — rappel état (23/09)

- Tables : `documents`, `document_templates`, `generated_documents`, `archives`
- RPC : `transition_document_workflow`
- UI registre + validation + archivage
- Notifications de transition
- Signature/cachet/QR : colonnes prêtes ; flux complets à finaliser
