# AGENTS.md — EduSoft CG

Ce fichier est la référence permanente pour toute session de développement (humaine ou IA).

## Produit

**EduSoft CG** est un SaaS de gestion et de pilotage des établissements scolaires privés au Congo-Brazzaville.

Positionnement : le système d’exploitation numérique de l’établissement scolaire.

## Règle absolue

> **UNE INFORMATION EST CRÉÉE UNE SEULE FOIS, PUIS UTILISÉE PARTOUT OÙ ELLE EST NÉCESSAIRE.**

Aucune duplication de source de vérité n’est autorisée.

## Architecture cible (résumé)

- Multi-tenant strict (chaque école = un tenant)
- Multi-années scolaires (aucune année n’écrase une autre)
- RBAC + RLS
- Services transversaux : Identity & Access, Documents & Workflows, Payment Engine, Notifications & Audit
- Piliers métier : Administration, Pédagogie, Programmes & Progression, Évaluations & Examens, Finance, Vie scolaire, Communication, Santé, Archives, Pilotage Direction
- Couche intelligente : EduSoft AI (assistante contrôlée, jamais autorité autonome)

## Stack technique actuelle

- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase (Auth + PostgreSQL + RLS)
- Tailwind CSS 4
- Resend (emails)
- Lucide React, Recharts, xlsx

## Règles de développement non négociables

1. Une information est créée une seule fois.
2. Aucune école ne peut accéder aux données d’une autre.
3. Une année scolaire ne doit jamais écraser une autre.
4. Le rôle détermine ce qu’un utilisateur peut faire (RBAC).
5. Le contexte (école + année + affectations) détermine quelles données il peut voir (RLS).
6. Le Directeur pilote, il n’effectue pas toutes les opérations quotidiennes.
7. Les opérations financières et les notes validées doivent être traçables (audit).
8. L’IA propose / génère / analyse ; une personne habilitée valide les opérations critiques.
9. Aucune nouvelle fonctionnalité ne doit créer une deuxième source de vérité.
10. Avant toute nouvelle page ou table, répondre aux 13 questions de conception (voir PRD §69).

## Règle de reprise du projet existant

Améliorer et migrer progressivement. Ne jamais repartir de zéro.

Avant toute modification majeure :
1. Identifier l’existant
2. Identifier ce qui fonctionne
3. Identifier les incohérences
4. Comparer avec l’architecture cible
5. Conserver les composants réutilisables
6. Migrer progressivement
7. Tester
8. Supprimer uniquement ce qui est réellement obsolète

## Documentation de référence

Tous les documents se trouvent dans `/docs` :

- `PROJECT_STATE.md` — état actuel vs cible
- `ARCHITECTURE.md`
- `DATABASE.md`
- `SECURITY.md`
- `ROLES_PERMISSIONS.md`
- `BUSINESS_RULES.md`
- `ROADMAP.md`
- `CHANGELOG.md`

Le PRD complet (Product Requirements Document v2.0) est la source de vérité fonctionnelle.

## Definition of Done (rappel)

Une fonctionnalité n’est terminée que si :
- son objectif et son rôle sont clairs
- la source de données est unique
- l’école et l’année scolaire sont correctement gérées
- les permissions et le RLS sont vérifiés
- l’audit est prévu si nécessaire
- les données sont réutilisables par les autres modules
- les scénarios principaux sont testés

## Contact / contexte

Projet privé. Développé pour le marché congolais (établissements privés : Primaire, Collège, Lycée général et technique).
