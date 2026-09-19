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

- Mode classique (papier puis saisie)
- Mode assisté (grille + barème + corrigé)
- Mode QCM (automatique)
- IA : assistance à l’analyse, validation finale humaine

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
