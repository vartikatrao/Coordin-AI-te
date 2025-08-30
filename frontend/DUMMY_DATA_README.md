# Group Mode Dummy Data Population

This document explains how to populate dummy data for testing Group Mode functionality.

## 📊 What Data Will Be Added

### 👥 Users (6 sample users)
- **Alice Johnson** - Coffee enthusiast, MG Road, Bangalore
- **Bob Smith** - Tech geek & fitness enthusiast, Koramangala
- **Charlie Davis** - Music producer & travel blogger, Indiranagar  
- **Diana Wilson** - Yoga instructor & book lover, Whitefield
- **Ethan Brown** - Entrepreneur & jazz enthusiast, HSR Layout
- **Fiona Garcia** - Fashion designer & dance instructor, Jayanagar

Each user includes:
- Profile information (name, email, photo, location)
- Interests and preferences
- Age and bio
- Cuisine and atmosphere preferences

### 👥 Groups (5 sample groups)
- **Weekend Coffee Explorers** - Coffee meetups
- **Fitness & Food Squad** - Health & wellness group
- **Startup Networking Meetup** - Business networking
- **Art & Culture Enthusiasts** - Creative activities
- **Brunch & Chill** - Casual weekend meetups

Each group includes:
- Group members and metadata
- Purpose and tags
- Last messages and activity status
- AI recommendations for meetup locations
- Planned locations and times

## 🚀 How to Populate Data

### Method 1: Using the Admin Page (Recommended)

1. Start your Next.js development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to the admin page:
   ```
   http://localhost:3000/admin/populate-data
   ```

3. Click the "🚀 Populate Dummy Data" button

4. Monitor the progress and logs in real-time

### Method 2: Using Browser Console (Quick)

1. Open your app in the browser
2. Make sure you're logged in with Firebase Auth
3. Open browser Developer Tools (F12)
4. Go to the Console tab
5. Copy and paste the content from `frontend/scripts/consoleDummyData.js`
6. Run the function:
   ```javascript
   populateGroupModeDummyData()
   ```

### Method 3: Node.js Script (Advanced)

1. Set up environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

2. Install Firebase dependencies:
   ```bash
   cd frontend
   npm install firebase
   ```

3. Run the script:
   ```bash
   node scripts/addDummyData.js
   ```

## 🔍 Verification

After populating data, you can verify it worked by:

1. **Check Users**: Go to Group Mode → User Discovery
   - You should see 6 sample users available for selection
   - Each user should have profile pictures, interests, and locations

2. **Check Groups**: Go to Group Mode → Main view
   - You should see 5 sample groups in your groups list
   - Groups should have member avatars, last messages, and purposes

3. **Firebase Console**: Check your Firestore database
   - `users` collection should have 6 documents
   - `groups` collection should have 5 documents

## 🧹 Cleanup (Optional)

To remove dummy data:

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Delete documents with IDs starting with:
   - Users: `user_alice_001`, `user_bob_002`, etc.
   - Groups: Find groups created by these user IDs

## 🎯 Use Cases

This dummy data enables testing of:

- **User Discovery**: Search and filter functionality
- **Group Creation**: Multi-user group formation
- **Group Chat**: Message history and real-time updates
- **Location Finding**: AI recommendations and venue suggestions
- **Profile Management**: User interests and preferences
- **Notification Systems**: Unread message counts
- **Group Management**: Member management and group settings

## ⚠️ Important Notes

- **Development Only**: This is for testing purposes only
- **Data Persistence**: Data will persist in your Firebase database
- **User IDs**: Dummy users have predictable IDs for easy identification
- **Images**: Uses Unsplash placeholder images
- **Locations**: All locations are in Bangalore, India
- **No Authentication**: Dummy users are just data entries, not auth accounts

## 🔧 Customization

To modify the dummy data:

1. Edit the data arrays in any of the script files
2. Add/remove users or groups as needed
3. Update locations, interests, or preferences
4. Modify group purposes and AI recommendations

The data structure follows the same format as real user/group data, so it integrates seamlessly with existing functionality.
