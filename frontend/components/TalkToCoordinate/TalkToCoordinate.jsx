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
  SimpleGrid,
} from '@chakra-ui/react';
import { ChatIcon, HamburgerIcon, AddIcon, ArrowForwardIcon, DeleteIcon } from '@chakra-ui/icons';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
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

  // Auto-create conversation when component loads
  useEffect(() => {
    if (user?.uid && !currentConversationId) {
      createNewConversation();
    }
  }, [user?.uid, currentConversationId]);

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
        lastMessageTime: doc.data().lastMessageTime?.toDate().toLocaleString([], { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      }))
      // Sort locally instead of in the query
      .sort((a, b) => {
        if (a.lastMessageTime && b.lastMessageTime) {
          return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
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

  const createNewConversation = async () => {
    try {
      const newConversation = {
        userId: user.uid,
        title: 'New Chat',
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        messageCount: 0,
      };

      const docRef = await addDoc(collection(db, 'conversations'), newConversation);
      setCurrentConversationId(docRef.id);
      setChatHistory([]);
      setConversationTitle(''); // Reset title for new conversation
      onClose();
      
      // Don't show toast for auto-created conversations
      if (chatHistory.length > 0) {
        toast({
          title: 'New conversation started!',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new conversation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Function to generate conversation title from first message
  const generateConversationTitle = (message) => {
    if (message.length > 50) {
      return message.substring(0, 50) + '...';
    }
    return message;
  };

  // Function to handle example button clicks - send directly to backend
  const handleExampleClick = async (exampleText) => {
    // Ensure conversation exists
    if (!currentConversationId) {
      await createNewConversation();
      return;
    }

    // Set conversation title if this is the first message
    if (chatHistory.length === 0) {
      const title = generateConversationTitle(exampleText);
      setConversationTitle(title);
    }

    const userMessage = { 
      type: 'user', 
      content: exampleText, 
      timestamp: new Date(),
      conversationId: currentConversationId,
      userId: user.uid
    };

    // Add user message to database and local state immediately
    try {
      await addDoc(collection(db, 'messages'), {
        ...userMessage,
        timestamp: serverTimestamp(),
      });
      
      // Also add to local state for immediate display
      setChatHistory(prev => [...prev, userMessage]);
    } catch (error) {
      console.error('Error saving user message:', error);
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
      // Use the actual count of messages we just added
      const newMessageCount = chatHistory.length + 2; // +2 for user + AI message
      await updateDoc(doc(db, 'conversations', currentConversationId), {
        lastMessageTime: serverTimestamp(),
        messageCount: newMessageCount,
        title: conversationTitle || generateConversationTitle(exampleText)
      });
      
      // Add AI message to local state for immediate display
      setChatHistory(prev => [...prev, aiMessage]);
      
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

    // Ensure conversation exists
    if (!currentConversationId) {
      await createNewConversation();
      return;
    }

    // Set conversation title if this is the first message
    if (chatHistory.length === 0) {
      const title = generateConversationTitle(messageToSend);
      setConversationTitle(title);
    }

    const userMessage = { 
      type: 'user', 
      content: messageToSend, 
      timestamp: new Date(),
      conversationId: currentConversationId,
      userId: user.uid
    };

    // Add user message to database and local state immediately
    try {
      await addDoc(collection(db, 'messages'), {
        ...userMessage,
        timestamp: serverTimestamp(),
      });
      
      // Also add to local state for immediate display
      setChatHistory(prev => [...prev, userMessage]);
    } catch (error) {
      console.error('Error saving user message:', error);
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

      // Add AI message to database
      await addDoc(collection(db, 'messages'), {
        ...aiMessage,
        timestamp: serverTimestamp(),
      });

      // Update conversation with last message time and title
      // Use the actual count of messages we just added
      const newMessageCount = chatHistory.length + 2; // +2 for user + AI message
      await updateDoc(doc(db, 'conversations', currentConversationId), {
        lastMessageTime: serverTimestamp(),
        messageCount: newMessageCount,
        title: conversationTitle || generateConversationTitle(messageToSend)
      });
      
      // Add AI message to local state for immediate display
      setChatHistory(prev => [...prev, aiMessage]);
      
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
      setQuery('');
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
        
        // Check for new JSON format first
        if (result.data?.final_recommendation && result.data?.places) {
          console.log('Found new JSON format with final_recommendation and places');
          mainRecommendation = result.data.final_recommendation;
          places = result.data.places;
        }
        // Check if we have the structured JSON response from the new format
        else if (result.data?.recommendations) {
          console.log('Found recommendations field:', result.data.recommendations);
          
          // Try to parse as JSON first (new format)
          if (typeof result.data.recommendations === 'string') {
            try {
              // First, try to extract JSON from the string if it contains ```json blocks
              let jsonString = result.data.recommendations;
              
              // Check if the string contains a JSON code block
              const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
              if (jsonMatch) {
                jsonString = jsonMatch[1].trim();
                console.log('Extracted JSON from code block');
              }
              
              const parsedRecommendations = JSON.parse(jsonString);
              if (parsedRecommendations.final_recommendation && parsedRecommendations.places !== undefined) {
                console.log('Parsed new JSON format from string');
                mainRecommendation = parsedRecommendations.final_recommendation;
                places = parsedRecommendations.places || [];
              } else {
                mainRecommendation = result.data.recommendations;
              }
            } catch (e) {
              console.log('JSON parsing failed:', e);
              // If not JSON, use as plain text
              mainRecommendation = result.data.recommendations;
              console.log('Using recommendations as plain string');
            }
          }
          // Handle object format (new JSON structure)
          else if (result.data.recommendations.final_recommendation) {
            console.log('Found new format with final_recommendation');
            mainRecommendation = result.data.recommendations.final_recommendation;
            places = result.data.recommendations.places || [];
          }
          // Fallback to old format handling
          else if (result.data.recommendations.tasks_output) {
            console.log('Found old tasks_output format');
            
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

        // Extract summary if available  
        let summary = null;
        if (result.data?.summary) {
          summary = result.data.summary;
        } else if (result.data?.recommendations?.summary) {
          summary = result.data.recommendations.summary;
        } else {
          // Try to extract summary from parsed JSON
          try {
            let jsonString = result.data?.recommendations || '';
            const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              const parsedData = JSON.parse(jsonMatch[1].trim());
              summary = parsedData.summary;
            }
          } catch (e) {
            // Ignore parsing errors for summary
          }
        }

        return {
          recommendations: "Here's what I found for you:",
          mainText: mainRecommendation, // Keep for backward compatibility
          places: places,
          summary: summary,
          tips: "💡 This recommendation is powered by our advanced AI agents that analyze your preferences and local data.",
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

  // Function to render markdown-like text
  const renderMarkdownText = (text) => {
    if (!text) return null;
    
    // First, completely remove ALL asterisks from the entire text
    const cleanText = text.replace(/\*/g, '');
    
    // Split text into lines and process each line
    const lines = cleanText.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Skip empty lines
      if (!line.trim()) return <br key={lineIndex} />;
      
      // Handle headers (lines starting with ###)
      if (line.startsWith('###')) {
        const headerText = line.replace(/^###+\s*/, '');
        return (
          <Text key={lineIndex} fontSize="lg" fontWeight="bold" color="#a60629" mt={4} mb={2}>
            {headerText}
          </Text>
        );
      }
      
      // Handle subheaders (lines starting with ####)
      if (line.startsWith('####')) {
        const headerText = line.replace(/^####+\s*/, '');
        return (
          <Text key={lineIndex} fontSize="md" fontWeight="bold" color="#a60629" mt={3} mb={2}>
            {headerText}
          </Text>
        );
      }
      
      // Handle subheaders (lines starting with ---)
      if (line.startsWith('---')) {
        return <Divider key={lineIndex} my={3} />;
      }
      
      // Clean line: format properly
      let cleanLine = line
        .replace(/^\s*-\s*/, '• ') // Replace dashes with bullet points
        .replace(/^\s*•\s*/, '• '); // Ensure proper bullet point format
      
      // If line starts with "Rank X:" make it bold and purple
      if (cleanLine.match(/^Rank \d+:/)) {
        return (
          <Text key={lineIndex} fontSize="md" fontWeight="bold" color="#a60629" mt={3} mb={2}>
            {cleanLine}
          </Text>
        );
      }
      
      // If line starts with a bullet point, format it properly
      if (cleanLine.startsWith('• ')) {
        return (
          <Text key={lineIndex} fontSize="sm" color="gray.700" mb={1} ml={4}>
            {cleanLine}
          </Text>
        );
      }
      
      // Regular text
      return (
        <Text key={lineIndex} fontSize="sm" color="gray.600" mb={1}>
          {cleanLine}
        </Text>
      );
    });
  };

  const renderPlaceCard = (place, index) => {
    // Handle different place data structures
    const placeId = place.fsq_id || place.id || `place-${index}`;
    const placeName = place.name || 'Unknown Place';
    
    // Handle location formatting
    let locationText = '';
    if (place.location?.formatted_address) {
      locationText = place.location.formatted_address;
    } else if (place.location?.lat && place.location?.lng) {
      locationText = `${place.location.lat}, ${place.location.lng}`;
    } else if (place.address) {
      locationText = place.address;
    }
    
    // Handle categories
    const category = place.categories?.[0]?.name || 'General';
    
    // Handle rating
    const rating = place.rating;
    
    // Handle price
    const priceLevel = place.price?.tier || place.price;
    const priceDisplay = priceLevel ? '$'.repeat(priceLevel) : null;
    
    // Handle distance
    const distance = place.distance;
    
    // Create search URL
    const searchQuery = `${placeName}${locationText ? ' ' + locationText : ''}`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    return (
      <Card key={placeId} bg="white" border="1px solid" borderColor="gray.200" shadow="sm" mb={3}>
        <CardBody>
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between" align="start">
              <VStack align="start" spacing={1} flex={1}>
                <Text fontWeight="bold" fontSize="lg" color="#a60629">
                  {placeName}
                </Text>
                
                {locationText && (
                  <Text fontSize="sm" color="gray.600">
                    📍 {locationText}
                  </Text>
                )}
                
                <HStack spacing={2} wrap="wrap">
                  {distance && (
                    <Badge colorScheme="green" variant="subtle">
                      📏 {distance}m away
                    </Badge>
                  )}
                  
                  <Badge colorScheme="blue" variant="subtle">
                    🏷️ {category}
                  </Badge>
                  
                  {rating && (
                    <Badge colorScheme="orange" variant="subtle">
                      ⭐ {rating}
                    </Badge>
                  )}
                  
                  {priceDisplay && (
                    <Badge colorScheme="purple" variant="subtle">
                      💰 {priceDisplay}
                    </Badge>
                  )}
                </HStack>
                
                {/* Display tips if available */}
                {place.tips && place.tips.length > 0 && (
                  <Box mt={2}>
                    <Text fontSize="xs" color="gray.500" fontWeight="semibold">💡 Tips:</Text>
                    {place.tips.slice(0, 2).map((tip, tipIndex) => (
                      <Text key={tipIndex} fontSize="xs" color="gray.600" fontStyle="italic">
                        "• {typeof tip === 'string' ? tip : tip.text}"
                      </Text>
                    ))}
                  </Box>
                )}
              </VStack>
              
              <IconButton
                as="a"
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                icon={<ArrowForwardIcon />}
                bg="#a60629" 
                color="white" 
                _hover={{ bg: "#8a0522" }}
                size="sm"
                aria-label={`Search ${placeName} on Google`}
              />
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    );
  };

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
          bg={message.type === 'user' ? '#f5e6e8' : 'white'}
          border="1px solid"
          borderColor={message.type === 'user' ? '#a60629' : 'gray.200'}
          shadow="md"
        >
                  <CardBody p={6}>
          <HStack spacing={3} mb={3}>
            <Avatar
              size="sm"
              name={message.type === 'user' ? 'You' : 'Coordinate AI'}
              src={message.type === 'user' ? user?.photoURL : undefined}
              bg={message.type === 'ai' ? '#a60629' : undefined}
            />
            <Text fontSize="sm" color="gray.500">
              {message.timestamp.toLocaleTimeString()}
            </Text>
          </HStack>
            
            {message.type === 'user' ? (
              <Text>{message.content}</Text>
            ) : (
              <VStack align="stretch" spacing={4}>
                {/* Header with recommendations title */}
                {message.content.recommendations && (
                  <Text fontWeight="semibold" color="#a60629" fontSize="lg">
                    {message.content.recommendations}
                  </Text>
                )}
                
                {/* Summary section for structured responses */}
                {message.content.summary && (
                  <Box bg="blue.50" p={3} borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                    <Text fontSize="sm" color="blue.800" fontWeight="semibold">
                      📋 Summary: {message.content.summary}
                    </Text>
                  </Box>
                )}
                
                {/* Main recommendation text with markdown rendering */}
                {message.content.mainText && (
                  <Box>
                    {renderMarkdownText(message.content.mainText)}
                  </Box>
                )}
                
                {/* Handle final_recommendation from structured JSON response */}
                {message.content.final_recommendation && (
                  <Box>
                    <Text fontWeight="semibold" color="#a60629" mb={3} fontSize="md">
                      🤖 AI Recommendation
                    </Text>
                    <Box bg="gray.50" p={4} borderRadius="md" borderLeft="4px solid" borderColor="#a60629">
                      {renderMarkdownText(message.content.final_recommendation)}
                    </Box>
                  </Box>
                )}
                
                {/* Places cards */}
                {message.content.places && message.content.places.length > 0 && (
                  <Box>
                    <Text fontWeight="semibold" color="#a60629" mb={3}>
                      📍 Recommended Places ({message.content.places.length}):
                    </Text>
                    <SimpleGrid columns={[1, 2]} spacing={4}>
                      {message.content.places.map((place, index) => renderPlaceCard(place, index))}
                    </SimpleGrid>
                  </Box>
                )}
                
                {/* Fallback suggestions */}
                {message.content.suggestions && (
                  <VStack align="stretch" spacing={2}>
                    {message.content.suggestions.map((suggestion, idx) => (
                      <Text key={idx} fontSize="sm">
                        {typeof suggestion === 'string' ? suggestion : JSON.stringify(suggestion)}
                      </Text>
                    ))}
                  </VStack>
                )}
                
                {message.content.tips && (
                  <Box bg="blue.50" p={3} borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                    <Text fontSize="sm" color="blue.800">
                      💡 {message.content.tips}
                    </Text>
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
          <Button colorScheme="red" onClick={() => window.location.href = '/'}>
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
              <ChatIcon color="#a60629" />
              <Text>Conversations</Text>
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <Button
                leftIcon={<AddIcon />}
                bg="#a60629" color="white" _hover={{ bg: "#8a0522" }}
                onClick={createNewConversation}
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
                        bg="#a60629" color="white" _hover={{ bg: "#8a0522" }}
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
                          bg="#a60629" color="white" _hover={{ bg: "#8a0522" }}
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
              <Text fontSize="md" fontWeight="bold" color="#a60629">
                {conversationTitle}
              </Text>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  bg="#a60629" color="white" _hover={{ bg: "#8a0522" }}
                  variant="outline"
                  onClick={clearChatHistory}
                  isDisabled={chatHistory.length === 0}
                >
                  Clear Chat
                </Button>
                <Button
                  size="sm"
                  bg="#a60629" color="white" _hover={{ bg: "#8a0522" }}
                  variant="outline"
                  onClick={createNewConversation}
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
                <Text fontSize="4xl" fontWeight="bold" color="black" fontFamily="Montserrat, sans-serif">
                  Hello {user?.displayName || user?.email?.split('@')[0] || 'there'}!
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
                    bg="#a60629" color="white" _hover={{ bg: "#8a0522" }}
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
                    bg="#a60629" color="white" _hover={{ bg: "#8a0522" }}
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
                    bg="#a60629" color="white" _hover={{ bg: "#8a0522" }}
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
                borderColor="#a60629"
                fontFamily="Montserrat, sans-serif"
                fontSize="lg"
                _focus={{ borderColor: '#a60629', boxShadow: '0 0 0 1px #a60629' }}
                flex="1"
              />
              <IconButton
                type="submit"
                bg="#a60629" color="white" _hover={{ bg: "#8a0522" }}
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
