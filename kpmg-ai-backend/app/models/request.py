"""Request models for API"""
from pydantic import BaseModel
from typing import Optional


class ReportRequest(BaseModel):
    """Request model for report generation"""
    market_name: str
    geography: str
    mission_type: str
    client_website: Optional[str] = None
    conversation_id: Optional[str] = None
    action: Optional[str] = "generate"
    section_id: Optional[str] = None


class ReportResponse(BaseModel):
    """Response model for report generation"""
    sections: list
    expert_recommendations: list
    conversation_id: str
