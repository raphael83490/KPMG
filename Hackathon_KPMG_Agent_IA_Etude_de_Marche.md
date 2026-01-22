# Hackathon KPMG — Agent IA d’Étude de Marché & Due Diligence  
**Récapitulatif global du projet**

---

## 1. Contexte & objectif du hackathon
Dans le cadre du hackathon organisé avec **KPMG**, l’objectif est de concevoir une **solution IA concrète, crédible et actionnable**, capable d’améliorer en profondeur la manière dont les consultants réalisent des **études de marché et des due diligences**.

L’enjeu n’est pas de produire un démonstrateur théorique, mais un **MVP réaliste**, projetable en conditions réelles cabinet.

---

## 2. Problème identifié
Aujourd’hui, une grande partie du temps consultant est absorbée par :
- la recherche d’informations hétérogènes,
- la formalisation de rapports,
- la structuration de slides,
- la gestion d’informations incomplètes ou peu fiables (marchés niche).

👉 Ce temps est **à faible valeur ajoutée**, alors que le rôle du consultant est d’analyser, juger, recommander.

---

## 3. Vision du projet
Créer un **agent IA de consulting** qui :
- structure le raisonnement comme un consultant senior,
- produit des livrables exploitables (rapport + slides),
- rend explicites ses hypothèses,
- sait reconnaître ses limites,
- et **active l’expertise humaine quand nécessaire**.

L’IA **n’automatise pas bêtement** :  
elle **augmente la valeur du consultant**.

---

## 4. Fonctionnement général de l’agent IA

### 4.1 Architecture du rapport
L’agent travaille selon un **plan fixe et lisible** :

#### Grand I — Le Marché
- Définition & périmètre
- Sizing (TAM / SAM / SOM ou équivalent)
- Segmentation
- Tendances & drivers
- Chaîne de valeur / régulation (si pertinent)

#### Grand II — Paysage concurrentiel
- Principaux acteurs
- Modèles économiques
- Chiffres clés (si disponibles)
- Facteurs clés d’achat
- Positionnement relatif des acteurs

#### Grand III — Conclusion & recommandations
- Synthèse exécutive
- Risques & zones d’incertitude
- Leviers de développement
- Prochaines étapes recommandées

---

### 4.2 Contenu de chaque sous-partie
Pour chaque sous-section, l’agent fournit :
- une **structure claire avec titres et sous-titres**,
- un **texte récapitulatif clair et complet**,
- des **graphiques et visuels pertinents** (graphiques de données, diagrammes, tableaux, infographies),
- un **score de confiance**,
- un indicateur : *fiable / à renforcer / à valider*,
- un accès au **détail du raisonnement** :
  - sources utilisées,
  - hypothèses retenues,
  - méthodes de calcul,
  - limites identifiées.

---

## 5. Méthodes de recherche de l’agent IA
L’agent choisit la méthode la plus pertinente selon le contexte :

1. **Sources fiables**
   - anciennes missions,
   - bases sectorielles (ex. Xerfi).

2. **Sources publiques**
   - web, open data, sites institutionnels.

3. **Marchés peu documentés (niche)**
   - équations simples (prix × volume),
   - ordres de grandeur,
   - marchés comparables (proxy),
   - scénarios d’hypothèses.

👉 Si la donnée n’existe pas, l’agent **n’invente pas** :  
il **formule et trace des hypothèses**.

---

## 6. Déroulé d’une interaction “Étude de marché”

### Étape 1 — Input utilisateur
Un **formulaire / quiz** permet de cadrer la mission :
- marché,
- géographie,
- objectif (DD, benchmark, propale, etc.),
- niveau de profondeur attendu,
- contraintes éventuelles.

### Étape 2 — Output principal
- génération automatique du **rapport complet structuré** comprenant :
  - texte avec titres et sous-titres hiérarchisés,
  - graphiques et visualisations de données (courbes, barres, camemberts, etc.),
  - tableaux synthétiques,
  - autres visuels pertinents (diagrammes, schémas, infographies),
- **export PowerPoint** via template cabinet avec intégration des visuels.

### Étape 3 — Interaction itérative
L’utilisateur peut :
- approfondir une section,
- demander la méthodologie,
- modifier une hypothèse,
- recalculer automatiquement les résultats.

---

## 7. Gestion de l’incertitude : “Expert-in-the-loop”
Lorsque l’agent détecte :
- une donnée faible,
- une hypothèse trop structurante,
- un marché très niche,
- ou un enjeu business critique,

👉 il **recommande explicitement** le recours à un **expert humain**.

### Rôle de l’agent dans ce cas :
1. expliquer ce qui doit être validé,
2. définir le profil d’expert pertinent,
3. proposer une mise en relation (via réseaux d’experts),
4. préparer un **guide d’entretien structuré**,
5. intégrer le retour de l’expert :
   - retranscription,
   - synthèse,
   - mise à jour du rapport,
   - amélioration du score de confiance.

---

## 8. Mode hors “Étude de marché”
En dehors de ce mode structuré, l’agent fonctionne comme :
- un **LLM classique**,
- connecté aux **bases de données internes KPMG**,
- pour de la Q&A, de la synthèse ou de la recherche documentaire.

---

## 9. Démonstration lors du hackathon
- Cas fil rouge choisi : **Pet Care**.
- Démo basée sur :
  - un parcours utilisateur complet,
  - un livrable final (slides),
  - éventuellement une vidéo si nécessaire.
- Promesse mise en avant :
  > *3 semaines de travail consultant transformées en quelques minutes.*

---

## 10. Message clé du projet
> L’IA ne remplace pas le consultant.  
> Elle structure son raisonnement, accélère son travail  
> et sait quand faire intervenir l’expertise humaine.

C’est une **nouvelle manière de travailler en consulting** :
plus rapide, plus fiable, plus capitalisable.
