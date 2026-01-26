"""State definition for LangGraph workflow"""
from typing import TypedDict, List, Optional, Dict, Any
from langgraph.graph.message import AnyMessage


class AgentState(TypedDict):
    """State for the KPMG AI Agent workflow"""
    
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
    
    # Progression tracking (NOUVEAU)
    current_step: Optional[str]  # "orchestrator", "cascade_research", "report_generation", etc.
    current_section_index: Optional[int]  # Index dans sections_to_process
    total_sections: Optional[int]
    progress_percentage: Optional[float]  # 0.0 à 1.0
    step_details: Optional[Dict[str, Any]]  # Détails de l'étape actuelle
    estimated_time_remaining: Optional[int]  # Secondes estimées
    start_time: Optional[float]  # Timestamp de début
