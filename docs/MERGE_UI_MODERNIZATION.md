# Fusion ui-modernization → main

## Statut

| Fichier | Décision | Statut |
|---------|----------|--------|
| `app/api/teachers/route.ts` | **Fusion** : sécurité JWT + school_id auth (**ui-mod**) + `resolveRoleIdByName` (**main**) | ✅ Appliqué sur main |
| `app/page.tsx` | **main** (redirection par rôle / espaces) | ✅ Garder main |
| `lib/supabase/middleware.ts` | **main** (Role Spaces + `canRoleAccessPath`) | ✅ Garder main |
| `lib/supabase.ts` | **main** (commentaire + client browser) | ✅ Garder main |
| `components/Sidebar.tsx` | **Supprimé** (obsolète : RoleSpaceShell / layouts) | ✅ Ne pas restaurer |
| `app/pedagogie/matieres/page.tsx` | **ui-modernization** (séries, subject_curriculums, catalogue) **sans** import Sidebar | ⚠️ À finaliser |
| `app/pedagogie/classes/page.tsx` | Conserver **séparation Collège / Lycée général / Lycée technique** + améliorations ui-mod | ⚠️ À finaliser |

## Principes respectés

- Une info = une source
- Espaces par rôle (pas de sidebar globale unique)
- `teacher_assignments` = source canonique d’affectations
- Lycée général ≠ Lycée technique
- school_id / academic_year_id / RLS

## API Teachers (déjà sur main)

Conservé de **ui-modernization** :
- Bearer JWT obligatoire
- school_id = école de l’utilisateur authentifié
- refus si body.school_id ≠ école auth
- rollback Auth/users/teachers si email échoue
- escape HTML email

Conservé de **main** :
- `resolveRoleIdByName("Enseignant")` (plus d’UUID hardcodé seul)

## Matières (action restante)

Prendre le fichier de la branche `ui-modernization` @ `765b65f` :

- types Series, SubjectCurriculum
- table `subject_curriculums`
- filtres cycle / niveau / série
- catalogue + rattachement classe

Puis **retirer** :

```ts
import Sidebar from "@/components/Sidebar";
```

et tout usage JSX de `<Sidebar />`.

La page doit s’afficher dans le layout Pédagogie / Direction existant (Role Spaces).

## PR ouverte

https://github.com/massambaamichael-create/edusoft-cg/pull/1

Résoudre les conflits restants sur GitHub en suivant ce tableau (pas « ours » / « theirs » global).
