import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  Alert,
  AlertIcon,
  useToast,
  Card,
  CardBody,
  Heading
} from '@chakra-ui/react';
import { Auth, db } from '../../firebase/firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function QuickFriends() {
  const [user, loading] = useAuthState(Auth);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const addQuickFriends = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please log in first',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Add accepted friends and received friend requests for your current account
      const friendRequests = [
        // ACCEPTED FRIENDS
        {
          senderId: "user_alice_001",
          senderName: "Alice Johnson",
          senderEmail: "alice.johnson@example.com",
          receiverId: user.uid,
          receiverName: user.displayName || user.email,
          receiverEmail: user.email,
          status: "accepted",
          message: `${user.displayName || 'User'} and Alice are now friends!`,
        },
        {
          senderId: "user_bob_002", 
          senderName: "Bob Smith",
          senderEmail: "bob.smith@example.com",
          receiverId: user.uid,
          receiverName: user.displayName || user.email,
          receiverEmail: user.email,
          status: "accepted",
          message: `${user.displayName || 'User'} and Bob are now friends!`,
        },
        {
          senderId: user.uid,
          senderName: user.displayName || user.email,
          senderEmail: user.email,
          receiverId: "user_charlie_003",
          receiverName: "Charlie Brown",
          receiverEmail: "charlie.brown@example.com",
          status: "accepted",
          message: `${user.displayName || 'User'} and Charlie are now friends!`,
        },
        
        // RECEIVED FRIEND REQUESTS (pending)
        {
          senderId: "user_diana_004",
          senderName: "Diana Wilson",
          senderEmail: "diana.wilson@example.com",
          receiverId: user.uid,
          receiverName: user.displayName || user.email,
          receiverEmail: user.email,
          status: "pending",
          message: `Hi ${user.displayName || 'there'}! I'd love to connect and explore Bangalore together!`,
        },
        {
          senderId: "user_ethan_005",
          senderName: "Ethan Brown",
          senderEmail: "ethan.brown@example.com",
          receiverId: user.uid,
          receiverName: user.displayName || user.email,
          receiverEmail: user.email,
          status: "pending",
          message: `Hey! Saw your profile and thought we might have similar interests. Let's be friends!`,
        },
        {
          senderId: "user_fiona_006",
          senderName: "Fiona Garcia",
          senderEmail: "fiona.garcia@example.com",
          receiverId: user.uid,
          receiverName: user.displayName || user.email,
          receiverEmail: user.email,
          status: "pending",
          message: `Hello! I'm also into coffee and art. Would love to be friends and maybe explore cafes together!`,
        },
        
        // SENT FRIEND REQUESTS (pending) - from you to others
        {
          senderId: user.uid,
          senderName: user.displayName || user.email,
          senderEmail: user.email,
          receiverId: "user_george_007",
          receiverName: "George Chen",
          receiverEmail: "george.chen@example.com",
          status: "pending",
          message: `Hi George! Would love to connect and maybe check out some tech meetups together.`,
        },
        {
          senderId: user.uid,
          senderName: user.displayName || user.email,
          senderEmail: user.email,
          receiverId: "user_hannah_008",
          receiverName: "Hannah Patel",
          receiverEmail: "hannah.patel@example.com",
          status: "pending",
          message: `Hey Hannah! Interested in being friends and exploring Bangalore's food scene together.`,
        }
      ];

      for (const request of friendRequests) {
        await addDoc(collection(db, 'friendRequests'), {
          ...request,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      toast({
        title: 'Success!',
        description: `Added ${friendRequests.length} friend connections (3 accepted friends + 3 received requests + 2 sent requests)`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error adding friends:', error);
      toast({
        title: 'Error',
        description: 'Failed to add friends: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <Box p={8} textAlign="center">Loading...</Box>;
  }

  if (!user) {
    return (
      <Box p={8} textAlign="center">
        <Alert status="warning">
          <AlertIcon />
          Please log in to add friends
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={8} maxW="600px" mx="auto">
      <VStack spacing={6}>
        <Heading>⚡ Quick Add Friends</Heading>
        
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Current User: {user.displayName || user.email}</Text>
            <Text>UID: {user.uid}</Text>
          </Box>
        </Alert>

        <Card w="100%">
          <CardBody>
            <VStack spacing={4}>
              <Text textAlign="center" fontWeight="bold">
                This will add comprehensive friend connections to test all features:
              </Text>
              
              <VStack spacing={3} align="stretch">
                <Text fontWeight="semibold" color="green.600">✅ Accepted Friends (3):</Text>
                <VStack spacing={1} pl={4} align="stretch">
                  <Text fontSize="sm">• Alice Johnson (Coffee & Art enthusiast)</Text>
                  <Text fontSize="sm">• Bob Smith (Tech & Gaming lover)</Text>
                  <Text fontSize="sm">• Charlie Brown (Music & Travel fan)</Text>
                </VStack>
                
                <Text fontWeight="semibold" color="blue.600">📥 Received Requests (3):</Text>
                <VStack spacing={1} pl={4} align="stretch">
                  <Text fontSize="sm">• Diana Wilson (wants to explore Bangalore)</Text>
                  <Text fontSize="sm">• Ethan Brown (similar interests)</Text>
                  <Text fontSize="sm">• Fiona Garcia (coffee & art lover)</Text>
                </VStack>
                
                <Text fontWeight="semibold" color="orange.600">📤 Sent Requests (2):</Text>
                <VStack spacing={1} pl={4} align="stretch">
                  <Text fontSize="sm">• George Chen (tech meetups)</Text>
                  <Text fontSize="sm">• Hannah Patel (food scene)</Text>
                </VStack>
              </VStack>
              
              <Button
                colorScheme="green"
                onClick={addQuickFriends}
                isLoading={isLoading}
                loadingText="Adding Friend Connections..."
                size="lg"
                w="100%"
              >
                🚀 Add All Friend Connections
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Text fontSize="sm" color="gray.600" textAlign="center">
          After adding connections, test all features:
          <br />• <strong>Find Friends tab</strong>: See your 3 accepted friends
          <br />• <strong>Friend Requests tab</strong>: Accept/decline 3 received requests
          <br />• <strong>Friend Requests tab</strong>: View your 2 sent requests
        </Text>
      </VStack>
    </Box>
  );
}
