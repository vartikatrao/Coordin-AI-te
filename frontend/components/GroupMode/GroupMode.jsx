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
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { AddIcon, SearchIcon, ChatIcon, ViewIcon, DeleteIcon } from '@chakra-ui/icons';
import UserDiscovery from './UserDiscovery';
import GroupChat from './GroupChat';
import LocationFinder from './LocationFinder';
import FriendSearch from './FriendSearch';
import FriendRequests from './FriendRequests';
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
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';

const GroupMode = () => {
  const { user } = useSelector((state) => state.userReducer);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('groups'); // 'groups', 'discovery', 'friends', 'requests', 'chat', 'location'
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  const [groupToDelete, setGroupToDelete] = useState(null);
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
      
      // Update currentGroup if it exists and has been modified
      if (currentGroup) {
        const updatedCurrentGroup = sortedGroups.find(g => g.id === currentGroup.id);
        if (updatedCurrentGroup) {
          setCurrentGroup(updatedCurrentGroup);
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid, currentGroup?.id]);

  // Filter groups based on search query
  useEffect(() => {
    if (groupSearchQuery.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(group =>
        group.name?.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
        group.members?.some(member => 
          member.name?.toLowerCase().includes(groupSearchQuery.toLowerCase())
        ) ||
        group.lastMessage?.toLowerCase().includes(groupSearchQuery.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [groupSearchQuery, groups]);

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
        const recommendationText = aiData.results?.recommendation || 
                                 aiData.results?.summary || 
                                 aiData.results?.raw ||
                                 'AI-powered location recommendations generated';
        
        await updateDoc(docRef, {
          aiRecommendations: aiData.results,
          lastMessage: `AI Recommendation: ${recommendationText.substring(0, 100)}...`,
          lastMessageTime: serverTimestamp(),
        });
        
        // Update local state with AI recommendations
        groupWithId.aiRecommendations = aiData.results;
        groupWithId.lastMessage = `AI Recommendation: ${recommendationText.substring(0, 100)}...`;
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

  const handleDeleteClick = (group, event) => {
    event.stopPropagation(); // Prevent group selection when clicking delete
    setGroupToDelete(group);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;

    try {
      // Delete from Firebase
      await deleteDoc(doc(db, 'groups', groupToDelete.id));

      // Note: No need to manually update local state since the onSnapshot listener
      // will automatically remove the group from the groups array when it's deleted from Firebase
      
      // If the deleted group was currently selected, clear selection
      if (currentGroup?.id === groupToDelete.id) {
        setCurrentGroup(null);
        setActiveTab('groups');
      }

      toast({
        title: 'Group deleted',
        description: `${groupToDelete.name} has been deleted`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      setGroupToDelete(null);
      onDeleteClose();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Error deleting group',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
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
          <Button colorScheme="blackAlpha" onClick={() => window.location.href = '/'}>
            Go to Login
          </Button>
        </VStack>
      </Box>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'groups':
        return (
          <Box>
            <Heading size="lg" mb={4}>My Groups</Heading>

            {groups.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color="gray.500" fontSize="lg">No groups yet</Text>
                <Text color="gray.400" mt={2}>Create your first group to get started!</Text>
                <Button 
                  mt={4} 
                  colorScheme="purple" 
                  onClick={() => setActiveTab('discovery')}
                >
                  Create Group
                </Button>
              </Box>
            ) : (
              <Text color="gray.500">
                Select a group from the sidebar to view details, chat, or find locations.
              </Text>
            )}
          </Box>
        );
      case 'discovery':
        return <UserDiscovery onCreateGroup={handleCreateGroup} />;
      case 'friends':
        return <FriendSearch />;
      case 'requests':
        return <FriendRequests />;
      case 'chat':
        return currentGroup ? (
          <GroupChat 
            group={currentGroup} 
            onMessageSent={updateGroupLastMessage}
            onGroupUpdate={(updatedGroup) => {
              // Update currentGroup immediately with the new data
              if (updatedGroup && currentGroup?.id === updatedGroup.id) {
                setCurrentGroup(updatedGroup);
              }
              // The groups list will automatically update via the onSnapshot listener
            }}
            onLeaveGroup={(groupId) => {
              // Handle leaving group - clear current group and go back to groups list
              if (currentGroup?.id === groupId) {
                setCurrentGroup(null);
                setActiveTab('groups');
              }
            }}
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
        return (
          <Box>
            <Heading size="lg" mb={4}>My Groups</Heading>

            {groups.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color="gray.500" fontSize="lg">No groups yet</Text>
                <Text color="gray.400" mt={2}>Create your first group to get started!</Text>
                <Button 
                  mt={4} 
                  colorScheme="purple" 
                  onClick={() => setActiveTab('discovery')}
                >
                  Create Group
                </Button>
              </Box>
            ) : (
              <Text color="gray.500">
                Select a group from the sidebar to view details, chat, or find locations.
              </Text>
            )}
          </Box>
        );
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottom="1px solid" borderColor="gray.200" px={6} py={4}>
        <Flex justify="space-between" align="center">
          <Heading size="lg" color="black">Group Mode</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blackAlpha"
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
            <Input 
              placeholder="Search groups..." 
              size="sm" 
              value={groupSearchQuery}
              onChange={(e) => setGroupSearchQuery(e.target.value)}
            />
          </Box>
          
          <VStack spacing={0} align="stretch">
            {filteredGroups.length === 0 && groupSearchQuery.trim() !== '' ? (
              <Box p={4} textAlign="center">
                <Text color="gray.500" fontSize="sm">
                  No groups found matching "{groupSearchQuery}"
                </Text>
              </Box>
            ) : (
              filteredGroups.map((group) => (
              <Box
                key={group.id}
                p={4}
                cursor="pointer"
                bg={currentGroup?.id === group.id ? 'gray.50' : 'white'}
                borderLeft={currentGroup?.id === group.id ? '4px solid' : 'none'}
                borderColor="gray.500"
                _hover={{ bg: 'gray.50' }}
                onClick={() => handleGroupSelect(group)}
              >
                <Flex justify="space-between" align="start" mb={2}>
                  <Text fontWeight="semibold" noOfLines={1}>
                    {group.name}
                  </Text>
                  <HStack spacing={2}>
                    {group.unreadCount > 0 && (
                      <Badge colorScheme="red" borderRadius="full">
                        {group.unreadCount}
                      </Badge>
                    )}
                    <IconButton
                      size="xs"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      variant="ghost"
                      aria-label="Delete group"
                      onClick={(e) => handleDeleteClick(group, e)}
                      _hover={{ bg: 'red.100' }}
                    />
                  </HStack>
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
              ))
            )}
          </VStack>
        </Box>

        {/* Main Content Area */}
        <Box flex={1} bg="white" display="flex" flexDirection="column">
          {/* Tab Navigation */}
          <Flex borderBottom="1px solid" borderColor="gray.200" wrap="wrap" flexShrink={0}>
            <Button
              variant={activeTab === 'groups' ? 'solid' : 'ghost'}
              colorScheme={activeTab === 'groups' ? 'purple' : 'gray'}
              borderRadius="none"
              onClick={() => setActiveTab('groups')}
              size="sm"
            >
              My Groups
            </Button>
            <Button
              variant={activeTab === 'discovery' ? 'solid' : 'ghost'}
              colorScheme={activeTab === 'discovery' ? 'purple' : 'gray'}
              borderRadius="none"
              onClick={() => setActiveTab('discovery')}
              size="sm"
            >
              <SearchIcon mr={2} />
              Create Group
            </Button>
            <Button
              variant={activeTab === 'friends' ? 'solid' : 'ghost'}
              colorScheme={activeTab === 'friends' ? 'purple' : 'gray'}
              borderRadius="none"
              onClick={() => setActiveTab('friends')}
              size="sm"
            >
              <AddIcon mr={2} />
              Find Friends
            </Button>
            <Button
              variant={activeTab === 'requests' ? 'solid' : 'ghost'}
              colorScheme={activeTab === 'requests' ? 'purple' : 'gray'}
              borderRadius="none"
              onClick={() => setActiveTab('requests')}
              size="sm"
            >
              Friend Requests
            </Button>
            <Button
              variant={activeTab === 'chat' ? 'solid' : 'ghost'}
              colorScheme={activeTab === 'chat' ? 'purple' : 'gray'}
              borderRadius="none"
              onClick={() => setActiveTab('chat')}
              isDisabled={!currentGroup}
              size="sm"
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
              size="sm"
            >
              <ViewIcon mr={2} />
              Find Location
            </Button>
          </Flex>

          {/* Content */}
          <Box p={6} flex="1" h="0">
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

      {/* Delete Group Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Group
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{groupToDelete?.name}"? 
              This action cannot be undone and will remove all messages and data associated with this group.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDeleteConfirm} 
                ml={3}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default GroupMode;
