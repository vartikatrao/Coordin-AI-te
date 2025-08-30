import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  Avatar,
  Badge,
  InputGroup,
  InputLeftElement,
  useToast,
  Card,
  CardBody,
  Spinner,
  Tag,
  TagLabel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Divider,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, CheckIcon } from '@chakra-ui/icons';
import { useSelector } from 'react-redux';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  where,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';

const FriendSearch = () => {
  const { user } = useSelector((state) => state.userReducer);
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [friends, setFriends] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Fetch all users (excluding current user and existing friends)
  useEffect(() => {
    if (!user?.uid) return;

    try {
      const q = query(collection(db, 'users'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const users = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              interests: doc.data().interests || [],
              location: doc.data().location || 'Unknown',
            }))
            .filter(userData => userData.uid !== user.uid); // Filter out current user
          
          setAllUsers(users);
          setIsLoading(false);
        } catch (error) {
          console.error('Error processing users:', error);
          setAllUsers([]);
          setIsLoading(false);
        }
      }, (error) => {
        console.error('Error fetching users:', error);
        setAllUsers([]);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up users listener:', error);
      setAllUsers([]);
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
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const requests = new Set(snapshot.docs.map(doc => doc.data().receiverId));
          setSentRequests(requests);
        } catch (error) {
          console.error('Error processing sent requests:', error);
          setSentRequests(new Set());
        }
      }, (error) => {
        console.error('Error fetching sent requests:', error);
        setSentRequests(new Set());
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up sent requests listener:', error);
      setSentRequests(new Set());
    }
  }, [user?.uid]);

  // Fetch existing friends
  useEffect(() => {
    if (!user?.uid) return;

    try {
      const q = query(
        collection(db, 'friendRequests'),
        where('status', '==', 'accepted')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const friendIds = new Set();
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.senderId === user.uid) {
              friendIds.add(data.receiverId);
            } else if (data.receiverId === user.uid) {
              friendIds.add(data.senderId);
            }
          });
          setFriends(friendIds);
        } catch (error) {
          console.error('Error processing friends:', error);
          setFriends(new Set());
        }
      }, (error) => {
        console.error('Error fetching friends:', error);
        setFriends(new Set());
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up friends listener:', error);
      setFriends(new Set());
    }
  }, [user?.uid]);

  // Filter users based on search query and exclude friends/pending requests
  useEffect(() => {
    let filtered = allUsers;

    // Exclude friends and users with pending requests
    filtered = filtered.filter(userData => 
      !friends.has(userData.uid) && !sentRequests.has(userData.uid)
    );

    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(userData =>
        userData.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userData.interests?.some(interest => 
          interest.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        userData.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userData.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [searchQuery, allUsers, friends, sentRequests]);

  const handleSendFriendRequest = async (targetUser) => {
    try {
      // Check if request already exists
      const existingRequestQuery = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', user.uid),
        where('receiverId', '==', targetUser.uid)
      );
      
      const existingRequests = await getDocs(existingRequestQuery);
      
      if (!existingRequests.empty) {
        toast({
          title: 'Request Already Sent',
          description: `You've already sent a friend request to ${targetUser.displayName}`,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Create friend request
      await addDoc(collection(db, 'friendRequests'), {
        senderId: user.uid,
        senderName: user.displayName,
        senderAvatar: user.photoURL,
        senderEmail: user.email,
        receiverId: targetUser.uid,
        receiverName: targetUser.displayName,
        receiverAvatar: targetUser.photoURL,
        receiverEmail: targetUser.email,
        status: 'pending',
        createdAt: serverTimestamp(),
        message: `${user.displayName} would like to be your friend`
      });

      toast({
        title: 'Friend Request Sent!',
        description: `Your request has been sent to ${targetUser.displayName}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send friend request. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openConfirmDialog = (userData) => {
    setSelectedUser(userData);
    onOpen();
  };

  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="lg" />
        <Text mt={4}>Loading users...</Text>
      </Box>
    );
  }

  return (
    <Box h="100%" display="flex" flexDirection="column">
      <VStack spacing={6} align="stretch" h="100%">
        {/* Header */}
        <Box flexShrink={0}>
          <Heading size="lg" mb={2}>
            🔍 Find & Add Friends
          </Heading>
          <Text color="gray.600">
            Search for users and send friend requests to add them to your groups
          </Text>
        </Box>

        {/* Search Input */}
        <Box flexShrink={0}>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search by name, interests, location, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="white"
              border="2px solid"
              borderColor="gray.200"
              _focus={{
                borderColor: "purple.400",
                boxShadow: "0 0 0 1px #9F7AEA",
              }}
            />
          </InputGroup>
        </Box>

        {/* Statistics */}
        <Box flexShrink={0}>
          <HStack spacing={4} wrap="wrap">
            <Badge colorScheme="blue" p={2} borderRadius="full">
              {filteredUsers.length} Users Found
            </Badge>
            <Badge colorScheme="green" p={2} borderRadius="full">
              {friends.size} Friends
            </Badge>
            <Badge colorScheme="orange" p={2} borderRadius="full">
              {sentRequests.size} Pending Requests
            </Badge>
          </HStack>
        </Box>

        <Divider />

        {/* User Results - Scrollable */}
        <Box 
          flex="1" 
          overflowY="auto" 
          pr={2}
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#CBD5E0',
              borderRadius: '24px',
            },
          }}
        >
          {filteredUsers.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text fontSize="lg" color="gray.500">
                {searchQuery ? 'No users found matching your search' : 'No new users to add as friends'}
              </Text>
              <Text color="gray.400" mt={2}>
                {searchQuery ? 'Try different search terms' : 'All available users are already friends or have pending requests'}
              </Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch" pb={4}>
              {filteredUsers.map((userData) => (
                <Card key={userData.uid || userData.id} bg="white" shadow="sm" _hover={{ shadow: "md" }}>
                  <CardBody>
                    <Flex justify="space-between" align="center">
                      <HStack spacing={4} flex="1">
                        <Avatar
                          src={userData.photoURL}
                          name={userData.displayName}
                          size="md"
                        />
                        <Box flex="1">
                          <Text fontWeight="semibold" fontSize="lg">
                            {userData.displayName || 'User'}
                          </Text>
                          <Text color="gray.600" fontSize="sm" mb={2}>
                            📍 {userData.location}
                          </Text>
                          {userData.interests && userData.interests.length > 0 && (
                            <HStack spacing={1} flexWrap="wrap">
                              {userData.interests.slice(0, 3).map((interest, index) => (
                                <Tag key={index} size="sm" colorScheme="purple" variant="subtle">
                                  <TagLabel>{interest}</TagLabel>
                                </Tag>
                              ))}
                              {userData.interests.length > 3 && (
                                <Tag size="sm" colorScheme="gray" variant="subtle">
                                  <TagLabel>+{userData.interests.length - 3} more</TagLabel>
                                </Tag>
                              )}
                            </HStack>
                          )}
                          {userData.bio && (
                            <Text color="gray.500" fontSize="sm" mt={2} noOfLines={2}>
                              {userData.bio}
                            </Text>
                          )}
                        </Box>
                      </HStack>

                      <Button
                        leftIcon={<AddIcon />}
                        colorScheme="purple"
                        variant="solid"
                        onClick={() => openConfirmDialog(userData)}
                        size="md"
                      >
                        Add Friend
                      </Button>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>

      {/* Confirmation Dialog */}
      <AlertDialog isOpen={isOpen} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Send Friend Request
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing={4} align="center">
                <Avatar
                  src={selectedUser?.photoURL}
                  name={selectedUser?.displayName}
                  size="lg"
                />
                <Text textAlign="center">
                  Send a friend request to <strong>{selectedUser?.displayName}</strong>?
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  They'll be able to see your profile and you can add them to groups once they accept.
                </Text>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onClose} mr={3}>
                Cancel
              </Button>
              <Button
                colorScheme="purple"
                onClick={() => handleSendFriendRequest(selectedUser)}
                leftIcon={<AddIcon />}
              >
                Send Request
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default FriendSearch;
