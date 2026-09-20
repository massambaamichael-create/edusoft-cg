# IMPORT_MIGRATION.md — EduSoft CG

## 1. Mission

L’Import & Migration Engine est le point d’entrée contrôlé des données existantes d’un établissement vers EduSoft CG.
Il ne s’agit pas d’un simple import Excel des élèves.
Le moteur doit intégrer progressivement les données administratives, pédagogiques, RH, financières et de vie scolaire, puis les transformer en données natives EduSoft CG.

> Une information est créée une seule fois, puis réutilisée partout où elle est nécessaire.

Une donnée importée devient une source de vérité commune, réutilisable par les autres domaines selon leurs permissions.

## 2. Périmètre

- établissement et référentiels
- élèves
- parents / tuteurs
- inscriptions
- enseignants
- personnel administratif et autres personnels
- cycles, niveaux, séries, classes
- matières et matières dans les classes
- affectations pédagogiques
- finance
- évaluations / résultats historiques
- absences / retards / discipline
- documents et références documentaires

Les données sensibles (RH, santé, finance, documents sensibles) restent soumises à leurs contrôles propres.

## 3. Source unique de vérité

L’import alimente les tables métier existantes. Il ne crée pas une deuxième base parallèle de données importées.

Exemples :
- Excel élève → students
- Excel parent → parents
- relation familiale → student_parents
- inscription → student_enrollments
- matière/classe → class_subjects
- affectation → teacher_assignments

Les données deviennent ensuite disponibles aux modules concernés : Administration, Pédagogie, Finance, RH, Vie scolaire, Documents, Communication, etc.

## 4. Import par métier et par permissions

Le droit d’utiliser l’Import & Migration Engine n’est jamais un droit global.

Rôle → Permission → Domaine → Périmètre → École → Année scolaire → Données autorisées.

- Administration / Secrétariat : élèves, parents/tuteurs, inscriptions et données administratives autorisées.
- RH : personnel et données RH autorisées.
- Pédagogie / Directeur des Études : référentiels pédagogiques, classes, matières, affectations et données pédagogiques autorisées.
- Finance / Comptabilité : frais, paiements et historiques financiers autorisés.
- Vie scolaire : absences, retards et discipline autorisés.
- Infirmerie : données de santé autorisées, avec restrictions renforcées.
- Directeur : supervision, validation et contrôle selon les permissions disponibles.

Un rôle ne reçoit jamais automatiquement accès aux autres domaines parce qu’il peut importer dans son propre domaine.

## 5. Réutilisation inter-modules

L’utilisateur autorisé à importer une donnée crée ou met à jour la source de vérité. Les autres services ne réimportent pas la même donnée.

Exemple : Administration importe un élève. Le même élève est ensuite réutilisé par Pédagogie, Vie scolaire, Finance, Documents et Direction selon leurs droits.

Chaque rôle ne voit que les données autorisées par son métier et les RLS.

## 6. Identité et numérotation

L’import doit pouvoir attribuer des identifiants métier stables sans remplacer les UUID techniques.

Élève : students.id = identifiant technique ; Student Number / matricule EduSoft = identifiant métier visible. Exemple : EDCG-2026-000245.

Le format doit pouvoir être configurable par établissement.

Personnel / enseignant : le projet possède déjà teachers.employee_number ; l’évolution doit réutiliser cette structure lorsqu’elle est suffisante.

Parent / tuteur : prévoir un identifiant métier propre lorsque le modèle de données le permet.

Identifiant externe : conserver le matricule ou identifiant historique de l’établissement lorsque celui-ci existe.

Un nouvel import doit réutiliser l’identité existante au lieu de créer un doublon.

## 7. Détection des doublons

Ordre de rapprochement à adapter aux données disponibles :
1. identifiant externe stable
2. identifiant EduSoft existant
3. email / téléphone lorsque fiables
4. combinaison identité + date de naissance
5. autres critères configurables

Un cas ambigu ne doit jamais être fusionné silencieusement. Il doit être présenté comme conflit à résoudre.

## 8. Workflow d’import

1. Sélection du fichier
2. Identification du domaine métier
3. Vérification des permissions
4. Détection du format
5. Lecture du fichier
6. Mapping des colonnes
7. Prévisualisation
8. Validation des références
9. Détection des doublons et conflits
10. Rapport de pré-import
11. Validation humaine
12. Import par lots
13. Génération / réutilisation des identifiants
14. Création des relations
15. Rapport final
16. Journal d’audit

Aucun import massif ne doit être exécuté directement après la sélection du fichier.

## 9. Dépendances

Le moteur doit respecter les dépendances réelles de la base.

Ordre général : école / année → référentiels → classes / matières → personnel / enseignants → élèves / parents → relations / inscriptions → matières dans les classes → affectations → données historiques dépendantes.

L’ordre exact doit être dérivé du schéma réel et de ses contraintes.

## 10. Année scolaire et séparation pédagogique

Tout import doit être contextualisé par école, année scolaire lorsque pertinent, et contexte pédagogique lorsque pertinent.

La séparation Lycée Général / Lycée Technique est obligatoire et doit être préservée pendant le mapping et l’import.

Les données historiques ne doivent jamais être écrasées par un import d’une nouvelle année.

## 11. Prévisualisation et validation

Le pré-import doit présenter : lignes totales, créations prévues, mises à jour prévues, doublons potentiels, conflits, champs obligatoires manquants, références inconnues, formats invalides et relations impossibles.

L’utilisateur autorisé valide ensuite l’opération.

## 12. Journalisation

Chaque import doit avoir un identifiant de lot et conserver : utilisateur, rôle, école, année, domaine, fichier, date/heure, lignes analysées, créations, mises à jour, conflits, erreurs, identifiants générés et résultat final.

Lorsque techniquement possible, chaque donnée importée conserve une référence vers son identifiant externe et son lot d’import.

## 13. Sécurité

Le moteur doit utiliser les permissions existantes et les RLS.
Le contrôle d’interface n’est jamais suffisant : l’API / serveur doit également vérifier les permissions et le périmètre.
La service_role ne doit pas être utilisée comme moyen de contourner les règles métier ou d’accorder implicitement un accès global.

## 14. Compatibilité avec l’existant

Le projet possède déjà un import Excel dans app/pedagogie/classes/page.tsx.
Cet import doit être analysé et progressivement intégré au moteur transversal.
Ne pas supprimer brutalement la fonctionnalité existante et ne pas dupliquer son comportement dans un second système.

## 15. Enseignants et affectations

teacher_assignments est la source officielle des affectations pédagogiques.
Les nouvelles fonctions d’import doivent alimenter cette structure.
teacher_subjects reste legacy/compatibilité pendant la migration progressive et ne doit pas redevenir la source de vérité.

## 16. Comptes utilisateurs

Importer une personne ne signifie pas automatiquement créer un compte Auth.
Distinction obligatoire : Personne → identité → compte éventuel → rôle → espace métier → permissions.

## 17. Principe de non-duplication

Avant toute nouvelle table, API ou fonction : vérifier si la donnée existe déjà, identifier sa source de vérité, vérifier les relations, vérifier permissions/RLS, réutiliser l’existant lorsque possible et ne créer une structure qu’en cas de besoin réel.

L’Import & Migration Engine est une couche d’entrée vers EduSoft CG, pas une nouvelle base métier.

## 18. Évolution prévue

Le moteur doit pouvoir supporter Excel .xlsx, CSV, templates EduSoft CG, mapping manuel, mapping assisté, validation, dédoublonnage, import par lots, historique des migrations, rollback lorsque techniquement possible et migrations progressives.

La priorité initiale est : Excel/CSV + mapping + prévisualisation + validation + dédoublonnage + import natif + journalisation + permissions métier.