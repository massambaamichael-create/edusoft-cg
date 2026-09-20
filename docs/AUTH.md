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
| `routes.ts` | Mapping rôle → chemin d’accueil |
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

| Rôle | Espace (chemin) | Statut |
|------|-----------------|--------|
| Directeur | `/dashboard` (Direction) | **Protégé / existant** |
| Enseignant | `/enseignant` | **Protégé / existant** |
| Secrétaire / Admin | `/administration` | **Espace protégé** |
| Comptable | `/finance` | **Espace protégé** |
| Surveillant | `/vie-scolaire` | **Espace protégé** |
| RH | `/rh` | **Espace protégé / socle** |
| Infirmerie | `/sante` | **Espace protégé / socle** |
| Directeur des Études | `/pedagogie` | **Espace protégé** |
| Parent / Élève | `/parent`, `/eleve` | Releases ultérieures |

### Comportement actuel

- Après login → `get_my_role()` → redirection vers l’espace principal du rôle
- Les espaces métier sont protégés par un garde de route côté interface : un rôle non autorisé est redirigé vers son espace d’accueil
- Le serveur/RLS reste l’autorité de sécurité : le garde frontend ne remplace jamais les politiques Supabase
- L’espace enseignant conserve sa sidebar dédiée ; les autres espaces disposent de leur propre navigation métier
- Les modules restent partiels tant que leurs fonctionnalités métier ne sont pas livrées : protéger un espace ne signifie pas que tout son domaine est terminé

## Règles

- Ne plus hardcoder d’UUID de rôle
- Préférer `hasPermission` / `getMyRole` aux tests dispersés
- Ne pas réappliquer l’ancienne migration RLS du repo (obsolète vs production)
- Ne pas casser l’auth existante lors des migrations d’UI
- **Un rôle = un espace**
