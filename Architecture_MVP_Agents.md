# Architecture MVP — Agents IA pour Hackathon KPMG
**Architecture technique et recommandations pour le démonstrateur Pet Care**

---

## 🎯 Objectif du MVP

Démontrer de manière **visible et crédible** que l'agent IA :
1. Utilise **3 sources d'information en cascade** (interne KPMG → web → estimation)
2. Produit un **rapport structuré avec segmentation approfondie** (focus Pet Care)
3. **Détecte les limites** et recommande l'expertise humaine quand nécessaire
4. Génère des **livrables exploitables** (affichage web + export PowerPoint)
5. **Intégration web complète** : input utilisateur → traitement IA → affichage → approfondissement → export

---

## 🌐 Architecture Web + IA

### Workflow utilisateur

```
1. Utilisateur remplit le formulaire sur le site web
   ↓
2. Données envoyées à l'agent IA (API)
   ↓
3. Agent IA traite et génère le rapport (texte + graphiques)
   ↓
4. Résultats renvoyés au site web (JSON/HTML)
   ↓
5. Affichage du rapport sur le site web (texte + visuels)
   ↓
6. Utilisateur peut :
   - Approfondir certaines sections (nouvelle requête IA)
   - Exporter le rapport complet en PowerPoint
```

---

## 🏗️ Architecture proposée : Agents modulaires

### 1. **Agent Orchestrateur Principal** (`OrchestratorAgent`)
**Rôle** : Coordonne l'ensemble du processus et gère le workflow en cascade

**Responsabilités** :
- Reçoit l'input utilisateur depuis l'API web
- Décompose la mission en sous-tâches (sections du rapport)
- **Pour chaque information recherchée, applique le système en cascade** :
  1. Cherche d'abord dans documents internes KPMG
  2. Si rien trouvé → cherche sur le web
  3. Si rien trouvé → fait des estimations avec hypothèses
- Assure la cohérence globale du rapport
- Gère le workflow expert-in-the-loop
- Renvoie les résultats au format JSON pour affichage web

**Système de cascade (fallback)** :
```
Pour chaque information recherchée :
  ┌─────────────────────────────────┐
  │ 1. Recherche INTERNE KPMG       │
  │    (InternalResearchAgent)      │
  └──────────────┬──────────────────┘
                 │
         ┌───────▼────────┐
         │ Données trouvées?│
         └───────┬──────────┘
                 │
        ┌────────┴────────┐
        │ OUI             │ NON
        │                 │
        ▼                 ▼
  ┌──────────┐    ┌──────────────────┐
  │ Utiliser │    │ 2. Recherche WEB │
  │ Score:   │    │ (WebResearchAgent)│
  │ 0.8-1.0  │    └────────┬─────────┘
  └──────────┘             │
                    ┌──────▼────────┐
                    │ Données trouvées?│
                    └──────┬──────────┘
                           │
                  ┌────────┴────────┐
                  │ OUI             │ NON
                  │                 │
                  ▼                 ▼
            ┌──────────┐    ┌──────────────────┐
            │ Utiliser │    │ 3. ESTIMATION    │
            │ Score:   │    │ (EstimationAgent)│
            │ 0.5-0.8  │    │ Score: 0.3-0.6   │
            └──────────┘    │ + Alerte expert  │
                           └──────────────────┘
```

**Technologie suggérée** : LangGraph / LangChain avec workflow orchestré + API REST (FastAPI/Flask)

---

### 2. **Agent Recherche Interne KPMG** (`InternalResearchAgent`)
**Rôle** : Interroge les bases de données internes et anciennes missions

**Responsabilités** :
- Recherche dans les documents KPMG (missions passées, bases sectorielles)
- Extraction d'informations structurées
- Attribution d'un score de confiance élevé (0.8-1.0)
- Traçabilité des sources (référence mission, date, secteur)

**Pour la démo Pet Care** :
- Utiliser cette source pour : **Définition & périmètre du marché** (si mission similaire existe)
- Afficher clairement : "Source : Mission KPMG [Réf] - Secteur Pet Care 2022"

**Technologie suggérée** : 
- RAG (Retrieval Augmented Generation) sur base vectorielle
- Embeddings des documents internes
- Base de données : ChromaDB / Pinecone / Weaviate

---

### 3. **Agent Recherche Web** (`WebResearchAgent`)
**Rôle** : Recherche d'informations sur le web via sources fiables

**Responsabilités** :
- Recherche web ciblée (sites institutionnels, études de marché publiques)
- Vérification de la fiabilité des sources
- Attribution d'un score de confiance moyen (0.5-0.8)
- Extraction et synthèse d'informations

**Pour la démo Pet Care** :
- Utiliser cette source pour : **Tendances & drivers**, **Chiffres clés acteurs**
- Afficher clairement : "Source : [Nom site] - [URL] - [Date]"
- Exemples : Statista, études sectorielles publiques, sites institutionnels

**Technologie suggérée** :
- Tavily API / Perplexity API / Serper API pour recherche web
- Scraping ciblé de sites fiables (avec respect robots.txt)
- Filtrage par domaines de confiance (.gov, .org, sites reconnus)

---

### 4. **Agent Estimation & Hypothèses** (`EstimationAgent`)
**Rôle** : Génère des estimations pour marchés niche avec hypothèses tracées

**Responsabilités** :
- Calculs d'ordres de grandeur (équations : prix × volume)
- Comparaisons avec marchés proxy
- Formulation d'hypothèses explicites
- Attribution d'un score de confiance faible (0.3-0.6)
- **Déclenchement automatique de l'alerte expert** si score < 0.5

**Pour la démo Pet Care** :
- Utiliser cette source pour : **Segmentation détaillée** (marché niche par type d'animal, service)
- Utiliser pour : **Sizing précis** (TAM/SAM/SOM) si données manquantes
- Afficher clairement : "Estimation basée sur : [Hypothèse 1], [Hypothèse 2]"
- **Montrer l'alerte expert** : "⚠️ Recommandation : Validation par expert sectoriel Pet Care"

**Technologie suggérée** :
- LLM avec prompts structurés pour calculs
- Bibliothèque de calcul (Python : pandas, numpy)
- Template d'hypothèses structurées

---

### 5. **Agent Segmentation Spécialisé** (`SegmentationAgent`)
**Rôle** : Réalise un travail approfondi de segmentation (focus Pet Care)

**Responsabilités** :
- Segmentation multi-critères (type d'animal, type de service, géographie, prix)
- Création de matrices de segmentation
- Génération de graphiques de segmentation
- Analyse de chaque segment (taille, croissance, caractéristiques)

**Pour la démo Pet Care** :
- Segmentation par :
  - **Type d'animal** : Chiens, Chats, Oiseaux, NAC (Nouveaux Animaux de Compagnie)
  - **Type de service** : Alimentation, Soins vétérinaires, Accessoires, Services (garde, toilettage)
  - **Prix** : Premium, Milieu de gamme, Économique
  - **Géographie** : France, Europe, International
- Générer des graphiques : camemberts, matrices, courbes de croissance par segment

**Technologie suggérée** :
- LLM pour analyse textuelle
- Bibliothèques de visualisation : matplotlib, plotly, seaborn
- Génération de graphiques automatiques

---

### 6. **Agent Génération de Rapport** (`ReportGeneratorAgent`)
**Rôle** : Assemble et formate le rapport final avec visuels pour affichage web

**Responsabilités** :
- Structuration du rapport (titres, sous-titres hiérarchisés)
- Intégration des résultats des différents agents
- Génération de graphiques et visualisations (formats web : PNG, SVG, base64)
- Création de tableaux synthétiques
- **Format de sortie** : JSON structuré pour affichage web
- Export PowerPoint avec template KPMG (sur demande utilisateur)

**Format JSON de sortie** :
```json
{
  "sections": [
    {
      "id": "1.1",
      "title": "Définition & périmètre",
      "content": "Texte de la section...",
      "source": "INTERNE_KPMG",
      "confidence_score": 0.9,
      "source_details": {
        "type": "Mission KPMG",
        "reference": "KPMG_PetCare_2022",
        "date": "2022"
      },
      "graphs": [
        {
          "type": "bar",
          "data": {...},
          "image_base64": "..."
        }
      ],
      "tables": [...],
      "can_deepen": true
    }
  ]
}
```

**Technologie suggérée** :
- Génération JSON structuré
- Bibliothèques de graphiques : plotly (JSON), matplotlib (PNG base64), seaborn
- python-pptx pour export PowerPoint (sur demande)
- Template PowerPoint KPMG (à créer ou adapter)

---

### 7. **Agent Expert-in-the-Loop** (`ExpertRecommendationAgent`)
**Rôle** : Détecte les zones d'incertitude et recommande l'intervention d'un expert

**Responsabilités** :
- Analyse des scores de confiance
- Identification des hypothèses critiques
- Génération de recommandations d'expertise
- Création de guide d'entretien structuré
- Préparation de questions ciblées pour l'expert

**Pour la démo Pet Care** :
- Détecter quand une estimation est trop incertaine
- Recommander : "Expert recommandé : Vétérinaire spécialisé Pet Care / Analyste marché animalier"
- Générer un guide d'entretien avec questions précises

**Technologie suggérée** :
- LLM avec prompts spécialisés
- Système de règles (si score < X, alors alerte)
- Template de guide d'entretien

---

## 🌐 Architecture Web (Frontend + Backend + API)

### Frontend (Site Web)
**Technologies suggérées** :
- React / Vue.js / Next.js (framework moderne)
- Affichage du rapport avec sections interactives
- Boutons "Approfondir" sur chaque section
- Bouton "Exporter PowerPoint" global
- Indicateurs visuels de source (🟢 INTERNE, 🔵 WEB, 🟡 ESTIMATION)
- Affichage des graphiques (via Plotly.js ou images base64)

**Fonctionnalités** :
- Formulaire de saisie (marché, géographie, objectif)
- Affichage du rapport en temps réel (streaming possible)
- Sections cliquables pour approfondir
- Export PowerPoint déclenché côté backend

### Backend API
**Technologies suggérées** :
- FastAPI (Python) ou Flask
- Endpoints REST :
  - `POST /api/generate-report` : Génère le rapport complet
  - `POST /api/deepen-section` : Approfondit une section spécifique
  - `GET /api/export-powerpoint` : Exporte le rapport en PowerPoint

**Format des requêtes** :
```json
// POST /api/generate-report
{
  "market": "Pet Care",
  "geography": "France",
  "objective": "Segmentation approfondie",
  "depth_level": "standard"
}

// POST /api/deepen-section
{
  "section_id": "1.3",
  "focus": "Segmentation par type d'animal",
  "current_report_id": "report_123"
}
```

### Communication Frontend ↔ Backend ↔ IA
```
Frontend (React)
    ↓ HTTP POST
Backend API (FastAPI)
    ↓ Appel Python
OrchestratorAgent
    ↓ Orchestration
Agents spécialisés
    ↓ Résultats JSON
Backend API
    ↓ HTTP Response JSON
Frontend
    ↓ Affichage
Utilisateur
```

---

## 🔄 Workflow proposé pour la démo Pet Care

### Phase 1 : Input utilisateur sur le site web
1. Utilisateur remplit le formulaire : "Étude de marché Pet Care - France - Segmentation approfondie"
2. Frontend envoie les données à l'API backend (`POST /api/generate-report`)

### Phase 2 : Orchestration et décomposition
3. **OrchestratorAgent** reçoit la requête via l'API
4. Décompose en sections selon l'architecture du rapport
5. Pour chaque section, identifie les informations nécessaires

### Phase 3 : Recherche en cascade (pour chaque information)
6. **Pour chaque information recherchée, système en cascade** :

   **Exemple : Recherche "Définition du marché Pet Care"**
   ```
   Étape 1 : InternalResearchAgent cherche dans bases KPMG
   ├─ Si trouvé → Utilise (score 0.9) ✅
   └─ Si non trouvé → Continue
   
   Étape 2 : WebResearchAgent cherche sur web
   ├─ Si trouvé → Utilise (score 0.7) ✅
   └─ Si non trouvé → Continue
   
   Étape 3 : EstimationAgent fait estimation
   └─ Génère estimation avec hypothèses (score 0.4) ⚠️
   └─ Déclenche alerte expert si score < 0.5
   ```

7. **Répète pour toutes les informations nécessaires** :
   - Définition marché → Cascade
   - Taille marché (TAM) → Cascade
   - Tendances → Cascade
   - Segmentation → Cascade (avec SegmentationAgent)
   - Acteurs → Cascade
   - etc.

### Phase 4 : Analyse & Segmentation
8. `SegmentationAgent` travaille sur la segmentation Pet Care :
   - Utilise les données collectées (quelle que soit leur source)
   - Analyse multi-critères
   - Génération de graphiques de segmentation
   - Calcul de taille par segment

### Phase 5 : Détection d'incertitude
9. `ExpertRecommendationAgent` analyse les résultats :
   - Détecte scores de confiance faibles (< 0.5)
   - Identifie hypothèses critiques
   - Génère recommandations d'expert pour chaque zone d'incertitude

### Phase 6 : Génération du rapport JSON
10. `ReportGeneratorAgent` assemble tout :
    - Structure le rapport avec sections clairement identifiées
    - Intègre les visuels (graphiques en base64 ou JSON Plotly)
    - Marque la source de chaque section (INTERNE/WEB/ESTIMATION)
    - Génère le JSON structuré

### Phase 7 : Envoi au frontend
11. Backend API renvoie le JSON au frontend
12. Frontend affiche le rapport avec :
    - Texte structuré
    - Graphiques et visuels
    - Indicateurs de source
    - Boutons "Approfondir" sur chaque section
    - Bouton "Exporter PowerPoint"

### Phase 8 : Interactions utilisateur
13. **Option A - Approfondir une section** :
    - Utilisateur clique sur "Approfondir section 1.3"
    - Frontend envoie `POST /api/deepen-section`
    - OrchestratorAgent relance la recherche en cascade pour cette section
    - Retourne résultats enrichis
    - Frontend met à jour la section

14. **Option B - Exporter PowerPoint** :
    - Utilisateur clique sur "Exporter PowerPoint"
    - Frontend envoie `GET /api/export-powerpoint`
    - Backend génère le PowerPoint avec python-pptx
    - Retourne le fichier .pptx en téléchargement

---

## 📊 Visualisation des sources dans le rapport

**Recommandation importante** : Marquer visuellement chaque section avec sa source

### Exemple de formatage dans le rapport :

```
## I. Le Marché

### 1.1 Définition & périmètre
[🟢 SOURCE INTERNE KPMG]
📊 Score de confiance : 0.9 (Fiable)
📁 Source : Mission KPMG - Secteur Pet Care - 2022

[Texte de la section...]

---

### 1.2 Tendances & drivers
[🔵 SOURCE WEB]
📊 Score de confiance : 0.7 (À renforcer)
🌐 Sources :
  - Statista - Pet Care Market Report 2023
  - INSEE - Dépenses ménages animaux de compagnie

[Texte de la section...]

---

### 1.3 Segmentation détaillée
[🟡 ESTIMATION & HYPOTHÈSES]
📊 Score de confiance : 0.4 (À valider)
⚠️ **RECOMMANDATION EXPERT** : Validation par expert sectoriel Pet Care

**Hypothèses retenues :**
- Hypothèse 1 : Taux de pénétration marché premium = 15% (basé sur marché comparable)
- Hypothèse 2 : Croissance segment NAC = +25% annuel (estimation)

[Graphiques de segmentation...]
```

---

## 🛠️ Stack technique recommandée

### Backend IA (Agents)
- **Framework** : Python avec LangChain / LangGraph
- **LLM** : OpenAI GPT-4 / Anthropic Claude (pour qualité)
- **Base vectorielle** : ChromaDB (local) ou Pinecone (cloud)
- **Recherche web** : Tavily API ou Perplexity API
- **Calculs** : pandas, numpy
- **Visualisations** : plotly, matplotlib, seaborn

### Backend API
- **Framework** : FastAPI (Python) - recommandé pour API REST moderne
- **Alternative** : Flask (plus simple mais moins performant)
- **Gestion async** : asyncio pour appels agents en parallèle
- **CORS** : Configuration pour communication avec frontend
- **Export PowerPoint** : python-pptx

### Frontend (Site Web)
- **Framework** : React / Next.js (recommandé) ou Vue.js
- **Styling** : Tailwind CSS ou Material-UI
- **Graphiques** : Plotly.js (pour graphiques interactifs) ou affichage images base64
- **HTTP Client** : Axios ou fetch API
- **État** : React Context ou Zustand (pour gestion état rapport)

### Communication
- **API REST** : Endpoints JSON
- **Format données** : JSON structuré (voir format ReportGeneratorAgent)
- **Streaming** (optionnel) : Server-Sent Events (SSE) pour affichage progressif

### Export
- **PowerPoint** : python-pptx (génération côté backend)
- **Template KPMG** : À créer avec branding
- **Format** : .pptx téléchargé depuis le frontend

---

## 🎬 Scénario de démo recommandé

### Étape 1 : Input utilisateur sur le site web
- **Site web ouvert** : Interface moderne avec formulaire
- Utilisateur remplit : "Pet Care - France - Segmentation approfondie"
- Clic sur "Générer le rapport"

### Étape 2 : Affichage du processus (optionnel - en temps réel)
- **Indicateur de progression** : "Recherche en cours..."
- Montrer visuellement les étapes :
  - "🟢 Recherche dans bases KPMG..."
  - "🔵 Recherche web..."
  - "🟡 Calcul d'estimations..."
- Afficher le système en cascade : "Source INTERNE non trouvée → Passage à source WEB"

### Étape 3 : Rapport généré et affiché sur le site web
- **Rapport structuré** affiché directement sur le site
- Sections clairement marquées par source (🟢 INTERNE, 🔵 WEB, 🟡 ESTIMATION)
- **Focus sur la segmentation** : graphiques multiples, matrices interactives
- **Alerte expert visible** : Section avec recommandation d'expert (badge rouge/orange)

### Étape 4 : Interaction utilisateur - Approfondir une section
- Utilisateur clique sur bouton "Approfondir" sur section segmentation
- Nouvelle recherche en cascade déclenchée pour cette section
- Section mise à jour avec informations enrichies
- **Démontre** : Le système peut itérer et améliorer

### Étape 5 : Détail des sources (modal ou panneau latéral)
- Clic sur une section → Modal s'ouvre avec :
  - Source exacte utilisée (avec cascade affichée)
  - Score de confiance
  - Hypothèses détaillées (si estimation)
  - Recommandation expert avec guide d'entretien (si applicable)
  - Historique : "Tentative INTERNE → Non trouvé → Tentative WEB → Trouvé"

### Étape 6 : Export PowerPoint
- Utilisateur clique sur "Exporter PowerPoint"
- Backend génère le fichier .pptx
- Téléchargement automatique
- **Démontre** : Livrable exploitable immédiatement

---

## ✅ Points clés pour la démo

1. **Système en cascade visible** : Montrer que pour chaque information, le système essaie INTERNE → WEB → ESTIMATION
2. **Visibilité des sources** : Chaque section doit clairement indiquer sa source finale (et l'historique de la cascade)
3. **Segmentation approfondie** : Montrer plusieurs niveaux de segmentation avec graphiques interactifs
4. **Alerte expert visible** : Au moins une section doit déclencher une recommandation d'expert
5. **Intégration web fluide** : Site web moderne, affichage en temps réel, interactions possibles
6. **Transparence** : Afficher les hypothèses, limites, et historique de recherche
7. **Livrable exploitable** : PowerPoint prêt à l'emploi généré depuis le site
8. **Approfondissement** : Démontrer la possibilité d'approfondir des sections après génération initiale

---

## 🚀 Plan d'implémentation (priorités)

### Phase 1 - MVP Minimal (Semaine 1)
- [ ] OrchestratorAgent basique
- [ ] WebResearchAgent (recherche web simple)
- [ ] EstimationAgent (calculs basiques)
- [ ] ReportGeneratorAgent (rapport texte simple)

### Phase 2 - Sources multiples (Semaine 2)
- [ ] InternalResearchAgent (simulation avec données mock)
- [ ] SegmentationAgent (segmentation multi-critères)
- [ ] Marquage visuel des sources dans le rapport

### Phase 3 - Expert-in-the-loop (Semaine 3)
- [ ] ExpertRecommendationAgent
- [ ] Système d'alertes
- [ ] Guide d'entretien structuré

### Phase 4 - Polissage (Semaine 4)
- [ ] Graphiques et visualisations
- [ ] Export PowerPoint avec template
- [ ] Interface utilisateur (optionnel)
- [ ] Tests et ajustements

---

## 💡 Recommandations finales

1. **Commencer simple** : MVP avec 2-3 agents fonctionnels vaut mieux qu'une architecture complexe non fonctionnelle
2. **Mock les données internes** : Pour la démo, simuler une base KPMG avec quelques documents Pet Care
3. **Focus segmentation** : C'est le point fort de la démo, investir du temps là-dessus
4. **Transparence maximale** : Montrer clairement les limites et hypothèses
5. **Storytelling** : Raconter l'histoire des 3 sources dans la présentation
