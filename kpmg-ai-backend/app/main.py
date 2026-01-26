"""FastAPI application for KPMG AI Agent"""
import os
# Disable ChromaDB telemetry early (before any imports that might use ChromaDB)
os.environ["ANONYMIZED_TELEMETRY"] = "False"

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.models.request import ReportRequest, ReportResponse
from app.graph.workflow import create_workflow_graph
from app.config import Config
import json
import uuid
import time
import asyncio


app = FastAPI(title="KPMG AI Agent API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize workflow graph
workflow_app = create_workflow_graph()


@app.on_event("startup")
async def startup_event():
    """
    Initialize RAG vectorstore on server startup
    This will trigger document indexing and display progress messages
    """
    try:
        from app.tools.rag_tool import _get_vectorstore
        print("\n🚀 Initializing RAG system...")
        vectorstore = _get_vectorstore(force_reindex=False)
        if vectorstore:
            print("✅ RAG system ready!\n")
        else:
            print("⚠️  RAG system initialized but no documents found.\n")
    except Exception as e:
        print(f"⚠️  Warning: Could not initialize RAG system: {e}\n")


def estimate_time_remaining(progress: float, elapsed_time: float) -> int:
    """Estimate remaining time based on progress"""
    if progress <= 0:
        return 300  # Default 5 minutes if no progress
    
    if progress >= 1.0:
        return 0
    
    total_estimated = elapsed_time / progress
    remaining = total_estimated - elapsed_time
    return max(0, int(remaining))


@app.post("/api/generate-report-stream")
async def generate_report_stream(request: ReportRequest):
    """
    Génère un rapport avec streaming en temps réel via SSE
    """
    async def event_generator():
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
                "messages": [],
                "current_step": None,
                "current_section_index": None,
                "total_sections": None,
                "progress_percentage": None,
                "step_details": None,
                "estimated_time_remaining": None,
                "start_time": None
            }
            
            # Émettre événement initial
            yield f"data: {json.dumps({'type': 'start', 'conversation_id': initial_state['conversation_id']})}\n\n"
            
            start_time = time.time()
            last_progress = 0.0
            last_section_count = 0
            final_state = initial_state
            
            # Streamer les états du workflow
            # astream() retourne un dict {node_name: state} à chaque étape
            async for output in workflow_app.astream(initial_state):
                # output est un dict {node_name: state}
                # On itère sur tous les nœuds qui ont été exécutés
                for node_name, state in output.items():
                    # Extraire les informations de progression depuis le state
                    current_step = state.get("current_step")
                    progress = state.get("progress_percentage", 0.0)
                    step_details = state.get("step_details", {})
                    current_section_index = state.get("current_section_index", 0)
                    total_sections = state.get("total_sections", 14)
                    report_sections = state.get("report_sections", [])
                    
                    # Mettre à jour l'état final
                    final_state = state
                    
                    # Calculer le temps estimé
                    elapsed_time = time.time() - start_time
                    estimated_remaining = estimate_time_remaining(progress, elapsed_time)
                    
                    # Émettre événement de progression
                    if progress != last_progress or current_step:
                        yield f"data: {json.dumps({
                            'type': 'progress',
                            'percentage': progress,
                            'step': current_step,
                            'node': node_name,
                            'details': step_details,
                            'section_index': current_section_index,
                            'total_sections': total_sections,
                            'estimated_time_remaining': estimated_remaining
                        })}\n\n"
                        last_progress = progress
                    
                    # Émettre événement si une nouvelle section est complétée
                    # On envoie seulement les métadonnées (titre, ID) pour la progression, pas le contenu complet
                    if len(report_sections) > last_section_count:
                        # Nouvelles sections ajoutées
                        new_sections = report_sections[last_section_count:]
                        for section in new_sections:
                            # Envoyer seulement les métadonnées pour la progression
                            section_info = {
                                "id": section.get("id", ""),
                                "title": section.get("title", ""),
                                "source": section.get("source", ""),
                                "confidence_score": section.get("confidence_score", 0.0)
                            }
                            yield f"data: {json.dumps({
                                'type': 'section_complete',
                                'section': section_info
                            })}\n\n"
                        last_section_count = len(report_sections)
            
            # Émettre événement final avec toutes les sections et recommandations
            yield f"data: {json.dumps({
                'type': 'complete',
                'sections': final_state.get('report_sections', []),
                'expert_recommendations': final_state.get('expert_recommendations', []),
                'conversation_id': final_state.get('conversation_id', initial_state['conversation_id'])
            })}\n\n"
            
        except Exception as e:
            # Émettre événement d'erreur
            yield f"data: {json.dumps({
                'type': 'error',
                'message': str(e)
            })}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.post("/api/generate-report", response_model=ReportResponse)
async def generate_report(request: ReportRequest):
    """
    Génère un rapport complet d'étude de marché (sans streaming)
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
            "messages": [],
            "current_step": None,
            "current_section_index": None,
            "total_sections": None,
            "progress_percentage": None,
            "step_details": None,
            "estimated_time_remaining": None,
            "start_time": None
        }
        
        # Exécuter le workflow
        final_state = await workflow_app.ainvoke(initial_state)
        
        return ReportResponse(
            sections=final_state.get("report_sections", []),
            expert_recommendations=final_state.get("expert_recommendations", []),
            conversation_id=final_state.get("conversation_id", initial_state["conversation_id"])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "version": "1.0.0"}
