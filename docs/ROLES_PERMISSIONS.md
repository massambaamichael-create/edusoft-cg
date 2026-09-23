# ROLES_PERMISSIONS.md — EduSoft CG

## 1. Rôles cibles (PRD)

| Rôle | Responsabilité principale | Interface |
|------|---------------------------|-----------|
| **Promoteur / Fondateur** | Vision, stratégie, investissements, contrôle global | Pilotage stratégique multi-établissements |
| **Directeur / Chef d’établissement** | Supervise, arbitre, décide, valide, contrôle | Dashboard pilotage + alertes + validations |
| **Directeur des Études / Censeur** | Organisation pédagogique, emplois du temps, affectations, programmes, évaluations, bulletins | Pédagogie |
| **Administration / Secrétariat** | Élèves, parents, inscriptions, dossiers, documents admin | Administration |
| **Finance / Comptabilité** | Frais, échéanciers, paiements, reçus, impayés, caisse | Finance |
| **Vie scolaire** | Absences, retards, discipline, incidents | Vie scolaire |
| **Enseignant** | Ses classes, ses matières, ses évaluations, ses notes | Enseignement |
| **Parent / Tuteur** | Enfants liés, résultats, finances, communication | Portail parent |
| **Élève** | Emploi du temps, notes, devoirs, documents | Portail élève |
| **Services spécialisés** (RH, Infirmerie, Sécurité…) | Selon service | Espaces restreints |

## 2. Matrice de responsabilités (extrait PRD §15)

| Domaine | Responsable principal | Direction |
|---------|-----------------------|-----------|
| Élèves | Administration | Supervision |
| Parents | Administration | Supervision |
| Inscriptions | Administration | Validation selon règles |
| Classes | Administration / Pédagogie | Supervision |
| Matières | Pédagogie | Supervision |
| Affectations | Directeur des Études | Validation |
| Emplois du temps | Directeur des Études | Consultation |
| Programmes | Directeur des Études | Pilotage |
| Progression | Enseignants | Supervision |
| Notes | Enseignants | Validation selon workflow |
| Bulletins | Pédagogie | Validation |
| Absences | Enseignants / Vie scolaire | Supervision |
| Discipline | Vie scolaire | Décisions importantes |
| Paiements | Finance | Contrôle |
| Documents officiels | Service propriétaire | Autorité habilitée |
| Signatures / Cachets | Autorité habilitée | Selon document |

## 3. Identity & Access — règle de provisioning

Tout rôle disposant d'un espace nécessitant une authentification suit le modèle centralisé :

`auth.users` → authentification / mot de passe  
`users` → identité + école + rôle  
`profil métier` → données métier existantes  
`espace` → accès déterminé par RBAC + RLS

L'identifiant de connexion actuel est l'email du compte Auth. Le matricule ou identifiant métier reste une donnée distincte. Lorsqu'un compte est créé par l'établissement, un mot de passe temporaire est généré côté serveur, transmis par un canal contrôlé et marqué pour changement obligatoire à la première connexion. Aucun mot de passe n'est stocké dans les tables métier.

Cette règle s'applique notamment aux espaces Enseignant, Parent/Tuteur, Élève, Finance/Comptabilité, RH, Administration/Secrétariat, Vie scolaire, Santé/Infirmerie et aux espaces de Direction selon les permissions.

## 4. État actuel dans le code

- Rôle principal géré : **Directeur** (`is_director()`)
- Création d’enseignants avec un `role_id` hardcodé
- Pas encore de gestion fine des autres rôles côté application
- RLS principalement orientée « même école + Directeur »

## 5. Objectif de migration

1. Introduire tous les rôles ci-dessus dans la table `roles`
2. Étendre les helpers RLS (`is_teacher()`, `is_secretary()`, etc.)
3. Affiner les policies selon le rôle + les affectations
4. Adapter l’interface (Sidebar + pages) selon le rôle de l’utilisateur connecté

## 6. Règle d’or pour les enseignants

Un enseignant ne voit et ne modifie que ce qui lui est explicitement affecté (classes + matières + année).
