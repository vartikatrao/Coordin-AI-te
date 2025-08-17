import difflib
from typing import Dict, Optional
from crewai_tools import tool
from app.core.config import settings

FSQ_API_KEY = settings.FSQ_API_KEY

# Static map of category names (lowercase) to integer IDs
CATEGORIES_CACHE: Dict[str, str] = {
    "restaurant": "13065",
    "cafe": "13032",
    "bar": "13003",
    "coffee shop": "13032",
    "fast food": "13145",
    "grocery store": "17069",
    "shopping": "17000",
    "hotel": "19014",
    "food": "13000",
    "pub": "13003",
    "grocery": "17069",
    "gas": "19006",
    "hospital": "15014",
    "pharmacy": "17057",
    "bank": "17002",
    "atm": "17002",
    "gym": "18021",
    "park": "16032",
    "outdoors": "16000",
    "nightlife": "10032",
    "museum": "10027",
    "airport": "19040",
    "train station": "19047",
    "office": "12058",
    "school": "12013",
    "library": "12057",
    "bakery": "13002",
    "pizza": "13064",
    "dessert": "13040",
}

@tool("Category Lookup Tool")
def category_lookup_tool(category_name: str) -> Optional[str]:
    """Looks up Foursquare category IDs for a given category name using fuzzy matching."""
    if not category_name:
        return None

    category_name = category_name.lower().strip()

    # Exact match
    if category_name in CATEGORIES_CACHE:
        return CATEGORIES_CACHE[category_name]

    # Fuzzy match
    closest = difflib.get_close_matches(
        category_name,
        CATEGORIES_CACHE.keys(),
        n=1,
        cutoff=0.6
    )

    if closest:
        matched_category = closest[0]
        print(f"DEBUG: Fuzzy matched '{category_name}' to '{matched_category}'")
        return CATEGORIES_CACHE[matched_category]

    return None

class CategoryTool:
    """Wrapper class for backward compatibility"""
    def __init__(self):
        self.tool = category_lookup_tool
    
    def _run(self, category_name: str) -> Optional[str]:
        return category_lookup_tool(category_name)

def get_popular_categories():
    """
    Returns a dictionary of popular category mappings for common queries.
    """
    return {
        "food": "13000",
        "restaurant": "13065",
        "cafe": "13032",
        "coffee": "13032",
        "bar": "13003",
        "pub": "13003",
        "shopping": "17000",
        "grocery": "17069",
        "hotel": "19014",
        "gas": "19006",
        "hospital": "15014",
        "pharmacy": "17057",
        "bank": "17002",
        "atm": "17002",
        "gym": "18021",
        "park": "16032",
        "nightlife": "10032",
        "museum": "10027",
    }