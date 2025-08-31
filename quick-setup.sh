#!/bin/bash

echo "🚀 Coordin-AI-te Quick Setup Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the Coordin-AI-te root directory"
    exit 1
fi

echo "📂 Setting up Backend..."

# Backend setup
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp env.example .env
    echo "⚠️  IMPORTANT: Please edit backend/.env file with your API keys!"
fi

cd ..

echo "🌐 Setting up Frontend..."

# Frontend setup
cd frontend

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create .env.local file
echo "⚙️  Creating frontend environment file..."
cat > .env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAl2K5K42XxbtjnqetSR-B4G2o60PhV5Ms
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=coordin-ai-te.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=coordin-ai-te
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=coordin-ai-te.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=956015981020
NEXT_PUBLIC_FIREBASE_APP_ID=1:956015981020:web:2cd7437b98092f70891f19
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-0WLP5VQD8Va
EOF

cd ..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit backend/.env with your API keys (Foursquare, Gemini)"
echo "2. Start backend: cd backend && source venv/bin/activate && python run.py"
echo "3. Start frontend: cd frontend && npm run dev"
echo ""
echo "🔗 Links:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📖 For detailed instructions, see SETUP.md"
