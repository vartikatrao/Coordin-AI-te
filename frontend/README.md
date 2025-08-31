# Coordin-AI-te Frontend Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Firebase account (Google Cloud Platform account recommended)
- Git

### 🔥 Firebase Setup

#### Step 1: Create Firebase Project

1. **Go to Firebase Console**: Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)

2. **Create New Project**:
   - Click "Add project"
   - Enter project name (e.g., "coordin-ai-te")
   - Enable/disable Google Analytics (recommended to enable)
   - Accept terms and create project

3. **Enable Required Services**:

   **Authentication:**
   - Go to "Authentication" > "Sign-in method"
   - Enable the following providers:
     - **Google**: Click "Google" > Enable > Add your support email
     - **Email/Password**: Click "Email/Password" > Enable both options
     - **Phone**: Click "Phone" > Enable

   **Firestore Database:**
   - Go to "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location (choose closest to your users)

   **Storage (Optional but recommended):**
   - Go to "Storage"
   - Click "Get started"
   - Accept default security rules
   - Choose same location as Firestore

#### Step 2: Get Firebase Configuration

1. **Web App Setup**:
   - In Firebase Console, click the gear icon ⚙️ > "Project settings"
   - Scroll down to "Your apps"
   - Click "Add app" > Web icon (</>) 
   - Enter app nickname: "Coordin-AI-te Frontend"
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

2. **Copy Configuration**:
   ```javascript
   // You'll get something like this - SAVE THESE VALUES!
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456789",
     measurementId: "G-XXXXXXXXXX"
   };
   ```

#### Step 3: Security Rules Setup

**Firestore Rules** (Go to "Firestore Database" > "Rules"):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Group data access
    match /groups/{groupId} {
      allow read, write: if request.auth != null;
    }
    
    // Places and public data
    match /places/{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

**Storage Rules** (Go to "Storage" > "Rules"):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 🚀 Frontend Setup

#### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/Coordin-AI-te.git
cd Coordin-AI-te/frontend

# Install dependencies
npm install
# or
yarn install
```

#### Step 2: Environment Configuration

1. **Create Environment File**:
```bash
# Create .env.local in the frontend root directory
touch .env.local
```

2. **Add Firebase Configuration**:
```bash
# .env.local
# Firebase Configuration (from Step 2 above)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_V1_URL=http://localhost:8000/api/v1

# Google Maps (optional - for enhanced location features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# App Configuration
NEXT_PUBLIC_APP_NAME=Coordin-AI-te
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### Step 3: Verify Firebase Connection

1. **Test Firebase Setup**:
```bash
npm run dev
```

2. **Check Browser Console**:
   - Open browser to `http://localhost:3000`
   - Open Developer Tools (F12)
   - Check Console tab for Firebase initialization messages:
     - ✅ "Firebase app initialized successfully"
     - ✅ "Firebase services initialized successfully"
     - ✅ "Testing Firestore connectivity..."

#### Step 4: Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking (if using TypeScript)
npm run type-check
```

### 🔧 Common Setup Issues & Solutions

#### Firebase Authentication Issues
```bash
# Error: "Firebase: Error (auth/configuration-not-found)"
# Solution: Ensure all environment variables are set correctly in .env.local
```

#### CORS Issues
```bash
# Error: CORS policy blocking requests
# Solution: Add your domain to Firebase authorized domains:
# Firebase Console > Authentication > Settings > Authorized domains
# Add: localhost, your-domain.com
```

#### Environment Variables Not Loading
```bash
# Issue: Environment variables showing as undefined
# Solution: 
# 1. Ensure .env.local is in the frontend root directory
# 2. All variables start with NEXT_PUBLIC_
# 3. Restart the development server after changes
```

#### Firestore Permission Denied
```bash
# Error: "Missing or insufficient permissions"
# Solution: Check Firestore rules and ensure user is authenticated
```

### 📱 Mobile Development Setup

```bash
# For mobile testing, use your local IP instead of localhost
# Find your IP address:
ip addr show | grep "inet " | grep -v 127.0.0.1

# Update .env.local with your IP:
NEXT_PUBLIC_API_BASE_URL=http://YOUR_IP_ADDRESS:8000

# Then access via mobile browser:
http://YOUR_IP_ADDRESS:3000
```
