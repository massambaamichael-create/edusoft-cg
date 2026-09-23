# CHANGELOG.md — EduSoft CG

## [2026-09-23] — Documents, Audit, Notifications, Identity, Enseignant

### Documents & Workflows (PRD §43–46, Release 7)
- Socle workflow documentaire (`draft` → `submitted` → `validated`/`rejected` → `archived`)
- RPC `transition_document_workflow`
- Registre documentaire dans Administration (`/administration/documents`)
- **Dépôt / création de brouillon** (modal, types PRD, élève optionnel, code de vérification)
- Stats registre + design aligné Admin (cartes, modal, boutons slate)
- **RLS corrigée** : isolation par `school_id` (plus d’obligation d’avoir un `student_id` pour lire)
- Archivage depuis le registre (sans suppression silencieuse)
- Notifications sur transitions de workflow
- Migrations : `documents_workflow_foundation`, `document_archive_audit_completion`, `document_workflow_notifications`, `documents_rls_school_scope_and_create`

### Audit & Notifications
- Journal d’audit administratif (`/administration/audit`, permission `audit.read`)
- Centre de notifications personnel + intégration shell
- Traçabilité des opérations de comptes (Identity)

### Identity & Access
- Fiabilisation du statut `must_change_password` (serveur-authoritative)
- Rôle **Directeur des Études** (RBAC + filtres comptes)
- Baseline rôles opérationnels + accès Parent/Élève (migrations identity)

### Pédagogie / Enseignant
- Espace Programmes & Progression côté enseignant
- Rattachement programme au contexte pédagogique exact
- Sécurisation création d’évaluations et correction des notes
- Durcissement workflow correction (RLS / permissions)
- Alignement navigation enseignant sur les routes réelles

### Administration UI
- Tableau de bord : cartes Documents, Audit, Accès & comptes
- Accès comptes aligné sur rôles réels (pas de permissions inventées)

### Documentation
- `docs/DOCUMENTS.md`, `docs/WORKFLOWS.md`, `docs/PROJECT_STATE.md`, `docs/ROADMAP.md` alignés

---

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
