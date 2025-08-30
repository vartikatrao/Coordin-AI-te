import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  Badge,
  Card,
  CardBody,
  SimpleGrid,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { Auth, db } from '../../firebase/firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function CheckData() {
  const [user, loading] = useAuthState(Auth);
  const [data, setData] = useState({
    users: [],
    friendRequests: [],
    groups: [],
    loading: true
  });
  const toast = useToast();

  const checkFirebaseData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true }));

      // Check users collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Check friend requests collection
      const friendRequestsSnapshot = await getDocs(collection(db, 'friendRequests'));
      const friendRequests = friendRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Check groups collection
      const groupsSnapshot = await getDocs(collection(db, 'groups'));
      const groups = groupsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setData({
        users,
        friendRequests,
        groups,
        loading: false
      });

      console.log('Users:', users);
      console.log('Friend Requests:', friendRequests);
      console.log('Groups:', groups);

    } catch (error) {
      console.error('Error checking Firebase data:', error);
      toast({
        title: 'Error',
        description: 'Failed to check Firebase data: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (user) {
      checkFirebaseData();
    }
  }, [user]);

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="lg" />
        <Text mt={4}>Loading authentication...</Text>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box p={8} textAlign="center">
        <Alert status="warning">
          <AlertIcon />
          Please log in to check Firebase data
        </Alert>
      </Box>
    );
  }

  const acceptedFriends = data.friendRequests.filter(req => req.status === 'accepted');
  const pendingRequests = data.friendRequests.filter(req => req.status === 'pending');

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Heading>🔍 Firebase Data Debug</Heading>
        
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Current User: {user.displayName || user.email}</Text>
            <Text>UID: {user.uid}</Text>
          </Box>
        </Alert>

        <Button onClick={checkFirebaseData} colorScheme="purple" isLoading={data.loading}>
          🔄 Refresh Data
        </Button>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {/* Users Stats */}
          <Card>
            <CardBody>
              <VStack spacing={3}>
                <Heading size="md">👥 Users</Heading>
                <Badge colorScheme="blue" fontSize="lg" p={2}>
                  {data.users.length} Total
                </Badge>
                <Text fontSize="sm" color="gray.600">
                  {data.users.filter(u => u.uid !== user.uid).length} Other Users
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Friend Requests Stats */}
          <Card>
            <CardBody>
              <VStack spacing={3}>
                <Heading size="md">🤝 Friend Requests</Heading>
                <Badge colorScheme="green" fontSize="lg" p={2}>
                  {acceptedFriends.length} Accepted
                </Badge>
                <Badge colorScheme="orange" fontSize="md" p={1}>
                  {pendingRequests.length} Pending
                </Badge>
                <Text fontSize="sm" color="gray.600">
                  {data.friendRequests.length} Total Requests
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Groups Stats */}
          <Card>
            <CardBody>
              <VStack spacing={3}>
                <Heading size="md">👫 Groups</Heading>
                <Badge colorScheme="purple" fontSize="lg" p={2}>
                  {data.groups.length} Total
                </Badge>
                <Text fontSize="sm" color="gray.600">
                  Groups in database
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Detailed Data */}
        {!data.loading && (
          <VStack spacing={4} align="stretch">
            <Heading size="lg">📊 Detailed Analysis</Heading>
            
            {/* Your Friend Connections */}
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>🔗 Your Friend Connections</Heading>
                {acceptedFriends.length === 0 ? (
                  <Alert status="warning">
                    <AlertIcon />
                    No accepted friends found for your account
                  </Alert>
                ) : (
                  <VStack spacing={2} align="stretch">
                    {acceptedFriends
                      .filter(req => req.senderId === user.uid || req.receiverId === user.uid)
                      .map((req, index) => {
                        const isReceiver = req.receiverId === user.uid;
                        const friendName = isReceiver ? req.senderName : req.receiverName;
                        return (
                          <Box key={index} p={3} bg="green.50" borderRadius="md">
                            <Text>✅ Friends with: <strong>{friendName}</strong></Text>
                          </Box>
                        );
                      })}
                  </VStack>
                )}
              </CardBody>
            </Card>

            {/* All Users */}
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>👥 All Users in Database</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                  {data.users.map((userData, index) => (
                    <Box key={index} p={2} bg={userData.uid === user.uid ? "blue.50" : "gray.50"} borderRadius="md">
                      <Text>
                        {userData.uid === user.uid ? "🫵 " : "👤 "}
                        <strong>{userData.displayName || 'Unknown'}</strong>
                        {userData.uid === user.uid && " (You)"}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        📍 {userData.location || 'No location'}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </CardBody>
            </Card>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}
