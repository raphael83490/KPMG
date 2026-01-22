# Mapping démo Pet Care — Système en cascade par section
**Plan détaillé pour démontrer le système de recherche en cascade (INTERNE → WEB → ESTIMATION)**

---

## 🎯 Objectif
Montrer clairement que **le système essaie toujours INTERNE d'abord, puis WEB, puis ESTIMATION** pour chaque information, avec un focus particulier sur la **segmentation approfondie** et la **détection d'incertitude** (expert-in-the-loop).

**Important** : Les sources ne sont **pas prédéfinies** - elles dépendent de ce qui est trouvé dans la cascade.

---

## 🔄 Système en cascade (pour chaque information)

Pour **chaque information recherchée**, le système applique cette logique :

```
1. 🟢 INTERNE KPMG
   ├─ Si trouvé → Utilise (score 0.8-1.0) ✅
   └─ Si non trouvé → Continue

2. 🔵 WEB
   ├─ Si trouvé → Utilise (score 0.5-0.8) ✅
   └─ Si non trouvé → Continue

3. 🟡 ESTIMATION
   └─ Génère estimation avec hypothèses (score 0.3-0.6) ⚠️
   └─ Déclenche alerte expert si score < 0.5
```

---

## 📋 Structure du rapport et exemples de cascade

### **GRAND I — LE MARCHÉ**

#### 1.1 Définition & périmètre du marché Pet Care

**Information recherchée** : "Définition du marché Pet Care et périmètre"

**Cascade appliquée** :
```
1. 🟢 INTERNE KPMG
   └─ Recherche dans bases KPMG...
   └─ ✅ TROUVÉ : Document mission Pet Care 2022
   └─ Score : 0.9 (Fiable)
   └─ ARRÊT : Utilise cette source
```

**Contenu à générer** :
- Définition du marché Pet Care
- Périmètre (alimentation, soins, accessoires, services)
- Évolution historique du marché

**Affichage dans le rapport (sur le site web)** :
```
[🟢 SOURCE INTERNE KPMG]
📊 Score de confiance : 0.9 (Fiable)
📁 Source : Mission KPMG - Étude secteur Pet Care France - 2022
📄 Document : KPMG_PetCare_Market_Definition_2022.pdf

**Historique de recherche :**
✅ Tentative INTERNE → Données trouvées → Utilisé
```

**Pour la démo** : Utiliser un document mock simulant une ancienne mission KPMG (pour que cette section utilise INTERNE)

---

#### 1.2 Sizing (TAM / SAM / SOM)

**Informations recherchées** : Taille du marché (TAM, SAM, SOM)

**Cascade appliquée pour TAM** :
```
1. 🟢 INTERNE KPMG
   └─ Recherche dans bases KPMG...
   └─ ❌ NON TROUVÉ : Pas de données TAM dans missions précédentes
   └─ Continue...

2. 🔵 WEB
   └─ Recherche web sur Statista, études publiques...
   └─ ✅ TROUVÉ : Données TAM marché Pet Care global
   └─ Score : 0.7 (À renforcer)
   └─ ARRÊT : Utilise cette source
```

**Cascade appliquée pour SAM** :
```
1. 🟢 INTERNE KPMG
   └─ ❌ NON TROUVÉ
   └─ Continue...

2. 🔵 WEB
   └─ Recherche web...
   └─ ❌ NON TROUVÉ : Données SAM non disponibles publiquement
   └─ Continue...

3. 🟡 ESTIMATION
   └─ Calcul basé sur TAM et hypothèses
   └─ Score : 0.6 (À renforcer)
   └─ Utilise cette estimation
```

**Cascade appliquée pour SOM** :
```
1. 🟢 INTERNE KPMG
   └─ ❌ NON TROUVÉ
   └─ Continue...

2. 🔵 WEB
   └─ ❌ NON TROUVÉ
   └─ Continue...

3. 🟡 ESTIMATION
   └─ Calcul avec hypothèses multiples
   └─ Score : 0.4 (À valider)
   └─ ⚠️ ALERTE EXPERT déclenchée (score < 0.5)
```

**Affichage dans le rapport (sur le site web)** :
```
[🔵 SOURCE WEB] TAM
📊 Score de confiance : 0.7 (À renforcer)
🌐 Source : Statista - Pet Care Market Size Global 2023
💶 TAM estimé : 250 Mds€ (mondial)

[🟡 ESTIMATION & HYPOTHÈSES] SAM / SOM
📊 Score de confiance : 0.4 (À valider)
⚠️ **RECOMMANDATION EXPERT** : Validation sizing par expert sectoriel

**Hypothèses retenues :**
- Hypothèse 1 : Part de marché France = 5% du marché européen
- Hypothèse 2 : Taux de pénétration services premium = 12% (basé sur marché comparable)
- Hypothèse 3 : Croissance annuelle = +8% (estimation conservatrice)

💶 SAM estimé : 12.5 Mds€ (France)
💶 SOM estimé : 1.2 Mds€ (marché adressable à court terme)
```

**Pour la démo** : 
- Recherche web réelle sur Statista ou sites similaires
- Calculs d'estimation avec hypothèses explicites
- **Alerte expert visible** pour SOM

---

#### 1.3 Segmentation approfondie ⭐ **FOCUS DÉMO**

**Informations recherchées** : Données de segmentation détaillée (par type d'animal, service, prix, géographie)

**Cascade appliquée** :
```
1. 🟢 INTERNE KPMG
   └─ Recherche dans bases KPMG...
   └─ ❌ NON TROUVÉ : Pas de segmentation détaillée dans missions précédentes
   └─ Continue...

2. 🔵 WEB
   └─ Recherche web sur études de marché...
   └─ ⚠️ PARTIELLEMENT TROUVÉ : Données partielles (répartition chiens/chats seulement)
   └─ Score : 0.5 (Données incomplètes)
   └─ Continue (besoin de données plus complètes)...

3. 🟡 ESTIMATION
   └─ Complète les données partielles avec estimations
   └─ Génère segmentation multi-critères complète
   └─ Score : 0.5 (À valider - mix WEB + ESTIMATION)
   └─ ⚠️ ALERTE EXPERT déclenchée (score = 0.5)
```

**C'est ici que se concentre le travail de segmentation !**

**Segmentation multi-niveaux** :

**Niveau 1 : Par type d'animal**
- Chiens (60% du marché)
- Chats (35% du marché)
- Oiseaux (3% du marché)
- NAC - Nouveaux Animaux de Compagnie (2% du marché)

**Niveau 2 : Par type de service/produit**
- Alimentation (45%)
- Soins vétérinaires (30%)
- Accessoires (15%)
- Services (garde, toilettage) (10%)

**Niveau 3 : Par positionnement prix**
- Premium (20%)
- Milieu de gamme (50%)
- Économique (30%)

**Niveau 4 : Par géographie**
- Île-de-France (25%)
- Grandes métropoles (40%)
- Autres régions (35%)

**Score de confiance** : 0.5 (Estimation) → **⚠️ ALERTE EXPERT**

**Affichage dans le rapport (sur le site web)** :
```
[🟡 ESTIMATION & HYPOTHÈSES] Segmentation
📊 Score de confiance : 0.5 (À valider)
⚠️ **RECOMMANDATION EXPERT** : Validation segmentation par expert sectoriel Pet Care

**Historique de recherche :**
❌ Tentative INTERNE → Non trouvé
⚠️ Tentative WEB → Données partielles trouvées (répartition chiens/chats seulement)
✅ Complétion ESTIMATION → Segmentation complète générée

**Méthodologie :**
- Analyse croisée de données partielles WEB + estimations
- Comparaison avec marchés similaires (alimentation humaine, services à la personne)
- Hypothèses de répartition basées sur études comparables

**Hypothèses retenues :**
- Hypothèse 1 : Répartition chiens/chats basée sur données INSEE partiellement disponibles (source WEB)
- Hypothèse 2 : Répartition produits/services basée sur marché comparable (alimentation humaine) - ESTIMATION
- Hypothèse 3 : Répartition prix basée sur études sectorielles partielles - ESTIMATION

[Graphiques à générer :]
- Camembert : Répartition par type d'animal
- Camembert : Répartition par type de produit/service
- Matrice : Positionnement prix × type de produit
- Graphique en barres : Taille de marché par segment (en M€)
- Graphique évolution : Croissance par segment (projection)
```

**Graphiques à créer** :
1. **Camembert** : Répartition par type d'animal
2. **Camembert** : Répartition par type de produit/service
3. **Matrice 2x2** : Positionnement prix × type de produit
4. **Graphique en barres** : Taille de marché par segment (en M€)
5. **Graphique évolution** : Croissance par segment (projection 3 ans)
6. **Tableau croisé** : Segmentation complète avec chiffres

**Pour la démo** : 
- **C'est la section la plus importante** - investir du temps sur les graphiques
- Montrer clairement que c'est une estimation avec hypothèses
- **Alerte expert très visible**

---

#### 1.4 Tendances & drivers

**Information recherchée** : "Tendances et drivers du marché Pet Care"

**Cascade appliquée** :
```
1. 🟢 INTERNE KPMG
   └─ Recherche dans bases KPMG...
   └─ ❌ NON TROUVÉ : Pas de données tendances récentes dans missions précédentes
   └─ Continue...

2. 🔵 WEB
   └─ Recherche web sur sites spécialisés...
   └─ ✅ TROUVÉ : Plusieurs sources fiables
   └─ Score : 0.7 (À renforcer)
   └─ ARRÊT : Utilise cette source
```

**Contenu à générer** :
- Tendances de consommation
- Évolution des comportements propriétaires
- Drivers de croissance
- Tendances émergentes (bio, premium, digital)

**Affichage dans le rapport (sur le site web)** :
```
[🔵 SOURCE WEB]
📊 Score de confiance : 0.7 (À renforcer)

**Historique de recherche :**
❌ Tentative INTERNE → Non trouvé
✅ Tentative WEB → Données trouvées → Utilisé

🌐 Sources :
  - Statista - Pet Care Trends 2023
  - Étude IFOP - Comportement propriétaires d'animaux 2023
  - Site institutionnel - Fédération française des fabricants d'aliments

**Tendances identifiées :**
1. Premiumisation du marché (+15% annuel sur segment premium)
2. Digitalisation des services (vente en ligne, apps)
3. Préoccupation santé/écologie (bio, naturel)
4. Services à domicile (garde, soins)
```

**Pour la démo** : Recherche web réelle sur sites fiables

---

#### 1.5 Chaîne de valeur / Régulation
**Source** : 🔵 **WEB** (WebResearchAgent) + 🟢 **INTERNE KPMG** (si disponible)

**Stratégie mixte** :
- Chaîne de valeur : Source WEB
- Régulation : Source INTERNE KPMG (si mission précédente) ou WEB

**Score de confiance** : 0.6-0.8 selon source

---

### **GRAND II — PAYSAGE CONCURRENTIEL**

#### 2.1 Principaux acteurs
**Source** : 🔵 **WEB** (WebResearchAgent)

**Contenu à générer** :
- Liste des principaux acteurs (marques, distributeurs)
- Parts de marché (si disponibles)
- Présentation des leaders

**Score de confiance** : 0.6-0.7

**Affichage dans le rapport** :
```
[🔵 SOURCE WEB]
📊 Score de confiance : 0.6 (À renforcer)
🌐 Sources :
  - Sites officiels des entreprises
  - Rapports annuels publics
  - Articles de presse spécialisée

**Acteurs identifiés :**
- Royal Canin (Mars Petcare)
- Purina (Nestlé)
- Hill's Pet Nutrition
- ...
```

---

#### 2.2 Modèles économiques
**Source** : 🟡 **ESTIMATION** (EstimationAgent) + 🔵 **WEB** (WebResearchAgent)

**Stratégie mixte** :
- Modèles connus : Source WEB
- Modèles à estimer : Source ESTIMATION

**Score de confiance** : 0.5-0.7

---

#### 2.3 Chiffres clés des acteurs
**Source** : 🔵 **WEB** (WebResearchAgent)

**Contenu** : CA, croissance, parts de marché (si disponibles publiquement)

**Score de confiance** : 0.6

---

#### 2.4 Facteurs clés d'achat
**Source** : 🟢 **INTERNE KPMG** (si étude client disponible) ou 🔵 **WEB**

**Score de confiance** : 0.7-0.9 selon source

---

#### 2.5 Positionnement relatif des acteurs
**Source** : 🟡 **ESTIMATION** (EstimationAgent)

**Contenu** : Matrice de positionnement (prix × qualité, etc.)

**Score de confiance** : 0.5 → **⚠️ ALERTE EXPERT**

---

### **GRAND III — CONCLUSION & RECOMMANDATIONS**

#### 3.1 Synthèse exécutive
**Source** : **Synthèse** de toutes les sources précédentes

**Contenu** : Résumé des points clés, avec indication des sources utilisées

---

#### 3.2 Risques & zones d'incertitude
**Source** : **Analyse** par ExpertRecommendationAgent

**Contenu** :
- Liste des zones d'incertitude identifiées
- Recommandations d'expertise pour chaque zone
- Guide d'entretien structuré

**Affichage dans le rapport** :
```
⚠️ **ZONES D'INCERTITUDE IDENTIFIÉES**

1. **Sizing précis (SOM)** - Score confiance : 0.4
   - Recommandation : Expert sectoriel Pet Care
   - Profil : Analyste marché spécialisé animalier / Consultant secteur
   - Questions clés à poser :
     * Quelle est la taille réelle du marché adressable à court terme ?
     * Quels sont les freins à la pénétration marché ?
     * Quelle est la croissance attendue sur 3 ans ?

2. **Segmentation détaillée** - Score confiance : 0.5
   - Recommandation : Expert sectoriel + Vétérinaire spécialisé
   - Profil : Expert marché + Vétérinaire comportementaliste
   - Questions clés à poser :
     * Validation de la répartition chiens/chats/NAC
     * Confirmation des tendances de consommation par segment
     * Évolution attendue des segments émergents (NAC, premium)

3. **Positionnement concurrentiel** - Score confiance : 0.5
   - Recommandation : Expert sectoriel
   - Questions clés à poser :
     * Validation de la matrice de positionnement
     * Identification des différenciateurs clés
```

---

#### 3.3 Leviers de développement
**Source** : **Synthèse** de toutes les sources

---

#### 3.4 Prochaines étapes recommandées
**Source** : **Synthèse** + **Recommandations expert**

---

## 🎬 Scénario de démo recommandé

### Séquence 1 : Introduction et site web (30 sec)
- **Site web ouvert** : Interface moderne
- Présentation du cas : "Étude de marché Pet Care - France"
- Objectif : Segmentation approfondie
- Formulaire rempli sur le site

### Séquence 2 : Génération du rapport sur le site (2-3 min)
- Clic sur "Générer le rapport"
- **Affichage en temps réel** sur le site :
  - Indicateur de progression
  - "🟢 Recherche dans bases KPMG..."
  - "❌ Non trouvé → Passage à source WEB..."
  - "🔵 Recherche web sur sources fiables..."
  - "✅ Données trouvées" ou "❌ Non trouvé → Passage à ESTIMATION..."
  - "🟡 Calcul d'estimations avec hypothèses..."
- **Démontre** : Le système en cascade en action

### Séquence 3 : Présentation du rapport sur le site (5-7 min)
- **Rapport affiché directement sur le site web**
- **Section 1.1** : 
  - Montrer source INTERNE KPMG (score 0.9)
  - Historique : "✅ Tentative INTERNE → Trouvé → Utilisé"
- **Section 1.2** : 
  - Montrer cascade : INTERNE (non trouvé) → WEB (TAM trouvé) → ESTIMATION (SAM/SOM)
  - Alerte expert visible pour SOM
- **Section 1.3** : **FOCUS SEGMENTATION**
  - Montrer cascade : INTERNE (non trouvé) → WEB (partiel) → ESTIMATION (complété)
  - Tous les graphiques interactifs sur le site
  - Expliquer les hypothèses
  - Alerte expert visible
- **Section 1.4** : 
  - Montrer cascade : INTERNE (non trouvé) → WEB (trouvé)
- **Section 3.2** : 
  - Montrer les recommandations d'expert structurées

### Séquence 4 : Interaction - Approfondir une section (2 min)
- **Clic sur bouton "Approfondir"** sur section segmentation
- Nouvelle recherche en cascade déclenchée
- Section mise à jour avec informations enrichies
- **Démontre** : Possibilité d'itérer et améliorer

### Séquence 5 : Détail des sources (modal) (2 min)
- **Clic sur une section** → Modal s'ouvre
- Afficher :
  - Historique complet de la cascade
  - Sources utilisées (avec détails)
  - Hypothèses détaillées
  - Score de confiance
  - Recommandation expert avec guide d'entretien
- **Démontre** : Transparence totale du processus

### Séquence 6 : Export PowerPoint depuis le site (1 min)
- **Clic sur "Exporter PowerPoint"** sur le site
- Backend génère le fichier .pptx
- Téléchargement automatique
- Montrer le PowerPoint généré
- Visuels intégrés
- Template KPMG appliqué
- **Démontre** : Livrable exploitable immédiatement

---

## ✅ Checklist pour la démo

- [ ] **Système en cascade fonctionnel** : Montrer INTERNE → WEB → ESTIMATION pour plusieurs informations
- [ ] **Au moins 1 information trouvée via INTERNE** (score élevé 0.8-1.0)
- [ ] **Au moins 2-3 informations trouvées via WEB** (après échec INTERNE)
- [ ] **Au moins 2 informations via ESTIMATION** (après échec INTERNE + WEB)
- [ ] **Section segmentation très développée** avec 5+ graphiques interactifs sur le site
- [ ] **Au moins 2 alertes expert visibles** (segmentation + sizing)
- [ ] **Historique de cascade affiché** pour chaque section (INTERNE → WEB → ESTIMATION)
- [ ] **Guide d'entretien structuré généré** pour chaque alerte expert
- [ ] **Site web fonctionnel** : Formulaire → Génération → Affichage → Approfondissement → Export
- [ ] **Bouton "Approfondir" fonctionnel** sur au moins une section
- [ ] **Export PowerPoint fonctionnel** depuis le site
- [ ] **Template KPMG appliqué** dans le PowerPoint

---

## 💡 Points d'attention

1. **Ne pas inventer de données** : Si une donnée n'existe pas, utiliser l'estimation avec hypothèses explicites
2. **Transparence maximale** : Toujours afficher les sources et hypothèses
3. **Segmentation = point fort** : Investir du temps sur cette section
4. **Alerte expert = démonstration clé** : Montrer que l'IA sait reconnaître ses limites
5. **Storytelling** : Raconter l'histoire des 3 sources dans la présentation
