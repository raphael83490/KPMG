"""Configuration management for KPMG AI Backend"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""
    
    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # Google Docs (optionnel - non utilisé par défaut)
    GOOGLE_DOCS_CREDENTIALS_PATH = os.getenv("GOOGLE_DOCS_CREDENTIALS_PATH")
    GOOGLE_DOCS_DOCUMENT_ID = os.getenv("GOOGLE_DOCS_DOCUMENT_ID")
    
    # Documents locaux (utilisé par défaut)
    DOCUMENTS_DIRECTORY = os.getenv("DOCUMENTS_DIRECTORY", "data/documents")
    
    # Linkup API
    LINKUP_API_KEY = os.getenv("LINKUP_API_KEY")
    LINKUP_API_URL = os.getenv("LINKUP_API_URL", "https://api.linkup.so/v1/search")
    
    # ChromaDB
    CHROMA_PERSIST_DIRECTORY = os.getenv("CHROMA_PERSIST_DIRECTORY", "./data/chroma_db")
    
    # FastAPI
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", "8000"))
    
    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
