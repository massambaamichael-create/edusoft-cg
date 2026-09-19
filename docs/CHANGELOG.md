# CHANGELOG.md — EduSoft CG

Format : [Date] — Description

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

### Non fait dans cette livraison
- Layouts / routes par rôle (Phase 2)
- Refactor de la page Classes
- Modification des policies SQL production

---

## [2026-09-19] — Phase 0 Documentation ✅ TERMINÉE

### Première vague
- Remplacement du boilerplate `AGENTS.md` par les règles du projet EduSoft CG
- Création du dossier `docs/`
- Ajout de `docs/PROJECT_STATE.md`
- Ajout de `docs/ARCHITECTURE.md`
- Ajout de `docs/DATABASE.md`
- Ajout de `docs/SECURITY.md`
- Ajout de `docs/ROLES_PERMISSIONS.md`
- Ajout de `docs/ROADMAP.md`
- Ajout de `docs/CHANGELOG.md`
- Mise à jour du `README.md`

### Seconde vague (complétion Phase 0)
- Ajout de `docs/BUSINESS_RULES.md`
- Ajout de `docs/MODULES.md`
- Ajout de `docs/PEDAGOGY.md` (avec audit du code Classes / Matières)
- Ajout de `docs/EVALUATIONS.md`
- Ajout de `docs/PAYMENTS.md`
- Ajout de `docs/DOCUMENTS.md`
- Ajout de `docs/WORKFLOWS.md`
- Ajout de `docs/AI.md`
- Mise à jour de `docs/PROJECT_STATE.md` (audit détaillé + Phase 0 terminée)
- Mise à jour de `docs/ROADMAP.md` (Phase 0 marquée terminée)
