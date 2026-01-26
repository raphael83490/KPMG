"""Google Docs Tool for internal KPMG knowledge base search"""
from langchain.tools import tool
from langchain_community.document_loaders import GoogleDocsLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from app.config import Config
import os


# Cache pour le vectorstore (éviter de le recréer à chaque fois)
_vectorstore_cache = None


def _get_vectorstore():
    """Get or create the ChromaDB vectorstore"""
    global _vectorstore_cache
    
    if _vectorstore_cache is not None:
        return _vectorstore_cache
    
    # Charger document Google Docs
    if not Config.GOOGLE_DOCS_DOCUMENT_ID:
        return None
    
    try:
        loader = GoogleDocsLoader(document_ids=[Config.GOOGLE_DOCS_DOCUMENT_ID])
        docs = loader.load()
        
        # Split et indexer dans ChromaDB
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        
        # Vector store
        embeddings = OpenAIEmbeddings(api_key=Config.OPENAI_API_KEY)
        vectorstore = Chroma.from_documents(
            documents=splits,
            embedding=embeddings,
            persist_directory=Config.CHROMA_PERSIST_DIRECTORY
        )
        
        _vectorstore_cache = vectorstore
        return vectorstore
    except Exception as e:
        print(f"Error loading Google Docs: {e}")
        return None


@tool
def search_internal_knowledge(query: str) -> str:
    """
    Recherche dans la base de connaissances interne KPMG (Google Docs).
    
    Args:
        query: Requête de recherche
        
    Returns:
        Informations trouvées ou message indiquant absence de résultats
    """
    vectorstore = _get_vectorstore()
    
    if vectorstore is None:
        return "Aucune information trouvée dans la base interne KPMG (configuration manquante)."
    
    try:
        # Recherche
        results = vectorstore.similarity_search(query, k=3)
        
        if results:
            return "\n\n".join([doc.page_content for doc in results])
        else:
            return "Aucune information trouvée dans la base interne KPMG."
    except Exception as e:
        return f"Erreur lors de la recherche interne: {str(e)}"
