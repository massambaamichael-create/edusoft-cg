# ROADMAP.md — EduSoft CG

Alignée sur le PRD v2.0 (§82 et §83) et adaptée à l’existant.

## Phase 0 — Documentation ✅ TERMINÉE (19 septembre 2026)

- [x] AGENTS.md
- [x] docs/PROJECT_STATE.md
- [x] docs/ARCHITECTURE.md
- [x] docs/DATABASE.md
- [x] docs/SECURITY.md
- [x] docs/ROLES_PERMISSIONS.md
- [x] docs/ROADMAP.md
- [x] docs/CHANGELOG.md
- [x] docs/BUSINESS_RULES.md
- [x] docs/MODULES.md
- [x] docs/PEDAGOGY.md
- [x] docs/EVALUATIONS.md
- [x] docs/PAYMENTS.md
- [x] docs/DOCUMENTS.md
- [x] docs/WORKFLOWS.md
- [x] docs/AI.md

## Release 1 — Core (prochaine priorité)

Objectif : fondations solides multi-tenant + année scolaire + identité + administration de base.

Ordre recommandé (données & sécurité d’abord) :

1. École
2. Année scolaire (contextualisation partout)
3. Utilisateurs / Rôles (helpers RLS étendus)
4. Élèves / Parents / Tuteurs
5. Inscriptions
6. Classes (déjà bien avancées)
7. Matières (formalisation des 3 concepts)
8. Affectations
9. RLS affinés (surtout enseignants)

## Release 2 — Pédagogie fondamentale

- Matières + affectations stabilisées
- Emplois du temps (détection de conflits)
- Notes → Moyennes → Bulletins (source unique)

## Release 3 — Finance

- Frais + échéanciers
- Payment Engine (Mobile Money MTN / Airtel, banque, espèces)
- Reçus + rapprochement + audit financier

## Release 4 — Portails

- Portail parent
- Portail élève
- Notifications de base

## Release 5 — Programme & Progression

- Référentiels de programmes versionnés
- Progression pédagogique (prévu / enseigné / évalué / maîtrisé)

## Release 6 — Évaluations avancées

- Banque de questions
- Génération de sujets + corrigés
- Variantes A/B/C anti-triche
- Examens complets

## Release 7 — Documents & Workflows

- Templates + génération PDF
- Validation + signature + cachet + QR de vérification
- Archivage

## Release 8 — Intelligence

- EduSoft AI (génération, analyse, assistance, recommandations)
- Toujours sous contrôle humain pour les opérations critiques

## Règle de progression

On ne passe à la release suivante que lorsque la précédente est stable et documentée.
Chaque fonctionnalité doit respecter la Definition of Done (PRD §86).
