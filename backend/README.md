# Coordin-AI-te Backend Setup

## Prerequisites
- Python 3.8+ (recommended: Python 3.11+)
- pip or pipenv
- Virtual environment (recommended)
- Firebase service account key
- Required API keys (see Environment Variables section)

## 🚀 Setup Instructions

### Step 1: Clone and Navigate
```bash
git clone https://github.com/your-username/Coordin-AI-te.git
cd Coordin-AI-te/backend
```

### Step 2: Create Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Environment Configuration

1. **Create Environment File**:
```bash
cp env.example .env
```

2. **Configure Environment Variables**:
```bash
# .env file configuration

# Firebase Configuration
FIREBASE_CREDENTIALS=path/to/your/firebase-service-key.json
FIREBASE_WEB_API_KEY=your_firebase_web_api_key

# AI API Keys
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash-exp

# Foursquare API (for location data)
FSQ_API_KEY=your_foursquare_api_key

# Default Location (Bangalore coordinates as example)
DEFAULT_LAT=12.9716
DEFAULT_LNG=77.5946

# Debug Configuration
CONFIRM_BEFORE_SEARCH=true
DEBUG_AGENT_LOGS=true

# App Configuration
APP_NAME=Coordin-AI-te Backend
APP_ENV=development
```

### Step 5: Firebase Service Account Setup

1. **Get Firebase Service Account**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Place it in your backend directory
   - Update `FIREBASE_CREDENTIALS` in `.env` with the file path

2. **Get Firebase Web API Key**:
   - Go to Firebase Console → Project Settings → General
   - Copy the "Web API Key"
   - Add it to `FIREBASE_WEB_API_KEY` in `.env`

### Step 6: API Keys Setup

**Google Gemini API**:
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Add to `GEMINI_API_KEY` in `.env`

**Foursquare API**:
1. Go to [Foursquare Developer Portal](https://developer.foursquare.com/)
2. Create an app and get API key
3. Add to `FSQ_API_KEY` in `.env`

### Step 7: Run the Application

```bash
# Development server with auto-reload
python run.py

# Alternative: Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 8: Verify Setup

1. **Check Health Endpoint**:
```bash
curl http://localhost:8000/health
```

2. **Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX T XX:XX:XX",
  "version": "1.0.0"
}
```

3. **Check API Documentation**:
   - Visit: `http://localhost:8000/docs`
   - Interactive Swagger UI with all endpoints

## 📋 API Endpoints Documentation

### 🤖 AI Assistant (`/api/ai/`)

#### `POST /api/ai/solo-recommendations`
**Description**: Get AI-powered personalized location recommendations for individual users

**Request Body**:
```json
{
  "user_preferences": {
    "mood": "relaxed",
    "budget": "moderate",
    "cuisine": ["indian", "italian"]
  },
  "current_location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "context": {
    "time_of_day": "afternoon",
    "purpose": "casual dining"
  }
}
```

**Response**:
```json
{
  "recommendations": [
    {
      "place_id": "abc123",
      "name": "Cozy Corner Cafe",
      "confidence_score": 0.92,
      "reasoning": "Perfect for your relaxed mood...",
      "distance": "0.5km"
    }
  ],
  "status": "success"
}
```

#### `POST /api/ai/group-meetup`
**Description**: Find optimal meeting locations for groups

**Request Body**:
```json
{
  "group_members": [
    {
      "user_id": "user1",
      "location": {"latitude": 12.9716, "longitude": 77.5946},
      "preferences": ["quiet", "good-wifi"]
    }
  ],
  "meetup_preferences": {
    "purpose": "work meeting",
    "duration": "2 hours"
  }
}
```

#### `POST /api/ai/proactive-alert`
**Description**: Get context-aware proactive location alerts

---

### 👤 Solo Mode (`/api/v1/solo/`)

#### `POST /api/v1/solo/query`
**Description**: Process natural language queries for place recommendations

**Request Body**:
```json
{
  "query": "I want a quiet coffee shop near me",
  "user_id": "user123",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  }
}
```

#### `POST /api/v1/solo/place-details`
**Description**: Get detailed information about specific places

#### `GET /api/v1/solo/examples`
**Description**: Get example queries for the solo mode

#### `GET /api/v1/solo/supported-intents`
**Description**: Get list of supported query intents

#### `POST /api/v1/solo/generate-title`
**Description**: Generate conversation titles based on user queries

---

### 👥 Group Mode (`/api/v1/group/`)

#### `POST /api/v1/group/coordinate`
**Description**: Find optimal meeting locations for groups with advanced coordination

**Request Body**:
```json
{
  "group_data": {
    "members": [
      {
        "user_id": "user1",
        "location": {"lat": 12.9716, "lng": 77.5946},
        "preferences": ["budget-friendly", "outdoor-seating"]
      }
    ],
    "meetup_type": "casual dining",
    "time_preference": "evening"
  }
}
```

#### `GET /api/v1/group/health`
**Description**: Health check for group coordination services

#### `POST /api/v1/group/test`
**Description**: Test endpoint for group coordination functionality

---

### 🔧 Personalization (`/api/personalization/`)

#### `POST /api/personalization/learn-preferences`
**Description**: Learn and update user preferences from behavior

**Request Body**:
```json
{
  "user_id": "user123",
  "interaction_data": {
    "clicked_places": ["place1", "place2"],
    "search_queries": ["coffee near me"],
    "time_spent": {"place1": 300}
  }
}
```

#### `POST /api/personalization/routine-analysis`
**Description**: Analyze user routines and patterns

#### `POST /api/personalization/contextual-suggestions`
**Description**: Get context-aware personalized suggestions

#### `GET /api/personalization/user-insights/{user_id}`
**Description**: Get AI-generated insights about user preferences

---

### 🛡️ Safety (`/api/safety/`)

#### `POST /api/safety/safe-route`
**Description**: Get safe route recommendations

**Request Body**:
```json
{
  "start_location": {"latitude": 12.9716, "longitude": 77.5946},
  "end_location": {"latitude": 12.9750, "longitude": 77.6000},
  "time_of_travel": "night",
  "user_preferences": {
    "avoid_areas": ["area1"],
    "prefer_well_lit": true
  }
}
```

#### `POST /api/safety/area-safety`
**Description**: Assess safety levels of specific areas

#### `POST /api/safety/safety-alerts`
**Description**: Get proactive safety alerts

#### `POST /api/safety/emergency-coordination`
**Description**: Emergency contact coordination

#### `GET /api/safety/safety-tips`
**Description**: Get general safety tips and guidelines

---

### 📍 Location Search (`/api/location/`)

#### `GET /api/location/search`
**Description**: Search for locations with various filters

**Query Parameters**:
- `query`: Search term
- `latitude`: Current latitude
- `longitude`: Current longitude
- `radius`: Search radius in meters
- `category`: Place category filter

#### `GET /api/location/popular-locations`
**Description**: Get popular locations in an area

#### `GET /api/location/nearby`
**Description**: Get nearby places based on current location

---

### 🔐 Authentication (`/api/auth/`)

#### `GET /api/auth/me`
**Description**: Get current authenticated user information

---

### 📄 Solo Page (`/api/v1/solo-page/`)

#### `POST /api/v1/solo-page/preferences`
**Description**: Handle user preferences for solo page

#### `POST /api/v1/solo-page/generate-title`
**Description**: Generate titles for solo page conversations

#### `GET /api/v1/solo-page/examples`
**Description**: Get examples for solo page functionality

---

### 🏥 Health & Utility

#### `GET /health`
**Description**: Application health check

#### `GET /test`
**Description**: General test endpoint

#### `GET /`
**Description**: Root endpoint with API information

## 🔧 Troubleshooting

### Common Issues

1. **Import Error for Firebase**:
```bash
# Make sure firebase-admin is installed
pip install firebase-admin
```

2. **Environment Variables Not Loading**:
```bash
# Ensure .env file is in backend root directory
# Check file permissions
ls -la .env
```

3. **API Key Issues**:
```bash
# Test individual API keys
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.service.com/test
```

4. **Port Already in Use**:
```bash
# Find process using port 8000
lsof -i :8000
# Kill the process
kill -9 PID
```

### Development Tips

1. **Enable Debug Logging**:
```bash
# In .env file
DEBUG_AGENT_LOGS=true
```

2. **Test API Endpoints**:
```bash
# Use curl or Postman
curl -X POST http://localhost:8000/health
```

3. **Monitor Logs**:
```bash
# Run with verbose logging
python run.py --log-level debug
```
