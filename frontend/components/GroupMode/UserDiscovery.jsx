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
} from '@chakra-ui/react';
import { SearchIcon, AddIcon } from '@chakra-ui/icons';
import { useSelector } from 'react-redux';
import { 
  collection, 
  onSnapshot, 
  query, 
  where,
  orderBy
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

  // Fetch all users from Firebase (excluding current user)
  useEffect(() => {
    const q = query(
      collection(db, 'users')
      // Temporarily removed orderBy to avoid index requirement
      // orderBy('displayName')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          interests: doc.data().interests || [],
          location: doc.data().location || 'Unknown',
          mutualFriends: 0, // TODO: Implement mutual friends logic
          isOnline: Math.random() > 0.5, // TODO: Implement real online status
        }))
        .filter(userData => userData.uid !== user.uid) // Filter out current user client-side
        .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '')); // Sort client-side
      
      setAllUsers(users);
      setFilteredUsers(users);
    });

    return () => unsubscribe();
  }, [user.uid]);

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

    if (!groupName.trim()) {
      toast({
        title: 'Group name required',
        description: 'Please enter a name for your group',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!groupPurpose) {
      toast({
        title: 'Group purpose required',
        description: 'Please select a purpose for your group',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const groupData = {
      name: groupName.trim(),
      purpose: groupPurpose,
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
    <Box>
      <Heading size="md" mb={6} color="purple.600">
        {isModal ? 'Create New Group' : 'Find People & Create Groups'}
      </Heading>

      {/* Search Bar */}
      <Box mb={6}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search by name, interests, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="lg"
          />
        </InputGroup>
      </Box>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <Box mb={6}>
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
        <VStack spacing={4} mb={6}>
          <Box w="100%">
            <Text fontWeight="semibold" mb={3}>
              Group Name
            </Text>
            <Input
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              size="lg"
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

      {/* Users List */}
      <Box>
        <Text fontWeight="semibold" mb={4}>
          People in CoordinAIte ({filteredUsers.length})
        </Text>
        
        <VStack spacing={3} align="stretch">
          {filteredUsers.map((user) => (
            <Box
              key={user.id}
              p={4}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              bg="white"
              _hover={{ shadow: 'md' }}
              transition="all 0.2s"
            >
              <Flex align="center" justify="space-between">
                <Flex align="center" flex={1}>
                  <Checkbox
                    isChecked={selectedUsers.some(u => (u.uid || u.id) === (user.uid || user.id))}
                    onChange={() => handleUserSelect(user)}
                    colorScheme="purple"
                    size="lg"
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
          ))}
        </VStack>
      </Box>

      {/* Create Group Button (only in modal) */}
      {isModal && (
        <Box mt={6}>
          <Button
            colorScheme="purple"
            size="lg"
            w="100%"
            onClick={handleCreateGroup}
            isDisabled={selectedUsers.length === 0 || !groupName.trim()}
          >
            <AddIcon mr={2} />
            Create Group
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default UserDiscovery;
