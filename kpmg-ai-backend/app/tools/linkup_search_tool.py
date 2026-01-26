"""Linkup Web Search Tool for web research"""
from langchain.tools import tool
import httpx
from app.config import Config


@tool
def linkup_web_search(query: str) -> str:
    """
    Effectue une recherche web approfondie via Linkup API.
    
    Args:
        query: Requête de recherche détaillée et spécifique
        
    Returns:
        Résultats de recherche formatés
    """
    if not Config.LINKUP_API_KEY:
        return "Configuration Linkup API manquante."
    
    headers = {
        "Authorization": f"Bearer {Config.LINKUP_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "q": query,
        "depth": "standard",
        "outputType": "searchResults",
        "includeImages": False
    }
    
    try:
        response = httpx.post(
            Config.LINKUP_API_URL,
            json=payload,
            headers=headers,
            timeout=30.0
        )
        response.raise_for_status()
        data = response.json()
        
        # Formater les résultats
        if "results" in data and data["results"]:
            formatted = []
            for result in data["results"][:5]:  # Top 5
                title = result.get('title', 'N/A')
                snippet = result.get('snippet', result.get('description', ''))
                formatted.append(f"Source: {title}\n{snippet}")
            return "\n\n---\n\n".join(formatted)
        else:
            return "Aucun résultat trouvé via recherche web."
            
    except httpx.HTTPError as e:
        return f"Erreur HTTP lors de la recherche web: {str(e)}"
    except Exception as e:
        return f"Erreur lors de la recherche web: {str(e)}"
