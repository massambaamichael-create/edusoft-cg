# IDENTITY_ACCESS.md — EduSoft CG

## Objectif

Identity & Access est une brique transversale du système. Une personne est reliée à une identité EduSoft, à un compte d'authentification éventuel, à un rôle et à son espace métier.

### Principe absolu

> UNE INFORMATION EST CRÉÉE UNE SEULE FOIS, PUIS UTILISÉE PARTOUT OÙ ELLE EST NÉCESSAIRE.

## Modèle

```
Personne
  ↓
public.users
  ├── auth_user_id → auth.users
  ├── school_id
  ├── role_id
  ├── login_identifier
  └── must_change_password
        ↓
Profil métier existant
(teacher / student / parent / personnel...)
        ↓
Espace autorisé
```

Il n'existe pas de seconde table de comptes par métier.

## Identifiant de connexion

- L'email reste l'identité de contact/Auth lorsque disponible.
- `users.login_identifier` devient l'identifiant fonctionnel central de connexion.
- Pour les profils sans email, EduSoft peut générer un identifiant établissement (ex. `EDCG-ELV-...`) tout en conservant un email Auth technique interne.
- L'identifiant métier reste distinct : matricule enseignant, matricule élève, etc.
- À terme, le PRD permet un identifiant métier de connexion configurable si le schéma et le flux Auth sont adaptés ; cette évolution ne doit pas créer une deuxième source de vérité.

## Création d'un compte

Lorsqu'un rôle nécessite un accès :

1. l'autorité habilitée crée ou active le profil métier ;
2. le service Identity & Access crée le compte Supabase Auth ;
3. un mot de passe temporaire aléatoire est généré côté serveur ;
4. `auth.users` conserve le secret d'authentification ;
5. `public.users` conserve uniquement l'identité, l'école et le rôle ;
6. le profil métier existant est relié à `users` ;
7. les identifiants sont transmis par un canal contrôlé ;
8. le premier accès doit imposer le changement du mot de passe.

Le mot de passe temporaire ne doit jamais être écrit dans une table métier, un log ou un champ de profil.

## Comptes concernés

Le modèle cible couvre notamment :

- Enseignant → espace Enseignant
- Parent / Tuteur → portail Parent
- Élève → portail Élève
- Comptable → Finance
- RH → RH
- Secrétaire → Administration
- Surveillant → Vie scolaire
- Infirmerie → Santé
- Directeur / Directeur des Études → espaces correspondant à leurs permissions

Un même compte peut évoluer de rôle uniquement via une opération autorisée et auditée.

## Gestion du cycle de vie

Identity & Access devra couvrir :

- création ;
- activation / désactivation ;
- réinitialisation du mot de passe ;
- première connexion ;
- changement obligatoire du mot de passe temporaire ;
- changement de rôle autorisé ;
- rattachement à l'école ;
- traçabilité des opérations sensibles.

## État d'implémentation

- Le provisioning Auth centralisé est maintenant disponible comme primitive réutilisable.
- Le provisioning enseignant l'utilise et marque le profil `users.must_change_password = true`.
- Le middleware impose ce changement côté serveur avant l'accès à un espace métier ; le client ne peut plus contourner cette règle via `user_metadata`.
- La page de changement de mot de passe met à jour Auth puis réinitialise le drapeau serveur.
- Les autres profils métier seront raccordés progressivement, après vérification de leurs tables, permissions et RLS.
- Aucun lint/build n'est lancé à cette étape.
