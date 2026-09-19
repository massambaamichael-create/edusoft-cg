# AUTH.md — EduSoft CG

## Principe

```
AUTH (Supabase)
  → USERS (school_id, role_id)
      → SCHOOLS
      → ROLES → ROLE_PERMISSIONS → PERMISSIONS
          → has_permission() / get_my_role() / get_my_permissions()
```

Pour un enseignant, une action pédagogique n’est autorisée que si :

1. `has_permission('…')`
2. `school_id` correct
3. année scolaire cohérente
4. `is_my_class_subject(class_subject_id)` lorsque applicable

## Couche frontend (`lib/auth/`)

| Fichier | Rôle |
|---------|------|
| `types.ts` | Types rôle, permissions, école, contexte |
| `permissions.ts` | Appels RPC Supabase |
| `useCurrentUser.ts` | Hook React central |
| `index.ts` | Exports |

### Usage recommandé (Client Component)

```tsx
import { useCurrentUser } from "@/lib/auth";

const { role, school, hasPermission, loading } = useCurrentUser();

if (loading) return null;

if (hasPermission("students.create")) {
  // afficher l’action
}
```

### Côté API / serveur

```ts
import { resolveRoleIdByName, checkPermission } from "@/lib/auth";
```

## Multi-espaces par rôle (particularité EduSoft)

Un rôle ≠ masquer des boutons dans une UI unique.

Cible progressive :

| Rôle | Espace |
|------|--------|
| Directeur | Direction / pilotage |
| Enseignant | Espace enseignant (ses classes / matières) |
| Secrétaire | Administration |
| Comptable | Finance |
| Surveillant | Vie scolaire |
| Parent / Élève | Portails (releases ultérieures) |

La Phase 1 pose uniquement la **couche d’identité et de permissions**.  
Les layouts par rôle arrivent en Phase 2+.

## Règles

- Ne plus hardcoder d’UUID de rôle
- Préférer `hasPermission` / `getMyRole` aux tests dispersés
- Ne pas réappliquer l’ancienne migration RLS du repo (obsolète vs production)
- Ne pas casser l’auth existante lors des migrations d’UI
