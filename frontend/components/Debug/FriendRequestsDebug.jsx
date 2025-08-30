import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  Code,
  Alert,
  AlertIcon,
  Heading,
} from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { 
  collection, 
  query, 
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';

const FriendRequestsDebug = () => {
  const { user } = useSelector((state) => state.userReducer);
  const [debugInfo, setDebugInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const checkFriendRequests = async () => {
    setIsLoading(true);
    setDebugInfo('');
    
    try {
      // Check if friendRequests collection exists
      const q = query(collection(db, 'friendRequests'));
      const snapshot = await getDocs(q);
      
      let info = `📊 Friend Requests Collection Debug:\n`;
      info += `Collection exists: ${snapshot.docs.length > 0 ? 'Yes' : 'No'}\n`;
      info += `Total documents: ${snapshot.docs.length}\n\n`;
      
      if (snapshot.docs.length > 0) {
        info += `Documents:\n`;
        snapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          info += `${index + 1}. ID: ${doc.id}\n`;
          info += `   Sender: ${data.senderName} (${data.senderId})\n`;
          info += `   Receiver: ${data.receiverName} (${data.receiverId})\n`;
          info += `   Status: ${data.status}\n`;
          info += `   Created: ${data.createdAt?.toDate()?.toLocaleString() || 'No date'}\n\n`;
        });
      } else {
        info += `No friend requests found in the collection.\n`;
      }
      
      info += `Current user: ${user?.displayName} (${user?.uid})\n`;
      
      setDebugInfo(info);
    } catch (error) {
      setDebugInfo(`❌ Error checking friend requests: ${error.message}\n${error.stack}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestFriendRequest = async () => {
    if (!user?.uid) {
      setDebugInfo('❌ No user logged in');
      return;
    }

    try {
      setIsLoading(true);
      
      // Create a test friend request
      const testRequest = {
        senderId: user.uid,
        senderName: user.displayName || 'Test User',
        senderAvatar: user.photoURL || '',
        senderEmail: user.email || '',
        receiverId: 'test_receiver_123',
        receiverName: 'Test Receiver',
        receiverAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        receiverEmail: 'test@example.com',
        status: 'pending',
        message: `${user.displayName || 'Test User'} would like to be your friend`,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'friendRequests'), testRequest);
      
      setDebugInfo(`✅ Test friend request created successfully!\nDocument ID: ${docRef.id}\n\nNow check the collection again.`);
    } catch (error) {
      setDebugInfo(`❌ Error creating test friend request: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Heading size="lg">🔍 Friend Requests Debug</Heading>
        
        <Alert status="info">
          <AlertIcon />
          This component helps debug friend request loading issues.
        </Alert>

        <VStack spacing={3}>
          <Button 
            onClick={checkFriendRequests} 
            isLoading={isLoading}
            colorScheme="blue"
            size="lg"
            w="100%"
          >
            Check Friend Requests Collection
          </Button>
          
          <Button 
            onClick={createTestFriendRequest} 
            isLoading={isLoading}
            colorScheme="green"
            variant="outline"
            size="lg"
            w="100%"
            isDisabled={!user?.uid}
          >
            Create Test Friend Request
          </Button>
        </VStack>

        {debugInfo && (
          <Box>
            <Text fontWeight="semibold" mb={2}>Debug Information:</Text>
            <Code 
              p={4} 
              borderRadius="md" 
              bg="gray.50" 
              whiteSpace="pre-wrap"
              w="100%"
              fontSize="sm"
            >
              {debugInfo}
            </Code>
          </Box>
        )}

        {!user?.uid && (
          <Alert status="warning">
            <AlertIcon />
            Please log in to test friend request functionality.
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

export default FriendRequestsDebug;
