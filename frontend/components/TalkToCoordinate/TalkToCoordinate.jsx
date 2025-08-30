import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  useToast,
  Spinner,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Divider,
  Card,
  CardBody,
  Avatar,
  Alert,
  AlertIcon,
  Badge,
} from '@chakra-ui/react';
import { ChatIcon, HamburgerIcon, AddIcon, ArrowForwardIcon, DeleteIcon } from '@chakra-ui/icons';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query as firestoreQuery, 
  where, 
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { SendIcon } from '@chakra-ui/icons';

const TalkToCoordinate = () => {
  const { user } = useSelector((state) => state.userReducer);
  const { place, coordinates } = useSelector((state) => state.placeReducer);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Note: Removed auto-creation of conversations - they're now created only when first message is sent

  // Handle query parameter and automatically send message
  useEffect(() => {
    if (router.query.message && user?.uid && currentConversationId) {
      const message = router.query.message;
      setQuery(message);
      
      // Create a synthetic event for handleSubmit
      const syntheticEvent = { preventDefault: () => {} };
      handleSubmit(syntheticEvent, message);
      
      // Clear the query parameter
      router.replace('/talk-to-coordinate', undefined, { shallow: true });
    }
  }, [router.query.message, user?.uid, currentConversationId]);

  // Fetch user's conversations from Firebase
  useEffect(() => {
    if (!user || !user.uid) return;

    // Simplified query without ordering to avoid index requirement
    const q = firestoreQuery(
      collection(db, 'conversations'),
      where('userId', '==', user.uid)
      // Removed orderBy temporarily to fix the index issue
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Keep the original timestamp for sorting
        lastMessageTimeRaw: doc.data().lastMessageTime?.toDate(),
        // Format for display
        lastMessageTime: doc.data().lastMessageTime?.toDate().toLocaleString([], { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      }))
      // Filter out conversations with no messages (messageCount = 0)
      .filter(convo => convo.messageCount > 0)
      // Sort by the raw timestamp instead of the formatted string
      .sort((a, b) => {
        if (a.lastMessageTimeRaw && b.lastMessageTimeRaw) {
          return b.lastMessageTimeRaw - a.lastMessageTimeRaw;
        }
        return 0;
      });
      
      setConversations(convos);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch messages for current conversation
  useEffect(() => {
    if (!currentConversationId) return;

    // Simplified query without ordering to avoid index requirement
    const q = firestoreQuery(
      collection(db, 'messages'),
      where('conversationId', '==', currentConversationId)
      // Removed orderBy temporarily to fix the index issue
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }))
      // Sort locally instead of in the query
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      setChatHistory(messages);
    });

    return () => unsubscribe();
  }, [currentConversationId]);

  const createNewConversation = async (firstMessage, messageTitle) => {
    try {
      const newConversation = {
        userId: user.uid,
        title: messageTitle || 'New Chat',
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        messageCount: 0,
      };

      const docRef = await addDoc(collection(db, 'conversations'), newConversation);
      setCurrentConversationId(docRef.id);
      setConversationTitle(messageTitle || '');
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new conversation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };

  // Start a new conversation locally (without saving to Firebase yet)
  const startNewConversation = () => {
    setCurrentConversationId(null);
    setChatHistory([]);
    setConversationTitle('');
    onClose();
  };

  // Function to generate conversation title using Gemini AI
  const generateConversationTitle = async (message) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/solo/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          max_length: 100
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.data && result.data.title) {
        return result.data.title;
      } else {
        // Fallback to simple truncation
        return message.length > 100 ? message.substring(0, 97) + '...' : message;
      }
    } catch (error) {
      console.error('Error generating title:', error);
      // Fallback to simple truncation
      return message.length > 100 ? message.substring(0, 97) + '...' : message;
    }
  };

  // Function to handle example button clicks - send directly to backend
  const handleExampleClick = async (exampleText) => {
    // Create conversation only when first message is sent
    let conversationId = currentConversationId;
    if (!conversationId) {
      // Use quick local title generation first, then update later
      const quickTitle = exampleText.length > 50 ? exampleText.substring(0, 47) + '...' : exampleText;
      conversationId = await createNewConversation(exampleText, quickTitle);
      setCurrentConversationId(conversationId);
      setConversationTitle(quickTitle);
      
      // Generate better title in background
      generateConversationTitle(exampleText).then(betterTitle => {
        setConversationTitle(betterTitle);
        updateDoc(doc(db, 'conversations', conversationId), { title: betterTitle });
      });
    }

    const userMessage = { 
      type: 'user', 
      content: exampleText, 
      timestamp: new Date(),
      conversationId: conversationId,
      userId: user.uid
    };

    // Add user message to local state immediately for instant UI response
    setChatHistory(prev => [...prev, userMessage]);

    // Add user message to database in background
    try {
      await addDoc(collection(db, 'messages'), {
        ...userMessage,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving user message:', error);
      // Remove from local state if save failed
      setChatHistory(prev => prev.filter(msg => msg !== userMessage));
      return; // Stop if user message fails to save
    }

    // Set loading state for AI response (not for sending)
    setIsLoading(true);
    
    try {
      // Get AI response from backend
      const aiResponse = await generateAIResponse(exampleText);
      
      const aiMessage = { 
        type: 'ai', 
        content: aiResponse, 
        timestamp: new Date(),
        conversationId: currentConversationId,
        userId: user.uid
      };

      // Add AI message to database
      await addDoc(collection(db, 'messages'), {
        ...aiMessage,
        timestamp: serverTimestamp(),
      });

      // Update conversation with last message time and title
      // Use the actual count of messages we just added (Firebase listener will have the updated count)
      const newMessageCount = chatHistory.length + 2; // +2 for user + AI message
      await updateDoc(doc(db, 'conversations', currentConversationId), {
        lastMessageTime: serverTimestamp(),
        messageCount: newMessageCount,
        title: conversationTitle || await generateConversationTitle(exampleText)
      });
      
      console.log('Successfully saved conversation with', newMessageCount, 'messages');
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        type: 'ai', 
        content: { error: 'Sorry, I encountered an error. Please try again.' }, 
        timestamp: new Date() 
      };
      
      // Add error message to local state
      setChatHistory(prev => [...prev, errorMessage]);
      
      // Keep error toast for debugging purposes
      toast({
        title: 'Error',
        description: 'Failed to get AI response',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e, messageContent = null) => {
    e.preventDefault();
    const messageToSend = messageContent || query;
    if (!messageToSend.trim()) return;

    // Create conversation only when first message is sent
    let conversationId = currentConversationId;
    if (!conversationId) {
      // Use quick local title generation first, then update later
      const quickTitle = messageToSend.length > 50 ? messageToSend.substring(0, 47) + '...' : messageToSend;
      conversationId = await createNewConversation(messageToSend, quickTitle);
      setCurrentConversationId(conversationId);
      setConversationTitle(quickTitle);
      
      // Generate better title in background
      generateConversationTitle(messageToSend).then(betterTitle => {
        setConversationTitle(betterTitle);
        updateDoc(doc(db, 'conversations', conversationId), { title: betterTitle });
      });
    }

    const userMessage = { 
      type: 'user', 
      content: messageToSend, 
      timestamp: new Date(),
      conversationId: conversationId,
      userId: user.uid
    };

    // Add user message to local state immediately for instant UI response
    setChatHistory(prev => [...prev, userMessage]);
    setQuery(''); // Clear input immediately

    // Add user message to database in background
    try {
      await addDoc(collection(db, 'messages'), {
        ...userMessage,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving user message:', error);
      // Remove from local state if save failed
      setChatHistory(prev => prev.filter(msg => msg !== userMessage));
      return; // Stop if user message fails to save
    }

    // Set loading state for AI response (not for sending)
    setIsLoading(true);
    
    try {
      // Get AI response from backend
      const aiResponse = await generateAIResponse(messageToSend);
      
      const aiMessage = { 
        type: 'ai', 
        content: aiResponse, 
        timestamp: new Date(),
        conversationId: currentConversationId,
        userId: user.uid
      };

      // Add AI message to database only - Firebase listener will update local state
      await addDoc(collection(db, 'messages'), {
        ...aiMessage,
        timestamp: serverTimestamp(),
      });

      // Update conversation with last message time and title
      // Use the actual count of messages we just added (Firebase listener will have the updated count)
      const newMessageCount = chatHistory.length + 2; // +2 for user + AI message
      await updateDoc(doc(db, 'conversations', currentConversationId), {
        lastMessageTime: serverTimestamp(),
        messageCount: newMessageCount,
        title: conversationTitle || await generateConversationTitle(messageToSend)
      });
      
      console.log('Successfully saved conversation with', newMessageCount, 'messages');
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        type: 'ai', 
        content: { error: 'Sorry, I encountered an error. Please try again.' }, 
        timestamp: new Date() 
      };
      
      // Add error message to local state
      setChatHistory(prev => [...prev, errorMessage]);
      
      // Keep error toast for debugging purposes
      toast({
        title: 'Error',
        description: 'Failed to get AI response',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (userQuery) => {
    try {
      // Call your backend AI service directly
      console.log('Calling backend AI service with query:', userQuery);
      
      const response = await fetch('http://localhost:8000/api/v1/solo/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userQuery,
          user_location: coordinates ? `${coordinates.lat},${coordinates.lon}` : (place || "12.9716,77.5946") // Use coordinates when available, otherwise place name or default
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Backend response:', result);
      console.log('Result data:', result.data);
      console.log('Recommendations:', result.data?.recommendations);

      if (result.status === 'success') {
        // Extract the main recommendation text from the recommendations field
        let mainRecommendation = "AI recommendation generated successfully";
        let places = [];
        
        // Check if recommendations exist and have the expected structure
        if (result.data?.recommendations) {
          console.log('Found recommendations field:', result.data.recommendations);
          
          // Try to extract from different possible structures
          if (result.data.recommendations.raw) {
            mainRecommendation = result.data.recommendations.raw;
            console.log('Using raw field from recommendations');
          } else if (result.data.recommendations.tasks_output) {
            console.log('Found tasks_output in recommendations');
            
            // Look for the recommendation task output
            const recommendationTask = result.data.recommendations.tasks_output.find(task => 
              task.agent === "Personalized Recommendation Expert"
            );
            
            if (recommendationTask?.raw) {
              console.log('Found recommendation task:', recommendationTask.raw);
              mainRecommendation = recommendationTask.raw;
            }

            // Extract places from the Place Discovery Specialist task
            const placeTask = result.data.recommendations.tasks_output.find(task => 
              task.agent === "Place Discovery Specialist"
            );
            
            if (placeTask?.raw) {
              console.log('Found place task:', placeTask.raw);
              try {
                // Parse the JSON array of places
                const placesData = JSON.parse(placeTask.raw);
                if (Array.isArray(placesData)) {
                  places = placesData;
                  console.log('Parsed places:', places);
                }
              } catch (e) {
                console.log('Could not parse places data:', e);
                console.log('Raw place data:', placeTask.raw);
              }
            }
          } else if (typeof result.data.recommendations === 'string') {
            mainRecommendation = result.data.recommendations;
            console.log('Using recommendations as string');
          } else {
            // Try to find any text content in the recommendations object
            const recData = result.data.recommendations;
            if (recData.raw) {
              mainRecommendation = recData.raw;
            } else if (recData.message) {
              mainRecommendation = recData.message;
            } else if (recData.response) {
              mainRecommendation = recData.response;
            } else {
              // Log the entire structure to see what we have
              console.log('Full recommendations structure:', JSON.stringify(recData, null, 2));
            }
          }
        }

        console.log('Final mainRecommendation:', mainRecommendation);
        console.log('Final places:', places);

        return {
          recommendations: "Here's what I found for you:",
          mainText: mainRecommendation,
          places: places,
          tips: "This recommendation is powered by our advanced AI agents that analyze your preferences and local data.",
          rawData: result.data
        };
      } else {
        throw new Error(result.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Backend AI call failed:', error);
      
      // Fallback to smart local response if backend fails
      const query = userQuery.toLowerCase();
      
      if (query.includes('coffee') || query.includes('cafe')) {
        return {
          recommendations: "I'm having trouble connecting to my AI services, but here are some general coffee suggestions:",
          suggestions: [
            "☕ Try searching for 'coffee shops' in your area",
            "☕ Look for places with good WiFi if you need to work",
            "☕ Check reviews for atmosphere and coffee quality"
          ],
          tips: "For more specific recommendations, please try again later when my AI services are available.",
          error: true
        };
      } else if (query.includes('food') || query.includes('restaurant') || query.includes('eat')) {
        return {
          recommendations: "I'm having trouble connecting to my AI services, but here are some general dining tips:",
          suggestions: [
            "🍕 Search for restaurants by cuisine type",
            "🍜 Check ratings and reviews",
            "🍔 Consider location and parking options"
          ],
          tips: "For personalized recommendations, please try again later when my AI services are available.",
          error: true
        };
      } else {
        return {
          recommendations: "I'm having trouble connecting to my AI services right now.",
          suggestions: [
            "Try asking about specific types of places (coffee, food, study, etc.)",
            "Be specific about your preferences and location",
            "Try again in a few moments"
          ],
          tips: "For the best experience, please try again later when my AI services are fully available.",
          error: true
        };
      }
    }
  };

  // Note: Removed custom renderMarkdownText function - now using ReactMarkdown for proper rendering

  const renderPlaceCard = (place) => (
    <Card key={place.fsq_id} bg="white" border="1px solid" borderColor="gray.200" shadow="sm" mb={3}>
      <CardBody>
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold" fontSize="lg" color="purple.600">
                {place.name}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {place.location.formatted_address}
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme="green" variant="subtle">
                  {place.distance}m away
                </Badge>
                {place.categories?.[0]?.name && (
                  <Badge colorScheme="blue" variant="subtle">
                    {place.categories[0].name}
                  </Badge>
                )}
              </HStack>
            </VStack>
            <IconButton
              as="a"
              href={`https://www.google.com/search?q=${encodeURIComponent(place.name + ' ' + place.location.formatted_address)}`}
              target="_blank"
              rel="noopener noreferrer"
              icon={<ExternalLinkIcon />}
              colorScheme="purple"
              size="sm"
              aria-label={`Search ${place.name} on Google`}
            />
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  const renderChatMessage = (message, index) => (
    <Flex
      key={index}
      justify={message.type === 'user' ? 'flex-end' : 'flex-start'}
      mb={6}
      w="100%"
    >
      <Box
        maxW="70%"
        minW="200px"
      >
        <Card
          bg={message.type === 'user' ? 'purple.100' : 'white'}
          border="1px solid"
          borderColor={message.type === 'user' ? 'purple.200' : 'gray.200'}
          shadow="md"
        >
                  <CardBody p={6}>
          <HStack spacing={3} mb={3}>
            <Avatar
              size="sm"
              name={message.type === 'user' ? (user?.displayName || 'You') : 'Coordinate AI'}
              src={message.type === 'user' ? user?.photoURL : undefined}
              bg={message.type === 'ai' ? 'purple.500' : undefined}
            />
            <Text fontSize="sm" color="gray.500">
              {message.timestamp.toLocaleTimeString()}
            </Text>
          </HStack>
            
            {message.type === 'user' ? (
              <Text>{message.content}</Text>
            ) : (
              <VStack align="stretch" spacing={4}>
                {message.content.recommendations && (
                  <Text fontWeight="semibold" color="purple.600" fontSize="lg">
                    {message.content.recommendations}
                  </Text>
                )}
                
                {/* Main recommendation text with markdown rendering */}
                {message.content.mainText && (
                  <Box>
                    <ReactMarkdown
                      components={{
                        h1: ({children}) => <Text fontSize="2xl" fontWeight="bold" color="purple.700" mt={6} mb={4}>{children}</Text>,
                        h2: ({children}) => <Text fontSize="xl" fontWeight="bold" color="purple.600" mt={5} mb={3}>{children}</Text>,
                        h3: ({children}) => <Text fontSize="lg" fontWeight="bold" color="purple.600" mt={4} mb={2}>{children}</Text>,
                        h4: ({children}) => <Text fontSize="md" fontWeight="bold" color="purple.500" mt={3} mb={2}>{children}</Text>,
                        p: ({children}) => <Text fontSize="sm" color="gray.700" mb={3} lineHeight="1.6">{children}</Text>,
                        ul: ({children}) => <Box ml={4} mb={3}>{children}</Box>,
                        li: ({children}) => <Text fontSize="sm" color="gray.700" mb={1}>• {children}</Text>,
                        strong: ({children}) => <Text as="span" fontWeight="bold" color="gray.800">{children}</Text>,
                        em: ({children}) => <Text as="span" fontStyle="italic" color="gray.600">{children}</Text>,
                        hr: () => <Divider my={4} />,
                      }}
                    >
                      {message.content.mainText}
                    </ReactMarkdown>
                  </Box>
                )}
                
                {/* Places cards */}
                {message.content.places && message.content.places.length > 0 && (
                  <Box>
                    <Text fontWeight="semibold" color="purple.600" mb={3}>
                      Recommended Places:
                    </Text>
                    {message.content.places.map(renderPlaceCard)}
                  </Box>
                )}
                
                {/* Fallback suggestions */}
                {message.content.suggestions && (
                  <VStack align="stretch" spacing={2}>
                    {message.content.suggestions.map((suggestion, idx) => (
                      <Box key={idx}>
                        {typeof suggestion === 'string' ? (
                          <ReactMarkdown
                            components={{
                              p: ({children}) => <Text fontSize="sm" color="gray.700" mb={2}>{children}</Text>,
                              strong: ({children}) => <Text as="span" fontWeight="bold">{children}</Text>,
                              em: ({children}) => <Text as="span" fontStyle="italic">{children}</Text>,
                            }}
                          >
                            {suggestion}
                          </ReactMarkdown>
                        ) : (
                          <Text fontSize="sm">{JSON.stringify(suggestion)}</Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
                
                {message.content.tips && (
                  <Box bg="blue.50" p={3} borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <Text fontSize="sm" color="blue.800" mb={1}>{children}</Text>,
                        strong: ({children}) => <Text as="span" fontWeight="bold" color="blue.900">{children}</Text>,
                        em: ({children}) => <Text as="span" fontStyle="italic">{children}</Text>,
                        ul: ({children}) => <Box ml={2}>{children}</Box>,
                        li: ({children}) => <Text fontSize="sm" color="blue.800" mb={1}>• {children}</Text>,
                      }}
                    >
                      {message.content.tips}
                    </ReactMarkdown>
                  </Box>
                )}
                
                {message.content.error && (
                  <Alert status="error" size="sm">
                    <AlertIcon />
                    {message.content.error}
                  </Alert>
                )}
              </VStack>
            )}
          </CardBody>
        </Card>
      </Box>
    </Flex>
  );

  // Function to clear current chat history
  const clearChatHistory = async () => {
    if (!currentConversationId) return;
    
    try {
      // Delete all messages for the current conversation
      const messagesQuery = firestoreQuery(
        collection(db, 'messages'),
        where('conversationId', '==', currentConversationId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Clear local state
      setChatHistory([]);
      setConversationTitle('');
      
      // Update conversation to reset message count
      await updateDoc(doc(db, 'conversations', currentConversationId), {
        messageCount: 0,
        title: 'New Chat'
      });
      
      console.log('Chat history cleared successfully');
    } catch (error) {
      console.error('Error clearing chat history:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear chat history',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Function to delete a specific conversation and all its messages
  const deleteConversation = async (conversationId) => {
    try {
      // Delete all messages for this conversation
      const messagesQuery = firestoreQuery(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Delete the conversation document
      await deleteDoc(doc(db, 'conversations', conversationId));
      
      // If this was the current conversation, clear the current state
      if (conversationId === currentConversationId) {
        setCurrentConversationId(null);
        setChatHistory([]);
        setConversationTitle('');
      }
      
      console.log('Conversation deleted successfully');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!user || !user.uid) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Text color="gray.500">Please log in to access Coordinate AI</Text>
          <Button colorScheme="purple" onClick={() => window.location.href = '/'}>
            Go to Login
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box h="100%" bg="gray.50" overflow="hidden">
      {/* Conversations Sidebar */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <HStack spacing={3}>
              <ChatIcon color="purple.500" />
              <Text>Conversations</Text>
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <Button
                leftIcon={<AddIcon />}
                colorScheme="purple"
                onClick={startNewConversation}
                size="lg"
                borderRadius="full"
              >
                New Chat
              </Button>
              
              <Divider />
              
              <VStack spacing={2} align="stretch">
                {conversations.map((conversation) => (
                  <Box
                    key={conversation.id}
                    p={3}
                    borderBottom="1px"
                    borderColor="gray.200"
                    cursor="pointer"
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => {
                      setCurrentConversationId(conversation.id);
                      setConversationTitle(conversation.title);
                      onClose();
                    }}
                  >
                    <Flex justify="space-between" align="center">
                      <Box flex="1">
                        <Text fontWeight="medium" noOfLines={1}>
                          {conversation.title}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {conversation.lastMessageTime}
                        </Text>
                      </Box>
                      <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent conversation selection
                          deleteConversation(conversation.id);
                        }}
                        aria-label="Delete conversation"
                      />
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Sidebar Toggle Button */}
      <Box position="fixed" top={6} left={4} zIndex={1000}>
        <IconButton
          icon={<HamburgerIcon />}
          onClick={onOpen}
          colorScheme="purple"
          borderRadius="full"
          size="lg"
          aria-label="Open conversations"
        />
      </Box>

      {/* Main Chat Area - Full Width */}
      <Box w="100%" h="100%" display="flex" flexDirection="column" overflow="hidden">
        {/* Chat Header - Shows when conversation has started */}
        {chatHistory.length > 0 && conversationTitle && (
          <Box 
            bg="white" 
            borderBottom="1px solid" 
            borderColor="gray.200" 
            pt={4}
            pb={4}
            position="sticky"
            top={0}
            zIndex={10}
          >
            <Flex justify="space-between" align="center" maxW="1200px" mx="auto">
              <Text fontSize="md" fontWeight="bold" color="purple.600">
                {conversationTitle}
              </Text>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  colorScheme="purple"
                  variant="outline"
                  onClick={clearChatHistory}
                  isDisabled={chatHistory.length === 0}
                >
                  Clear Chat
                </Button>
                <Button
                  size="sm"
                  colorScheme="purple"
                  variant="outline"
                  onClick={startNewConversation}
                >
                  New Chat
                </Button>
              </HStack>
            </Flex>
          </Box>
        )}

        {/* Chat History - Full Width */}
        <Box flex="1" overflowY="auto" p={8} pb={24} w="100%">
          {/* Welcome Message - Only when no chat history */}
          {chatHistory.length === 0 && (
            <Box textAlign="center" py={8} display="flex" alignItems="center" justifyContent="center" minH="60vh">
              <VStack spacing={4} maxW="800px" mx="auto">
                <Text fontSize="4xl" fontWeight="bold" color="purple.600" fontFamily="Montserrat, sans-serif">
                  Hello! I'm Coordinate AI
                </Text>
                <Text fontSize="lg" color="gray.600" maxW="600px" textAlign="center" fontFamily="Montserrat, sans-serif">
                  Ask me anything about places, activities, or get personalized recommendations. 
                  I can help you find the perfect spots for food, study, work, entertainment, and more!
                </Text>
                <VStack spacing={2} mt={4}>
                  <Text fontSize="md" color="gray.500" fontWeight="semibold" fontFamily="Montserrat, sans-serif">
                    Try asking me:
                  </Text>
                  <HStack spacing={2} flexWrap="wrap" justify="center">
                                      <Button 
                    size="md" 
                    variant="outline" 
                    colorScheme="purple"
                    fontSize="md"
                    fontFamily="Montserrat, sans-serif"
                    onClick={() => handleExampleClick("Find coffee shops near me")}
                    disabled={isLoading}
                  >
                    "Find coffee shops near me"
                  </Button>
                  <Button 
                    size="md" 
                    variant="outline" 
                    colorScheme="purple"
                    fontSize="md"
                    fontFamily="Montserrat, sans-serif"
                    onClick={() => handleExampleClick("Best restaurants for date night")}
                    disabled={isLoading}
                  >
                    "Best restaurants for date night"
                  </Button>
                  <Button 
                    size="md" 
                    variant="outline" 
                    colorScheme="purple"
                    fontSize="md"
                    fontFamily="Montserrat, sans-serif"
                    onClick={() => handleExampleClick("Quiet places to study with WiFi")}
                    disabled={isLoading}
                  >
                    "Quiet places to study with WiFi"
                  </Button>
                  </HStack>
                </VStack>
              </VStack>
            </Box>
          )}

          {chatHistory.map((message, index) => renderChatMessage(message, index))}
          
          {/* Loading Indicator */}
          {isLoading && (
            <Flex justify="flex-start" mb={4}>
              <Box bg="white" px={4} py={3} borderRadius="lg" border="1px solid" borderColor="gray.200">
                <HStack spacing={2}>
                  <Spinner size="sm" />
                  <Text fontSize="sm">AI is thinking...</Text>
                </HStack>
              </Box>
            </Flex>
          )}
        </Box>

        {/* Input Form - Fixed at Bottom */}
        <Box 
          position="fixed" 
          bottom={0} 
          left={0} 
          right={0} 
          p={6} 
          borderTop="1px solid" 
          borderColor="gray.200" 
          bg="white" 
          zIndex={100}
        >
          <form onSubmit={handleSubmit}>
            <HStack spacing={3} maxW="1200px" mx="auto">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me about places, activities, or get recommendations..."
                size="lg"
                disabled={isLoading}
                borderRadius="full"
                border="2px solid"
                borderColor="purple.200"
                fontFamily="Montserrat, sans-serif"
                fontSize="lg"
                _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
                flex="1"
              />
              <IconButton
                type="submit"
                colorScheme="purple"
                size="lg"
                aria-label="Send message"
                icon={<ArrowForwardIcon />}
                borderRadius="full"
                disabled={!query.trim() || isLoading}
              />
            </HStack>
          </form>
        </Box>
      </Box>
    </Box>
  );
};

export default TalkToCoordinate;
