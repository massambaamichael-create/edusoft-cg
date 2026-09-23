# DOCUMENTS.md — EduSoft CG

Dernière mise à jour : 23 septembre 2026

Référence PRD : §43–46, §77, Release 7.

## 1. Service transversal Documents

```
Document
 ↓
Création / dépôt (draft)
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

| Statut actuel | Action | Permission |
|---------------|--------|------------|
| — | Créer brouillon | `documents.upload` |
| `draft` / `rejected` | Soumettre | `documents.upload` |
| `submitted` | Valider / Rejeter | `documents.validate` |
| `validated` | Archiver | `documents.validate` |

**RLS** (migration `documents_rls_school_scope_and_create`) :
- SELECT / INSERT / UPDATE isolés par `school_id = get_my_school_id()`
- `student_id` optionnel ; s’il est renseigné, il doit appartenir à la même école
- DELETE limité aux `draft` / `rejected` + `documents.upload`

Règles respectées (PRD §87) :
- Une seule source de vérité (`documents`)
- Isolation par `school_id` + RLS
- Validation humaine obligatoire (pas de publication autonome)
- Archivage = conservation, pas suppression

## 4. UI métier

- **Administration → Documents** (`/administration/documents`)
  - Cartes stats (total, brouillons, à valider, validés/archivés)
  - **Nouveau document** (modal) : titre, type PRD, élève optionnel, URL fichier optionnelle → statut `draft` + `verification_code`
  - Registre filtrable (recherche, statut)
  - Actions : ouvrir, soumettre, valider, rejeter, archiver
  - Design aligné Admin (slate, cards arrondies, modal)
  - Permissions : `documents.read` / `documents.upload` / `documents.validate`
- Notifications sur transitions de workflow

## 5. Signatures, cachets, QR (état)

| Capacité PRD | État |
|--------------|------|
| Zones signature / cachet (champs) | ✅ Colonnes présentes |
| Signature électronique complète | 🟡 Préparé, pas encore flux UI complet |
| Cachet électronique | 🟡 Préparé (`stamp_applied`) |
| QR / code de vérification | 🟡 `verification_code` généré à la création |
| Mode papier (print → scan → réimport) | 🟠 À finaliser |
| Vérification publique minimale | 🟠 À finaliser |

## 6. Ce qui reste (aligné PRD Release 7)

1. Upload fichier Storage (au-delà de l’URL manuelle)
2. Génération PDF depuis `document_templates` → `generated_documents`
3. Workflow multi-niveaux configurable (Secrétaire → Censeur → Directeur)
4. Signature / cachet numériques + QR public de vérification
5. Réimport scan (mode papier) et liaison archives
6. Types documentaires branchés sur les modules métier sans 2ᵉ source de vérité

## 7. Règle de conception

Avant toute nouvelle page ou table documents :

> Cette donnée existe-t-elle déjà dans `students`, `payments`, `report_cards`, etc. ?
> Si oui → la réutiliser. Ne jamais créer une fiche « document-élève » parallèle.
