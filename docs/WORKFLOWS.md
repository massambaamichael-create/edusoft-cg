# WORKFLOWS.md — EduSoft CG

Dernière mise à jour : 23 septembre 2026

Référence PRD : §45, §75–78.

## 1. Principe

Chaque type de document ou d’opération critique peut avoir son propre workflow configurable selon l’établissement.
L’IA et les automatisations **proposent** ; une personne habilitée **valide** (PRD §64).

## 2. Workflows déjà implémentés

### 2.1 Validation des classes
`pending` → `approved` / `rejected`

### 2.2 Documents (Release 7 — socle livré le 23/09/2026)

```
draft → submitted → validated | rejected → archived
```

- RPC : `transition_document_workflow`
- UI : Administration → Documents
- Permissions : `documents.upload`, `documents.validate`
- Notifications sur transitions
- Archivage sans suppression (table `archives` + statut)

### 2.3 Évaluations / corrections
Workflow de correction et notes durci (enseignant, affectations, traçabilité).
Table `assessment_workflow_actions` pour l’historique des transitions.

### 2.4 Identity (premier accès)
Mot de passe temporaire → changement obligatoire (`must_change_password` serveur) avant accès métier.

## 3. Exemples de workflows documentaires cibles (PRD)

```
Secrétaire → Directeur des Études → Directeur → Signature → Publication
```

ou

```
Comptable → Directeur → Promoteur
```

Ces chaînes multi-niveaux restent **à configurer** (le socle draft/submitted/validated/archived est en place).

## 4. Workflow global d’un élève (cible)

Création administrative → Inscription → Classe → Matières → Enseignants → Emploi du temps → Programme → Progression → Évaluations → Notes → Moyennes → Bulletin → Parent / Élève → Archives

## 5. Workflow global financier (cible)

Inscription → Frais applicables → Échéancier → Facture / situation → Paiement → Confirmation → Rapprochement → Reçu → Solde → Rapport → Audit

## 6. Workflow global documentaire (cible PRD §77)

Donnée source → Document généré → Contrôle → Validation → Signature → Cachet → Publication → QR / vérification → Archivage

**État** : création/dépôt + validation + archivage + code de vérification présents ; génération PDF, signature électronique complète et QR public à finaliser.

## 7. Workflow évaluation IA (cible PRD §78)

Programme → Progression réelle → Compétences → Paramètres du devoir → IA → Sujet A/B/C + corrigés → Contrôle humain → Validation → Attribution des variantes → Impression / diffusion → Correction → Notes → Analyse → Progression / bulletin

**État** : variantes, correction, workflow notes présents ; génération IA complète encore limitée.

## 8. Audit

- Table `audit_logs` (action, table, record, old/new data, user, IP, school_id)
- UI : Administration → Journal d’audit (`audit.read`)
- Périmètre strictement multi-tenant
