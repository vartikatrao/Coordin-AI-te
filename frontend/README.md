# Coordin-AI-te

**Coordinate better. Meet faster. Travel safer.**

## Description

Coordin-AI-te is an AI-powered location coordination and recommendation platform that helps users discover places and coordinate meetups intelligently. The application features advanced AI agents, personalized recommendations, and smart group coordination capabilities to enhance your location-based experiences.

## Tech Stack

**Frontend:**
- Next.js (React framework)
- Chakra UI (Component library and styling)
- Redux Toolkit (State management)
- Firebase (Authentication and real-time database)
- React Google Maps API (Location services)
- React Icons & React Markdown

**Backend:**
- FastAPI (Python web framework)
- CrewAI (Multi-agent AI framework)
- Google Generative AI (Gemini models)
- Foursquare API (Place data and recommendations)
- Firebase Admin SDK (Authentication)
- ChromaDB (Vector database for embeddings)
- OpenAI & LiteLLM (AI model integration)

## Features

### 🤖 AI-Powered Modes

**Solo Mode - Personal AI Concierge**
- Hyperlocal smart assistant for individual recommendations
- Mood-based location suggestions (happy, tired, productive, etc.)
- Routine-based recommendations (morning coffee, workout, lunch)
- Context-aware suggestions based on time, weather, and location
- Advanced filtering (budget, atmosphere, features, radius)
- Real-time personalized place discovery

**Group Mode - Smart Meetup Coordination**
- Equidistant meetup finder for optimal group locations
- AI-powered group preferences analysis
- Real-time group chat with polls and voting
- Friend discovery and invitation system
- Collaborative decision-making tools

### 🔐 Authentication & Security
- Firebase Authentication with multiple methods:
  - Google OAuth
  - Email/Password
  - Phone OTP verification
- Secure user sessions and data protection

### 🎯 Smart Features

**Location Intelligence:**
- Real-time location detection and search
- Foursquare-powered place database
- Distance-based recommendations
- Safety route suggestions

**Personalization:**
- AI learns from user behavior and preferences
- Customizable daily routines
- Mood tracking and adaptation
- Context-aware proactive suggestions

**Group Coordination:**
- Real-time messaging and polls
- Optimal meeting point calculations
- Group preference analysis
- Collaborative filtering and voting

### 📱 User Experience
- Modern, responsive UI with Chakra UI
- Real-time updates and notifications
- Comprehensive error handling with toast notifications
- Progressive web app capabilities
- Mobile-optimized interface

## Installation & Setup

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- Firebase project
- Foursquare API key
- Google AI API key

### Frontend Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/Coordin-AI-te.git
cd Coordin-AI-te/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Create .env.local file with your Firebase config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

4. Run the development server:
```bash
npm run dev
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
# Copy env.example to .env and fill in your API keys
cp env.example .env
# Edit .env with your:
# - FOURSQUARE_API_KEY
# - GOOGLE_AI_API_KEY
# - FIREBASE credentials
```

5. Run the backend server:
```bash
uvicorn main:app --reload
```

## API Endpoints

### Solo Mode API (`/api/v1/solo/`)
- `POST /query` - Process natural language queries for place recommendations
- `POST /place-details` - Get detailed information about specific places
- `GET /examples` - Get example queries
- `GET /supported-intents` - Get supported intent categories

### Group Mode API (`/api/v1/group/`)
- `POST /coordinate` - Find optimal meeting locations for groups
- `POST /quick-coordinate` - Quick group coordination
- `POST /analyze-preferences` - Analyze group preferences

### AI Assistant API (`/api/ai/`)
- `POST /solo-recommendations` - Get AI-powered solo recommendations
- `POST /group-meetup` - Generate group meetup suggestions
- `POST /proactive-alert` - Context-aware proactive alerts

## Project Structure

```
Coordin-AI-te/
├── frontend/           # Next.js React application
│   ├── components/     # Reusable UI components
│   ├── pages/         # Next.js pages and API routes
│   ├── redux/         # State management
│   └── services/      # API service functions
├── backend/           # FastAPI Python application
│   ├── app/
│   │   ├── agents/    # AI agents (Solo, Group)
│   │   ├── api/       # API route handlers
│   │   ├── core/      # Configuration and utilities
│   │   └── routers/   # FastAPI routers
│   └── requirements.txt
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- CrewAI for the multi-agent framework
- Foursquare for location data
- Google AI for intelligent recommendations
- Firebase for real-time capabilities
