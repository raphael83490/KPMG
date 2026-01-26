"""RAG Tool for internal KPMG knowledge base - supports multiple file formats"""
import os
# Disable ChromaDB telemetry to avoid errors
os.environ["ANONYMIZED_TELEMETRY"] = "False"

from langchain.tools import tool
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    UnstructuredWordDocumentLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from app.config import Config
import hashlib
import json
from pathlib import Path


# Cache pour le vectorstore
_vectorstore_cache = None
_index_metadata_file = "data/chroma_db/index_metadata.json"


def _get_document_hash(file_path: str) -> str:
    """Calculate hash of file for change detection"""
    try:
        with open(file_path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    except Exception:
        return ""


def _load_index_metadata() -> dict:
    """Load index metadata to track indexed files"""
    if os.path.exists(_index_metadata_file):
        try:
            with open(_index_metadata_file, 'r') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _save_index_metadata(metadata: dict):
    """Save index metadata"""
    os.makedirs(os.path.dirname(_index_metadata_file), exist_ok=True)
    try:
        with open(_index_metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
    except Exception as e:
        print(f"Error saving metadata: {e}")


def _load_documents_from_directory(directory: str = None) -> list:
    """
    Load all documents from a directory (PDF, TXT, DOCX, MD, etc.)
    """
    if directory is None:
        directory = Config.DOCUMENTS_DIRECTORY
    
    documents = []
    directory_path = Path(directory)
    
    if not directory_path.exists():
        print(f"Directory {directory} does not exist")
        return documents
    
    # Supported file types
    file_extensions = {
        '.pdf': PyPDFLoader,
        '.txt': TextLoader,
        '.md': TextLoader,
        '.docx': UnstructuredWordDocumentLoader,
    }
    
    # Files to exclude from indexing (documentation, config files, etc.)
    excluded_files = {
        'readme.md', 'readme.txt', '.gitkeep', '.gitignore',
        'license', 'license.txt', 'changelog', 'changelog.txt',
        '.gitkeep.bak', 'readme_documents.md'
    }
    
    # File extensions to exclude (even if they match supported types)
    excluded_extensions = {'.gitkeep', '.gitignore', '.bak'}
    
    for file_path in directory_path.rglob('*'):
        # Skip directories
        if not file_path.is_file():
            continue
        
        # Skip if extension is excluded
        if file_path.suffix.lower() in excluded_extensions:
            continue
        
        # Skip if file name matches excluded patterns
        file_name_lower = file_path.name.lower()
        if any(excluded in file_name_lower for excluded in excluded_files):
            print(f"⊘ Skipping {file_path.name} (excluded file)")
            continue
        
        if file_path.is_file() and file_path.suffix.lower() in file_extensions:
            try:
                loader_class = file_extensions[file_path.suffix.lower()]
                loader = loader_class(str(file_path))
                docs = loader.load()
                
                # Add metadata about source file
                for doc in docs:
                    doc.metadata['source_file'] = str(file_path)
                    doc.metadata['file_type'] = file_path.suffix
                    doc.metadata['file_name'] = file_path.name
                
                documents.extend(docs)
                print(f"✓ Loaded {file_path.name} ({len(docs)} chunks)")
            except Exception as e:
                print(f"✗ Error loading {file_path}: {e}")
                continue
    
    return documents


def _should_reindex() -> bool:
    """
    Check if reindexing is needed based on file changes
    """
    metadata = _load_index_metadata()
    
    # Check local documents
    doc_directory = Config.DOCUMENTS_DIRECTORY
    if os.path.exists(doc_directory):
        for file_path in Path(doc_directory).rglob('*'):
            if file_path.is_file():
                file_str = str(file_path)
                file_hash = _get_document_hash(file_str)
                
                if file_str not in metadata or metadata.get(file_str) != file_hash:
                    return True
    
    # If no metadata exists, we need to index
    if not metadata:
        return True
    
    return False


def _get_vectorstore(force_reindex: bool = False):
    """
    Get or create the ChromaDB vectorstore with support for multiple file sources
    """
    global _vectorstore_cache
    
    # Check if reindexing is needed
    if not force_reindex and _vectorstore_cache is not None:
        if not _should_reindex():
            print("Using cached vectorstore (no changes detected)")
            return _vectorstore_cache
    
    print("=" * 50)
    print("Indexing documents in ChromaDB...")
    print("=" * 50)
    
    # Load documents from local directory
    all_documents = _load_documents_from_directory(Config.DOCUMENTS_DIRECTORY)
    
    if not all_documents:
        print(f"⚠️  No documents found in {Config.DOCUMENTS_DIRECTORY}/")
        print(f"   Place your PDF, TXT, DOCX, or MD files in {Config.DOCUMENTS_DIRECTORY}/")
        
        # Try to load existing vectorstore if it exists
        if os.path.exists(Config.CHROMA_PERSIST_DIRECTORY) and os.listdir(Config.CHROMA_PERSIST_DIRECTORY):
            try:
                embeddings = OpenAIEmbeddings(api_key=Config.OPENAI_API_KEY)
                vectorstore = Chroma(
                    persist_directory=Config.CHROMA_PERSIST_DIRECTORY,
                    embedding_function=embeddings
                )
                _vectorstore_cache = vectorstore
                print("✓ Using existing index")
                return vectorstore
            except Exception as e:
                print(f"Error loading existing index: {e}")
        
        return None
    
    print(f"\n📄 Total documents loaded: {len(all_documents)} chunks")
    
    # Split documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    splits = text_splitter.split_documents(all_documents)
    print(f"📦 Split into {len(splits)} chunks for indexing")
    
    # Create embeddings and vectorstore
    print("🔄 Creating embeddings (this may take a moment)...")
    embeddings = OpenAIEmbeddings(api_key=Config.OPENAI_API_KEY)
    
    # Clear existing index if it exists and we're reindexing
    if force_reindex or _should_reindex():
        if os.path.exists(Config.CHROMA_PERSIST_DIRECTORY) and os.listdir(Config.CHROMA_PERSIST_DIRECTORY):
            try:
                old_vectorstore = Chroma(
                    persist_directory=Config.CHROMA_PERSIST_DIRECTORY,
                    embedding_function=embeddings
                )
                old_vectorstore.delete_collection()
                print("🗑️  Cleared old index")
            except Exception:
                pass
    
    # Create or update vectorstore
    vectorstore = Chroma.from_documents(
        documents=splits,
        embedding=embeddings,
        persist_directory=Config.CHROMA_PERSIST_DIRECTORY
    )
    
    # Save metadata
    metadata = {}
    doc_directory = Config.DOCUMENTS_DIRECTORY
    if os.path.exists(doc_directory):
        for file_path in Path(doc_directory).rglob('*'):
            if file_path.is_file():
                metadata[str(file_path)] = _get_document_hash(str(file_path))
    
    _save_index_metadata(metadata)
    
    _vectorstore_cache = vectorstore
    print("✅ Indexing complete!")
    print("=" * 50)
    return vectorstore


@tool
def search_internal_knowledge(query: str) -> str:
    """
    Recherche dans la base de connaissances interne KPMG.
    Supporte plusieurs formats : PDF, TXT, DOCX, MD depuis data/documents/
    
    Args:
        query: Requête de recherche
        
    Returns:
        Informations trouvées ou message indiquant absence de résultats
    """
    vectorstore = _get_vectorstore()
    
    if vectorstore is None:
        return f"Aucune information trouvée dans la base interne KPMG (aucun document indexé dans {Config.DOCUMENTS_DIRECTORY}/)."
    
    try:
        # Recherche avec métadonnées pour traçabilité
        # Réduire k à 3 pour éviter trop de répétitions
        results = vectorstore.similarity_search_with_score(query, k=3)
        
        if results:
            # Grouper les résultats par fichier source pour éviter les répétitions
            results_by_file = {}
            for doc, score in results:
                source_file = doc.metadata.get('source_file', 'Unknown')
                file_name = doc.metadata.get('file_name', Path(source_file).name if source_file != 'Unknown' else 'Unknown')
                content = doc.page_content
                
                if file_name not in results_by_file:
                    results_by_file[file_name] = []
                
                results_by_file[file_name].append({
                    'content': content,
                    'score': score
                })
            
            # Formater les résultats en consolidant par fichier
            formatted_results = []
            global_best_distance = float('inf')  # Pour suivre la meilleure distance globale
            
            for file_name, file_results in results_by_file.items():
                # ChromaDB retourne des distances (plus bas = mieux)
                # Prendre la distance la plus faible (meilleur match)
                best_distance = min(r['score'] for r in file_results)
                global_best_distance = min(global_best_distance, best_distance)
                
                # Convertir distance en score de similarité (0.0 à 1.0)
                # Distance 0.0 → score 1.0, Distance 1.0 → score 0.5, Distance 2.0 → score 0.33
                similarity_score = 1.0 / (1.0 + best_distance)
                
                # Consolider le contenu (enlever les doublons partiels)
                contents = [r['content'] for r in file_results]
                # Joindre les contenus uniques
                unique_contents = []
                seen_content = set()
                for content in contents:
                    # Normaliser le contenu pour détecter les doublons
                    content_normalized = ' '.join(content.split())
                    if content_normalized not in seen_content:
                        seen_content.add(content_normalized)
                        unique_contents.append(content)
                
                consolidated_content = '\n\n'.join(unique_contents)
                # Afficher le score de similarité (plus lisible) et la distance (pour debug)
                formatted_results.append(f"[Source: {file_name} | Similarity: {similarity_score:.2f} | Distance: {best_distance:.3f}]\n{consolidated_content}")
            
            # Ajouter le meilleur score global au début pour faciliter l'extraction
            best_similarity = 1.0 / (1.0 + global_best_distance)
            result_text = "\n\n---\n\n".join(formatted_results)
            # Préfixer avec le meilleur score pour extraction facile
            return f"[BEST_SIMILARITY: {best_similarity:.3f}]\n{result_text}"
        else:
            return "Aucune information trouvée dans la base interne KPMG."
    except Exception as e:
        return f"Erreur lors de la recherche interne: {str(e)}"
