from typing import Dict
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings
from app.agents.tools.categories_tool import CategoryTool
import json

llm = ChatGoogleGenerativeAI(
    model=settings.GEMINI_MODEL,
    google_api_key=settings.GEMINI_API_KEY,
    temperature=0.1,
    max_tokens=8000
)

class QueryNormalizationTool:
    name: str = "Query Normalization Tool"
    description: str = "Normalizes user queries using Gemini LLM to extract purpose, category IDs, budget, and attributes."

    def _run(self, query: str) -> Dict:
        try:
            prompt = f"""
            Analyze the user query: "{query}"
            Extract the following:
            - purpose: The main intent (e.g., "coffee shop", "restaurant").
            - category_name: Best Foursquare category match.
            - budget: One of "affordable", "mid-range", "premium", or "unknown".
            - attributes: List of Foursquare attributes (e.g., ["wifi", "outdoor_seating"]).

            Return a JSON object with these fields. If unclear, make reasonable assumptions or use defaults.
            Example output: 
            {{
                "query": "coffee shop",
                "category_ids": ["13032"],
                "budget": "affordable",
                "attributes": ["wifi"]
            }}
            """
            response = llm.invoke(prompt)
            result = response.content if hasattr(response, 'content') else str(response)

            try:
                parsed = json.loads(result)
            except json.JSONDecodeError:
                parsed = {
                    "query": query,
                    "category_ids": [CategoryTool()._run(query)] if CategoryTool()._run(query) else [],
                    "budget": "unknown",
                    "attributes": []
                }
                print(f"DEBUG: Fallback parsing for query '{query}': {parsed}")

            if not parsed.get("category_ids") and parsed.get("query"):
                category_id = CategoryTool()._run(parsed["query"])
                if category_id:
                    parsed["category_ids"] = [category_id]

            return parsed

        except Exception as e:
            print(f"Query normalization failed: {e}")
            return {
                "query": query,
                "category_ids": [CategoryTool()._run(query)] if CategoryTool()._run(query) else [],
                "budget": "unknown",
                "attributes": []
            }

def normalize_query_with_llm(query: str) -> Dict:
    return QueryNormalizationTool()._run(query)