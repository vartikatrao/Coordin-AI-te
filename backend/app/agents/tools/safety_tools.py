from crewai.tools import BaseTool
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json

def compute_safety_score(place):
    """Dummy safety score for now (extend later)"""
    print("🛡️ [Safety Tool] Computing safety score...")
    # Basic fallback: closer places = safer
    distance = place.get("distance", 1000)
    return round(max(0.1, min(1.0, 1.0 - distance/10000)), 2)

class SafetyAssessmentTool(BaseTool):
    name: str = "SafetyAssessmentTool"
    description: str = "Assess safety aspects of venues and locations for group meetups"
    
    def _run(self, venue_data: str = None, group_data: str = None) -> str:
        """
        Assess safety aspects of venues and provide safety recommendations
        
        Args:
            venue_data: JSON string containing venue information
            group_data: JSON string containing group member information
            
        Returns:
            JSON string with safety assessment and recommendations
        """
        try:
            # Parse input data
            venues = json.loads(venue_data) if venue_data else []
            group_members = json.loads(group_data) if group_data else []
            
            safety_assessments = []
            
            for venue in venues:
                # Basic safety assessment
                safety_score = compute_safety_score(venue)
                
                # Extract safety-relevant information
                venue_assessment = {
                    "venue_id": venue.get("fsq_place_id", ""),
                    "venue_name": venue.get("name", "Unknown"),
                    "safety_score": safety_score,
                    "safety_factors": {
                        "distance_from_members": venue.get("distance", "unknown"),
                        "rating": venue.get("rating", 0),
                        "price_level": venue.get("price", 1),
                        "hours_available": bool(venue.get("hours")),
                        "has_contact_info": bool(venue.get("tel") or venue.get("website"))
                    },
                    "safety_recommendations": [],
                    "accessibility_features": venue.get("features", {})
                }
                
                # Add safety recommendations based on assessment
                recommendations = []
                
                if safety_score > 0.8:
                    recommendations.append("High safety rating - excellent choice for group meetup")
                elif safety_score > 0.6:
                    recommendations.append("Good safety rating - suitable for group meetup")
                elif safety_score > 0.4:
                    recommendations.append("Moderate safety rating - consider additional precautions")
                else:
                    recommendations.append("Lower safety rating - verify location and consider alternatives")
                
                # Check for group-specific safety considerations
                if len(group_members) > 6:
                    recommendations.append("Large group - verify venue capacity and noise policies")
                
                # Check for accessibility requirements
                accessibility_needed = any(
                    member.get("constraints", {}).get("accessibility") 
                    for member in group_members
                )
                if accessibility_needed:
                    if venue.get("features", {}).get("wheelchair_accessible"):
                        recommendations.append("Wheelchair accessible - meets accessibility requirements")
                    else:
                        recommendations.append("Accessibility requirements noted - verify venue accessibility")
                
                venue_assessment["safety_recommendations"] = recommendations
                safety_assessments.append(venue_assessment)
            
            # Overall group safety recommendations
            overall_recommendations = [
                "Share meeting location with trusted contacts",
                "Plan travel routes and check public transport options",
                "Keep emergency contacts readily available",
                "Verify venue is still open before traveling"
            ]
            
            # Add group-specific recommendations
            if len(group_members) >= 3:
                overall_recommendations.append("Consider designating a group coordinator for communication")
            
            if any(member.get("age", 20) < 18 for member in group_members):
                overall_recommendations.append("Minors in group - ensure appropriate supervision and safe venue choice")
            
            safety_report = {
                "venue_assessments": safety_assessments,
                "overall_safety_score": sum(v["safety_score"] for v in safety_assessments) / len(safety_assessments) if safety_assessments else 0,
                "group_safety_recommendations": overall_recommendations,
                "assessment_timestamp": "current",
                "group_size": len(group_members),
                "summary": f"Safety assessment completed for {len(safety_assessments)} venues and {len(group_members)} group members"
            }
            
            return json.dumps(safety_report, indent=2)
            
        except Exception as e:
            error_response = {
                "error": f"Safety assessment failed: {str(e)}",
                "status": "error",
                "fallback_recommendations": [
                    "Choose well-lit, public venues",
                    "Meet during daylight hours when possible",
                    "Share location with trusted contacts",
                    "Have emergency contacts available"
                ]
            }
            return json.dumps(error_response, indent=2)
