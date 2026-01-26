# KPMG AI Backend - LangChain/LangGraph

Backend FastAPI pour le système d'agents IA KPMG utilisant LangChain et LangGraph.

## Installation

1. Créer un environnement virtuel :
```bash
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
```

2. Installer les dépendances :
```bash
pip install -r requirements.txt
```

3. Configurer les variables d'environnement :
```bash
cp .env.example .env
# Éditer .env et remplir les clés API
```

## Configuration

Variables d'environnement requises dans `.env` :
- `OPENAI_API_KEY` : Clé API OpenAI (requis)
- `LINKUP_API_KEY` : Clé API Linkup (optionnel)
- `LINKUP_API_URL` : URL de l'API Linkup
- `CHROMA_PERSIST_DIRECTORY` : Répertoire pour ChromaDB (par défaut: `./data/chroma_db`)

### Documents pour RAG

Placez vos documents dans `data/documents/` :
- Formats supportés : PDF, TXT, MD, DOCX
- L'indexation se fait automatiquement au démarrage
- Voir `GUIDE_RAG.md` et `README_DOCUMENTS.md` pour plus de détails

**Note** : Les fichiers README.md, .gitkeep, etc. sont automatiquement exclus de l'indexation.

## Démarrage

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

L'API sera accessible sur `http://localhost:8000`

## Endpoints

### POST `/api/generate-report-stream`
Génère un rapport avec streaming en temps réel (SSE).

**Body:**
```json
{
  "market_name": "Pet Care",
  "geography": "France",
  "mission_type": "Étude de marché",
  "client_website": "www.example.com",
  "conversation_id": "conv-123"
}
```

**Réponse:** Stream SSE avec événements de progression

### POST `/api/generate-report`
Génère un rapport complet (sans streaming).

**Body:** Identique à `/api/generate-report-stream`

**Réponse:**
```json
{
  "sections": [...],
  "expert_recommendations": [...],
  "conversation_id": "conv-123"
}
```

### GET `/health`
Health check endpoint.

## Architecture

- `app/graph/` : Workflow LangGraph
- `app/tools/` : Tools LangChain (RAG, Linkup, Estimation)
- `app/models/` : Modèles Pydantic
- `app/main.py` : Application FastAPI

## Workflow

Le workflow LangGraph suit cette logique :
1. **Orchestrator** : Décompose la mission en sections
2. **Process Section** : Traite chaque section
3. **Cascade Research** : Recherche INTERNE → WEB → ESTIMATION
4. **Report Generation** : Génère le rapport formaté
5. **Expert Recommendation** : Détecte les zones d'incertitude

## Notes

- Le streaming utilise Server-Sent Events (SSE)
- La progression est calculée en temps réel
- Le système en cascade est préservé depuis n8n
- Les documents sont indexés automatiquement dans ChromaDB
