import json
from typing import Dict, List, Any
from crewai.tools import BaseTool


class ContextAnalyzerTool(BaseTool):
    name: str = "Context Analyzer"
    description: str = """
    Analyze places data and provide intelligent recommendations based on user context.
    This tool takes the extracted user intent and found places to generate personalized 
    recommendations with explanations and context-aware suggestions.
    
    Use this tool after getting places from Foursquare to provide intelligent analysis.
    """
    
    def _run(self, user_intent: str, places_data: str, current_time: str = None) -> str:
        """
        Analyze places data against user context and provide intelligent recommendations.
        """
        
        analysis_prompt = f"""
        You are an intelligent location recommendation system. Analyze the user intent and places data to provide personalized recommendations.
        
        User Intent (JSON): {user_intent}
        
        Found Places (JSON): {places_data}
        
        Current Time: {current_time}
        
        Please analyze and return a JSON response with the following structure:
        {{
            "recommendations": [
                {{
                    "place_name": "string",
                    "fsq_place_id": "string", 
                    "ranking_score": "number 1-10",
                    "why_recommended": "string - detailed explanation",
                    "best_for": "string - what makes it perfect for user's need",
                    "timing_advice": "string - when to visit based on context",
                    "additional_info": "string - any extra helpful details",
                    "tags": ["array of relevant tags like child-friendly, wifi, quiet, etc."]
                }}
            ],
            "overall_summary": "string - conversational summary of recommendations",
            "alternative_suggestions": "string - if no perfect matches, suggest alternatives",
            "contextual_tips": [
                "array of helpful tips based on user context and time"
            ]
        }}
        
        Analysis Guidelines:
        - Consider user's primary intent, group composition, budget, and time preferences
        - Rank places based on relevance to user needs, not just rating or distance
        - For family contexts, prioritize family-friendly venues and avoid inappropriate places
        - For study contexts, prioritize quiet environments, wifi availability, good seating
        - For entertainment contexts, consider timing and group dynamics
        - Explain WHY each place is recommended, don't just list features
        - Provide actionable timing advice (avoid rush hours, best days to visit, etc.)
        - Be conversational and helpful in explanations
        - If places don't match well, suggest modifications to search or alternative ideas
        
        Example good explanations:
        - "This library is perfect for studying as it offers quiet individual desks and has minimal foot traffic on Tuesday afternoons"
        - "This restaurant is ideal for family dinner as it has a kids menu, spacious seating, and a relaxed atmosphere that welcomes families"
        - "Given it's evening and you want fun activities, this entertainment center has multiple options and stays open late"
        
        Return only the JSON object, no additional text.
        """
        
        return analysis_prompt


def create_context_analyzer_tool():
    return ContextAnalyzerTool()