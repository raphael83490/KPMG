"""Estimation Tool for market data estimation"""
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from app.config import Config


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
    if not Config.OPENAI_API_KEY:
        return "Configuration OpenAI manquante."
    
    llm = ChatOpenAI(
        model=Config.OPENAI_MODEL,
        temperature=0.3,
        api_key=Config.OPENAI_API_KEY
    )
    
    # Déterminer le type d'estimation demandé
    is_sizing = any(kw in variables.lower() for kw in ['tam', 'sam', 'som', 'taille', 'sizing'])
    is_segmentation = 'segmentation' in variables.lower()
    is_market_share = any(kw in variables.lower() for kw in ['acteurs', 'parts de marché', 'market share'])
    
    if is_sizing:
        specific_instructions = """
Pour l'estimation de sizing (TAM/SAM/SOM), tu DOIS fournir :

TAM (Total Addressable Market) :
- Calcul bottom-up : Population cible × Taux de possession × Dépense moyenne
- Valeur en MILLIARDS D'EUROS avec 1 décimale (ex: 7.2 Md€)

SAM (Serviceable Available Market) :
- Portion du TAM accessible (ex: 60-80% du TAM pour un marché mature)
- Valeur en MILLIARDS D'EUROS

SOM (Serviceable Obtainable Market) :
- Part réalistement capturable (5-20% du SAM typiquement)
- Valeur en MILLIONS D'EUROS

Exemple de format attendu :
| Indicateur | Low | Base | High | Unité |
|------------|-----|------|------|-------|
| TAM | 6.5 | 7.2 | 8.0 | Md€ |
| SAM | 4.2 | 4.8 | 5.5 | Md€ |
| SOM | 210 | 290 | 380 | M€ |
"""
    elif is_segmentation:
        specific_instructions = """
Pour la segmentation, tu DOIS fournir :

Segments principaux avec POURCENTAGES (doivent sommer à 100%) :
- Segment 1 : XX% - description
- Segment 2 : YY% - description
- Etc.

Exemple de format attendu :
| Segment | Part de marché | Valeur estimée |
|---------|----------------|----------------|
| Alimentation | 55% | 3.8 Md€ |
| Santé & Soins | 25% | 1.7 Md€ |
| Accessoires | 15% | 1.0 Md€ |
| Services | 5% | 0.3 Md€ |
| TOTAL | 100% | 6.8 Md€ |
"""
    elif is_market_share:
        specific_instructions = """
Pour les parts de marché des acteurs, tu DOIS fournir :

Top 5-10 acteurs avec leurs PARTS DE MARCHÉ en % :
- Utilise des VRAIS NOMS d'entreprises connues du secteur
- PAS de "Acteur A", "Acteur B"
- Les pourcentages doivent être réalistes et sommer à ~100%

Exemple de format attendu :
| Acteur | Part de marché | Position |
|--------|----------------|----------|
| Nestlé Purina | 28% | Leader |
| Mars Petcare | 22% | #2 |
| Royal Canin | 12% | #3 |
| Autres | 38% | Fragmenté |
"""
    else:
        specific_instructions = """
Fournis des estimations chiffrées structurées avec :
- Valeurs numériques précises (pas de "quelques", "plusieurs")
- Unités claires (€, %, unités)
- Hypothèses explicites
"""
    
    system_msg = """Tu es un expert en modélisation économique et estimation de marchés.
Tu interviens lorsque la donnée directe est absente ou incomplète.

RÈGLES ABSOLUES :
1. Tu DOIS fournir des CHIFFRES PRÉCIS, pas des approximations vagues
2. Utilise des VRAIS NOMS d'entreprises connues du secteur, pas "Acteur A/B/C"
3. Chaque estimation doit avoir une hypothèse justifiée
4. Fournis des tableaux structurés avec valeurs numériques
5. Si des DONNÉES INTERNES sont fournies dans le contexte, UTILISE-LES comme base (ex: si TAM interne = 7 Md€, utilise cette valeur)
6. NE PAS utiliser de formules LaTeX (pas de \\text, \\times, [, ]). Utilise du texte simple.
   Exemple CORRECT : "27 millions x 50% = 13.5 millions de ménages"
   Exemple INCORRECT : "[27 \\text{ millions} \\times 50\\% = 13.5 \\text{ millions}]"

""" + specific_instructions + """

Approche méthodologique :
- Si données internes disponibles : les utiliser comme base de référence
- Bottom-up : Population x Taux x Valeur moyenne (en texte simple)
- Benchmarks sectoriels et analogies de marchés similaires
- Sanity checks avec comparaisons internationales
- Ranges low/base/high pour chaque estimation"""
    
    user_msg = f"Contexte: {context}\nVariables à estimer: {variables}\n\nGénère des estimations CHIFFRÉES et STRUCTURÉES."
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_msg),
        ("user", user_msg)
    ])
    
    try:
        chain = prompt | llm
        result = chain.invoke({})
        return result.content
    except Exception as e:
        return f"Erreur lors de l'estimation: {str(e)}"
