# Coordin-AI-te Backend

This FastAPI backend extends your existing Zomato clone frontend with AI-powered features for Coordin-AI-te.

## What This Backend Does

**It extends your existing functionality, it doesn't replace it:**

- ✅ **Keeps your Firebase auth** - no changes needed
- ✅ **Keeps your existing frontend** - all screens and features intact
- ✅ **Keeps your existing location search** - extends it with AI
- ✅ **Keeps your existing profile system** - adds personalization

## New AI Features Added

### 1. Solo Mode - Hyperlocal Smart Assistant
- **Endpoint**: `POST /api/ai/solo-recommendations`
- **What it does**: Enhances your existing venue search with AI-powered personalization
- **Example**: "It's 4PM, your usual café is full. Try the quieter one 3 mins away?"

### 2. Group Mode - Equidistant Meetup Finder
- **Endpoint**: `POST /api/ai/group-meetup`
- **What it does**: Finds optimal meeting points for groups using your existing venue data
- **Example**: "Found the perfect spot - 18 mins from each of you, matches your vibe!"

### 3. Personalization & Learning
- **Endpoint**: `POST /api/personalization/learn-preferences`
- **What it does**: Learns from user behavior to improve recommendations
- **Example**: Analyzes search patterns, clicks, and preferences

### 4. Safety Features
- **Endpoint**: `POST /api/safety/safe-route`
- **What it does**: Creates safe route recommendations using your location data
- **Example**: "Your usual route home has 3 closed shops tonight. Taking Oak Street instead."

## How to Use

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Environment Variables
```bash
cp env.example .env
# Edit .env with your API keys
```

### 3. Run the Backend
```bash
uvicorn main:app --reload
```

### 4. Integrate with Frontend
The backend runs on `http://localhost:8000` and your frontend can call these endpoints to enhance the existing functionality.

## API Endpoints

### AI Assistant (`/api/ai`)
- `POST /solo-recommendations` - Enhanced solo recommendations
- `POST /group-meetup` - Group meetup optimization
- `POST /proactive-alert` - Context-aware alerts

### Personalization (`/api/personalization`)
- `POST /learn-preferences` - Learn from user behavior
- `POST /routine-analysis` - Analyze user routines
- `POST /contextual-suggestions` - Context-aware suggestions
- `GET /user-insights/{user_id}` - AI-generated insights

### Safety (`/api/safety`)
- `POST /safe-route` - Safe route finding
- `POST /area-safety` - Area safety assessment
- `POST /safety-alerts` - Proactive safety alerts
- `POST /emergency-coordination` - Emergency contact coordination
- `GET /safety-tips` - General safety tips

## Integration with Existing Frontend

This backend is designed to work alongside your existing frontend:

1. **Keep all existing Firebase auth** - no changes needed
2. **Keep all existing components** - just add new API calls
3. **Enhance existing search** - add AI recommendations
4. **Extend existing profile** - add personalization features
5. **Add safety features** - enhance location services

## Example Frontend Integration

```javascript
// In your existing frontend, add calls to the backend
const getAIRecommendations = async (userPreferences, location) => {
  const response = await fetch('http://localhost:8000/api/ai/solo-recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      preferences: userPreferences,
      current_location: location,
      time_of_day: 'afternoon'
    })
  });
  return response.json();
};
```

## What You Get

- **AI-powered recommendations** that learn from user behavior
- **Group coordination** features for meetups
- **Safety features** for route planning
- **Personalization** that improves over time
- **All existing functionality** preserved and enhanced

This backend makes your app smarter without changing what already works!
