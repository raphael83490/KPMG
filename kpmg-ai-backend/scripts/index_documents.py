#!/usr/bin/env python3
"""
Script pour indexer manuellement les documents dans ChromaDB
Usage: python scripts/index_documents.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.tools.rag_tool import _get_vectorstore

if __name__ == "__main__":
    print("🚀 Starting document indexing...")
    print()
    
    # Force reindex
    vectorstore = _get_vectorstore(force_reindex=True)
    
    if vectorstore:
        print()
        print("✅ Documents successfully indexed!")
        print("   You can now use the search_internal_knowledge tool.")
    else:
        print()
        print("❌ No documents found to index.")
        print("   Please add files to data/documents/ directory:")
        print("   - PDF files (.pdf)")
        print("   - Text files (.txt, .md)")
        print("   - Word documents (.docx)")
