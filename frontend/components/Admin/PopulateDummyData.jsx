import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  Progress,
  Badge,
  Divider,
  useToast
} from '@chakra-ui/react';
import { 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  serverTimestamp,
  getDoc 
} from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';

const PopulateDummyData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const toast = useToast();

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

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
    },
    {
      uid: "user_george_007",
      displayName: "George Chen",
      email: "george.chen@example.com",
      phoneNumber: "+91-9876543216",
      photoURL: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150",
      address: ["Electronic City, Bangalore, Karnataka"],
      bookmarks: [],
      recent: [],
      orders: [],
      interests: ["Technology", "AI", "Gaming", "Anime"],
      location: "Electronic City, Bangalore",
      bio: "Software engineer and AI enthusiast. Love exploring new tech and anime!",
      age: 27,
      preferences: {
        cuisine: ["Asian", "Korean", "Japanese"],
        atmosphere: "modern",
        budget: "moderate"
      }
    },
    {
      uid: "user_hannah_008",
      displayName: "Hannah Patel",
      email: "hannah.patel@example.com",
      phoneNumber: "+91-9876543217",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      address: ["Rajajinagar, Bangalore, Karnataka"],
      bookmarks: [],
      recent: [],
      orders: [],
      interests: ["Medicine", "Volunteering", "Hiking", "Dogs"],
      location: "Rajajinagar, Bangalore",
      bio: "Doctor by day, adventurer by weekend. Love helping people and exploring nature!",
      age: 29,
      preferences: {
        cuisine: ["Healthy", "Mediterranean", "Indian"],
        atmosphere: "peaceful",
        budget: "moderate"
      }
    },
    {
      uid: "user_ivan_009",
      displayName: "Ivan Rodriguez",
      email: "ivan.rodriguez@example.com",
      phoneNumber: "+91-9876543218",
      photoURL: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
      address: ["Malleshwaram, Bangalore, Karnataka"],
      bookmarks: [],
      recent: [],
      orders: [],
      interests: ["Sports", "Football", "Coaching", "Beer"],
      location: "Malleshwaram, Bangalore",
      bio: "Former football player turned coach. Love sports, good beer, and team spirit!",
      age: 31,
      preferences: {
        cuisine: ["Sports Bar", "Mexican", "BBQ"],
        atmosphere: "lively",
        budget: "moderate"
      }
    },
    {
      uid: "user_julia_010",
      displayName: "Julia Kim",
      email: "julia.kim@example.com",
      phoneNumber: "+91-9876543219",
      photoURL: "https://images.unsplash.com/photo-1488508872907-592763824245?w=150",
      address: ["Yelahanka, Bangalore, Karnataka"],
      bookmarks: [],
      recent: [],
      orders: [],
      interests: ["Design", "UX/UI", "Sustainability", "Cats"],
      location: "Yelahanka, Bangalore",
      bio: "UX Designer passionate about sustainable design and cat welfare!",
      age: 26,
      preferences: {
        cuisine: ["Vegan", "Organic", "Cafe"],
        atmosphere: "cozy",
        budget: "moderate"
      }
    },
    {
      uid: "user_kevin_011",
      displayName: "Kevin Thompson",
      email: "kevin.thompson@example.com",
      phoneNumber: "+91-9876543220",
      photoURL: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150",
      address: ["JP Nagar, Bangalore, Karnataka"],
      bookmarks: [],
      recent: [],
      orders: [],
      interests: ["Finance", "Investing", "Hiking", "Photography"],
      location: "JP Nagar, Bangalore",
      bio: "Financial analyst with a passion for outdoor photography and mountain hiking!",
      age: 33,
      preferences: {
        cuisine: ["Continental", "Thai", "Rooftop"],
        atmosphere: "upscale",
        budget: "high"
      }
    },
    {
      uid: "user_linda_012",
      displayName: "Linda Martinez",
      email: "linda.martinez@example.com",
      phoneNumber: "+91-9876543221",
      photoURL: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150",
      address: ["Banashankari, Bangalore, Karnataka"],
      bookmarks: [],
      recent: [],
      orders: [],
      interests: ["Teaching", "Literature", "Theater", "Wine"],
      location: "Banashankari, Bangalore",
      bio: "English literature professor who loves theater performances and wine tastings!",
      age: 35,
      preferences: {
        cuisine: ["Wine Bar", "European", "Fine Dining"],
        atmosphere: "sophisticated",
        budget: "high"
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
      name: "Tech Innovation Hub",
      members: [
        { id: "user_bob_002", name: "Bob Smith", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", location: "Koramangala, Bangalore" },
        { id: "user_george_007", name: "George Chen", avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150", location: "Electronic City, Bangalore" },
        { id: "user_julia_010", name: "Julia Kim", avatar: "https://images.unsplash.com/photo-1488508872907-592763824245?w=150", location: "Yelahanka, Bangalore" },
        { id: "user_alice_001", name: "Alice Johnson", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612c547?w=150", location: "MG Road, Bangalore" }
      ],
      memberIds: ["user_bob_002", "user_george_007", "user_julia_010", "user_alice_001"],
      createdBy: "user_george_007",
      purpose: "business",
      lastMessage: "Anyone interested in the new AI meetup next week? 🤖",
      unreadCount: 1,
      isActive: true,
      tags: ["tech", "AI", "innovation", "networking"],
      plannedLocation: "91springboard, Koramangala",
      plannedTime: "Thursday 6:00 PM",
      aiRecommendations: "91springboard in Koramangala is perfect for tech meetups! Great coworking atmosphere and close to all members. Nearby options include The Humming Tree for post-meetup discussions."
    },
    {
      name: "Wellness Warriors",
      members: [
        { id: "user_diana_004", name: "Diana Wilson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", location: "Whitefield, Bangalore" },
        { id: "user_hannah_008", name: "Hannah Patel", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", location: "Rajajinagar, Bangalore" },
        { id: "user_fiona_006", name: "Fiona Garcia", avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150", location: "Jayanagar, Bangalore" }
      ],
      memberIds: ["user_diana_004", "user_hannah_008", "user_fiona_006"],
      createdBy: "user_diana_004",
      purpose: "fitness",
      lastMessage: "Morning yoga session tomorrow? The weather looks perfect! 🧘‍♀️",
      unreadCount: 0,
      isActive: true,
      tags: ["wellness", "yoga", "healthy", "morning"],
      plannedLocation: "Lalbagh Botanical Garden",
      plannedTime: "Saturday 7:00 AM",
      aiRecommendations: "Lalbagh offers beautiful outdoor spaces for yoga and wellness activities. After the session, try nearby healthy cafes like Koramangala Social or head to Mavalli Tiffin Rooms for a healthy South Indian breakfast."
    },
    {
      name: "Business Leaders Circle",
      members: [
        { id: "user_ethan_005", name: "Ethan Brown", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", location: "HSR Layout, Bangalore" },
        { id: "user_kevin_011", name: "Kevin Thompson", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150", location: "JP Nagar, Bangalore" },
        { id: "user_linda_012", name: "Linda Martinez", avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150", location: "Banashankari, Bangalore" }
      ],
      memberIds: ["user_ethan_005", "user_kevin_011", "user_linda_012"],
      createdBy: "user_ethan_005",
      purpose: "business",
      lastMessage: "Quarterly business review dinner - Michelin level food! 🍷",
      unreadCount: 3,
      isActive: true,
      tags: ["business", "networking", "fine-dining", "professional"],
      plannedLocation: "The Oberoi, MG Road",
      plannedTime: "Friday 8:00 PM",
      aiRecommendations: "The Oberoi offers an upscale atmosphere perfect for business discussions. Ziya restaurant provides excellent fine dining, and the central location works well for all members' travel convenience."
    },
    {
      name: "Creative Minds Collective",
      members: [
        { id: "user_alice_001", name: "Alice Johnson", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612c547?w=150", location: "MG Road, Bangalore" },
        { id: "user_charlie_003", name: "Charlie Davis", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150", location: "Indiranagar, Bangalore" },
        { id: "user_fiona_006", name: "Fiona Garcia", avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150", location: "Jayanagar, Bangalore" },
        { id: "user_julia_010", name: "Julia Kim", avatar: "https://images.unsplash.com/photo-1488508872907-592763824245?w=150", location: "Yelahanka, Bangalore" }
      ],
      memberIds: ["user_alice_001", "user_charlie_003", "user_fiona_006", "user_julia_010"],
      createdBy: "user_fiona_006",
      purpose: "study",
      lastMessage: "The design exhibition at Gallery Sumukha was inspiring! 🎨",
      unreadCount: 2,
      isActive: true,
      tags: ["art", "design", "creative", "inspiration"],
      plannedLocation: "Gallery Sumukha, Lavelle Road",
      plannedTime: "Sunday 4:00 PM",
      aiRecommendations: "Gallery Sumukha area has a great creative vibe! After the exhibition, explore nearby creative spaces like Matteo Coffea for artisanal coffee and discussions, or visit The Bookworm for browsing art books."
    },
    {
      name: "Sports & Social",
      members: [
        { id: "user_ivan_009", name: "Ivan Rodriguez", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150", location: "Malleshwaram, Bangalore" },
        { id: "user_george_007", name: "George Chen", avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150", location: "Electronic City, Bangalore" },
        { id: "user_bob_002", name: "Bob Smith", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", location: "Koramangala, Bangalore" }
      ],
      memberIds: ["user_ivan_009", "user_george_007", "user_bob_002"],
      createdBy: "user_ivan_009",
      purpose: "fitness",
      lastMessage: "Football match tonight! Who's bringing the snacks? ⚽",
      unreadCount: 1,
      isActive: true,
      tags: ["sports", "football", "active", "social"],
      plannedLocation: "BBMP Stadium, Malleshwaram",
      plannedTime: "Wednesday 6:30 PM",
      aiRecommendations: "BBMP Stadium is great for football! Post-game, head to nearby Toit Malleshwaram for craft beer and sports discussions, or try local street food at Gandhi Bazaar for authentic Bangalore flavors."
    },
    {
      name: "Literary & Wine Society",
      members: [
        { id: "user_linda_012", name: "Linda Martinez", avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150", location: "Banashankari, Bangalore" },
        { id: "user_hannah_008", name: "Hannah Patel", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", location: "Rajajinagar, Bangalore" },
        { id: "user_ethan_005", name: "Ethan Brown", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", location: "HSR Layout, Bangalore" }
      ],
      memberIds: ["user_linda_012", "user_hannah_008", "user_ethan_005"],
      createdBy: "user_linda_012",
      purpose: "study",
      lastMessage: "Next book club: 'Midnight's Children' - wine pairing included! 📚🍷",
      unreadCount: 0,
      isActive: false,
      tags: ["literature", "wine", "intellectual", "sophisticated"],
      plannedLocation: "Wine & Dine, Lavelle Road",
      plannedTime: "Sunday 5:00 PM",
      aiRecommendations: "Wine & Dine offers the perfect ambiance for literary discussions with excellent wine selection. Alternative options include Skyye Lounge for a more upscale setting or The Fatty Bao for a unique dining experience."
    }
  ];

  const addDummyUsers = async () => {
    addLog('🔥 Starting dummy users insertion...', 'info');
    let addedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < dummyUsers.length; i++) {
      const userData = dummyUsers[i];
      try {
        // Check if user already exists
        const userRef = doc(db, 'users', userData.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          addLog(`✅ User ${userData.displayName} already exists, skipping...`, 'info');
          skippedCount++;
        } else {
          // Add user to Firestore
          await setDoc(userRef, {
            ...userData,
            createdAt: serverTimestamp()
          });
          
          addLog(`✅ Added user: ${userData.displayName}`, 'success');
          addedCount++;
        }
        
        setProgress(((i + 1) / dummyUsers.length) * 50); // Users take up 50% of progress
      } catch (error) {
        addLog(`❌ Error adding user ${userData.displayName}: ${error.message}`, 'error');
      }
    }
    
    addLog(`📊 Users completed: ${addedCount} added, ${skippedCount} skipped`, 'info');
    return { addedCount, skippedCount };
  };

  const addDummyGroups = async () => {
    addLog('🔥 Starting dummy groups insertion...', 'info');
    let addedCount = 0;
    
    for (let i = 0; i < dummyGroups.length; i++) {
      const groupData = dummyGroups[i];
      try {
        // Add group to Firestore
        const docRef = await addDoc(collection(db, 'groups'), {
          ...groupData,
          createdAt: serverTimestamp(),
          lastMessageTime: serverTimestamp()
        });
        
        addLog(`✅ Added group: ${groupData.name} (ID: ${docRef.id})`, 'success');
        addedCount++;
        
        setProgress(35 + ((i + 1) / dummyGroups.length) * 30); // Groups take up 30%
      } catch (error) {
        addLog(`❌ Error adding group ${groupData.name}: ${error.message}`, 'error');
      }
    }
    
    addLog(`📊 Groups completed: ${addedCount} added`, 'info');
    return { addedCount };
  };

  const addDummyFriendRequests = async () => {
    addLog('🔥 Starting dummy friend requests insertion...', 'info');
    let addedCount = 0;
    
    // Sample friend requests between dummy users - comprehensive network
    const friendRequests = [
      // ACCEPTED FRIENDSHIPS - Core friend network
      {
        senderId: "user_alice_001",
        senderName: "Alice Johnson",
        senderAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612c547?w=150",
        senderEmail: "alice.johnson@example.com",
        receiverId: "user_bob_002",
        receiverName: "Bob Smith",
        receiverAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        receiverEmail: "bob.smith@example.com",
        status: "accepted",
        message: "Alice Johnson would like to be your friend"
      },
      {
        senderId: "user_alice_001",
        senderName: "Alice Johnson",
        senderAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612c547?w=150",
        senderEmail: "alice.johnson@example.com",
        receiverId: "user_charlie_003",
        receiverName: "Charlie Davis",
        receiverAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        receiverEmail: "charlie.davis@example.com",
        status: "accepted",
        message: "Alice Johnson would like to be your friend"
      },
      {
        senderId: "user_alice_001",
        senderName: "Alice Johnson",
        senderAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612c547?w=150",
        senderEmail: "alice.johnson@example.com",
        receiverId: "user_diana_004",
        receiverName: "Diana Wilson",
        receiverAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
        receiverEmail: "diana.wilson@example.com",
        status: "accepted",
        message: "Alice Johnson would like to be your friend"
      },
      {
        senderId: "user_bob_002",
        senderName: "Bob Smith",
        senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        senderEmail: "bob.smith@example.com",
        receiverId: "user_george_007",
        receiverName: "George Chen",
        receiverAvatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150",
        receiverEmail: "george.chen@example.com",
        status: "accepted",
        message: "Bob Smith would like to be your friend"
      },
      {
        senderId: "user_charlie_003",
        senderName: "Charlie Davis",
        senderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        senderEmail: "charlie.davis@example.com",
        receiverId: "user_fiona_006",
        receiverName: "Fiona Garcia",
        receiverAvatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150",
        receiverEmail: "fiona.garcia@example.com",
        status: "accepted",
        message: "Charlie Davis would like to be your friend"
      },
      {
        senderId: "user_diana_004",
        senderName: "Diana Wilson",
        senderAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
        senderEmail: "diana.wilson@example.com",
        receiverId: "user_hannah_008",
        receiverName: "Hannah Patel",
        receiverAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        receiverEmail: "hannah.patel@example.com",
        status: "accepted",
        message: "Diana Wilson would like to be your friend"
      },
      {
        senderId: "user_ethan_005",
        senderName: "Ethan Brown",
        senderAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        senderEmail: "ethan.brown@example.com",
        receiverId: "user_kevin_011",
        receiverName: "Kevin Thompson",
        receiverAvatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150",
        receiverEmail: "kevin.thompson@example.com",
        status: "accepted",
        message: "Ethan Brown would like to be your friend"
      },
      {
        senderId: "user_fiona_006",
        senderName: "Fiona Garcia",
        senderAvatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150",
        senderEmail: "fiona.garcia@example.com",
        receiverId: "user_julia_010",
        receiverName: "Julia Kim",
        receiverAvatar: "https://images.unsplash.com/photo-1488508872907-592763824245?w=150",
        receiverEmail: "julia.kim@example.com",
        status: "accepted",
        message: "Fiona Garcia would like to be your friend"
      },
      {
        senderId: "user_george_007",
        senderName: "George Chen",
        senderAvatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150",
        senderEmail: "george.chen@example.com",
        receiverId: "user_ivan_009",
        receiverName: "Ivan Rodriguez",
        receiverAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
        receiverEmail: "ivan.rodriguez@example.com",
        status: "accepted",
        message: "George Chen would like to be your friend"
      },
      {
        senderId: "user_hannah_008",
        senderName: "Hannah Patel",
        senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        senderEmail: "hannah.patel@example.com",
        receiverId: "user_linda_012",
        receiverName: "Linda Martinez",
        receiverAvatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150",
        receiverEmail: "linda.martinez@example.com",
        status: "accepted",
        message: "Hannah Patel would like to be your friend"
      },

      // PENDING FRIEND REQUESTS - Incoming
      {
        senderId: "user_ivan_009",
        senderName: "Ivan Rodriguez",
        senderAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
        senderEmail: "ivan.rodriguez@example.com",
        receiverId: "user_alice_001",
        receiverName: "Alice Johnson",
        receiverAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612c547?w=150",
        receiverEmail: "alice.johnson@example.com",
        status: "pending",
        message: "Ivan Rodriguez would like to be your friend"
      },
      {
        senderId: "user_julia_010",
        senderName: "Julia Kim",
        senderAvatar: "https://images.unsplash.com/photo-1488508872907-592763824245?w=150",
        senderEmail: "julia.kim@example.com",
        receiverId: "user_alice_001",
        receiverName: "Alice Johnson",
        receiverAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612c547?w=150",
        receiverEmail: "alice.johnson@example.com",
        status: "pending",
        message: "Julia Kim would like to be your friend"
      },
      {
        senderId: "user_kevin_011",
        senderName: "Kevin Thompson",
        senderAvatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150",
        senderEmail: "kevin.thompson@example.com",
        receiverId: "user_bob_002",
        receiverName: "Bob Smith",
        receiverAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        receiverEmail: "bob.smith@example.com",
        status: "pending",
        message: "Kevin Thompson would like to be your friend"
      },
      {
        senderId: "user_linda_012",
        senderName: "Linda Martinez",
        senderAvatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150",
        senderEmail: "linda.martinez@example.com",
        receiverId: "user_charlie_003",
        receiverName: "Charlie Davis",
        receiverAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        receiverEmail: "charlie.davis@example.com",
        status: "pending",
        message: "Linda Martinez would like to be your friend"
      },

      // PENDING FRIEND REQUESTS - Outgoing (sent by Alice)
      {
        senderId: "user_alice_001",
        senderName: "Alice Johnson",
        senderAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612c547?w=150",
        senderEmail: "alice.johnson@example.com",
        receiverId: "user_ethan_005",
        receiverName: "Ethan Brown",
        receiverAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        receiverEmail: "ethan.brown@example.com",
        status: "pending",
        message: "Alice Johnson would like to be your friend"
      },
      {
        senderId: "user_alice_001",
        senderName: "Alice Johnson",
        senderAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612c547?w=150",
        senderEmail: "alice.johnson@example.com",
        receiverId: "user_hannah_008",
        receiverName: "Hannah Patel",
        receiverAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        receiverEmail: "hannah.patel@example.com",
        status: "pending",
        message: "Alice Johnson would like to be your friend"
      }
    ];
    
    for (let i = 0; i < friendRequests.length; i++) {
      const requestData = friendRequests[i];
      try {
        // Add friend request to Firestore
        const docRef = await addDoc(collection(db, 'friendRequests'), {
          ...requestData,
          createdAt: serverTimestamp(),
          updatedAt: requestData.status === 'accepted' ? serverTimestamp() : null
        });
        
        addLog(`✅ Added friend request: ${requestData.senderName} → ${requestData.receiverName} (${requestData.status})`, 'success');
        addedCount++;
        
        setProgress(65 + ((i + 1) / friendRequests.length) * 35); // Friend requests take up remaining 35%
      } catch (error) {
        addLog(`❌ Error adding friend request: ${error.message}`, 'error');
      }
    }
    
    addLog(`📊 Friend requests completed: ${addedCount} added`, 'info');
    return { addedCount };
  };

  const handlePopulateData = async () => {
    setIsLoading(true);
    setProgress(0);
    setLogs([]);
    
    try {
      addLog('🚀 Starting dummy data population for Group Mode...', 'info');
      
      const userResults = await addDummyUsers();
      const groupResults = await addDummyGroups();
      const friendRequestResults = await addDummyFriendRequests();
      
      setProgress(100);
      addLog('🎉 Dummy data population completed successfully!', 'success');
      addLog(`📋 Summary: ${userResults.addedCount} users, ${groupResults.addedCount} groups, ${friendRequestResults.addedCount} friend requests added`, 'info');
      
      toast({
        title: 'Data Population Complete!',
        description: `Added ${userResults.addedCount} users, ${groupResults.addedCount} groups, and ${friendRequestResults.addedCount} friend requests`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      addLog(`❌ Error during data population: ${error.message}`, 'error');
      toast({
        title: 'Population Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            🔥 Populate Group Mode Dummy Data
          </Text>
          <Text color="gray.600">
            Add sample users and groups to test Group Mode functionality
          </Text>
        </Box>

        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="semibold">This will add comprehensive Group Mode data:</Text>
            <Text>• {dummyUsers.length} diverse users with unique profiles, interests, and locations</Text>
            <Text>• {dummyGroups.length} varied groups (Tech, Wellness, Business, Creative, Sports, etc.)</Text>
            <Text>• Comprehensive friend network with accepted friendships and pending requests</Text>
            <Text>• Realistic social connections between users for testing</Text>
          </Box>
        </Alert>

        <HStack spacing={4} wrap="wrap">
          <Badge colorScheme="blue" p={2}>{dummyUsers.length} Users</Badge>
          <Badge colorScheme="green" p={2}>{dummyGroups.length} Groups</Badge>
          <Badge colorScheme="pink" p={2}>Friend Network</Badge>
          <Badge colorScheme="purple" p={2}>Diverse Interests</Badge>
          <Badge colorScheme="orange" p={2}>All Bangalore Areas</Badge>
          <Badge colorScheme="teal" p={2}>Realistic Profiles</Badge>
        </HStack>

        {isLoading && (
          <Box>
            <Text mb={2}>Progress: {Math.round(progress)}%</Text>
            <Progress value={progress} colorScheme="blue" size="lg" />
          </Box>
        )}

        <Button
          onClick={handlePopulateData}
          isLoading={isLoading}
          loadingText="Populating Data..."
          colorScheme="blue"
          size="lg"
          disabled={isLoading}
        >
          🚀 Populate Dummy Data
        </Button>

        {logs.length > 0 && (
          <>
            <Divider />
            <Box>
              <Text fontWeight="semibold" mb={2}>📋 Operation Logs:</Text>
              <Box 
                maxH="300px" 
                overflowY="auto" 
                bg="gray.50" 
                p={4} 
                borderRadius="md"
                fontSize="sm"
                fontFamily="monospace"
              >
                {logs.map((log, index) => (
                  <Text 
                    key={index} 
                    color={
                      log.type === 'error' ? 'red.600' : 
                      log.type === 'success' ? 'green.600' : 
                      'gray.700'
                    }
                    mb={1}
                  >
                    [{log.timestamp}] {log.message}
                  </Text>
                ))}
              </Box>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default PopulateDummyData;
