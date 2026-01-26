# Plan de Migration : n8n → LangChain/LangGraph
**Migration du système d'agents IA KPMG vers une architecture LangChain/LangGraph**

---

## 📋 Analyse du Workflow n8n Actuel

### Architecture n8n Identifiée

#### Composants Principaux
1. **Webhook Trigger** : Point d'entrée POST (`/webhook/e3160991-67f7-4a16-a1e3-da8d8c84537f`)
2. **AI Agent Principal** : Agent LangChain orchestrant le processus
3. **Simple Memory** : Buffer Window Memory avec `conversation_id` comme clé
4. **OpenAI Chat Model** : GPT-4.1-mini pour l'agent principal
5. **Outils Disponibles** :
   - **Google Docs Tool** : Recherche dans base interne KPMG
   - **Linkup Web Search** : Recherche web approfondie (depth: deep)
   - **AI Agent Tool** : Agent ML pour estimations (GPT-4.1-mini)

#### Flux de Données Actuel
```
Webhook (POST)
  ↓
AI Agent (avec prompt système + utilisateur)
  ↓
Simple Memory (conversation_id)
  ↓
Outils (Google Docs / Linkup / AI Agent Tool)
  ↓
Respond to Webhook (JSON)
```

#### Prompt Système Actuel (à migrer)
- Consultant senior en stratégie
- Système en cascade : INTERNE → WEB → ESTIMATION
- Génération de rapport structuré
- Gestion expert-in-the-loop

#### Prompt Utilisateur Actuel (à migrer)
- Brief de mission (market_name, geography, mission_type, client_website)
- Instructions de cascade par sous-section
- Structure de rapport détaillée (3 grands chapitres)
- Format JSON pour graphiques

---

## 🎯 Architecture LangChain/LangGraph Cible

### Vue d'Ensemble

```
FastAPI Backend
  ↓
LangGraph Workflow (StateGraph)
  ↓
├─ Orchestrator Node
├─ Internal Research Node (RAG)
├─ Web Research Node (Linkup API)
├─ Estimation Node (LLM)
├─ Report Generation Node
└─ Expert Recommendation Node
```

### Stack Technique

- **Framework Backend** : FastAPI (Python)
- **Orchestration** : LangGraph (workflow state-based)
- **LLM** : OpenAI GPT-4.1-mini (via LangChain)
- **Mémoire** : ConversationBufferWindowMemory (LangChain)
- **RAG** : ChromaDB + LangChain RAG
- **Recherche Web** : Linkup API (via custom tool)
- **Base Vectorielle** : ChromaDB (documents internes KPMG)

---

## 🏗️ Structure du Projet

```
kpmg-ai-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app
│   ├── config.py               # Configuration
│   │
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── orchestrator.py     # Agent orchestrateur
│   │   ├── internal_research.py # RAG interne
│   │   ├── web_research.py     # Recherche web
│   │   ├── estimation.py       # Estimations ML
│   │   ├── report_generator.py # Génération rapport
│   │   └── expert_recommendation.py # Expert-in-loop
│   │
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── google_docs_tool.py # Tool Google Docs
│   │   ├── linkup_search_tool.py # Tool Linkup
│   │   └── estimation_tool.py  # Tool estimation
│   │
│   ├── graph/
│   │   ├── __init__.py
│   │   ├── workflow.py         # LangGraph StateGraph
│   │   └── state.py            # State definition
│   │
│   ├── memory/
│   │   ├── __init__.py
│   │   └── conversation.py     # Gestion mémoire
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── report.py           # Modèles Pydantic
│   │   └── request.py          # Modèles requêtes
│   │
│   └── utils/
│       ├── __init__.py
│       ├── visualization.py    # Génération graphiques
│       └── export.py            # Export PowerPoint
│
├── data/
│   └── documents/              # Documents KPMG pour RAG
│
├── requirements.txt
├── .env                         # Variables d'environnement
└── README.md
```

---

## 📦 Dépendances (requirements.txt)

```txt
# Core
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-dotenv==1.0.0

# LangChain & LangGraph
langchain==0.1.0
langchain-openai==0.0.2
langgraph==0.0.20
langchain-community==0.0.10

# RAG & Vector Store
chromadb==0.4.18
langchain-chroma==0.1.0

# Google Docs
google-api-python-client==2.100.0
google-auth-httplib2==0.1.1
google-auth-oauthlib==1.1.0

# Web Search
httpx==0.25.2
aiohttp==3.9.1

# Data & Visualization
pandas==2.1.3
numpy==1.26.2
plotly==5.18.0
matplotlib==3.8.2

# Export
python-pptx==0.6.23
Pillow==10.1.0

# Utilities
python-multipart==0.0.6
```

---

## 🔄 Migration Étape par Étape

### Phase 1 : Setup Initial (Jour 1)

#### 1.1 Création de l'environnement
```bash
# Créer environnement virtuel
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate sur Windows

# Installer dépendances
pip install -r requirements.txt
```

#### 1.2 Configuration (.env)
```env
# OpenAI
OPENAI_API_KEY=sk-...

# Google Docs (si utilisé)
GOOGLE_DOCS_CREDENTIALS_PATH=./credentials.json
GOOGLE_DOCS_DOCUMENT_ID=1yILIPVbX5q73lNUjBEIw_Ir-7HeXlIjZZ-Fd7xxDtxY

# Linkup API
LINKUP_API_KEY=...
LINKUP_API_URL=https://api.linkup.so/v1/search

# ChromaDB
CHROMA_PERSIST_DIRECTORY=./data/chroma_db

# FastAPI
API_HOST=0.0.0.0
API_PORT=8000
```

#### 1.3 Structure FastAPI de base
```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="KPMG AI Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

### Phase 2 : Définition du State (Jour 1-2)

#### 2.1 State Definition (LangGraph)
```python
# app/graph/state.py
from typing import TypedDict, List, Optional, Dict, Any
from langgraph.graph.message import AnyMessage

class AgentState(TypedDict):
    # Input
    market_name: str
    geography: str
    mission_type: str
    client_website: Optional[str]
    conversation_id: str
    action: Optional[str]  # "generate" ou "deepen"
    section_id: Optional[str]  # Pour approfondissement
    
    # Workflow
    current_section: Optional[str]
    sections_to_process: List[str]
    completed_sections: List[Dict[str, Any]]
    
    # Recherche cascade
    current_query: Optional[str]
    internal_result: Optional[Dict[str, Any]]
    web_result: Optional[Dict[str, Any]]
    estimation_result: Optional[Dict[str, Any]]
    final_source: Optional[str]  # "INTERNE", "WEB", "ESTIMATION"
    source_history: List[Dict[str, Any]]
    confidence_score: Optional[float]
    
    # Rapport final
    report_sections: List[Dict[str, Any]]
    expert_recommendations: List[Dict[str, Any]]
    
    # Messages
    messages: List[AnyMessage]
```

---

### Phase 3 : Création des Tools (Jour 2-3)

#### 3.1 Google Docs Tool (RAG Interne)
```python
# app/tools/google_docs_tool.py
from langchain.tools import tool
from langchain_community.document_loaders import GoogleDocsLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
import os

@tool
def search_internal_knowledge(query: str) -> str:
    """
    Recherche dans la base de connaissances interne KPMG (Google Docs).
    
    Args:
        query: Requête de recherche
        
    Returns:
        Informations trouvées ou message indiquant absence de résultats
    """
    # Charger document Google Docs
    document_id = os.getenv("GOOGLE_DOCS_DOCUMENT_ID")
    loader = GoogleDocsLoader(document_ids=[document_id])
    docs = loader.load()
    
    # Split et indexer dans ChromaDB
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)
    
    # Vector store
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma.from_documents(
        documents=splits,
        embedding=embeddings,
        persist_directory=os.getenv("CHROMA_PERSIST_DIRECTORY")
    )
    
    # Recherche
    results = vectorstore.similarity_search(query, k=3)
    
    if results:
        return "\n\n".join([doc.page_content for doc in results])
    else:
        return "Aucune information trouvée dans la base interne KPMG."
```

#### 3.2 Linkup Web Search Tool
```python
# app/tools/linkup_search_tool.py
from langchain.tools import tool
import httpx
import os

@tool
def linkup_web_search(query: str) -> str:
    """
    Effectue une recherche web approfondie via Linkup API.
    
    Args:
        query: Requête de recherche détaillée et spécifique
        
    Returns:
        Résultats de recherche formatés
    """
    api_key = os.getenv("LINKUP_API_KEY")
    api_url = os.getenv("LINKUP_API_URL")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "q": query,
        "depth": "deep",
        "outputType": "searchResults",
        "includeImages": False
    }
    
    try:
        response = httpx.post(api_url, json=payload, headers=headers, timeout=30.0)
        response.raise_for_status()
        data = response.json()
        
        # Formater les résultats
        if "results" in data:
            formatted = []
            for result in data["results"][:5]:  # Top 5
                formatted.append(f"Source: {result.get('title', 'N/A')}\n{result.get('snippet', '')}")
            return "\n\n---\n\n".join(formatted)
        else:
            return "Aucun résultat trouvé via recherche web."
            
    except Exception as e:
        return f"Erreur lors de la recherche web: {str(e)}"
```

#### 3.3 Estimation Tool
```python
# app/tools/estimation_tool.py
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
import os

@tool
def estimate_market_data(context: str, variables: str) -> str:
    """
    Génère des estimations de marché via agent ML.
    
    Args:
        context: Contexte du marché (nom, géographie, segmentation)
        variables: Variables à estimer (SAM, SOM, etc.)
        
    Returns:
        Estimations avec hypothèses et scores de confiance
    """
    llm = ChatOpenAI(
        model="gpt-4.1-mini",
        temperature=0.3,
        api_key=os.getenv("OPENAI_API_KEY")
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Tu es un expert en modélisation économique et estimation de marchés niches.
Tu interviens lorsque la donnée directe est absente, partielle ou incohérente.

Ton rôle :
- construire des ordres de grandeur crédibles,
- expliciter les hypothèses,
- produire des ranges (low / base / high),
- effectuer des sanity checks.

Contraintes :
- Tu utilises en priorité des approches bottom-up.
- Chaque hypothèse doit être justifiée (proxy, analogie, logique économique).
- Tu n'inventes pas de données historiques inexistantes.
- Les projections sont prudentes et expliquées.
- Tu livres uniquement des résultats structurés (JSON logique ou sections claires).

Tu ne produis pas de narration longue : seulement des résultats exploitables."""),
        ("user", f"""Contexte marché : {context}
Variables à estimer : {variables}

Génère une estimation structurée avec :
1. Équation de marché (bottom-up)
2. Hypothèses avec ranges
3. Calculs (low / base / high)
4. Sanity checks
5. Score de confiance global""")
    ])
    
    chain = prompt | llm
    result = chain.invoke({})
    
    return result.content
```

---

### Phase 4 : Création des Nodes LangGraph (Jour 3-5)

#### 4.1 Orchestrator Node
```python
# app/graph/workflow.py
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from .state import AgentState
import os

def orchestrator_node(state: AgentState) -> AgentState:
    """
    Node orchestrateur : décompose la mission en sections et initie le workflow.
    """
    # Définir les sections à traiter
    sections = [
        "1.1 Définition & périmètre",
        "1.2 Sizing (TAM / SAM / SOM)",
        "1.3 Segmentation",
        "1.4 Tendances & drivers",
        "1.5 Chaîne de valeur / Régulation",
        "2.1 Principaux acteurs",
        "2.2 Modèles économiques",
        "2.3 Chiffres clés des acteurs",
        "2.4 Facteurs clés d'achat",
        "2.5 Positionnement relatif",
        "3.1 Synthèse exécutive",
        "3.2 Risques & zones d'incertitude",
        "3.3 Leviers de développement",
        "3.4 Prochaines étapes"
    ]
    
    state["sections_to_process"] = sections
    state["completed_sections"] = []
    state["report_sections"] = []
    
    return state
```

#### 4.2 Cascade Research Node
```python
def cascade_research_node(state: AgentState) -> AgentState:
    """
    Node de recherche en cascade : INTERNE → WEB → ESTIMATION
    """
    from app.tools.google_docs_tool import search_internal_knowledge
    from app.tools.linkup_search_tool import linkup_web_search
    from app.tools.estimation_tool import estimate_market_data
    
    query = state["current_query"]
    section = state["current_section"]
    
    source_history = []
    
    # Étape 1 : Recherche INTERNE
    internal_result = search_internal_knowledge.invoke({"query": query})
    source_history.append({
        "step": 1,
        "source": "INTERNE",
        "status": "found" if "Aucune information" not in internal_result else "not_found"
    })
    
    if "Aucune information" not in internal_result:
        state["internal_result"] = {"content": internal_result, "score": 0.9}
        state["final_source"] = "INTERNE"
        state["confidence_score"] = 0.9
        state["source_history"] = source_history
        return state
    
    # Étape 2 : Recherche WEB
    web_result = linkup_web_search.invoke({"query": query})
    source_history.append({
        "step": 2,
        "source": "WEB",
        "status": "found" if "Aucun résultat" not in web_result else "not_found"
    })
    
    if "Aucun résultat" not in web_result:
        state["web_result"] = {"content": web_result, "score": 0.7}
        state["final_source"] = "WEB"
        state["confidence_score"] = 0.7
        state["source_history"] = source_history
        return state
    
    # Étape 3 : ESTIMATION
    context = f"Marché: {state['market_name']}, Géographie: {state['geography']}"
    estimation_result = estimate_market_data.invoke({
        "context": context,
        "variables": query
    })
    
    source_history.append({
        "step": 3,
        "source": "ESTIMATION",
        "status": "estimated"
    })
    
    state["estimation_result"] = {"content": estimation_result, "score": 0.4}
    state["final_source"] = "ESTIMATION"
    state["confidence_score"] = 0.4
    state["source_history"] = source_history
    
    return state
```

#### 4.3 Report Generation Node
```python
def report_generation_node(state: AgentState) -> AgentState:
    """
    Node de génération de rapport : assemble les sections avec formatage
    """
    from langchain_openai import ChatOpenAI
    from langchain.prompts import ChatPromptTemplate
    
    llm = ChatOpenAI(model="gpt-4.1-mini", temperature=0.3)
    
    # Récupérer les résultats de la cascade
    if state["final_source"] == "INTERNE":
        content = state["internal_result"]["content"]
    elif state["final_source"] == "WEB":
        content = state["web_result"]["content"]
    else:
        content = state["estimation_result"]["content"]
    
    # Prompt pour formater la section
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Tu es un consultant senior. Formate la section du rapport avec :
- Titre de section
- Contenu structuré et détaillé
- Tableaux si pertinent
- Graphiques JSON si pertinent (format: {"type": "bar|pie|line", "title": "...", "data": {...}})
- Indication de source: [🟢 INTERNE], [🔵 WEB], ou [🟡 ESTIMATION]
- Score de confiance"""),
        ("user", f"""Section: {state['current_section']}
Contenu source: {content}
Source finale: {state['final_source']}
Score: {state['confidence_score']}

Génère la section formatée du rapport.""")
    ])
    
    chain = prompt | llm
    formatted_section = chain.invoke({})
    
    # Ajouter à la liste des sections complétées
    section_data = {
        "id": state["current_section"],
        "title": state["current_section"],
        "content": formatted_section.content,
        "source": state["final_source"],
        "confidence_score": state["confidence_score"],
        "source_history": state["source_history"],
        "can_deepen": True
    }
    
    state["completed_sections"].append(section_data)
    state["report_sections"].append(section_data)
    
    return state
```

#### 4.4 Expert Recommendation Node
```python
def expert_recommendation_node(state: AgentState) -> AgentState:
    """
    Node de détection d'incertitude et recommandation d'expert
    """
    from langchain_openai import ChatOpenAI
    from langchain.prompts import ChatPromptTemplate
    
    recommendations = []
    
    for section in state["report_sections"]:
        if section["confidence_score"] < 0.5:
            llm = ChatOpenAI(model="gpt-4.1-mini", temperature=0.3)
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", """Tu génères des recommandations d'expert pour les zones d'incertitude.
Pour chaque zone avec score < 0.5, génère :
- Profil d'expert pertinent
- Guide d'entretien structuré avec 5-7 questions clés précises"""),
                ("user", f"""Section: {section['title']}
Score de confiance: {section['confidence_score']}
Source: {section['source']}

Génère la recommandation d'expert.""")
            ])
            
            chain = prompt | llm
            recommendation = chain.invoke({})
            
            recommendations.append({
                "section_id": section["id"],
                "section_title": section["title"],
                "recommendation": recommendation.content
            })
    
    state["expert_recommendations"] = recommendations
    return state
```

#### 4.5 Construction du Graph
```python
def create_workflow_graph():
    """
    Crée le graph LangGraph avec tous les nodes
    """
    workflow = StateGraph(AgentState)
    
    # Ajouter les nodes
    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("cascade_research", cascade_research_node)
    workflow.add_node("report_generation", report_generation_node)
    workflow.add_node("expert_recommendation", expert_recommendation_node)
    
    # Définir le flux
    workflow.set_entry_point("orchestrator")
    
    workflow.add_edge("orchestrator", "cascade_research")
    workflow.add_edge("cascade_research", "report_generation")
    workflow.add_edge("report_generation", "expert_recommendation")
    workflow.add_edge("expert_recommendation", END)
    
    # Compiler le graph
    app = workflow.compile()
    
    return app
```

---

### Phase 5 : Intégration FastAPI (Jour 5-6)

#### 5.1 Endpoints FastAPI
```python
# app/main.py (complet)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from app.graph.workflow import create_workflow_graph
from app.memory.conversation import get_memory_manager

app = FastAPI(title="KPMG AI Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialiser le graph
workflow_app = create_workflow_graph()
memory_manager = get_memory_manager()

class ReportRequest(BaseModel):
    market_name: str
    geography: str
    mission_type: str
    client_website: Optional[str] = None
    conversation_id: Optional[str] = None
    action: Optional[str] = "generate"
    section_id: Optional[str] = None

class ReportResponse(BaseModel):
    sections: List[dict]
    expert_recommendations: List[dict]
    conversation_id: str

@app.post("/api/generate-report", response_model=ReportResponse)
async def generate_report(request: ReportRequest):
    """
    Génère un rapport complet d'étude de marché
    """
    try:
        # Créer l'état initial
        initial_state = {
            "market_name": request.market_name,
            "geography": request.geography,
            "mission_type": request.mission_type,
            "client_website": request.client_website,
            "conversation_id": request.conversation_id or f"conv-{uuid.uuid4()}",
            "action": request.action,
            "section_id": request.section_id,
            "messages": []
        }
        
        # Exécuter le workflow
        final_state = await workflow_app.ainvoke(initial_state)
        
        return ReportResponse(
            sections=final_state["report_sections"],
            expert_recommendations=final_state["expert_recommendations"],
            conversation_id=final_state["conversation_id"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/deepen-section")
async def deepen_section(request: ReportRequest):
    """
    Approfondit une section spécifique du rapport
    """
    # Logique similaire mais ciblée sur une section
    pass

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
```

---

### Phase 6 : Gestion de la Mémoire (Jour 6)

#### 6.1 Conversation Memory Manager
```python
# app/memory/conversation.py
from langchain.memory import ConversationBufferWindowMemory
from typing import Dict
import os

class MemoryManager:
    def __init__(self):
        self.memories: Dict[str, ConversationBufferWindowMemory] = {}
    
    def get_memory(self, conversation_id: str) -> ConversationBufferWindowMemory:
        if conversation_id not in self.memories:
            self.memories[conversation_id] = ConversationBufferWindowMemory(
                k=10,  # Garder les 10 derniers échanges
                return_messages=True
            )
        return self.memories[conversation_id]
    
    def clear_memory(self, conversation_id: str):
        if conversation_id in self.memories:
            del self.memories[conversation_id]

def get_memory_manager() -> MemoryManager:
    return MemoryManager()
```

---

### Phase 7 : Export PowerPoint (Jour 7)

#### 7.1 Export Utility
```python
# app/utils/export.py
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
import base64
from io import BytesIO

def generate_powerpoint(report_sections: List[dict], output_path: str):
    """
    Génère un PowerPoint à partir des sections du rapport
    """
    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)
    
    # Slide titre
    title_slide = prs.slides.add_slide(prs.slide_layouts[0])
    title = title_slide.shapes.title
    subtitle = title_slide.placeholders[1]
    
    title.text = "Étude de Marché"
    subtitle.text = "Généré par KPMG AI Assistant"
    
    # Slides de contenu
    for section in report_sections:
        slide = prs.slides.add_slide(prs.slide_layouts[1])
        title_shape = slide.shapes.title
        content_shape = slide.placeholders[1]
        
        title_shape.text = section["title"]
        content_shape.text = section["content"]
        
        # Ajouter badge source
        if section["source"] == "INTERNE":
            source_text = "🟢 Source: INTERNE KPMG"
        elif section["source"] == "WEB":
            source_text = "🔵 Source: WEB"
        else:
            source_text = "🟡 Source: ESTIMATION"
        
        # Ajouter texte source
        left = Inches(0.5)
        top = Inches(6.5)
        width = Inches(9)
        height = Inches(0.5)
        textbox = slide.shapes.add_textbox(left, top, width, height)
        text_frame = textbox.text_frame
        text_frame.text = source_text
        text_frame.paragraphs[0].font.size = Pt(10)
    
    prs.save(output_path)
```

---

## 🔄 Migration des Prompts

### Prompt Système (identique à n8n)
```python
SYSTEM_PROMPT = """Tu es un consultant senior en stratégie spécialisé en études de marché et due diligences.
Ton rôle est d'orchestrer la recherche, la structuration et la synthèse d'une note de marché crédible.

[... prompt système complet du n8n ...]
"""
```

### Prompt Utilisateur (identique à n8n)
```python
USER_PROMPT_TEMPLATE = """Voici le brief de mission :

- Marché : {market_name}
- Géographie : {geography}
- Type de mission : {mission_type}
- Site du client (si fourni) : {client_website}

[... prompt utilisateur complet du n8n ...]
"""
```

---

## 🧪 Tests et Validation

### Tests Unitaires
```python
# tests/test_workflow.py
import pytest
from app.graph.workflow import create_workflow_graph

def test_workflow_execution():
    workflow = create_workflow_graph()
    
    initial_state = {
        "market_name": "Pet Care",
        "geography": "France",
        "mission_type": "Étude de marché",
        "conversation_id": "test-123",
        "messages": []
    }
    
    result = workflow.invoke(initial_state)
    
    assert "report_sections" in result
    assert len(result["report_sections"]) > 0
```

### Tests d'Intégration
```python
# tests/test_api.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_generate_report():
    response = client.post("/api/generate-report", json={
        "market_name": "Pet Care",
        "geography": "France",
        "mission_type": "Étude de marché"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "sections" in data
```

---

## 📊 Comparaison n8n vs LangGraph

| Aspect | n8n | LangGraph |
|--------|-----|-----------|
| **Orchestration** | Nodes visuels | Code Python (StateGraph) |
| **Flexibilité** | Limitée par UI | Totale (code) |
| **Debugging** | Logs n8n | Debugger Python standard |
| **Versioning** | Git (JSON) | Git (code Python) |
| **Performance** | Bonne | Excellente (optimisations possibles) |
| **Maintenance** | Interface graphique | Code standard |
| **Tests** | Difficile | Facile (pytest) |
| **Déploiement** | Serveur n8n | Docker/Cloud standard |

---

## 🚀 Déploiement

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
COPY data/ ./data/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LINKUP_API_KEY=${LINKUP_API_KEY}
    volumes:
      - ./data:/app/data
```

---

## ✅ Checklist de Migration

### Phase 1 : Setup
- [ ] Environnement Python créé
- [ ] Dépendances installées
- [ ] Variables d'environnement configurées
- [ ] Structure de projet créée

### Phase 2 : Tools
- [ ] Google Docs Tool implémenté
- [ ] Linkup Search Tool implémenté
- [ ] Estimation Tool implémenté
- [ ] Tests des tools

### Phase 3 : Graph
- [ ] State défini
- [ ] Nodes créés
- [ ] Graph compilé
- [ ] Tests du workflow

### Phase 4 : API
- [ ] FastAPI app créée
- [ ] Endpoints implémentés
- [ ] Gestion mémoire
- [ ] Tests API

### Phase 5 : Export
- [ ] Export PowerPoint
- [ ] Génération graphiques
- [ ] Tests export

### Phase 6 : Migration Frontend
- [ ] Mise à jour URL API (n8n → FastAPI)
- [ ] Adaptation format réponse
- [ ] Tests end-to-end

---

## 📝 Notes Importantes

1. **Mémoire Conversationnelle** : LangChain ConversationBufferWindowMemory remplace Simple Memory de n8n
2. **Streaming** : LangGraph supporte le streaming natif (à implémenter si besoin)
3. **Parallélisation** : Possibilité d'exécuter plusieurs recherches en parallèle (amélioration vs n8n)
4. **Cache** : Implémenter un cache Redis pour éviter recherches répétées
5. **Monitoring** : Ajouter logging structuré et métriques (Prometheus)

---

## 🎯 Prochaines Étapes

1. **Semaine 1** : Setup + Tools + Graph de base
2. **Semaine 2** : API + Tests + Export
3. **Semaine 3** : Optimisations + Cache + Monitoring
4. **Semaine 4** : Migration frontend + Tests end-to-end

---

**Date de création** : 2026-01-22  
**Version** : 1.0.0
