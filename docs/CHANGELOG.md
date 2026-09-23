# CHANGELOG.md — EduSoft CG

## [2026-09-23] — Documents, Audit, Notifications, Identity, Enseignant

### Documents & Workflows (PRD §43–46, Release 7)
- Socle workflow documentaire (`draft` → `submitted` → `validated`/`rejected` → `archived`)
- RPC `transition_document_workflow`
- Registre documentaire dans Administration (`/administration/documents`)
- Dépôt / création de brouillon (modal, types PRD, élève optionnel, code de vérification)
- **Upload Storage** : bucket privé `documents`, chemin `{school_id}/{uuid}/fichier`, signed URL à l’ouverture
- Formats : PDF, images, Word · max 15 Mo · isolation RLS par école
- Stats registre + design aligné Admin
- RLS corrigée : isolation par `school_id` (student_id optionnel)
- Archivage + notifications sur transitions
- Migrations : `documents_workflow_foundation`, `document_archive_audit_completion`, `document_workflow_notifications`, `documents_rls_school_scope_and_create`, `documents_storage_bucket`

### Audit & Notifications
- Journal d’audit administratif (`/administration/audit`, permission `audit.read`)
- Centre de notifications personnel + intégration shell
- Traçabilité des opérations de comptes (Identity)

### Identity & Access
- Fiabilisation du statut `must_change_password` (serveur-authoritative)
- Rôle **Directeur des Études** (RBAC + filtres comptes)
- Baseline rôles opérationnels + accès Parent/Élève

### Pédagogie / Enseignant
- Espace Programmes & Progression
- Sécurisation évaluations / corrections
- Alignement navigation enseignant

### Administration UI
- Tableau de bord : Documents, Audit, Accès & comptes

### Documentation
- DOCUMENTS, WORKFLOWS, PROJECT_STATE, ROADMAP alignés

---

## [2026-09-20] — Administration : création + liaison PRD

- Élèves / Parents / student_parents sans double fiche

## [2026-09-20] — Listes Administration

## [2026-09-20] — Multi-espaces + auth

## [2026-09-19] — Phase 0 docs
