# Frontend-Backend Integration Guide

This document describes the integration between the frontend and backend for Solo Mode and Group Mode features.

## Overview

The integration connects the React frontend with the FastAPI backend to provide AI-powered location recommendations and group coordination features.

## Backend Endpoints

### Solo Mode API (`/api/v1/solo/`)

- **POST `/query`** - Process natural language queries for place recommendations
- **POST `/place-details`** - Get detailed information about specific places
- **GET `/examples`** - Get example queries that work well with the system
- **GET `/supported-intents`** - Get list of supported intent categories

### Group Mode API (`/api/ai/`)

- **POST `/group-meetup`** - Find optimal meeting locations for groups
- **POST `/solo-recommendations`** - Get AI-powered solo recommendations
- **POST `/proactive-alert`** - Generate proactive alerts based on user context

## Frontend Components

### Solo Mode

**File**: `frontend/pages/solo-mode.jsx`
**Component**: `frontend/components/SoloMode/SoloMode.jsx`

**Features**:
- Chat Mode: Natural language queries to AI assistant
- Structured Mode: Form-based search with specific parameters
- Real-time AI recommendations
- Integration with backend solo agent

**API Integration**:
```javascript
import { soloModeAPI } from '@/services/api';

// Process natural language query
const result = await soloModeAPI.processQuery(
  "Find coffee shops near me",
  "12.9716,77.5946",
  { purpose: "coffee", mood: "casual" }
);
```

### Group Mode

**File**: `frontend/pages/group-mode.jsx`
**Component**: `frontend/components/GroupMode/GroupMode.jsx`

**Features**:
- User discovery and group creation
- AI-powered group recommendations
- Location finding for optimal meetup points
- Group chat functionality

**API Integration**:
```javascript
import { groupModeAPI } from '@/services/api';

// Find optimal group meetup location
const result = await groupModeAPI.findGroupMeetup(
  groupMembers,
  "social",
  5,
  "Indiranagar"
);
```

### Location Finder

**Component**: `frontend/components/GroupMode/LocationFinder.jsx`

**Features**:
- AI-powered location recommendations
- Integration with both group and solo APIs
- Meeting type and location preferences
- Real-time search results

## API Service Layer

**File**: `frontend/services/api.js`

Centralized service for all backend API calls with:
- Error handling
- Consistent response formatting
- Base URL configuration
- Health checks

## Integration Points

### 1. Solo Mode Flow

1. User enters query in chat mode or fills structured form
2. Frontend calls `soloModeAPI.processQuery()`
3. Backend processes query using AI agents
4. Returns structured recommendations
5. Frontend displays results with explanations

### 2. Group Mode Flow

1. User creates group with members and purpose
2. Frontend calls `groupModeAPI.findGroupMeetup()`
3. Backend analyzes group needs and finds optimal locations
4. Returns AI recommendations and meetup plan
5. Frontend stores recommendations and displays to group

### 3. Location Finding Flow

1. Group selects meeting type and location preferences
2. Frontend calls both group and solo APIs for comprehensive results
3. Backend provides AI-optimized recommendations
4. Frontend displays results with context and explanations

## Configuration

### Backend URL

The backend URL is configured in `frontend/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8000';
```

### CORS

Backend is configured to allow frontend requests from:
- `http://localhost:3000`
- `http://localhost:3001`

## Error Handling

- Network errors are caught and displayed to users
- API errors include detailed error messages
- Fallback behavior when AI services are unavailable
- Graceful degradation for missing features

## Testing

### Backend Health Check

```javascript
import { healthCheck } from '@/services/api';

const isHealthy = await healthCheck();
console.log('Backend healthy:', isHealthy);
```

### API Test Endpoint

```javascript
import { testAPI } from '@/services/api';

const testResult = await testAPI();
console.log('Test result:', testResult);
```

## Dependencies

### Frontend
- React with Chakra UI
- Redux for state management
- Firebase for authentication and data storage

### Backend
- FastAPI with Python
- CrewAI for AI agent orchestration
- OpenAI/Gemini for LLM integration
- Foursquare API for location data

## Development Workflow

1. **Backend Development**: Update AI agents and API endpoints
2. **Frontend Integration**: Update API service calls and UI components
3. **Testing**: Test both individual components and full user flows
4. **Deployment**: Deploy backend first, then frontend

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS settings include frontend URLs
2. **API Timeouts**: Check backend response times and frontend timeout settings
3. **AI Service Failures**: Implement fallback behavior for when AI services are down
4. **Data Format Mismatches**: Ensure frontend and backend use consistent data structures

### Debug Tools

- Browser Network tab for API call inspection
- Backend logs for server-side debugging
- Frontend console for client-side errors
- API documentation at `/docs` endpoint

## Future Enhancements

- Real-time updates using WebSockets
- Offline support with service workers
- Advanced AI features like learning user preferences
- Integration with additional location services
- Mobile app development
