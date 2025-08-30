import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Avatar,
  Badge,
  useToast,
  Card,
  CardBody,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, TimeIcon } from '@chakra-ui/icons';
import { useSelector } from 'react-redux';
import { 
  collection, 
  query, 
  onSnapshot, 
  updateDoc,
  doc,
  where,
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';

const FriendRequests = () => {
  const { user } = useSelector((state) => state.userReducer);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(''); // 'accept' or 'decline'
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Fetch received friend requests
  useEffect(() => {
    if (!user?.uid) return;

    try {
      const q = query(
        collection(db, 'friendRequests'),
        where('receiverId', '==', user.uid),
        where('status', '==', 'pending')
        // Temporarily removed orderBy to avoid index requirement
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const requests = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate(),
            }))
            .sort((a, b) => (b.createdAt || new Date()) - (a.createdAt || new Date())); // Sort client-side
          
          setReceivedRequests(requests);
          setIsLoading(false);
        } catch (error) {
          console.error('Error processing received requests:', error);
          setReceivedRequests([]);
          setIsLoading(false);
        }
      }, (error) => {
        console.error('Error fetching received requests:', error);
        setReceivedRequests([]);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up received requests listener:', error);
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Fetch sent friend requests
  useEffect(() => {
    if (!user?.uid) return;

    try {
      const q = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', user.uid),
        where('status', '==', 'pending')
        // Temporarily removed orderBy to avoid index requirement
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const requests = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate(),
            }))
            .sort((a, b) => (b.createdAt || new Date()) - (a.createdAt || new Date())); // Sort client-side
          
          setSentRequests(requests);
        } catch (error) {
          console.error('Error processing sent requests:', error);
          setSentRequests([]);
        }
      }, (error) => {
        console.error('Error fetching sent requests:', error);
        setSentRequests([]);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up sent requests listener:', error);
      setSentRequests([]);
    }
  }, [user?.uid]);

  // Fetch friends list
  useEffect(() => {
    if (!user?.uid) return;

    try {
      const q = query(
        collection(db, 'friendRequests'),
        where('status', '==', 'accepted')
        // Temporarily removed orderBy to avoid index requirement
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const friendsList = [];
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.senderId === user.uid) {
              friendsList.push({
                id: doc.id,
                uid: data.receiverId,
                name: data.receiverName,
                avatar: data.receiverAvatar,
                email: data.receiverEmail,
                acceptedAt: data.updatedAt?.toDate(),
              });
            } else if (data.receiverId === user.uid) {
              friendsList.push({
                id: doc.id,
                uid: data.senderId,
                name: data.senderName,
                avatar: data.senderAvatar,
                email: data.senderEmail,
                acceptedAt: data.updatedAt?.toDate(),
              });
            }
          });
          
          // Remove duplicates based on uid (keep the most recent one)
          const uniqueFriends = [];
          const seenUids = new Set();
          
          friendsList.forEach(friend => {
            if (!seenUids.has(friend.uid)) {
              seenUids.add(friend.uid);
              uniqueFriends.push(friend);
            }
          });
          
          // Sort friends by accepted date (client-side)
          uniqueFriends.sort((a, b) => (b.acceptedAt || new Date()) - (a.acceptedAt || new Date()));
          setFriends(uniqueFriends);
        } catch (error) {
          console.error('Error processing friends list:', error);
          setFriends([]);
        }
      }, (error) => {
        console.error('Error fetching friends list:', error);
        setFriends([]);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up friends listener:', error);
      setFriends([]);
    }
  }, [user?.uid]);

  const handleAcceptRequest = async (request) => {
    try {
      await updateDoc(doc(db, 'friendRequests', request.id), {
        status: 'accepted',
        updatedAt: new Date()
      });

      toast({
        title: 'Friend Request Accepted!',
        description: `You and ${request.senderName} are now friends`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept friend request. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeclineRequest = async (request) => {
    try {
      await updateDoc(doc(db, 'friendRequests', request.id), {
        status: 'declined',
        updatedAt: new Date()
      });

      toast({
        title: 'Request Declined',
        description: `Friend request from ${request.senderName} declined`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline friend request. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCancelRequest = async (request) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', request.id));

      toast({
        title: 'Request Cancelled',
        description: `Friend request to ${request.receiverName} cancelled`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel friend request. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openConfirmDialog = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    onOpen();
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Recently';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="lg" />
        <Text mt={4}>Loading friend requests...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            👥 Friend Requests
          </Heading>
          <Text color="gray.600">
            Manage your friend requests and connections
          </Text>
        </Box>

        <Tabs variant="enclosed" colorScheme="purple">
          <TabList>
            <Tab>
              Received 
              {receivedRequests.length > 0 && (
                <Badge ml={2} colorScheme="red" borderRadius="full">
                  {receivedRequests.length}
                </Badge>
              )}
            </Tab>
            <Tab>
              Sent 
              {sentRequests.length > 0 && (
                <Badge ml={2} colorScheme="orange" borderRadius="full">
                  {sentRequests.length}
                </Badge>
              )}
            </Tab>
            <Tab>
              Friends 
              {friends.length > 0 && (
                <Badge ml={2} colorScheme="green" borderRadius="full">
                  {friends.length}
                </Badge>
              )}
            </Tab>
          </TabList>

          <TabPanels>
            {/* Received Requests Tab */}
            <TabPanel>
              {receivedRequests.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text fontSize="lg" color="gray.500">
                    No pending friend requests
                  </Text>
                  <Text color="gray.400" mt={2}>
                    Friend requests you receive will appear here
                  </Text>
                </Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  {receivedRequests.map((request) => (
                    <Card key={request.id} bg="white" shadow="sm">
                      <CardBody>
                        <Flex justify="space-between" align="center">
                          <HStack spacing={4} flex="1">
                            <Avatar
                              src={request.senderAvatar}
                              name={request.senderName}
                              size="md"
                            />
                            <Box flex="1">
                              <Text fontWeight="semibold" fontSize="lg">
                                {request.senderName}
                              </Text>
                              <Text color="gray.600" fontSize="sm">
                                {request.senderEmail}
                              </Text>
                              <Text color="gray.500" fontSize="sm" mt={1}>
                                <TimeIcon boxSize={3} mr={1} />
                                {formatTimeAgo(request.createdAt)}
                              </Text>
                            </Box>
                          </HStack>

                          <HStack spacing={2}>
                            <Button
                              leftIcon={<CheckIcon />}
                              colorScheme="green"
                              size="sm"
                              onClick={() => openConfirmDialog(request, 'accept')}
                            >
                              Accept
                            </Button>
                            <Button
                              leftIcon={<CloseIcon />}
                              colorScheme="red"
                              variant="outline"
                              size="sm"
                              onClick={() => openConfirmDialog(request, 'decline')}
                            >
                              Decline
                            </Button>
                          </HStack>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </TabPanel>

            {/* Sent Requests Tab */}
            <TabPanel>
              {sentRequests.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text fontSize="lg" color="gray.500">
                    No pending sent requests
                  </Text>
                  <Text color="gray.400" mt={2}>
                    Friend requests you send will appear here
                  </Text>
                </Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  {sentRequests.map((request) => (
                    <Card key={request.id} bg="white" shadow="sm">
                      <CardBody>
                        <Flex justify="space-between" align="center">
                          <HStack spacing={4} flex="1">
                            <Avatar
                              src={request.receiverAvatar}
                              name={request.receiverName}
                              size="md"
                            />
                            <Box flex="1">
                              <Text fontWeight="semibold" fontSize="lg">
                                {request.receiverName}
                              </Text>
                              <Text color="gray.600" fontSize="sm">
                                {request.receiverEmail}
                              </Text>
                              <Text color="gray.500" fontSize="sm" mt={1}>
                                <TimeIcon boxSize={3} mr={1} />
                                Sent {formatTimeAgo(request.createdAt)}
                              </Text>
                            </Box>
                          </HStack>

                          <VStack spacing={1} align="end">
                            <Badge colorScheme="orange" variant="subtle">
                              Pending
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleCancelRequest(request)}
                            >
                              Cancel
                            </Button>
                          </VStack>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </TabPanel>

            {/* Friends Tab */}
            <TabPanel>
              {friends.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text fontSize="lg" color="gray.500">
                    No friends yet
                  </Text>
                  <Text color="gray.400" mt={2}>
                    Add friends to start creating groups together
                  </Text>
                </Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  {friends.map((friend) => (
                    <Card key={friend.id} bg="white" shadow="sm">
                      <CardBody>
                        <Flex justify="space-between" align="center">
                          <HStack spacing={4} flex="1">
                            <Avatar
                              src={friend.avatar}
                              name={friend.name}
                              size="md"
                            />
                            <Box flex="1">
                              <Text fontWeight="semibold" fontSize="lg">
                                {friend.name}
                              </Text>
                              <Text color="gray.600" fontSize="sm">
                                {friend.email}
                              </Text>
                              <Text color="gray.500" fontSize="sm" mt={1}>
                                Friends since {formatTimeAgo(friend.acceptedAt)}
                              </Text>
                            </Box>
                          </HStack>

                          <Badge colorScheme="green" variant="subtle">
                            Friends
                          </Badge>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Confirmation Dialog */}
      <AlertDialog isOpen={isOpen} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {actionType === 'accept' ? 'Accept Friend Request' : 'Decline Friend Request'}
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing={4} align="center">
                <Avatar
                  src={selectedRequest?.senderAvatar}
                  name={selectedRequest?.senderName}
                  size="lg"
                />
                <Text textAlign="center">
                  {actionType === 'accept' 
                    ? `Accept friend request from ${selectedRequest?.senderName}?`
                    : `Decline friend request from ${selectedRequest?.senderName}?`
                  }
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  {actionType === 'accept' 
                    ? "You'll be able to add each other to groups and see each other's profiles."
                    : "This request will be declined and they won't be notified."
                  }
                </Text>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onClose} mr={3}>
                Cancel
              </Button>
              <Button
                colorScheme={actionType === 'accept' ? 'green' : 'red'}
                onClick={() => 
                  actionType === 'accept' 
                    ? handleAcceptRequest(selectedRequest)
                    : handleDeclineRequest(selectedRequest)
                }
                leftIcon={actionType === 'accept' ? <CheckIcon /> : <CloseIcon />}
              >
                {actionType === 'accept' ? 'Accept' : 'Decline'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default FriendRequests;
