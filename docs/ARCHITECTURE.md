# ARCHITECTURE.md — EduSoft CG

## 1. Vision architecturale

EduSoft CG n’est pas une collection de pages CRUD.
C’est le **système d’exploitation numérique** de l’établissement scolaire.

Principe directeur :
> Une information est créée une seule fois, puis utilisée partout où elle est nécessaire.

## 2. Multi-tenant

Chaque établissement = un tenant logique.

Toutes les données métier sont rattachées à `SCHOOL`.
Aucune école ne peut accéder aux données d’une autre.

## 3. Contextualisation par année scolaire

Les données pédagogiques et financières sont contextualisées par année scolaire lorsque pertinent.

Exemple :
```
École X
 ├── 2025-2026
 ├── 2026-2027
 └── 2027-2028
```

Règle non négociable :
- Ne jamais supprimer
- Ne jamais écraser
- Ne jamais modifier rétroactivement les données historiques

Une nouvelle année crée un nouveau contexte.

## 4. Contexte pédagogique

```
École
 ↓
Année scolaire
 ↓
Cycle
 ↓
Filière / Section
 ↓
Niveau
 ↓
Série
 ↓
Classe
```

Séparation stricte Lycée général / Lycée technique.

## 5. Services transversaux (cœur de l’architecture)

| Service | Rôle |
|---------|------|
| **Identity & Access** | Comptes, authentification, rôles, permissions, invitations, sessions |
| **Documents & Workflows** | Génération, validation, signature, cachet, QR, archivage |
| **Payment Engine** | Paiements multi-canaux, confirmation, rapprochement, reçus |
| **Notifications & Audit** | Notifications multi-canal + journal d’audit complet |

## 6. Piliers métier

- Administration
- Pédagogie
- Programmes & Progression
- Évaluations & Examens
- Finance
- Vie scolaire
- Communication
- Santé (accès fortement restreint)
- Archives
- Pilotage Direction

## 7. Couche intelligente

**EduSoft AI** :
- Génère (sujets, corrigés, variantes)
- Analyse (résultats, progression, anomalies)
- Assiste
- Recommande

Mais **n’a jamais d’autorité autonome** sur les données critiques (notes, paiements, signatures, permissions, suppressions historiques).

## 8. Moteurs réutilisables (cible)

- Calculation Engine (moyennes, soldes, statistiques)
- Rules Engine (permissions, validations, alertes)
- Planning Engine (emplois du temps, salles, examens)
- Document Engine
- Workflow Engine
- Notification Engine
- Payment Engine
- Audit Engine
- AI Layer

## 9. Stack technique actuelle (et conservée)

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 |
| Backend / API | Route Handlers Next.js + Supabase |
| Base de données | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Sécurité données | RLS (Row Level Security) |
| Emails | Resend |
| Admin bypass | `supabaseAdmin` (service_role) — à utiliser avec parcimonie |

## 10. Principes de conception des pages

Avant de créer une nouvelle page ou fonctionnalité, répondre obligatoirement aux 13 questions du PRD §69 :

1. Quelle est sa mission exacte ?
2. Quel rôle l’utilise ?
3. Quelle donnée lui appartient ?
4. Quelle donnée doit être récupérée ailleurs ?
5. Existe-t-il déjà une fonction équivalente ?
6. Quelle est la source officielle de la donnée ?
7. Où cette donnée sera-t-elle réutilisée ?
8. Quelle école ?
9. Quelle année scolaire ?
10. Quel contexte pédagogique ?
11. Quelles règles RLS ?
12. Quelles actions sont autorisées ?
13. Que se passe-t-il lorsque la donnée change ?

## 11. Interfaces par rôle

L’interface doit changer selon le rôle (pas seulement cacher des boutons) :

- Directeur → Pilotage + Alertes + Validations
- Directeur des Études → Pédagogie
- Secrétaire → Administration
- Comptable → Finance
- Enseignant → Ses classes / matières / évaluations
- Parent → Enfants + finances + communication
- Élève → Parcours scolaire

## 12. Flux globaux cibles

Voir PRD §75 à §78 :
- Workflow élève
- Workflow financier
- Workflow documentaire
- Workflow évaluation IA
