# CHANGELOG.md — EduSoft CG

## [2026-09-20] — Release 1 — Administration (PRD Core)

### Aligné PRD
- **Une seule source de vérité** : tables `students`, `parents`, `student_parents`, `student_enrollments`
- Filtrage strict `school_id`
- Inscriptions **contextualisées par année scolaire**
- Contrôle d’accès via `students.*` / `parents.*` / `enrollments.*`

### Pages
- `/administration/eleves` — liste + recherche
- `/administration/parents` — liste + nombre d’enfants liés
- `/administration/inscriptions` — filtre par année scolaire

### Libs
- `lib/administration/students.ts`
- `lib/administration/parents.ts`
- `lib/administration/enrollments.ts`

Création / édition détaillée : prochaine itération (formulaires + validation).

---

## [2026-09-20] — Multi-espaces + enseignant classes

Espaces Enseignant / Administration / Finance / Vie scolaire + Mes classes via affectations.

## [2026-09-20] — Phase 1–2 auth

Couche `lib/auth`, redirection par rôle.

## [2026-09-19] — Phase 0 docs

Documentation PRD.
