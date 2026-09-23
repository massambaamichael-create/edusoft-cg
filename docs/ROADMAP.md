# ROADMAP.md — EduSoft CG

Alignée sur le PRD v2.0 (§82 et §83) et adaptée à l’existant.
Dernière mise à jour : 23 septembre 2026.

## Phase 0 — Documentation ✅ TERMINÉE (19 septembre 2026)

- [x] AGENTS.md + docs/* (ARCHITECTURE, DATABASE, SECURITY, ROLES, ROADMAP, CHANGELOG, BUSINESS_RULES, MODULES, PEDAGOGY, EVALUATIONS, PAYMENTS, DOCUMENTS, WORKFLOWS, AI, IDENTITY_ACCESS, PROJECT_STATE)
- [x] Resynchronisation docs Documents / Workflows / Project State / Changelog (23/09)

## Release 1 — Core 🟡 QUASI TERMINÉE

Objectif : fondations multi-tenant + année scolaire + identité + administration de base.

| Item | Statut |
|------|--------|
| École | ✅ |
| Année scolaire (contextualisation) | ✅ bien avancée |
| Utilisateurs / Rôles / RBAC | ✅ (Directeur des Études, Parent, Élève…) |
| Élèves / Parents / Tuteurs | ✅ UI + tables |
| Inscriptions | ✅ |
| Classes | ✅ + workflow validation |
| Matières (3 concepts) | 🟡 catalogue + class_subjects + assignments |
| Affectations | 🟡 `teacher_assignments` source de vérité ; legacy à purger |
| RLS affinés | 🟡 en cours (enseignants, assessments…) |
| Import & Migration Engine | 🟠 documenté, non prioritaire immédiat |

**Priorité immédiate R1 restante** : jeux de données de test + durcissement RLS.

## Release 2 — Pédagogie fondamentale 🟡 EN COURS

- [x] Matières + affectations (base)
- [x] Emplois du temps (structure riche : contraintes, scoring, génération)
- [ ] Notes → Moyennes → Bulletins (source unique) — encore partiel

## Release 3 — Finance 🟠 À RENFORCER

- [x] Tables / vues frais, paiements, reçus
- [ ] Échéanciers complets
- [ ] Payment Engine (Mobile Money MTN / Airtel, banque, espèces)
- [ ] Confirmation prestataire + rapprochement + audit financier

## Release 4 — Portails 🟡 DÉMARRÉE

- [x] Identity Parent / Élève + premiers espaces `/parent`, `/eleve`
- [x] Centre de notifications personnel
- [ ] Parcours complets (finances, bulletins, absences, documents)

## Release 5 — Programme & Progression 🟡 PRÉSENTE

- [x] Référentiels versionnés (tables)
- [x] Espace enseignant Programmes & Progression
- [ ] Couverture complète prévu / enseigné / évalué / maîtrisé en production

## Release 6 — Évaluations avancées 🟡 PRÉSENTE

- [x] Types d’évaluation, workflow, correction, variantes
- [ ] Banque de questions complète
- [ ] Génération sujets + corrigés IA sous contrôle humain
- [ ] Examens complets (salles, surveillants, PV)

## Release 7 — Documents & Workflows 🟡 SOCLE LIVRÉ (23/09)

- [x] Registre documentaire + workflow `draft/submitted/validated/rejected/archived`
- [x] RPC `transition_document_workflow`
- [x] Archivage + notifications de transition
- [x] Colonnes signature / cachet / verification_code / qr_code
- [ ] Templates → génération PDF
- [ ] Workflows multi-niveaux configurables
- [ ] Signature / cachet numériques + QR public de vérification
- [ ] Mode papier (print → scan → réimport)

## Release 8 — Intelligence 🟠 SOCLE

- [x] Gouvernance IA documentée (PRD §64)
- [ ] Génération / analyse / recommandations opérationnelles sous contrôle humain

## Ordre de travail recommandé (prochaines sessions)

1. Consolider R1 restante (données test + RLS)
2. Stabiliser parcours Admin Documents / Audit et Enseignant Évaluations / Programmes
3. Avancer Release 3 (Payment Engine) si usage réel finance prioritaire
4. Enrichir portails (R4) et finaliser Documents (R7) en parallèle contrôlée
5. Notes → Bulletins (R2) avant IA lourde (R8)

## Règle de progression

On ne déclare une release « terminée » que lorsqu’elle est stable, documentée et conforme à la Definition of Done (PRD §86).
Aucune fonctionnalité ne crée une deuxième source de vérité (PRD §71, §87.13).
