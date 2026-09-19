# CHANGELOG.md — EduSoft CG

## [2026-09-20] — Administration : création + liaison PRD

- **Nouvel élève** (`students.create`) → insert unique dans `students` + `school_id`
- **Nouveau parent** (`parents.manage`) → insert unique dans `parents`
- **Lier parent ↔ élève** → `student_parents` (un parent, plusieurs enfants)
- Pas de double fiche, permissions respectées

## [2026-09-20] — Listes Administration

Élèves / Parents / Inscriptions (lecture + filtre année)

## [2026-09-20] — Multi-espaces + auth

Espaces par rôle, `lib/auth`, Mes classes enseignant

## [2026-09-19] — Phase 0 docs
