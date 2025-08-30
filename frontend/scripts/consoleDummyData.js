// Quick Console Script for Dummy Data Population
// Copy and paste this into your browser console when on the app page
// Make sure you're authenticated and Firebase is available

async function populateGroupModeDummyData() {
  console.log('🚀 Starting Group Mode dummy data population...');
  
  // Check if Firebase is available
  if (typeof window === 'undefined' || !window.firebase) {
    console.error('❌ Firebase not available. Make sure you\'re on the app page.');
    return;
  }

  const { getFirestore, collection, addDoc, setDoc, doc, serverTimestamp, getDoc } = window.firebase;
  const db = getFirestore();

  // Dummy Users Data
  const dummyUsers = [
    {
      uid: "user_alice_001",
      displayName: "Alice Johnson",
      email: "alice.johnson@example.com",
      phoneNumber: "+91-9876543210",
      photoURL: "https://images.unsplash.com/photo-1494790108755-2616b612c547?w=150",
      address: ["MG Road, Bangalore, Karnataka"],
      bookmarks: [],
      recent: [],
      orders: [],
      interests: ["Coffee", "Books", "Art", "Photography"],
      location: "MG Road, Bangalore",
      bio: "Coffee enthusiast and art lover. Always up for exploring new cafes!",
      age: 25,
      preferences: {
        cuisine: ["Italian", "Chinese", "Continental"],
        atmosphere: "casual",
        budget: "moderate"
      }
    },
    {
      uid: "user_bob_002", 
      displayName: "Bob Smith",
      email: "bob.smith@example.com",
      phoneNumber: "+91-9876543211",
      photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      address: ["Koramangala, Bangalore, Karnataka"],
      bookmarks: [],
      recent: [],
      orders: [],
      interests: ["Sports", "Fitness", "Movies", "Tech"],
      location: "Koramangala, Bangalore",
      bio: "Tech geek and fitness enthusiast. Love outdoor activities and good food.",
      age: 28,
      preferences: {
        cuisine: ["Indian", "Italian", "Mexican"],
        atmosphere: "lively",
        budget: "moderate"
      }
    },
    {
      uid: "user_charlie_003",
      displayName: "Charlie Davis",
      email: "charlie.davis@example.com", 
      phoneNumber: "+91-9876543212",
      photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      address: ["Indiranagar, Bangalore, Karnataka"],
      bookmarks: [],
      recent: [],
      orders: [],
      interests: ["Music", "Travel", "Food", "Gaming"],
      location: "Indiranagar, Bangalore",
      bio: "Music producer and travel blogger. Always looking for new adventures!",
      age: 24,
      preferences: {
        cuisine: ["Thai", "Japanese", "Indian"],
        atmosphere: "trendy",
        budget: "high"
      }
    },
    {
      uid: "user_diana_004",
      displayName: "Diana Wilson",
      email: "diana.wilson@example.com",
      phoneNumber: "+91-9876543213", 
      photoURL: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      address: ["Whitefield, Bangalore, Karnataka"],
      bookmarks: [],
      recent: [],
      orders: [],
      interests: ["Reading", "Yoga", "Cooking", "Nature"],
      location: "Whitefield, Bangalore",
      bio: "Yoga instructor and book lover. Passionate about healthy living and mindfulness.",
      age: 30,
      preferences: {
        cuisine: ["Mediterranean", "Vegan", "Healthy"],
        atmosphere: "peaceful",
        budget: "moderate"
      }
    },
    {
      uid: "user_ethan_005",
      displayName: "Ethan Brown",
      email: "ethan.brown@example.com",
      phoneNumber: "+91-9876543214",
      photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", 
      address: ["HSR Layout, Bangalore, Karnataka"],
      bookmarks: [],
      recent: [],
      orders: [],
      interests: ["Business", "Networking", "Wine", "Jazz"],
      location: "HSR Layout, Bangalore",
      bio: "Entrepreneur and jazz enthusiast. Love connecting with like-minded people.",
      age: 32,
      preferences: {
        cuisine: ["Fine Dining", "French", "Wine Bar"],
        atmosphere: "upscale", 
        budget: "high"
      }
    },
    {
      uid: "user_fiona_006",
      displayName: "Fiona Garcia",
      email: "fiona.garcia@example.com",
      phoneNumber: "+91-9876543215",
      photoURL: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150",
      address: ["Jayanagar, Bangalore, Karnataka"],
      bookmarks: [],
      recent: [],
      orders: [],
      interests: ["Dance", "Fashion", "Shopping", "Brunch"],
      location: "Jayanagar, Bangalore",
      bio: "Fashion designer and dance instructor. Love weekend brunches and shopping!",
      age: 26,
      preferences: {
        cuisine: ["Brunch", "Continental", "Desserts"],
        atmosphere: "trendy",
        budget: "moderate"
      }
    }
  ];

  // Dummy Groups Data
  const dummyGroups = [
    {
      name: "Weekend Coffee Explorers",
      members: [
        { id: "user_alice_001", name: "Alice Johnson", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612c547?w=150", location: "MG Road, Bangalore" },
        { id: "user_bob_002", name: "Bob Smith", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", location: "Koramangala, Bangalore" },
        { id: "user_charlie_003", name: "Charlie Davis", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150", location: "Indiranagar, Bangalore" }
      ],
      memberIds: ["user_alice_001", "user_bob_002", "user_charlie_003"],
      createdBy: "user_alice_001",
      purpose: "coffee",
      lastMessage: "Found some amazing coffee spots in the city center! ☕",
      unreadCount: 2,
      isActive: true,
      tags: ["coffee", "weekend", "casual"],
      plannedLocation: "Church Street, Bangalore",
      plannedTime: "Saturday 3:00 PM",
      aiRecommendations: "Based on your group preferences, I recommend meeting at The Coffee Bean & Tea Leaf on Church Street. It's centrally located with great ambiance for conversations."
    },
    {
      name: "Fitness & Food Squad",
      members: [
        { id: "user_bob_002", name: "Bob Smith", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", location: "Koramangala, Bangalore" },
        { id: "user_diana_004", name: "Diana Wilson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", location: "Whitefield, Bangalore" },
        { id: "user_fiona_006", name: "Fiona Garcia", avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150", location: "Jayanagar, Bangalore" }
      ],
      memberIds: ["user_bob_002", "user_diana_004", "user_fiona_006"],
      createdBy: "user_diana_004",
      purpose: "fitness",
      lastMessage: "How about we try that new healthy bowl place after our workout? 🥗",
      unreadCount: 0,
      isActive: true,
      tags: ["fitness", "healthy", "active"],
      plannedLocation: "Cubbon Park, Bangalore",
      plannedTime: "Sunday 7:00 AM",
      aiRecommendations: "Perfect location for morning workouts! Cubbon Park offers great jogging trails, and there are several healthy food options nearby like Fresh Menu and Subway for post-workout meals."
    },
    {
      name: "Startup Networking Meetup",
      members: [
        { id: "user_ethan_005", name: "Ethan Brown", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", location: "HSR Layout, Bangalore" },
        { id: "user_charlie_003", name: "Charlie Davis", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150", location: "Indiranagar, Bangalore" },
        { id: "user_alice_001", name: "Alice Johnson", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612c547?w=150", location: "MG Road, Bangalore" },
        { id: "user_bob_002", name: "Bob Smith", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", location: "Koramangala, Bangalore" }
      ],
      memberIds: ["user_ethan_005", "user_charlie_003", "user_alice_001", "user_bob_002"],
      createdBy: "user_ethan_005",
      purpose: "business",
      lastMessage: "Let's discuss the latest tech trends over dinner 🚀",
      unreadCount: 1,
      isActive: true,
      tags: ["business", "networking", "tech"],
      plannedLocation: "UB City Mall, Bangalore",
      plannedTime: "Friday 7:30 PM",
      aiRecommendations: "For a professional networking dinner, I suggest Farzi Cafe or Toit Brewpub in UB City area. Both offer great ambiance for business discussions with excellent food and a sophisticated atmosphere."
    },
    {
      name: "Art & Culture Enthusiasts",
      members: [
        { id: "user_alice_001", name: "Alice Johnson", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612c547?w=150", location: "MG Road, Bangalore" },
        { id: "user_diana_004", name: "Diana Wilson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", location: "Whitefield, Bangalore" },
        { id: "user_fiona_006", name: "Fiona Garcia", avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150", location: "Jayanagar, Bangalore" }
      ],
      memberIds: ["user_alice_001", "user_diana_004", "user_fiona_006"],
      createdBy: "user_alice_001",
      purpose: "study",
      lastMessage: "The art exhibition at National Gallery is amazing! 🎨",
      unreadCount: 3,
      isActive: true,
      tags: ["art", "culture", "creative"],
      plannedLocation: "National Gallery of Modern Art, Bangalore",
      plannedTime: "Saturday 11:00 AM",
      aiRecommendations: "The National Gallery area is perfect for art lovers! After the exhibition, you can visit nearby cafes like Koshy's for a cultural dining experience, or head to Russell Market for some local shopping."
    },
    {
      name: "Brunch & Chill",
      members: [
        { id: "user_fiona_006", name: "Fiona Garcia", avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150", location: "Jayanagar, Bangalore" },
        { id: "user_charlie_003", name: "Charlie Davis", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150", location: "Indiranagar, Bangalore" },
        { id: "user_diana_004", name: "Diana Wilson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", location: "Whitefield, Bangalore" }
      ],
      memberIds: ["user_fiona_006", "user_charlie_003", "user_diana_004"],
      createdBy: "user_fiona_006", 
      purpose: "dining",
      lastMessage: "Sunday brunch plans? I found this cute new place! 🥞",
      unreadCount: 0,
      isActive: false,
      tags: ["brunch", "relaxed", "weekend"],
      plannedLocation: "Indiranagar 100 Feet Road",
      plannedTime: "Sunday 12:00 PM",
      aiRecommendations: "For a perfect Sunday brunch, try Hole in the Wall Cafe or Glen's Bakehouse on 100 Feet Road. Both offer amazing breakfast options and a relaxed weekend vibe perfect for catching up with friends."
    }
  ];

  try {
    // Add Users
    console.log('👥 Adding dummy users...');
    let userCount = 0;
    for (const userData of dummyUsers) {
      try {
        const userRef = doc(db, 'users', userData.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          console.log(`✅ User ${userData.displayName} already exists`);
        } else {
          await setDoc(userRef, {
            ...userData,
            createdAt: serverTimestamp()
          });
          console.log(`✅ Added user: ${userData.displayName}`);
          userCount++;
        }
      } catch (error) {
        console.error(`❌ Error adding user ${userData.displayName}:`, error);
      }
    }

    // Add Groups
    console.log('👥 Adding dummy groups...');
    let groupCount = 0;
    for (const groupData of dummyGroups) {
      try {
        const docRef = await addDoc(collection(db, 'groups'), {
          ...groupData,
          createdAt: serverTimestamp(),
          lastMessageTime: serverTimestamp()
        });
        console.log(`✅ Added group: ${groupData.name} (ID: ${docRef.id})`);
        groupCount++;
      } catch (error) {
        console.error(`❌ Error adding group ${groupData.name}:`, error);
      }
    }

    console.log(`🎉 Completed! Added ${userCount} users and ${groupCount} groups`);
    
  } catch (error) {
    console.error('❌ Error during population:', error);
  }
}

// Instructions
console.log(`
🔥 Group Mode Dummy Data Population Script
==========================================

To populate dummy data, run:
> populateGroupModeDummyData()

This will add:
• 6 sample users with diverse profiles
• 5 sample groups with different purposes
• Realistic data for testing Group Mode
`);

// Make function available globally
window.populateGroupModeDummyData = populateGroupModeDummyData;
