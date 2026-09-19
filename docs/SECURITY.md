# SECURITY.md — EduSoft CG

## 1. Principes non négociables

- Authentification sécurisée (Supabase Auth)
- RBAC (rôle → actions autorisées)
- RLS (contexte → données visibles)
- Isolation stricte des tenants (`school_id`)
- Isolation des années scolaires
- MFA recommandé pour les rôles sensibles (cible)
- Journal d’audit sur les opérations critiques
- Protection des données sensibles (médicales, financières)
- Validation des opérations critiques
- Limitation des permissions au strict nécessaire
- Absence de suppression silencieuse des données importantes

## 2. RBAC + RLS — les deux niveaux

**RBAC** répond à : « Ce rôle peut-il effectuer cette action ? »

**RLS** répond à : « Sur quelles données cette personne peut-elle effectuer cette action ? »

Contexte combiné :
```
École + Année scolaire + Contexte pédagogique + Rôle + Affectation
```

## 3. Helpers RLS existants

```sql
get_my_school_id()   -- UUID de l’école de l’utilisateur connecté
get_my_role_name()   -- Nom du rôle (Directeur, Enseignant…)
is_director()        -- true si rôle = Directeur
```

Ces fonctions sont `SECURITY DEFINER`.

## 4. État actuel des policies

- Tables principales : SELECT limité à la même école
- Écriture (INSERT/UPDATE/DELETE) : principalement réservée au Directeur
- `assessments` et `report_cards` : policies encore trop ouvertes (à durcir)
- Junction tables : policies via jointure sur la table parente

## 5. Règles cibles pour les enseignants

Un enseignant affecté à « Mathématiques – 3e A » ne doit voir/modifier que les données pédagogiques autorisées de cette classe + matière.

Il ne reçoit pas automatiquement accès aux autres classes ni aux finances.

## 6. Service Role

La clé `service_role` (utilisée dans `lib/supabaseAdmin.ts`) **contourne le RLS**.

Elle est volontairement utilisée pour certaines opérations d’administration (ex. création d’enseignant).

Règle : l’utiliser uniquement quand c’est strictement nécessaire, et toujours logger l’opération.

## 7. Données financières et notes

- Une transaction confirmée ou une note validée est considérée comme historique.
- On privilégie la correction via opération inverse + motif + trace d’audit plutôt que la modification silencieuse.

## 8. Prochaines améliorations prioritaires

1. Affiner les policies enseignants (lecture/écriture limitée aux affectations)
2. Ajouter des rôles intermédiaires (Secrétariat, Directeur des Études, Finance…)
3. Durcir les policies sur `assessments` et `report_cards`
4. Introduire une table d’audit générique
5. Préparer le terrain pour MFA sur les rôles sensibles
