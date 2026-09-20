# EVALUATIONS.md — EduSoft CG

## 1. Types d’évaluations (cible)

- Interrogation
- Devoir
- Devoir surveillé
- Composition
- Examen
- Test
- Évaluation diagnostique
- Rattrapage

Chaque évaluation est liée à : école, année, classe, matière, enseignant, programme, compétences, barème, date, durée.

## 2. Banque de questions (cible)

Chaque question possède : matière, niveau, chapitre, notion, compétence, difficulté, type, barème, durée estimée, auteur, statut, historique d’utilisation.

Statuts : Brouillon → À valider → Validée → Publiée → Archivée.

## 3. Génération IA de sujets (cible)

L’IA génère un sujet à partir de paramètres (classe, matière, programme, chapitres, compétences, durée, difficulté, barème, type, nombre de questions).

Elle doit utiliser les données pédagogiques d’EduSoft comme contexte.

Workflow obligatoire :
Demande → Génération IA → Sujet + corrigé → Contrôle humain → Modification → Validation → Publication → Impression / diffusion

## 4. Variantes anti-triche (cible)

Versions A / B / C pédagogiquement équivalentes.
Attribution automatique possible par élève.
Matrice d’équivalence conservée.

## 5. Correction

- **Mode principal — correction manuelle puis saisie directe de la note finale** : l’enseignant corrige la copie hors d’EduSoft puis renseigne simplement la note obtenue (/20 ou barème de l’évaluation).
- Saisie en feuille de classe pour les effectifs importants, avec une note par élève et appréciation facultative.
- Mode QCM automatique possible lorsqu’une évaluation est explicitement configurée pour cela.
- IA : assistance facultative, jamais substitutive au jugement de l’enseignant ; validation finale humaine.

### Règle de correction EduSoft CG
EduSoft CG ne doit pas obliger l’enseignant à saisir les points question par question pour une évaluation classique. La correction pédagogique reste celle de l’enseignant. EduSoft enregistre la note finale une seule fois, puis la transmet au workflow de validation et au registre officiel `grades` après validation.

## 6. Notes et bulletins

Les notes saisies **une seule fois** alimentent automatiquement :
- moyennes par matière
- moyennes générales
- bulletins
- statistiques
- portails parent / élève
- rapports

Aucune ressaisie.

## 7. État actuel

Tables présentes : `assessments`, `report_cards`.

Les policies RLS sont encore trop ouvertes (SELECT true).
Le schéma détaillé et les workflows ne sont pas encore stabilisés.

Priorité : après stabilisation du Core et de la Pédagogie fondamentale.
