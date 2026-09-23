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

- RBAC opérationnel pour **Directeur**, **Directeur des Études**, **Administrateur**, **Secrétaire**, **Comptable**, **RH**, **Infirmerie**, **Surveillant**, **Enseignant**, **Parent** et **Élève**.
- Le rôle **Directeur des Études** est présent dans `public.roles` et dispose d’un socle de permissions dédié à la pédagogie : classes, matières, planification, affectations, évaluations, notes, bulletins, examens et autorisations d’examens.
- Les espaces sont séparés : `/dashboard` pour la Direction, `/pedagogie` pour le Directeur des Études, `/enseignant` pour l’Enseignant, ainsi que les espaces métier dédiés aux autres rôles.
- Le provisioning d'identités reste centralisé : `auth.users` pour l'authentification, `public.users` pour l'identité/école/rôle, et les tables métier pour les profils opérationnels.
- Les comptes Parent/Élève disposent d’identifiants de connexion dédiés et de règles RLS limitant l’accès aux dossiers autorisés.

## 5. Règles de migration et de sécurité

1. Les rôles et permissions sont définis par nom/code, sans hardcoder de UUID métier dans l’application.
2. Chaque espace vérifie le rôle autorisé et les opérations sensibles doivent également vérifier les permissions côté serveur/RLS.
3. Les données restent isolées par **école + année scolaire + contexte pédagogique** selon le domaine concerné.
4. Un rôle métier ne doit recevoir que les permissions nécessaires à ses responsabilités.
5. Les mots de passe ne sont jamais stockés dans les tables métier ; les mots de passe temporaires ne sont affichés qu’au moment de leur génération/réinitialisation.
6. Les prochaines évolutions doivent compléter la matrice de permissions et les policies RLS sans contourner le modèle centralisé.

## 6. Règle d’or pour les enseignants

Un enseignant ne voit et ne modifie que ce qui lui est explicitement affecté (classes + matières + année).