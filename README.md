# EduSoft CG

SaaS de gestion et de pilotage des établissements scolaires privés au Congo-Brazzaville.

**Positionnement** : le système d’exploitation numérique de l’établissement scolaire.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase (Auth + PostgreSQL + RLS)
- Tailwind CSS 4
- Resend, Lucide, Recharts, xlsx

## Documentation

Toute la documentation de référence se trouve dans le dossier [`docs/`](./docs) :

| Fichier | Contenu |
|---------|---------|
| [AGENTS.md](./AGENTS.md) | Règles permanentes pour le développement |
| [docs/PROJECT_STATE.md](./docs/PROJECT_STATE.md) | État actuel vs architecture cible |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Architecture produit |
| [docs/DATABASE.md](./docs/DATABASE.md) | Principes de données + inventaire |
| [docs/SECURITY.md](./docs/SECURITY.md) | RBAC, RLS, sécurité |
| [docs/ROLES_PERMISSIONS.md](./docs/ROLES_PERMISSIONS.md) | Rôles et matrice de responsabilités |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Roadmap de migration |
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | Historique des changements |

Le **PRD v2.0** est la source de vérité fonctionnelle.

## Démarrage local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Variables d’environnement nécessaires (voir Supabase + Resend) :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

## Règle de développement

> Une information est créée une seule fois, puis utilisée partout où elle est nécessaire.

Voir `AGENTS.md` pour l’ensemble des règles non négociables.
