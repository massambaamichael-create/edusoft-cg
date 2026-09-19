# MODULES.md — EduSoft CG

Cartographie des modules cibles et de leur état actuel.

## Services transversaux

| Module | Description | État actuel |
|--------|-------------|-------------|
| Identity & Access | Comptes, auth, rôles, permissions, invitations | Partiel (Auth + users + roles + création enseignant) |
| Documents & Workflows | Génération, validation, signature, cachet, QR, archivage | Absent |
| Payment Engine | Paiements multi-canaux, confirmation, rapprochement | Absent |
| Notifications & Audit | Notifications multi-canal + journal d’audit | Minimal |

## Piliers métier

| Module | Description | État actuel |
|--------|-------------|-------------|
| **Administration** | Élèves, parents, inscriptions, dossiers, documents admin | Partiel (élèves, classes ; parents absents) |
| **Pédagogie** | Classes, matières, affectations, emplois du temps, notes, bulletins | Partiel (classes + matières + début d’affectations) |
| **Programmes & Progression** | Référentiels versionnés, couverture, compétences | Absent |
| **Évaluations & Examens** | Banque de questions, sujets, variantes, corrigés, examens | Très partiel (`assessments`, `report_cards`) |
| **Finance** | Frais, échéanciers, paiements, reçus, impayés, caisse | Absent |
| **Vie scolaire** | Absences, retards, discipline, incidents | Partiel (`student_attendance`) |
| **Communication** | Messages contextualisés | Absent |
| **Santé** | Données médicales (accès ultra-restreint) | Absent |
| **Archives** | Conservation historique | Absent |
| **Pilotage Direction** | Dashboard décisionnel, alertes, validations | Partiel (dashboard basique) |

## Couche intelligente

| Module | Description | État actuel |
|--------|-------------|-------------|
| EduSoft AI | Génération sujets/corrigés, variantes, analyse, assistance | Absent |

## Règle de progression

On ne développe un module avancé que lorsque les fondations (Core) dont il dépend sont stables et documentées.
