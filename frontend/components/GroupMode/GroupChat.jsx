import React, { useState, useEffect, useRef } from 'react';
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
  Divider,
  IconButton,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { 
  SunIcon, 
  SettingsIcon, 
  AddIcon,
} from '@chakra-ui/icons';
import { useSelector } from 'react-redux';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';

const GroupChat = ({ group, onMessageSent, onGroupUpdate, onLeaveGroup }) => {
  const { user } = useSelector((state) => state.userReducer);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [editedGroupName, setEditedGroupName] = useState('');
  const messagesEndRef = useRef(null);
  const toast = useToast();
  
  // Modal controls
  const { 
    isOpen: isSettingsOpen, 
    onOpen: onSettingsOpen, 
    onClose: onSettingsClose 
  } = useDisclosure();
  
  const { 
    isOpen: isLeaveOpen, 
    onOpen: onLeaveOpen, 
    onClose: onLeaveClose 
  } = useDisclosure();
  
  const cancelRef = useRef();

  // Safety check for group prop
  if (!group || !group.members) {
    return (
      <Box h="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="gray.500">No group selected</Text>
      </Box>
    );
  }

  // Safety check for user authentication
  if (!user || !user.uid) {
    return (
      <Box h="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="gray.500">Please log in to chat</Text>
      </Box>
    );
  }

  useEffect(() => {
    const q = query(
      collection(db, 'groups', group.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
      setMessages(messages);
    });

    return () => unsubscribe();
  }, [group.id]);

  useEffect(() => {
    if (messages && Array.isArray(messages) && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage || !newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'groups', group.id, 'messages'), {
        userId: user.uid,
        userName: user.displayName,
        userAvatar: user.photoURL,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
      
      // Update the group's last message
      if (onMessageSent) {
        onMessageSent(group.id, newMessage.trim(), user.displayName);
      }
    } catch (error) {
      toast({
        title: 'Error sending message',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAttachment = () => {
    toast({
      title: 'Attachment feature',
      description: 'File sharing coming soon!',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleOpenSettings = () => {
    setEditedGroupName(group.name || '');
    onSettingsOpen();
  };

  const handleSaveGroupName = async () => {
    if (!editedGroupName.trim()) {
      toast({
        title: 'Invalid name',
        description: 'Group name cannot be empty',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const groupRef = doc(db, 'groups', group.id);
      await updateDoc(groupRef, {
        name: editedGroupName.trim(),
        lastMessage: `Group name changed to "${editedGroupName.trim()}"`,
        lastMessageTime: serverTimestamp(),
      });

      // Add system message to chat
      await addDoc(collection(db, 'groups', group.id, 'messages'), {
        userId: 'system',
        userName: 'System',
        userAvatar: '',
        message: `${user.displayName} changed the group name to "${editedGroupName.trim()}"`,
        timestamp: serverTimestamp(),
        isSystemMessage: true,
      });

      toast({
        title: 'Group name updated',
        description: `Group renamed to "${editedGroupName.trim()}"`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSettingsClose();
      
      // Notify parent component with updated group data
      if (onGroupUpdate) {
        const updatedGroup = {
          ...group,
          name: editedGroupName.trim()
        };
        onGroupUpdate(updatedGroup);
      }
    } catch (error) {
      console.error('Error updating group name:', error);
      toast({
        title: 'Error updating group',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const groupRef = doc(db, 'groups', group.id);
      
      // Remove user from memberIds array
      const updatedMemberIds = group.memberIds.filter(id => id !== user.uid);
      const updatedMembers = group.members.filter(member => (member.id || member.uid) !== user.uid);
      
      await updateDoc(groupRef, {
        memberIds: updatedMemberIds,
        members: updatedMembers,
        lastMessage: `${user.displayName} left the group`,
        lastMessageTime: serverTimestamp(),
      });

      // Add system message to chat
      await addDoc(collection(db, 'groups', group.id, 'messages'), {
        userId: 'system',
        userName: 'System',
        userAvatar: '',
        message: `${user.displayName} left the group`,
        timestamp: serverTimestamp(),
        isSystemMessage: true,
      });

      toast({
        title: 'Left group',
        description: `You have left "${group.name}"`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      onLeaveClose();
      
      // Notify parent component if callback provided
      if (onLeaveGroup) {
        onLeaveGroup(group.id);
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: 'Error leaving group',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Listen for typing indicators
  useEffect(() => {
    const typingCollectionRef = collection(db, 'groups', group.id, 'typing');
    
    const unsubscribe = onSnapshot(typingCollectionRef, (snapshot) => {
      const typingUsers = [];
      snapshot.docs.forEach((doc) => {
        const typingData = doc.data();
        if (typingData.timestamp > Date.now() - 3000) { // 3 seconds timeout
          typingUsers.push({
            uid: doc.id,
            userName: typingData.userName
          });
        }
      });
      setTypingUsers(typingUsers);
    });

    return () => unsubscribe();
  }, [group.id]);

  // Update typing status
  const updateTypingStatus = async (isTyping) => {
    try {
      const typingDocRef = doc(db, 'groups', group.id, 'typing', user.uid);
      if (isTyping) {
        await setDoc(typingDocRef, {
          timestamp: Date.now(),
          userName: user.displayName
        });
      } else {
        await deleteDoc(typingDocRef);
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  return (
    <Box h="100%" display="flex" flexDirection="column">
      {/* Chat Header */}
      <Box p={4} borderBottom="1px solid" borderColor="gray.200" bg="white">
        <Flex justify="space-between" align="center">
          <Flex align="center">
            <Avatar
              src={group.members[0]?.avatar || 'https://bit.ly/default-avatar'}
              name={group.name || 'Group'}
              size="md"
              mr={3}
            />
            <Box>
              <Heading size="md" color="purple.600">
                {group.name || 'Group'}
              </Heading>
              <Text fontSize="sm" color="gray.500">
                {group.members.length || 0} members
              </Text>
            </Box>
          </Flex>
          
          <HStack spacing={2}>
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<SettingsIcon />}
                aria-label="More options"
                variant="ghost"
                colorScheme="purple"
              />
              <MenuList>
                <MenuItem icon={<AddIcon />} onClick={handleAttachment}>
                  Share Files
                </MenuItem>
                <MenuItem icon={<SettingsIcon />} onClick={handleOpenSettings}>
                  Group Settings
                </MenuItem>
                <MenuItem color="red.500" onClick={onLeaveOpen}>
                  Leave Group
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      {/* Messages Area */}
      <Box flex={1} overflowY="auto" p={4} bg="gray.50">
        <VStack spacing={4} align="stretch">
          {messages && Array.isArray(messages) && messages.length > 0 ? (
            messages.map((message) => (
              <Box
                key={message.id || Math.random()}
                alignSelf={message.userId === 'system' ? 'center' : (message.userId === user?.uid ? 'flex-end' : 'flex-start')}
                maxW={message.userId === 'system' ? '90%' : '70%'}
              >
                {message.userId === 'system' ? (
                  // System message styling
                  <Box
                    bg="gray.100"
                    color="gray.600"
                    px={3}
                    py={1}
                    borderRadius="full"
                    border="1px solid"
                    borderColor="gray.200"
                    textAlign="center"
                  >
                    <Text fontSize="xs">{message.message || ''}</Text>
                  </Box>
                ) : (
                  // Regular message styling
                  <Flex direction={message.userId === user?.uid ? 'row-reverse' : 'row'} align="end">
                    {message.userId !== user?.uid && (
                      <Avatar
                        src={message.userAvatar || 'https://bit.ly/default-avatar'}
                        name={message.userName || 'User'}
                        size="sm"
                        mr={2}
                      />
                    )}
                    
                    <Box
                      bg={message.userId === user?.uid ? 'purple.500' : 'white'}
                      color={message.userId === user?.uid ? 'white' : 'black'}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={message.userId === user?.uid ? 'transparent' : 'gray.200'}
                      boxShadow="sm"
                    >
                      {message.userId !== user?.uid && (
                        <Text fontSize="xs" color="gray.500" mb={1}>
                          {message.userName || 'User'}
                        </Text>
                      )}
                      <Text fontSize="sm">{message.message || ''}</Text>
                      <Text
                        fontSize="xs"
                        color={message.userId === user?.uid ? 'purple.100' : 'gray.500'}
                        mt={1}
                        textAlign={message.userId === user?.uid ? 'right' : 'left'}
                      >
                        {message.timestamp || ''}
                      </Text>
                    </Box>
                  </Flex>
                )}
              </Box>
            ))
          ) : (
            <Box textAlign="center" py={10}>
              <Text color="gray.500">No messages yet. Start the conversation!</Text>
            </Box>
          )}
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <Box alignSelf="flex-start" maxW="70%">
              <Flex align="end">
                <Avatar
                  src={group.members.find(m => m.id === typingUsers[0]?.uid)?.avatar || 'https://bit.ly/default-avatar'}
                  name={typingUsers[0]?.userName || 'Member'}
                  size="sm"
                  mr={2}
                />
                <Box
                  bg="white"
                  px={4}
                  py={2}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Text fontSize="sm" color="gray.500">
                    {typingUsers.length === 1 
                      ? `${typingUsers[0]?.userName || 'Someone'} is typing...`
                      : `${typingUsers.length} people are typing...`
                    }
                  </Text>
                </Box>
              </Flex>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {/* Message Input */}
      <Box p={4} borderTop="1px solid" borderColor="gray.200" bg="white">
        <Flex>
          <Input
            placeholder="Type a message..."
            value={newMessage || ''}
            onChange={(e) => {
              setNewMessage(e.target.value || '');
              updateTypingStatus(true);
            }}
            onKeyPress={(e) => {
              if (e && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                updateTypingStatus(false);
                handleSendMessage();
              }
            }}
            onBlur={() => updateTypingStatus(false)}
            mr={2}
            size="lg"
          />
          <Button
            colorScheme="purple"
            onClick={() => {
              updateTypingStatus(false);
              handleSendMessage();
            }}
            isDisabled={!newMessage || !newMessage.trim()}
            size="lg"
          >
            <SunIcon />
          </Button>
        </Flex>
      </Box>

      {/* Group Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Group Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Group Name</FormLabel>
                <Input
                  value={editedGroupName}
                  onChange={(e) => setEditedGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  size="lg"
                />
              </FormControl>
              
              <Box>
                <Text fontWeight="semibold" mb={2}>Group Members</Text>
                <VStack spacing={2} align="stretch">
                  {group.members.map((member, index) => (
                    <HStack key={index} spacing={3}>
                      <Avatar
                        src={member.avatar}
                        name={member.name}
                        size="sm"
                      />
                      <Text flex="1">{member.name}</Text>
                      {member.id === user.uid && (
                        <Badge colorScheme="purple" variant="subtle">You</Badge>
                      )}
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={onSettingsClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="purple" 
              onClick={handleSaveGroupName}
              isDisabled={!editedGroupName.trim() || editedGroupName.trim() === group.name}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Leave Group Confirmation Dialog */}
      <AlertDialog
        isOpen={isLeaveOpen}
        leastDestructiveRef={cancelRef}
        onClose={onLeaveClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Leave Group
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing={4} align="center">
                <Avatar
                  src={group.members[0]?.avatar || 'https://bit.ly/default-avatar'}
                  name={group.name || 'Group'}
                  size="lg"
                />
                <Text textAlign="center">
                  Are you sure you want to leave <strong>"{group.name}"</strong>?
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  You'll no longer receive messages from this group and won't be able to participate in conversations.
                </Text>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onLeaveClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleLeaveGroup} 
                ml={3}
              >
                Leave Group
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default GroupChat;
