# DOCUMENTS.md — EduSoft CG

Dernière mise à jour : 23 septembre 2026

Référence PRD : §43–46, §77, Release 7.

## 1. Service transversal Documents

```
Document
 ↓
Création / dépôt
 ↓
Soumission (submitted)
 ↓
Validation / Rejet
 ↓
Signature / Cachet (champs prêts)
 ↓
Publication
 ↓
Archivage
```

Types cibles (PRD) : certificats, attestations, bulletins, relevés, convocations, reçus, factures, rapports, procès-verbaux, courriers, documents administratifs.

## 2. Modèle de données (Supabase — source de vérité)

### `documents`
Registre opérationnel (upload / dépôt / workflow).

| Colonne | Rôle |
|---------|------|
| `id`, `school_id` | Identité + isolation multi-tenant |
| `student_id` | Lien optionnel vers l’élève (pas de doublon d’identité) |
| `title`, `document_type`, `file_url` | Contenu |
| `uploaded_by`, `created_at` | Traçabilité de création |
| `status` | Workflow : `draft` → `submitted` → `validated` / `rejected` → `archived` |
| `validated_by`, `validated_at` | Validation humaine |
| `signature_name`, `stamp_applied` | Préparation signature / cachet |
| `verification_code` | Code de vérification (base QR / authentification) |

### `document_templates`
Catalogue de modèles par école (`name`, `document_type`, `template_content`, `is_active`).

### `generated_documents`
Documents générés depuis un template (`template_id`, `document_number`, `qr_code`, statut, signature/cachet).

### `archives`
Archivage transversal (référence table + record, `archived_by`, `archived_at`) — sans suppression silencieuse (PRD §60, §66).

## 3. Workflow implémenté

Fonction RPC serveur : `transition_document_workflow(p_document_id, p_to_status, p_comment)`.

Transitions autorisées côté UI Administration :

| Statut actuel | Action | Permission |
|---------------|--------|------------|
| `draft` | Soumettre | `documents.upload` |
| `submitted` | Valider / Rejeter | `documents.validate` |
| `validated` | Archiver | `documents.validate` |

Règles respectées (PRD §87) :
- Une seule source de vérité (`documents`)
- Isolation par `school_id` + RLS
- Validation humaine obligatoire (pas de publication autonome)
- Archivage = conservation, pas suppression

## 4. UI métier

- **Administration → Documents** (`/administration/documents`)
  - Registre filtrable (recherche, statut)
  - Ouverture fichier, soumission, validation, rejet, archivage
  - Permissions : `documents.read` / `documents.upload` / `documents.validate`
- Notifications sur transitions de workflow (service transversal Notifications)

## 5. Signatures, cachets, QR (état)

| Capacité PRD | État |
|--------------|------|
| Zones signature / cachet (champs) | ✅ Colonnes présentes |
| Signature électronique complète | 🟡 Préparé, pas encore flux UI complet |
| Cachet électronique | 🟡 Préparé (`stamp_applied`) |
| QR / code de vérification | 🟡 `verification_code` + `qr_code` (generated) |
| Mode papier (print → scan → réimport) | 🟠 À finaliser |
| Vérification publique minimale | 🟠 À finaliser |

## 6. Ce qui reste (aligné PRD Release 7)

1. Génération PDF depuis `document_templates` → `generated_documents`
2. Workflow multi-niveaux configurable (Secrétaire → Censeur → Directeur)
3. Signature / cachet numériques + QR public de vérification
4. Réimport scan (mode papier) et liaison archives
5. Types documentaires riches (bulletins, reçus, convocations) branchés sur les modules métier sans 2ᵉ source de vérité

## 7. Règle de conception

Avant toute nouvelle page ou table documents :

> Cette donnée existe-t-elle déjà dans `students`, `payments`, `report_cards`, etc. ?
> Si oui → la réutiliser. Ne jamais créer une fiche « document-élève » parallèle.
