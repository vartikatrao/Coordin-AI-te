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
  Checkbox,
  InputGroup,
  InputLeftElement,
  useToast,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton,
  Select,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon } from '@chakra-ui/icons';
import { useSelector } from 'react-redux';
import { 
  collection, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';

const UserDiscovery = ({ onCreateGroup, isModal = false }) => {
  const { user } = useSelector((state) => state.userReducer);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupPurpose, setGroupPurpose] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const toast = useToast();

  // Safety check for user authentication
  if (!user || !user.uid) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.500">Please log in to discover users</Text>
      </Box>
    );
  }

  // Fetch friends from Firebase (only accepted friend requests)
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'friendRequests'),
      where('status', '==', 'accepted')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const friendIds = [];
      
      // Get friend user IDs
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.senderId === user.uid) {
          friendIds.push(data.receiverId);
        } else if (data.receiverId === user.uid) {
          friendIds.push(data.senderId);
        }
      });

      if (friendIds.length === 0) {
        setAllUsers([]);
        setFilteredUsers([]);
        return;
      }

      // Fetch user details for friends
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      const friends = usersSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          interests: doc.data().interests || [],
          location: doc.data().location || 'Unknown',
          mutualFriends: 0, // TODO: Implement mutual friends logic
          isOnline: Math.random() > 0.5, // TODO: Implement real online status
        }))
        .filter(userData => friendIds.includes(userData.uid))
        .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '')); // Sort client-side
      
      setAllUsers(friends);
      setFilteredUsers(friends);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter(user =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.interests.some(interest => 
          interest.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        user.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, allUsers]);

  const handleUserSelect = (userToSelect) => {
    if (selectedUsers.find(u => (u.uid || u.id) === (userToSelect.uid || userToSelect.id))) {
      // Remove user if already selected
      setSelectedUsers(selectedUsers.filter(u => (u.uid || u.id) !== (userToSelect.uid || userToSelect.id)));
    } else {
      // Add user if not selected
      setSelectedUsers([...selectedUsers, userToSelect]);
    }
  };

  const handleCreateGroup = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select at least one user to create a group',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Only require group name and purpose in modal mode
    if (isModal && !groupName.trim()) {
      toast({
        title: 'Group name required',
        description: 'Please enter a name for your group',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isModal && !groupPurpose) {
      toast({
        title: 'Group purpose required',
        description: 'Please select a purpose for your group',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Generate default group name and purpose for non-modal mode
    const finalGroupName = isModal 
      ? groupName.trim() 
      : `${user.displayName || 'User'} & ${selectedUsers.length === 1 
          ? selectedUsers[0].displayName 
          : `${selectedUsers.length} friends`}`;
    
    const finalGroupPurpose = isModal ? groupPurpose : 'social';

    const groupData = {
      name: finalGroupName,
      purpose: finalGroupPurpose,
      members: [
        { 
          id: user.uid, 
          name: user.displayName || 'You', 
          avatar: user.photoURL || 'https://bit.ly/default-avatar',
          location: user.location || 'Unknown'
        },
        ...selectedUsers.map(u => ({ 
          id: u.uid || u.id, 
          name: u.displayName || 'User', 
          avatar: u.photoURL || 'https://bit.ly/default-avatar',
          location: u.location || 'Unknown'
        }))
      ],
    };

    onCreateGroup(groupData);
    setSelectedUsers([]);
    setGroupName('');
    setGroupPurpose('');
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  return (
    <Box h="100%" display="flex" flexDirection="column">
      <VStack spacing={6} align="stretch" h="100%">
        {/* Header */}
        <Box flexShrink={0}>
          <Heading size="lg" mb={2} color="purple.600">
            {isModal ? '✨ Create New Group' : '👥 Add Friends to Groups'}
          </Heading>
          <Text color="gray.600">
            {isModal ? 'Select friends and set up your group' : 'Choose friends to coordinate with'}
          </Text>
        </Box>

        {/* Search Bar */}
        <Box flexShrink={0}>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search by name, interests, or location..."
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

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <Box flexShrink={0}>
            <Text fontWeight="semibold" mb={3}>
              Selected Members ({selectedUsers.length})
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              {selectedUsers.map((user) => (
                <Tag
                  key={user.id}
                  size="lg"
                  borderRadius="full"
                  variant="solid"
                  colorScheme="purple"
                >
                  <Avatar
                    src={user.photoURL || 'https://bit.ly/default-avatar'}
                    name={user.displayName || 'User'}
                    size="xs"
                    mr={2}
                  />
                  <TagLabel>{user.displayName || 'User'}</TagLabel>
                  <TagCloseButton
                    onClick={() => handleUserSelect(user)}
                  />
                </Tag>
              ))}
            </HStack>
          </Box>
        )}

        {/* Group Name Input (only in modal) */}
        {isModal && (
          <VStack spacing={4} flexShrink={0}>
            <Box w="100%">
              <Text fontWeight="semibold" mb={3}>
                Group Name
              </Text>
              <Input
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                size="lg"
                bg="white"
                border="2px solid"
                borderColor="gray.200"
                _focus={{
                  borderColor: "purple.400",
                  boxShadow: "0 0 0 1px #9F7AEA",
                }}
              />
            </Box>
            
            <Box w="100%">
              <Text fontWeight="semibold" mb={3}>
                Group Purpose
              </Text>
              <Select
                placeholder="Select group purpose..."
                value={groupPurpose}
                onChange={(e) => setGroupPurpose(e.target.value)}
                size="lg"
                bg="white"
                border="2px solid"
                borderColor="gray.200"
                _focus={{
                  borderColor: "purple.400",
                  boxShadow: "0 0 0 1px #9F7AEA",
                }}
              >
                <option value="social">Social Meetup</option>
                <option value="work">Work/Study</option>
                <option value="food">Food & Dining</option>
                <option value="entertainment">Entertainment</option>
                <option value="fitness">Fitness/Outdoor</option>
                <option value="shopping">Shopping</option>
                <option value="other">Other</option>
              </Select>
            </Box>
          </VStack>
        )}

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
          <Box flexShrink={0} mb={4}>
            <Text fontWeight="semibold">
              Friends in CoordinAIte ({filteredUsers.length})
            </Text>
          </Box>
          
          {filteredUsers.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text fontSize="lg" color="gray.500">
                {searchQuery ? 'No friends found matching your search' : 'No friends to add yet'}
              </Text>
              <Text color="gray.400" mt={2}>
                {searchQuery ? 'Try different search terms' : 'Add friends first to create groups with them'}
              </Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch" pb={4}>
              {filteredUsers.map((user) => {
                const isSelected = selectedUsers.some(u => (u.uid || u.id) === (user.uid || user.id));
                
                return (
                  <Box
                    key={user.id}
                    p={4}
                    border="2px solid"
                    borderColor={isSelected ? "purple.400" : "gray.200"}
                    borderRadius="lg"
                    bg={isSelected ? "purple.50" : "white"}
                    _hover={{ 
                      shadow: 'md',
                      borderColor: isSelected ? "purple.500" : "gray.300",
                      cursor: 'pointer'
                    }}
                    transition="all 0.2s"
                    onClick={() => handleUserSelect(user)}
                  >
                    <Flex align="center" justify="space-between">
                      <Flex align="center" flex={1}>
                        <Checkbox
                          isChecked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation(); // Prevent card click when checkbox is clicked
                            handleUserSelect(user);
                          }}
                          colorScheme="purple"
                          size="lg"
                          mr={4}
                        />
                        
                        <Avatar
                          src={user.photoURL || 'https://bit.ly/default-avatar'}
                          name={user.displayName || 'User'}
                          size="md"
                          mr={3}
                        />
                        <Box flex={1}>
                          <Flex justify="space-between" align="start" mb={2}>
                            <Text fontWeight="bold" fontSize="lg">
                              {user.displayName || 'User'}
                            </Text>
                            <Badge colorScheme={user.isOnline ? 'green' : 'gray'}>
                              {user.isOnline ? 'Online' : 'Offline'}
                            </Badge>
                          </Flex>
                          
                          <Text color="gray.600" mb={2}>
                            📍 {user.location}
                          </Text>
                          
                          {user.interests && user.interests.length > 0 && (
                            <HStack spacing={2} mb={2} flexWrap="wrap">
                              {user.interests.slice(0, 3).map((interest, index) => (
                                <Badge key={index} colorScheme="purple" variant="subtle">
                                  {interest}
                                </Badge>
                              ))}
                              {user.interests.length > 3 && (
                                <Text fontSize="sm" color="gray.500">
                                  +{user.interests.length - 3} more
                                </Text>
                              )}
                            </HStack>
                          )}
                          
                          <Text fontSize="sm" color="gray.500">
                            {user.mutualFriends} mutual connections
                          </Text>
                        </Box>
                      </Flex>
                    </Flex>
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>

        {/* Create Group Button */}
        {(isModal || (!isModal && selectedUsers.length > 0)) && (
          <Box flexShrink={0} mt={6}>
            <Button
              colorScheme="purple"
              size="lg"
              w="100%"
              onClick={handleCreateGroup}
              isDisabled={selectedUsers.length === 0 || (isModal && !groupName.trim())}
            >
              <AddIcon mr={2} />
              {isModal ? 'Create Group' : 'Create Group with Selected Friends'}
            </Button>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default UserDiscovery;
