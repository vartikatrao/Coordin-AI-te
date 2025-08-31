# Coordin-AI-te

An AI-powered location coordination platform that solves the everyday challenge of deciding where to go, meet, and explore.

## 🎯 Problems We Solve

### 1. Decision Fatigue
- **The Problem**: People spend 15-30 minutes daily deciding where to go, eat, or meet
- **Current Solutions**: Existing apps are reactive and don't proactively suggest places
- **Our Approach**: AI-driven proactive recommendations based on context and preferences

### 2. Context Blindness
- **The Problem**: Existing apps ignore crucial context like:
  - Purpose of the visit
  - Time constraints
  - Group dynamics
  - Real-world factors (safety, accessibility)
- **Our Solution**: Context-aware recommendations that consider all relevant factors

### 3. Lack of Learning
- **The Problem**: Apps don't learn from user behavior:
  - No memory of user preferences
  - Don't remember successful meetups
  - Fail to adapt to routines and patterns
- **Our Innovation**: Machine learning that continuously adapts to user preferences and patterns

### 4. Group Coordination Chaos
- **The Problem**: Finding meeting places leads to:
  - Endless group chats
  - Unfair travel distances
  - Cancelled plans
  - **Statistic**: 73% of meetups fail due to location coordination issues
- **Our Solution**: Intelligent group coordination that finds optimal meeting points for everyone

## 🚀 Features

- **Solo Mode**: Personalized AI recommendations for individual users
- **Group Mode**: Smart group coordination and meeting point optimization
- **Context-Aware AI**: Considers time, purpose, preferences, and real-world constraints
- **Learning Algorithm**: Continuously improves recommendations based on user behavior
- **Real-time Coordination**: Seamless group chat and decision-making tools

## 🚀 Quick Setup

### Option 1: Automated Setup
```bash
git clone https://github.com/vartikatrao/Coordin-AI-te.git
cd Coordin-AI-te
./quick-setup.sh
```

### Option 2: Manual Setup
See [SETUP.md](SETUP.md) for detailed instructions.

### Required API Keys
- **Foursquare API**: Get from https://developer.foursquare.com/
- **Google Gemini AI**: Get from https://ai.google.dev/

## 🛠️ Technology Stack

### Backend
- Python with FastAPI
- AI/ML integration for intelligent recommendations
- Firebase Authentication
- Real-time WebSocket connections

### Frontend
- Next.js React application
- Redux for state management
- Modern, responsive UI design

## 📱 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- Firebase account for authentication

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.