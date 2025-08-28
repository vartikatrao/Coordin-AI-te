from crewai import Task
from typing import List, Dict, Any

def create_group_coordination_tasks(agents: Dict) -> List[Task]:
    """Create all tasks for group coordination workflow"""
    
    # Task 1: Analyze Group Requirements
    analyze_requirements_task = Task(
        description="""
        Analyze the group meetup requirements by examining:
        1. Group member locations and calculate optimal meeting zones
        2. Individual preferences and constraints from all members
        3. Meeting purpose and extract relevant venue categories
        4. Time constraints and availability patterns
        5. Budget considerations across the group
        6. Accessibility requirements from constraints
        
        Input: Group members data with their locations, preferences, constraints, and meeting purpose
        
        Extract key insights like:
        - Geographic centroid for optimal meeting location
        - Common preferences vs conflicting needs
        - Critical constraints that must be respected
        - Venue type requirements based on meeting purpose
        
        Output: Structured analysis of group requirements and meeting parameters
        """,
        agent=agents["requirements_analyzer"],
        expected_output="JSON object with analyzed group requirements, geographic insights, and meeting parameters"
    )
    
    # Task 2: Search and Filter Venues  
    venue_search_task = Task(
        description="""
        Using the analyzed group requirements, search for suitable venues:
        1. Use Foursquare API to search venues near the optimal meeting location
        2. Filter venues based on meeting purpose and group preferences
        3. Calculate travel distances and times for each group member
        4. Estimate venue capacity suitability for group size
        5. Gather complete venue information (address, contact, photos, hours)
        6. Apply preference matching and constraint filtering
        
        Focus on finding venues that:
        - Are accessible and suitable for the group size
        - Match the meeting purpose (dining, coffee, study, etc.)
        - Have reasonable travel times for all members
        - Meet accessibility and other constraint requirements
        
        Return top venue candidates with complete details and travel analysis.
        """,
        agent=agents["venue_finder"],
        expected_output="JSON array of venue recommendations with complete details, travel info, and suitability scores",
        context=[analyze_requirements_task]
    )
    
    # Task 3: Safety Assessment
    safety_assessment_task = Task(
        description="""
        Perform comprehensive safety assessment for the recommended venues:
        1. Evaluate venue safety based on current time of day
        2. Check for nearby emergency services (hospitals, police, fire stations)
        3. Identify currently open venues in the surrounding area
        4. Calculate safety scores considering multiple factors
        5. Assess venue ratings and operational status
        6. Generate safety recommendations for each venue
        
        Consider:
        - Time-based safety factors (day vs night)
        - Proximity to emergency services
        - Activity level in the area (open venues nearby)
        - Venue ratings and reviews
        - Current operational status
        
        Provide safety scores and recommendations for informed decision-making.
        """,
        agent=agents["safety_assessor"], 
        expected_output="JSON object with safety assessments, scores, and recommendations for each venue",
        context=[venue_search_task]
    )
    
    # Task 4: Optimize and Rank Venues
    optimization_task = Task(
        description="""
        Optimize venue selection and create final rankings:
        1. Calculate fairness scores based on travel time variance
        2. Balance travel convenience with preference matching
        3. Factor in safety scores and venue quality ratings
        4. Consider group dynamics and meeting purpose fit
        5. Apply weighted scoring for final recommendations
        6. Select top 3 venues with clear justification
        
        Optimization criteria:
        - Minimize maximum travel time (minimax approach)
        - Reduce travel time variance for fairness
        - Prioritize safety and venue quality
        - Match group preferences and meeting purpose
        - Ensure accessibility compliance
        
        Rank venues and provide clear reasoning for recommendations.
        """,
        agent=agents["optimizer"],
        expected_output="JSON object with ranked venue recommendations and optimization reasoning",
        context=[analyze_requirements_task, venue_search_task, safety_assessment_task]
    )
    
    # Task 5: Generate Personalized Recommendations
    personalization_task = Task(
        description="""
        Create personalized explanations and recommendations for each group member:
        1. Generate individual explanations for why each venue works for them
        2. Highlight how their preferences are addressed
        3. Explain travel logistics (time, distance, transport options)  
        4. Address their specific constraints and requirements
        5. Provide safety context relevant to their concerns
        6. Suggest optimal transport modes and timing
        
        For each member, explain:
        - Why this venue matches their stated preferences
        - How their constraints are accommodated
        - Travel time and distance from their location
        - Safety considerations for their journey
        - Specific amenities that appeal to them
        - Budget alignment and value proposition
        
        Make each explanation personal, relevant, and actionable.
        """,
        agent=agents["personalizer"],
        expected_output="JSON object with personalized recommendations and explanations for each group member",
        context=[analyze_requirements_task, optimization_task, safety_assessment_task]
    )
    
    # Task 6: Final Coordination Summary
    coordination_summary_task = Task(
        description="""
        Create comprehensive coordination summary for the group meetup:
        1. Present top 3 venue recommendations with complete details
        2. Include personalized explanations for each group member
        3. Provide clear meeting logistics and coordination info
        4. Summarize safety assessments and recommendations
        5. Include backup options and contingency planning
        6. Format everything for easy group decision-making
        
        Final output should include:
        - Executive summary of recommendations
        - Detailed venue information (address, contact, photos, hours)
        - Individual member explanations and travel info
        - Safety scores and recommendations
        - Practical coordination details
        - Decision-making guidance for the group
        
        Present information in a clear, actionable format that helps the group coordinate effectively.
        """,
        agent=agents["coordinator"],
        expected_output="Complete JSON coordination package with recommendations, personalization, and logistics",
        context=[analyze_requirements_task, optimization_task, safety_assessment_task, personalization_task]
    )
    
    return [
        analyze_requirements_task,
        venue_search_task, 
        safety_assessment_task,
        optimization_task,
        personalization_task,
        coordination_summary_task
    ]

def create_quick_coordination_tasks(agents: Dict) -> List[Task]:
    """Create simplified tasks for quick coordination (faster processing)"""
    
    # Quick Analysis Task
    quick_analysis_task = Task(
        description="""
        Perform rapid analysis of group coordination needs:
        1. Calculate geographic centroid from member locations
        2. Extract key preferences and critical constraints
        3. Determine venue category requirements from meeting purpose
        4. Identify must-have features and deal-breakers
        
        Focus on essential requirements for quick venue matching.
        """,
        agent=agents["requirements_analyzer"],
        expected_output="Concise JSON with essential group requirements and meeting parameters"
    )
    
    # Quick Venue Search Task
    quick_venue_task = Task(
        description="""
        Search and evaluate venues efficiently:
        1. Search Foursquare API with targeted parameters
        2. Calculate travel times for all members
        3. Filter by critical constraints and preferences
        4. Select top 3 candidates quickly
        
        Prioritize speed while maintaining quality recommendations.
        """,
        agent=agents["venue_finder"],
        expected_output="JSON array with 3 venue recommendations and basic travel analysis",
        context=[quick_analysis_task]
    )
    
    # Quick Personalization Task
    quick_personalization_task = Task(
        description="""
        Generate brief personalized explanations:
        1. Create concise explanations for each member
        2. Focus on key benefits and travel logistics
        3. Address main preferences and constraints
        4. Keep explanations short but informative
        
        Provide essential personalization without extensive detail.
        """,
        agent=agents["personalizer"],
        expected_output="JSON with brief personalized explanations for each member",
        context=[quick_analysis_task, quick_venue_task]
    )
    
    return [
        quick_analysis_task,
        quick_venue_task,
        quick_personalization_task
    ]