# CHANGELOG.md — EduSoft CG

Format : [Date] — Description

## [2026-09-20] — Release 1 / Phase 2 — Espace Enseignant + redirection par rôle

### Multi-espaces (particularité EduSoft)
- `lib/auth/routes.ts` — mapping rôle → chemin d’accueil
- Login : redirection selon `get_my_role()` (Enseignant → `/enseignant`, Directeur → `/dashboard`)
- Middleware :
  - Enseignant forcé dans `/enseignant/*` (pas l’UI Direction complète)
  - Non-enseignants exclus de `/enseignant`

### Espace enseignant
- `app/enseignant/layout.tsx` — shell dédié + garde de rôle
- `components/TeacherSidebar.tsx` — navigation limitée (teal)
- `app/enseignant/page.tsx` — accueil enseignant (permissions visibles)
- Placeholders : `classes`, `matieres`, `evaluations`, `emploi-du-temps`

### Intention
Un rôle = un espace. L’enseignant n’utilise plus la sidebar Direction.

---

## [2026-09-20] — Release 1 / Phase 1 — Alignement auth frontend

### Code
- Ajout de `lib/auth/` :
  - `types.ts` — types rôle, permissions, école, contexte utilisateur
  - `permissions.ts` — wrappers RPC (`get_my_role`, `has_permission`, `get_my_permissions`, `is_my_class_subject`, `resolveRoleIdByName`)
  - `useCurrentUser.ts` — hook React (profil + école + rôle + permissions)
  - `index.ts` — exports publics
- `/api/teachers` : le rôle **Enseignant** est résolu par **nom** (`roles.name = 'Enseignant'`), plus d’UUID hardcodé

### Intention
- Aligner le frontend sur le modèle RBAC déjà présent en base Supabase
- Préparer les **espaces multi-rôles** (Direction, Enseignant, Administration…)
- Ne pas casser l’auth ni les écrans existants

---

## [2026-09-19] — Phase 0 Documentation ✅ TERMINÉE

Voir historique précédent (documentation complète PRD).
