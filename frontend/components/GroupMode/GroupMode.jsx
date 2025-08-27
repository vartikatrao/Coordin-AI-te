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
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  IconButton,
} from '@chakra-ui/react';
import { AddIcon, SearchIcon, ChatIcon, ViewIcon } from '@chakra-ui/icons';
import UserDiscovery from './UserDiscovery';
import GroupChat from './GroupChat';
import LocationFinder from './LocationFinder';
import { useSelector } from 'react-redux';
import { groupModeAPI } from '@/services/api';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';

const GroupMode = () => {
  const { user } = useSelector((state) => state.userReducer);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('discovery'); // 'discovery', 'chat', 'location'
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Set loading to false once user state is determined
  useEffect(() => {
    if (user !== undefined) {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch user's groups from Firebase
  useEffect(() => {
    if (!user || !user.uid) return;

    const q = query(
      collection(db, 'groups'),
      where('memberIds', 'array-contains', user.uid)
      // Temporarily removed orderBy to avoid index requirement
      // orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        lastMessageTime: doc.data().lastMessageTime?.toDate().toLocaleString([], { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      }));
      
      // Sort groups client-side by lastMessageTime
      const sortedGroups = groups.sort((a, b) => {
        if (!a.lastMessageTime || !b.lastMessageTime) return 0;
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      });
      
      setGroups(sortedGroups);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleCreateGroup = async (groupData) => {
    try {
      // First create the group in Firebase
      const newGroup = {
        name: groupData.name,
        members: groupData.members,
        memberIds: groupData.members.map(m => m.id),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        lastMessage: 'Group created!',
        lastMessageTime: serverTimestamp(),
        unreadCount: 0,
      };

      const docRef = await addDoc(collection(db, 'groups'), newGroup);
      
      // Update the new group with the Firebase ID
      const groupWithId = { ...newGroup, id: docRef.id };
      
      // Now get AI-powered recommendations for the group using the backend
      try {
        const aiData = await groupModeAPI.findGroupMeetup(
          groupData.members.map(m => ({
            name: m.name,
            location: m.location || 'Unknown'
          })),
          groupData.purpose || 'meeting',
          groupData.members.length
        );

        // Store AI recommendations in the group
        await updateDoc(docRef, {
          aiRecommendations: aiData.meetup_plan,
          lastMessage: `AI Recommendation: ${aiData.meetup_plan.substring(0, 100)}...`,
          lastMessageTime: serverTimestamp(),
        });
        
        // Update local state with AI recommendations
        groupWithId.aiRecommendations = aiData.meetup_plan;
        groupWithId.lastMessage = `AI Recommendation: ${aiData.meetup_plan.substring(0, 100)}...`;
      } catch (aiError) {
        console.warn('AI recommendations failed, continuing with group creation:', aiError);
      }
      
      setCurrentGroup(groupWithId);
      setActiveTab('chat');
      onClose();
      
      toast({
        title: 'Group created!',
        description: `${newGroup.name} is ready for coordination`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error creating group',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleGroupSelect = (group) => {
    setCurrentGroup(group);
    setActiveTab('chat');
  };

  const updateGroupLastMessage = async (groupId, message, senderName) => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        lastMessage: message,
        lastMessageTime: serverTimestamp(),
        lastSender: senderName,
      });
    } catch (error) {
      console.error('Error updating group last message:', error);
    }
  };

  // Safety check for user authentication - moved after all hooks
  if (isLoading) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Text color="gray.500">Loading...</Text>
        </VStack>
      </Box>
    );
  }

  if (!user || !user.uid) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Text color="gray.500">Please log in to access Group Mode</Text>
          <Button colorScheme="purple" onClick={() => window.location.href = '/'}>
            Go to Login
          </Button>
        </VStack>
      </Box>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'discovery':
        return <UserDiscovery onCreateGroup={handleCreateGroup} />;
      case 'chat':
        return currentGroup ? (
          <GroupChat 
            group={currentGroup} 
            onMessageSent={updateGroupLastMessage}
          />
        ) : (
          <Box textAlign="center" py={10}>
            <Text color="gray.500">Select a group to start chatting</Text>
          </Box>
        );
      case 'location':
        return currentGroup ? (
          <LocationFinder group={currentGroup} />
        ) : (
          <Box textAlign="center" py={10}>
            <Text color="gray.500">Select a group to find locations</Text>
          </Box>
        );
      default:
        return <UserDiscovery onCreateGroup={handleCreateGroup} />;
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottom="1px solid" borderColor="gray.200" px={6} py={4}>
        <Flex justify="space-between" align="center">
          <Heading size="lg" color="purple.600">Group Mode</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="purple"
            onClick={onOpen}
          >
            Create Group
          </Button>
        </Flex>
      </Box>

      <Flex h="calc(100vh - 80px)">
        {/* Left Sidebar - Groups List */}
        <Box w="300px" bg="white" borderRight="1px solid" borderColor="gray.200">
          <Box p={4} borderBottom="1px solid" borderColor="gray.200">
            <Text fontWeight="bold" mb={3}>Your Groups</Text>
            <Input placeholder="Search groups..." size="sm" />
          </Box>
          
          <VStack spacing={0} align="stretch">
            {groups.map((group) => (
              <Box
                key={group.id}
                p={4}
                cursor="pointer"
                bg={currentGroup?.id === group.id ? 'purple.50' : 'white'}
                borderLeft={currentGroup?.id === group.id ? '4px solid' : 'none'}
                borderColor="purple.500"
                _hover={{ bg: 'gray.50' }}
                onClick={() => handleGroupSelect(group)}
              >
                <Flex justify="space-between" align="start" mb={2}>
                  <Text fontWeight="semibold" noOfLines={1}>
                    {group.name}
                  </Text>
                  {group.unreadCount > 0 && (
                    <Badge colorScheme="red" borderRadius="full">
                      {group.unreadCount}
                    </Badge>
                  )}
                </Flex>
                
                <Text fontSize="sm" color="gray.600" noOfLines={1} mb={2}>
                  {group.lastMessage}
                </Text>
                
                <Flex justify="space-between" align="center">
                  <HStack spacing={2}>
                    {group.members.slice(0, 3).map((member) => (
                      <Avatar
                        key={member.id}
                        size="xs"
                        name={member.name}
                        src={member.avatar}
                      />
                    ))}
                    {group.members.length > 3 && (
                      <Text fontSize="xs" color="gray.500">
                        +{group.members.length - 3} more
                      </Text>
                    )}
                  </HStack>
                  <Text fontSize="xs" color="gray.500">
                    {group.lastMessageTime}
                  </Text>
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Main Content Area */}
        <Box flex={1} bg="white">
          {/* Tab Navigation */}
          <Flex borderBottom="1px solid" borderColor="gray.200">
            <Button
              variant={activeTab === 'discovery' ? 'solid' : 'ghost'}
              colorScheme={activeTab === 'discovery' ? 'purple' : 'gray'}
              borderRadius="none"
              onClick={() => setActiveTab('discovery')}
            >
              <SearchIcon mr={2} />
              Find People
            </Button>
            <Button
              variant={activeTab === 'chat' ? 'solid' : 'ghost'}
              colorScheme={activeTab === 'chat' ? 'purple' : 'gray'}
              borderRadius="none"
              onClick={() => setActiveTab('chat')}
              isDisabled={!currentGroup}
            >
              <ChatIcon mr={2} />
              Group Chat
            </Button>
            <Button
              variant={activeTab === 'location' ? 'solid' : 'ghost'}
              colorScheme={activeTab === 'location' ? 'purple' : 'gray'}
              borderRadius="none"
              onClick={() => setActiveTab('location')}
              isDisabled={!currentGroup}
            >
              <ViewIcon mr={2} />
              Find Location
            </Button>
          </Flex>

          {/* Content */}
          <Box p={6}>
            {renderContent()}
          </Box>
        </Box>
      </Flex>

      {/* Create Group Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <UserDiscovery onCreateGroup={handleCreateGroup} isModal={true} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GroupMode;
