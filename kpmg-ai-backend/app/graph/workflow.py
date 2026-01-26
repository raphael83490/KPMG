"""LangGraph workflow for KPMG AI Agent"""
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from .state import AgentState
from app.config import Config
import time


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
    state["total_sections"] = len(sections)
    state["current_section_index"] = 0
    state["progress_percentage"] = 0.0
    state["start_time"] = time.time()
    state["current_step"] = "orchestrator"
    state["step_details"] = {"message": "Initialisation du workflow..."}
    
    return state


def process_section_node(state: AgentState) -> AgentState:
    """
    Node qui traite une section : détermine quelle section traiter et prépare la requête
    """
    sections = state.get("sections_to_process", [])
    completed = state.get("completed_sections", [])
    current_index = state.get("current_section_index", 0)
    
    # Vérification de sécurité : éviter les boucles infinies
    if not sections or len(sections) == 0:
        state["current_step"] = "completed"
        state["progress_percentage"] = 1.0
        return state
    
    # Vérifier si toutes les sections sont déjà complétées
    if len(completed) >= len(sections) or current_index >= len(sections):
        # Toutes les sections sont traitées
        state["current_step"] = "completed"
        state["progress_percentage"] = 1.0
        state["current_section_index"] = len(sections)  # S'assurer que l'index est à jour
        return state
    
    # S'assurer que l'index ne dépasse pas la taille de la liste
    if current_index >= len(sections):
        current_index = len(sections) - 1
    
    current_section = sections[current_index]
    state["current_section"] = current_section
    state["current_step"] = "process_section"
    
    # Construire la requête pour cette section
    query = f"{current_section} pour le marché {state['market_name']} en {state['geography']}"
    state["current_query"] = query
    
    # Mettre à jour la progression
    progress = current_index / len(sections) if len(sections) > 0 else 1.0
    state["progress_percentage"] = progress
    state["step_details"] = {
        "message": f"Traitement de la section {current_section} ({current_index + 1}/{len(sections)})...",
        "section": current_section,
        "section_index": current_index + 1,
        "total_sections": len(sections)
    }
    
    return state


def cascade_research_node(state: AgentState) -> AgentState:
    """
    Node de recherche en cascade : INTERNE → WEB → ESTIMATION
    Avec logique spéciale pour les sections nécessitant des données chiffrées
    """
    from app.tools.rag_tool import search_internal_knowledge
    from app.tools.linkup_search_tool import linkup_web_search
    from app.tools.estimation_tool import estimate_market_data
    import re
    
    query = state.get("current_query", "")
    section = state.get("current_section", "")
    market_name = state.get("market_name", "")
    geography = state.get("geography", "")
    
    source_history = []
    state["current_step"] = "cascade_research"
    
    # === SECTIONS QUI NÉCESSITENT OBLIGATOIREMENT DES DONNÉES CHIFFRÉES ===
    quantitative_sections = [
        "1.2 Sizing",  # TAM/SAM/SOM
        "1.3 Segmentation",
        "1.4 Tendances",
        "2.1 Principaux acteurs",
        "2.3 Chiffres clés",
        "2.4 Facteurs",
        "2.5 Positionnement"
    ]
    requires_numbers = any(qs in section for qs in quantitative_sections)
    
    # === SECTIONS DE SYNTHÈSE qui utilisent les données des sections précédentes ===
    synthesis_sections = [
        "3.1 Synthèse",
        "3.2 Risques",
        "3.3 Leviers",
        "3.4 Prochaines"
    ]
    is_synthesis = any(ss in section for ss in synthesis_sections)
    
    def has_numeric_data(content: str) -> bool:
        """Vérifie si le contenu contient des données numériques exploitables"""
        if not content:
            return False
        numeric_patterns = [
            r'\d+[,.]?\d*\s*(milliards?|Md|billions?)\s*(d\')?euros?',
            r'\d+[,.]?\d*\s*(millions?|M)\s*(d\')?euros?',
            r'\d+[,.]?\d*\s*%',
            r'\d+[,.]?\d*\s*€',
            r'~?\d+[,.]?\d*\s*(Md€|M€)',
            r'(TAM|SAM|SOM)[^:]*:\s*~?\d+',
            r'part\s*(de\s*)?march[ée][^:]*:\s*~?\d+',
        ]
        for pattern in numeric_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return True
        return False
    
    def has_useful_content(content: str) -> bool:
        """Vérifie si le contenu est utile (pas juste des erreurs ou messages vides)"""
        if not content or len(content) < 100:
            return False
        # Patterns indiquant un contenu inutile
        useless_patterns = [
            r'aucun(e)?\s+(résultat|donnée|information)',
            r'pas\s+de\s+(données?|résultats?)',
            r'source.*n/a',
            r'erreur',
            r'malheureusement.*aucun'
        ]
        content_lower = content.lower()
        for pattern in useless_patterns:
            if re.search(pattern, content_lower):
                return False
        return True
    
    # === Pour les sections de SYNTHÈSE, utiliser les données des sections précédentes ===
    if is_synthesis:
        previous_sections = state.get("report_sections", [])
        if previous_sections:
            # Compiler un résumé des données des sections précédentes
            synthesis_context = f"DONNÉES DES SECTIONS PRÉCÉDENTES pour {market_name} en {geography}:\n\n"
            for prev_section in previous_sections:
                synthesis_context += f"### {prev_section.get('title', '')}:\n"
                synthesis_context += f"{prev_section.get('content', '')[:500]}...\n\n"
            
            state["synthesis_context"] = synthesis_context
            state["internal_result"] = {"content": synthesis_context, "score": 0.8}
            state["final_source"] = "SYNTHESE"
            state["confidence_score"] = 0.8
            state["source_history"] = [{"step": 0, "source": "SYNTHESE", "status": "compiled"}]
            state["has_numeric_data"] = True
            return state
    
    # === Étape 1 : Recherche INTERNE ===
    state["step_details"] = {
        "message": f"Recherche INTERNE pour {section}...",
        "source": "INTERNE"
    }
    internal_result = search_internal_knowledge.invoke({"query": query})
    
    has_results = "Aucune information" not in internal_result and "configuration manquante" not in internal_result
    
    # Extraire le score de similarité
    best_similarity = 0.0
    if has_results:
        similarity_match = re.search(r'\[BEST_SIMILARITY:\s*([\d.]+)\]', internal_result)
        if similarity_match:
            best_similarity = float(similarity_match.group(1))
        else:
            similarity_matches = re.findall(r'Similarity:\s*([\d.]+)', internal_result)
            if similarity_matches:
                best_similarity = max(float(s) for s in similarity_matches)
    
    internal_has_numbers = has_numeric_data(internal_result) if has_results else False
    
    # Stocker le résultat INTERNE pour le passer à l'ESTIMATION si nécessaire
    state["internal_data_for_estimation"] = internal_result if has_results else ""
    
    source_history.append({
        "step": 1,
        "source": "INTERNE",
        "status": "found" if has_results and best_similarity > 0.80 else "not_found",
        "score": best_similarity,
        "has_numbers": internal_has_numbers
    })
    
    # Conditions pour accepter INTERNE
    content_length = len(internal_result) if has_results else 0
    is_content_sufficient = content_length > 150
    section_keywords = section.lower().split()
    content_lower = internal_result.lower() if has_results else ""
    keyword_match_count = sum(1 for kw in section_keywords if kw in content_lower and len(kw) > 3)
    is_section_relevant = keyword_match_count >= 2
    
    if requires_numbers:
        internal_valid = (has_results and best_similarity > 0.80 and 
                         is_content_sufficient and is_section_relevant and internal_has_numbers)
    else:
        internal_valid = (has_results and best_similarity > 0.80 and 
                         is_content_sufficient and is_section_relevant)
    
    if internal_valid:
        state["internal_result"] = {"content": internal_result, "score": best_similarity}
        state["final_source"] = "INTERNE"
        state["confidence_score"] = min(0.9, best_similarity * 0.95)
        state["source_history"] = source_history
        state["has_numeric_data"] = internal_has_numbers
        return state
    
    # === Étape 2 : Recherche WEB ===
    state["step_details"] = {
        "message": f"Recherche WEB pour {section}...",
        "source": "WEB"
    }
    
    if requires_numbers:
        web_query = f"{query} chiffres données statistiques taille marché parts de marché {market_name} {geography}"
    else:
        web_query = query
    
    web_result = linkup_web_search.invoke({"query": web_query})
    web_has_numbers = has_numeric_data(web_result) if web_result else False
    web_is_useful = has_useful_content(web_result)
    
    # Stocker pour l'ESTIMATION
    state["web_data_for_estimation"] = web_result if web_is_useful else ""
    
    source_history.append({
        "step": 2,
        "source": "WEB",
        "status": "found" if web_is_useful else "not_found",
        "has_numbers": web_has_numbers
    })
    
    # Accepter WEB seulement si contenu utile ET (pas besoin de chiffres OU a des chiffres)
    if web_is_useful and (not requires_numbers or web_has_numbers):
        state["web_result"] = {"content": web_result, "score": 0.7}
        state["final_source"] = "WEB"
        state["confidence_score"] = 0.7
        state["source_history"] = source_history
        state["has_numeric_data"] = web_has_numbers
        return state
    
    # === Étape 3 : ESTIMATION (toujours si on arrive ici) ===
    state["step_details"] = {
        "message": f"Estimation pour {section}...",
        "source": "ESTIMATION"
    }
    
    # Context enrichi avec les données INTERNE et WEB trouvées (même partielles)
    context_parts = [f"Marché: {market_name}", f"Géographie: {geography}", f"Section: {section}"]
    
    # Ajouter les données INTERNE si disponibles
    internal_data = state.get("internal_data_for_estimation", "")
    if internal_data and len(internal_data) > 50:
        context_parts.append(f"\nDONNÉES INTERNES DISPONIBLES (à utiliser comme base):\n{internal_data[:1000]}")
    
    # Ajouter les données WEB si disponibles
    web_data = state.get("web_data_for_estimation", "")
    if web_data and len(web_data) > 50:
        context_parts.append(f"\nDONNÉES WEB DISPONIBLES (à utiliser comme référence):\n{web_data[:1000]}")
    
    context = "\n".join(context_parts)
    
    # Variables spécifiques selon le type de section
    if "Sizing" in section or "TAM" in section:
        variables = f"TAM SAM SOM taille marché {market_name} {geography} en milliards d'euros. IMPORTANT: Si des données internes mentionnent un TAM de 7 Md€, utilise cette valeur comme base."
    elif "Segmentation" in section:
        variables = f"Segmentation marché {market_name} {geography} par catégorie de produit avec pourcentages"
    elif "acteurs" in section.lower() or "Principaux" in section:
        variables = f"Parts de marché principaux acteurs {market_name} {geography} avec noms réels et pourcentages"
    elif "Chiffres clés" in section:
        variables = f"Chiffres clés acteurs marché {market_name} {geography} CA parts de marché"
    elif "Tendances" in section:
        variables = f"Tendances et drivers marché {market_name} {geography} avec données chiffrées sur la croissance"
    elif "Facteurs" in section:
        variables = f"Facteurs clés d'achat marché {market_name} {geography} avec importance relative en %"
    elif "Positionnement" in section:
        variables = f"Positionnement relatif acteurs marché {market_name} {geography} mapping concurrentiel"
    else:
        variables = query
    
    estimation_result = estimate_market_data.invoke({
        "context": context,
        "variables": variables
    })
    
    source_history.append({
        "step": 3,
        "source": "ESTIMATION",
        "status": "estimated"
    })
    
    state["estimation_result"] = {"content": estimation_result, "score": 0.5}
    state["final_source"] = "ESTIMATION"
    state["confidence_score"] = 0.5
    state["source_history"] = source_history
    state["has_numeric_data"] = True
    
    return state


def report_generation_node(state: AgentState) -> AgentState:
    """
    Node de génération de rapport : assemble les sections avec formatage
    """
    from langchain_openai import ChatOpenAI
    
    state["current_step"] = "report_generation"
    section = state.get("current_section", "")
    
    state["step_details"] = {
        "message": f"Génération du rapport pour {section}...",
        "section": section
    }
    
    llm = ChatOpenAI(
        model=Config.OPENAI_MODEL,
        temperature=0.3,
        api_key=Config.OPENAI_API_KEY
    )
    
    # Récupérer les résultats de la cascade
    if state.get("final_source") == "INTERNE":
        content = state.get("internal_result", {}).get("content", "")
    elif state.get("final_source") == "WEB":
        content = state.get("web_result", {}).get("content", "")
    elif state.get("final_source") == "SYNTHESE":
        content = state.get("synthesis_context", "")
    else:
        content = state.get("estimation_result", {}).get("content", "")
    
    # Nettoyer le contenu RAG pour éviter les répétitions
    # Si le contenu contient plusieurs chunks avec headers [Source: ...], on les consolide
    if state.get("final_source") == "INTERNE" and "[Source:" in content:
        # Extraire uniquement le contenu sans les headers répétitifs
        lines = content.split('\n')
        cleaned_lines = []
        skip_next = False
        for i, line in enumerate(lines):
            if line.strip().startswith('[Source:'):
                # Garder seulement le premier header de source
                if not any('[Source:' in prev_line for prev_line in cleaned_lines):
                    cleaned_lines.append(line)
                skip_next = False
            elif line.strip() == '---':
                # Ignorer les séparateurs entre chunks
                skip_next = True
            elif not skip_next:
                cleaned_lines.append(line)
        content = '\n'.join(cleaned_lines)
        # Ajouter un header de source unique au début
        if content and not content.startswith('[Source:'):
            source_match = content.split('\n')[0] if content else ""
            if '[Source:' in source_match:
                content = source_match + '\n\n' + '\n'.join(cleaned_lines[1:]) if len(cleaned_lines) > 1 else content
    
    # Prompt différencié selon la source
    final_source = state.get('final_source', 'UNKNOWN')
    confidence_score = state.get('confidence_score', 0.0)
    
    # Construire le prompt SANS f-strings pour éviter les problèmes d'accolades
    # LangChain requiert {{ }} pour les accolades littérales dans les templates
    
    graph_format_example = '```json\n{{"type": "pie", "title": "Titre", "data": {{"values": [55, 30, 15]}}, "labels": ["A", "B", "C"]}}\n```'
    
    if final_source == "INTERNE":
        system_prompt = """Tu es un consultant senior KPMG qui formate un rapport.

RÈGLE ABSOLUE : Tu NE DOIS PAS inventer de données. UNIQUEMENT les informations du contenu source.

Instructions strictes :
1. Extrais les données EXACTEMENT comme elles apparaissent
2. Cite les noms EXACTS (Nestlé Purina, Royal Canin, pas Acteur A/B)
3. Si une donnée n'est PAS dans la source, écris "Donnée non disponible"
4. NE PAS compléter avec tes connaissances générales

GRAPHIQUES : Génère un graphique UNIQUEMENT si tu as des DONNÉES CHIFFRÉES RÉELLES.
Format: """ + graph_format_example + """

Format de sortie :
- Titre de section
- Contenu structuré avec les VRAIES données
- Tableaux avec les VRAIS chiffres si présents
- 🟢 Source Interne
- Score de confiance: """ + str(round(confidence_score, 2))
    
    elif final_source == "WEB":
        system_prompt = """Tu es un consultant senior KPMG qui formate un rapport.

Instructions :
1. Utilise les DONNÉES RÉELLES du contenu source web
2. Tu peux ajouter du contexte explicatif autour des données
3. Cite les VRAIS chiffres et noms d'entreprises trouvés
4. NE PAS inventer de données si elles ne sont pas dans la source

GRAPHIQUES : Génère un graphique UNIQUEMENT si tu as des DONNÉES CHIFFRÉES RÉELLES.
Format: """ + graph_format_example + """

Format de sortie :
- Titre de section
- Contenu structuré avec données sourcées
- Tableaux avec données réelles si disponibles
- 🔵 Source Web
- Score de confiance: """ + str(round(confidence_score, 2))
    
    elif final_source == "SYNTHESE":
        # PROMPT pour les sections de SYNTHÈSE (Partie 3)
        system_prompt = """Tu es un consultant senior KPMG qui rédige une section de synthèse.

Cette section DOIT s'appuyer sur les données des sections précédentes du rapport.
Tu as accès aux données compilées des parties 1 et 2.

Instructions :
1. Synthétise les informations clés des sections précédentes
2. Mets en avant les chiffres importants (TAM, parts de marché, etc.)
3. Identifie les tendances et conclusions principales
4. Pour les risques : identifie les zones d'incertitude basées sur les scores de confiance faibles
5. Pour les leviers : propose des actions basées sur les opportunités identifiées
6. Pour les prochaines étapes : recommande des actions concrètes et si données insuffisantes, RECOMMANDE UN RDV EXPERT

NE PAS utiliser de formules mathématiques ou LaTeX. Utilise du texte simple.

GRAPHIQUES : Génère des graphiques récapitulatifs si pertinent.
Format: """ + graph_format_example + """

Format de sortie :
- Titre de section
- Contenu structuré basé sur les données des sections précédentes
- Points clés en bullet points
- Recommandations concrètes
- 🔵 Synthèse
- Score de confiance: """ + str(round(confidence_score, 2))
    
    else:  # ESTIMATION
        system_prompt = """Tu es un consultant senior KPMG qui formate un rapport basé sur des estimations.

Le contenu provient d'un modèle d'ESTIMATION avec des hypothèses méthodologiques.
IMPORTANT : Si des données internes sont fournies dans le contexte, utilise-les comme BASE pour tes estimations.

Instructions :
1. Formate les estimations de manière professionnelle
2. Présente les chiffres estimés clairement avec des calculs simples en texte (PAS de LaTeX)
3. Indique les hypothèses utilisées
4. Si une donnée interne existe (ex: TAM = 7 Md€), utilise-la plutôt que d'inventer

NE PAS utiliser de formules mathématiques LaTeX (pas de \\text, \\times, etc.). Utilise du texte simple.
Exemple correct : "27 millions x 50% = 13.5 millions" (pas de [, ], \\text)

GRAPHIQUES : Génère des graphiques pour visualiser les estimations.
Format: """ + graph_format_example + """

Format de sortie :
- Titre de section
- Contenu structuré avec les estimations chiffrées
- Calculs expliqués en texte simple
- Tableaux avec les valeurs estimées
- Graphiques pour visualiser les données
- 🟡 Estimation
- Score de confiance: """ + str(round(confidence_score, 2)) + """
- Hypothèses : liste des hypothèses clés"""
    
    # Le prompt user n'utilise PAS de variables LangChain, on passe tout en dur
    user_content = f"Section: {section}\nContenu source: {content}\n\nGénère la section formatée. RAPPEL: utilise UNIQUEMENT les données réelles du contenu source."
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", user_content)
    ])
    
    try:
        chain = prompt | llm
        # Pas de variables à passer car tout est déjà intégré dans le prompt
        formatted_section = chain.invoke({})
        formatted_content = formatted_section.content if hasattr(formatted_section, 'content') else str(formatted_section)
    except Exception as e:
        # En cas d'erreur, essayer de formater au moins le début du contenu
        error_msg = str(e)
        # Ne pas afficher le contenu source brut s'il est trop long ou contient des répétitions
        if len(content) > 500 or content.count('[Source:') > 1:
            # Extraire juste le début du contenu pour éviter les répétitions
            content_preview = content.split('\n\n---\n\n')[0] if '\n\n---\n\n' in content else content[:500]
            formatted_content = f"Erreur lors de la génération: {error_msg}\n\n[🟢 INTERNE] Contenu source (extrait):\n{content_preview}..."
        else:
            formatted_content = f"Erreur lors de la génération: {error_msg}\n\n[🟢 INTERNE] Contenu source:\n{content}"
    
    # Ajouter à la liste des sections complétées
    section_data = {
        "id": section,
        "title": section,
        "content": formatted_content,
        "source": state.get("final_source", "UNKNOWN"),
        "confidence_score": state.get("confidence_score", 0.0),
        "source_history": state.get("source_history", []),
        "can_deepen": True
    }
    
    completed = state.get("completed_sections", [])
    completed.append(section_data)
    state["completed_sections"] = completed
    
    report_sections = state.get("report_sections", [])
    report_sections.append(section_data)
    state["report_sections"] = report_sections
    
    # Mettre à jour l'index et la progression
    current_index = state.get("current_section_index", 0)
    sections = state.get("sections_to_process", [])
    total = state.get("total_sections", len(sections) if sections else 1)
    
    # Incrémenter l'index seulement si on n'a pas dépassé
    if current_index < len(sections):
        state["current_section_index"] = current_index + 1
    else:
        state["current_section_index"] = len(sections)
    
    # Mettre à jour la progression
    state["progress_percentage"] = min(1.0, (current_index + 1) / total) if total > 0 else 1.0
    state["total_sections"] = total
    
    return state


def expert_recommendation_node(state: AgentState) -> AgentState:
    """
    Node de détection d'incertitude et recommandation d'expert SPÉCIFIQUE AU MARCHÉ
    """
    from langchain_openai import ChatOpenAI
    from langchain.prompts import ChatPromptTemplate
    
    state["current_step"] = "expert_recommendation"
    state["step_details"] = {"message": "Analyse des zones d'incertitude..."}
    
    recommendations = []
    report_sections = state.get("report_sections", [])
    market_name = state.get("market_name", "")
    geography = state.get("geography", "")
    
    llm = ChatOpenAI(
        model=Config.OPENAI_MODEL,
        temperature=0.3,
        api_key=Config.OPENAI_API_KEY
    )
    
    for section in report_sections:
        confidence = section.get("confidence_score", 1.0)
        # Recommander un expert pour les sections avec score < 0.7 (pas seulement < 0.5)
        if confidence < 0.7:
            section_title = section.get('title', 'Unknown')
            source = section.get('source', 'UNKNOWN')
            
            system_msg = """Tu génères des recommandations d'expert pour les zones d'incertitude d'une étude de marché.

RÈGLE IMPORTANTE : L'expert recommandé doit être un SPÉCIALISTE DU MARCHÉ ÉTUDIÉ, pas un expert généraliste.

Pour chaque zone avec score < 0.5, génère :
1. **Profil d'expert du marché** :
   - Doit être un expert du secteur spécifique (ex: si marché Pet Care → expert industrie Pet Care/animalerie)
   - Exemples de profils : Directeur d'une entreprise du secteur, Analyste sectoriel spécialisé, Consultant spécialiste du marché, Responsable études de marché dans une entreprise leader
   - PAS un expert généraliste (pas "expert marketing", "expert comportement consommateur")

2. **Guide d'entretien structuré** :
   - 5-7 questions spécifiques au marché étudié
   - Questions sur les données manquantes de la section
   - Focus sur les insights terrain et données propriétaires"""
            
            user_msg = f"Section: {section_title}\nMarché étudié: {market_name}\nGéographie: {geography}\nScore de confiance: {confidence}\nSource utilisée: {source}\n\nGénère la recommandation d'expert SPÉCIFIQUE au marché {market_name}."
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_msg),
                ("user", user_msg)
            ])
            
            try:
                chain = prompt | llm
                recommendation = chain.invoke({})
                rec_content = recommendation.content if hasattr(recommendation, 'content') else str(recommendation)
                
                recommendations.append({
                    "section_id": section.get("id", ""),
                    "section_title": section.get("title", ""),
                    "recommendation": rec_content
                })
            except Exception as e:
                recommendations.append({
                    "section_id": section.get("id", ""),
                    "section_title": section.get("title", ""),
                    "recommendation": f"Erreur lors de la génération de recommandation: {str(e)}"
                })
    
    state["expert_recommendations"] = recommendations
    return state


def should_continue(state: AgentState) -> str:
    """
    Détermine si on doit continuer à traiter des sections ou terminer
    """
    sections = state.get("sections_to_process", [])
    completed = state.get("completed_sections", [])
    current_index = state.get("current_section_index", 0)
    
    # Vérifier si toutes les sections sont complétées
    # On utilise à la fois l'index et le nombre de sections complétées pour plus de robustesse
    if len(completed) >= len(sections) or current_index >= len(sections):
        return "expert_recommendation"
    else:
        return "process_section"


def create_workflow_graph():
    """
    Crée le graph LangGraph avec tous les nodes
    """
    workflow = StateGraph(AgentState)
    
    # Ajouter les nodes
    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("process_section", process_section_node)
    workflow.add_node("cascade_research", cascade_research_node)
    workflow.add_node("report_generation", report_generation_node)
    workflow.add_node("expert_recommendation", expert_recommendation_node)
    
    # Définir le flux
    workflow.set_entry_point("orchestrator")
    
    workflow.add_edge("orchestrator", "process_section")
    workflow.add_conditional_edges(
        "process_section",
        should_continue,
        {
            "process_section": "cascade_research",
            "expert_recommendation": "expert_recommendation"
        }
    )
    workflow.add_edge("cascade_research", "report_generation")
    workflow.add_edge("report_generation", "process_section")  # Loop pour traiter la section suivante
    workflow.add_edge("expert_recommendation", END)
    
    # Compiler le graph avec une limite de récursion plus élevée
    # (par défaut 25, on met 50 pour gérer jusqu'à 50 sections)
    app = workflow.compile()
    
    # Configurer la limite de récursion (si supporté par la version de LangGraph)
    try:
        # Certaines versions de LangGraph supportent checkpointer avec limite
        app = app.with_config({"recursion_limit": 50})
    except Exception:
        # Si la méthode n'existe pas, on continue sans
        pass
    
    return app
