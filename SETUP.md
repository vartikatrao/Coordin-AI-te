# 🚀 Coordin-AI-te Setup Guide

This guide will help you set up and run both the frontend and backend on your local machine.

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **Git**

## 🔧 Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/vartikatrao/Coordin-AI-te.git
cd Coordin-AI-te
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cp env.example .env
```

**Important:** Edit the `.env` file with your API keys:
```bash
nano .env  # or use any text editor
```

Required API keys in `.env`:
- `FSQ_API_KEY` - Your Foursquare API key
- `GEMINI_API_KEY` - Your Google Gemini API key
- `FIREBASE_WEB_API_KEY` - Your Firebase Web API key

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install Node.js dependencies
npm install

# Create frontend environment file
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local

# Add Firebase configuration
cat >> .env.local << 'EOF'

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAl2K5K42XxbtjnqetSR-B4G2o60PhV5Ms
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=coordin-ai-te.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=coordin-ai-te
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=coordin-ai-te.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=956015981020
NEXT_PUBLIC_FIREBASE_APP_ID=1:956015981020:web:2cd7437b98092f70891f19
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-0WLP5VQD8Va
EOF
```

## 🏃‍♀️ Running the Application

### Start Backend (Terminal 1)

```bash
cd backend
source venv/bin/activate  # Activate virtual environment
python run.py
```

You should see:
```
🚀 Starting Coordin-AI-te Backend...
🌐 Backend will be available at: http://localhost:8000
```

### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

## 🎯 Verify Setup

1. **Backend Health Check**: Visit http://localhost:8000/health
   - Should show: `{"status":"healthy",...}`

2. **Frontend**: Visit http://localhost:3000
   - Should load the Coordin-AI-te homepage

3. **API Connection**: Check browser console for any errors

## 🔑 Getting API Keys

### Foursquare API Key
1. Go to https://developer.foursquare.com/
2. Create an account and new app
3. Copy the API key to your `.env` file

### Google Gemini API Key
1. Go to https://ai.google.dev/
2. Get API access
3. Copy the API key to your `.env` file

### Firebase Configuration
The Firebase configuration is already provided, but you can set up your own:
1. Go to https://console.firebase.google.com/
2. Create a new project
3. Enable Authentication and Firestore
4. Get your web app configuration

## 🛠️ Troubleshooting

### Backend Issues
- **Port 8000 in use**: Kill any processes using port 8000 or change the port in `run.py`
- **Module not found**: Make sure virtual environment is activated and dependencies are installed
- **API key errors**: Check that your `.env` file has the correct API keys

### Frontend Issues
- **Can't reach backend**: Verify backend is running on port 8000
- **Firebase errors**: Check Firebase configuration in `.env.local`
- **Build errors**: Delete `node_modules` and run `npm install` again

### Common Commands

```bash
# Kill backend process
pkill -f "python run.py"

# Restart backend
cd backend && source venv/bin/activate && python run.py

# Restart frontend
cd frontend && npm run dev

# Check what's running on port 8000
ss -tlnp | grep 8000

# Check what's running on port 3000
ss -tlnp | grep 3000
```

## 📁 Project Structure

```
Coordin-AI-te/
├── backend/          # Python FastAPI backend
│   ├── app/          # Application code
│   ├── venv/         # Virtual environment
│   ├── requirements.txt
│   └── run.py        # Main entry point
├── frontend/         # Next.js frontend
│   ├── components/   # React components
│   ├── pages/        # Next.js pages
│   ├── package.json
│   └── .env.local    # Environment variables
└── README.md
```

## 🎉 You're Ready!

Once both frontend and backend are running:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

Happy coding! 🚀
