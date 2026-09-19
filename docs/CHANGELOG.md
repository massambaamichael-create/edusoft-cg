# CHANGELOG.md — EduSoft CG

Format : [Date] — Description

## [2026-09-20] — Release 1 / Phase 2b — Espaces multi-rôles + Mes classes

### Espaces par rôle
| Rôle | Chemin |
|------|--------|
| Directeur | `/dashboard` |
| Enseignant | `/enseignant` |
| Secrétaire / Admin / RH | `/administration` |
| Comptable | `/finance` |
| Surveillant / Infirmerie | `/vie-scolaire` |

- Middleware : contrôle d’accès par espace (`canRoleAccessPath`)
- `RoleSpaceShell` réutilisable
- Homes Administration / Finance / Vie scolaire (permissions affichées)

### Enseignant — données
- `lib/enseignant/assignments.ts` : charge les classes via `teacher_assignments` (fallback `teacher_subjects`)
- Page `/enseignant/classes` branchée sur les affectations réelles

---

## [2026-09-20] — Phase 2 — Espace Enseignant + redirection

Voir commits précédents (layout enseignant, sidebar, login/middleware).

## [2026-09-20] — Phase 1 — Couche auth frontend

Voir commits précédents (`lib/auth`, rôle par nom).

## [2026-09-19] — Phase 0 Documentation

Documentation PRD complète.
