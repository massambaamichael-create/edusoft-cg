# ROADMAP.md — EduSoft CG

Alignée sur le PRD v2.0 (§82 et §83) et adaptée à l’existant.

## Phase 0 — Documentation (en cours)

- [x] AGENTS.md
- [x] docs/PROJECT_STATE.md
- [x] docs/ARCHITECTURE.md
- [x] docs/DATABASE.md
- [x] docs/SECURITY.md
- [x] docs/ROLES_PERMISSIONS.md
- [x] docs/ROADMAP.md
- [ ] docs/CHANGELOG.md
- [ ] docs/BUSINESS_RULES.md (ultérieur)
- [ ] Autres docs spécialisées (PEDAGOGY, PAYMENTS, etc.) au fur et à mesure

## Release 1 — Core (priorité immédiate après Phase 0)

Objectif : fondations solides multi-tenant + année scolaire + identité + administration de base.

- Authentification complète
- École + année scolaire contextualisée partout
- Utilisateurs + rôles + RLS affinés
- Administration : élèves, parents/tuteurs, classes, inscriptions
- Formalisation des 3 concepts matières

## Release 2 — Pédagogie fondamentale

- Matières + affectations
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
