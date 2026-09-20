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
| `routes.ts` | Mapping rôle → espace + chemin d’accueil + contrôle d’accès |
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

| Rôle | Espace principal | Statut |
|------|------------------|--------|
| Directeur | `/dashboard` (Direction) | Protégé par middleware + interface Direction existante |
| Directeur des Études | `/pedagogie` | Espace pédagogique protégé |
| Enseignant | `/enseignant` | Espace enseignant protégé |
| Secrétaire / Administrateur | `/administration` | Espace administration protégé |
| Comptable | `/finance` | Espace finance protégé |
| Surveillant | `/vie-scolaire` | Espace vie scolaire protégé |
| RH | `/rh` | Espace RH protégé |
| Infirmerie | `/sante` | Espace santé protégé |
| Parent | `/parent` | Release portail ultérieure |
| Élève | `/eleve` | Release portail ultérieure |

### Architecture consolidée

Le projet utilise une seule architecture d'espace métier :

```
Rôle
  → Permission
  → Espace métier
  → Navigation de l'espace
  → Données/actions autorisées
  → Supabase RLS
```

- `getHomePathForRole()` détermine l'espace d'accueil après authentification.
- `canRoleAccessPath()` fournit la règle centrale des espaces.
- Le middleware Supabase applique cette règle côté serveur avant de laisser accéder aux routes protégées.
- `RoleSpaceShell` fournit le shell réutilisable pour les espaces métier concernés ; il n'y a pas de second `WorkspaceGuard`/`WorkspaceSidebar` concurrent.
- Le dashboard Direction conserve son interface existante et s'appuie sur le middleware pour la protection de route.
- Le frontend ne remplace jamais Supabase RLS : l'UI limite la navigation, tandis que RLS reste l'autorité finale sur les données.

### Règle de cohérence

Un nouveau rôle ou espace doit être ajouté dans le modèle centralisé (`RoleName`, `AppSpace`, `getHomePathForRole`, `getSpaceForPath`, `rolesAllowedInSpace`, `canRoleAccessPath`) avant de créer des gardes locaux dispersés.

## Règles

- Ne plus hardcoder d’UUID de rôle
- Préférer `hasPermission` / `getMyRole` aux tests dispersés
- Ne pas réappliquer l’ancienne migration RLS du repo (obsolète vs production)
- Ne pas casser l’auth existante lors des migrations d’UI
- **Un rôle = un espace**
