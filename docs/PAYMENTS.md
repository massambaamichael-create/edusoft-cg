# PAYMENTS.md — EduSoft CG

## 1. Structure cible

```
Frais
 ↓
Échéances
 ↓
Facturation
 ↓
Paiement
 ↓
Confirmation
 ↓
Rapprochement
 ↓
Reçu
 ↓
Comptabilité
```

Types de frais configurables : inscription, scolarité, transport, cantine, examens, activités, autres.

## 2. Payment Engine (service transversal)

Canaux :
- Mobile Money (MTN MoMo, Airtel Money)
- Banque
- Espèces
- Autres moyens configurables

L’architecture doit permettre d’ajouter de nouveaux prestataires sans reconstruire le module Finance.

## 3. Statuts de transaction

Initiée → En attente → Confirmée → Échouée → Annulée → Remboursée → Rapprochée

Règle critique :
EduSoft ne considère **jamais** automatiquement un paiement comme définitivement encaissé sur la seule base de l’action du parent.
La confirmation doit provenir du système de paiement selon le mécanisme d’intégration retenu.

## 4. Contrôle et audit

Chaque opération possède : utilisateur, date, montant, référence, mode, statut, ancienne valeur (si modification), nouvelle valeur, motif, validation.

Une transaction confirmée ne doit pas être supprimée silencieusement.
Les corrections produisent une trace d’audit.

## 5. Caisse (espèces)

Ouverture → Encaissements → Sorties autorisées → Clôture → Rapprochement → Écarts → Validation.

Le Directeur contrôle les résultats sans effectuer les opérations quotidiennes.

## 6. Impayés et relances

Calcul automatique : montant dû, payé, solde, retard, échéance, historique.
Relances automatisables (avant, à, après échéance).

## 7. État actuel

Module **absent**. Priorité : Release 3 (après Core et Pédagogie fondamentale).
