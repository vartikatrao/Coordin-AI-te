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
  Heading,
  Badge,
} from '@chakra-ui/react';
import { Auth, db } from '../../firebase/firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

export default function CleanupDuplicates() {
  const [user, loading] = useAuthState(Auth);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const toast = useToast();

  const analyzeDuplicates = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get all friend requests involving this user
      const q1 = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', user.uid)
      );
      const q2 = query(
        collection(db, 'friendRequests'),
        where('receiverId', '==', user.uid)
      );

      const [senderResults, receiverResults] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      const allRequests = [];
      senderResults.docs.forEach(doc => {
        allRequests.push({ id: doc.id, ...doc.data(), role: 'sender' });
      });
      receiverResults.docs.forEach(doc => {
        allRequests.push({ id: doc.id, ...doc.data(), role: 'receiver' });
      });

      // Group by friendship pair
      const friendshipPairs = new Map();
      
      allRequests.forEach(request => {
        const friendUid = request.role === 'sender' ? request.receiverId : request.senderId;
        const friendName = request.role === 'sender' ? request.receiverName : request.senderName;
        
        const key = `${Math.min(user.uid, friendUid)}_${Math.max(user.uid, friendUid)}`;
        
        if (!friendshipPairs.has(key)) {
          friendshipPairs.set(key, {
            friendUid,
            friendName,
            requests: []
          });
        }
        
        friendshipPairs.get(key).requests.push(request);
      });

      // Find duplicates
      const duplicates = [];
      const acceptedFriends = [];
      
      friendshipPairs.forEach((pair, key) => {
        const acceptedRequests = pair.requests.filter(r => r.status === 'accepted');
        
        if (acceptedRequests.length > 1) {
          duplicates.push({
            friendName: pair.friendName,
            count: acceptedRequests.length,
            requests: acceptedRequests
          });
        } else if (acceptedRequests.length === 1) {
          acceptedFriends.push(pair.friendName);
        }
      });

      setStats({
        totalRequests: allRequests.length,
        uniqueFriends: acceptedFriends.length,
        duplicates,
        acceptedFriends
      });

    } catch (error) {
      console.error('Error analyzing duplicates:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze duplicates: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupDuplicates = async () => {
    if (!stats || !stats.duplicates.length) return;

    setIsLoading(true);
    try {
      let deletedCount = 0;

      for (const duplicate of stats.duplicates) {
        // Keep the most recent request, delete the others
        const sortedRequests = duplicate.requests.sort((a, b) => 
          (b.updatedAt?.toDate() || b.createdAt?.toDate() || new Date()) - 
          (a.updatedAt?.toDate() || a.createdAt?.toDate() || new Date())
        );

        // Delete all but the first (most recent)
        for (let i = 1; i < sortedRequests.length; i++) {
          await deleteDoc(doc(db, 'friendRequests', sortedRequests[i].id));
          deletedCount++;
        }
      }

      toast({
        title: 'Cleanup Complete!',
        description: `Removed ${deletedCount} duplicate friend requests`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Re-analyze after cleanup
      await analyzeDuplicates();

    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      toast({
        title: 'Error',
        description: 'Failed to cleanup duplicates: ' + error.message,
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
          Please log in to cleanup duplicates
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={8} maxW="800px" mx="auto">
      <VStack spacing={6}>
        <Heading>🧹 Cleanup Duplicate Friends</Heading>
        
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Current User: {user.displayName || user.email}</Text>
            <Text>This tool will analyze and remove duplicate friend requests</Text>
          </Box>
        </Alert>

        <Card w="100%">
          <CardBody>
            <VStack spacing={4}>
              <Button
                colorScheme="blue"
                onClick={analyzeDuplicates}
                isLoading={isLoading}
                loadingText="Analyzing..."
                size="lg"
                w="100%"
              >
                🔍 Analyze Friend Requests
              </Button>

              {stats && (
                <VStack spacing={3} align="stretch" w="100%">
                  <Text fontWeight="bold">Analysis Results:</Text>
                  
                  <VStack spacing={2} align="stretch">
                    <Badge colorScheme="blue" p={2}>
                      Total Requests: {stats.totalRequests}
                    </Badge>
                    <Badge colorScheme="green" p={2}>
                      Unique Friends: {stats.uniqueFriends}
                    </Badge>
                    <Badge colorScheme="red" p={2}>
                      Duplicates Found: {stats.duplicates.length}
                    </Badge>
                  </VStack>

                  {stats.duplicates.length > 0 && (
                    <VStack spacing={2} align="stretch">
                      <Text fontWeight="semibold" color="red.600">Duplicate Friends:</Text>
                      {stats.duplicates.map((dup, index) => (
                        <Text key={index} fontSize="sm" pl={4}>
                          • {dup.friendName} ({dup.count} duplicates)
                        </Text>
                      ))}

                      <Button
                        colorScheme="red"
                        onClick={cleanupDuplicates}
                        isLoading={isLoading}
                        loadingText="Cleaning up..."
                        mt={4}
                      >
                        🗑️ Remove Duplicates
                      </Button>
                    </VStack>
                  )}

                  {stats.acceptedFriends.length > 0 && (
                    <VStack spacing={2} align="stretch">
                      <Text fontWeight="semibold" color="green.600">Valid Friends:</Text>
                      {stats.acceptedFriends.map((friend, index) => (
                        <Text key={index} fontSize="sm" pl={4}>
                          • {friend}
                        </Text>
                      ))}
                    </VStack>
                  )}
                </VStack>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
