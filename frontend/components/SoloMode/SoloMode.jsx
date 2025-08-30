import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  useToast,
  Badge,
  SimpleGrid,
  Divider,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { useSelector } from 'react-redux';

const SoloMode = () => {
  const { user } = useSelector((state) => state.userReducer);
  const { place, coordinates } = useSelector((state) => state.placeReducer);
  const [selectedPreferences, setSelectedPreferences] = useState({
    purpose: '',
    mood: '',
    budget: '',
    time: '',
    transport: '',
    location: ''
  });
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handlePreferenceSelect = (category, value) => {
    setSelectedPreferences(prev => ({
      ...prev,
      [category]: prev[category] === value ? '' : value
    }));
  };

  const handleGetRecommendations = async () => {
    if (!selectedPreferences.purpose) {
    toast({
        title: 'Please select a purpose',
        description: 'At least select what you\'re looking for',
        status: 'warning',
      duration: 3000,
      isClosable: true,
    });
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the actual backend API
      const response = await fetch('http://localhost:8000/api/v1/solo/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `Find ${selectedPreferences.purpose} places for ${selectedPreferences.mood || 'any'} mood, budget: ${selectedPreferences.budget || 'any'}, time: ${selectedPreferences.time || 'any time'}, transport: ${selectedPreferences.transport || 'any'}, near ${selectedPreferences.location || 'my current location'}`,
          user_location: coordinates ? `${coordinates.lat},${coordinates.lon}` : (place || "12.9716,77.5946") // Use coordinates when available, otherwise place name or default
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        setRecommendations(result.data);
    toast({
          title: 'Recommendations found!',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
      } else {
        throw new Error(result.error || 'Failed to get recommendations');
      }
      
    } catch (error) {
      console.error('Error:', error);
        toast({
        title: 'Error',
        description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
    } finally {
      setIsLoading(false);
    }
  };

  const renderRecommendations = () => {
    if (!recommendations) return null;
    
    return (
      <Card mt={6}>
                    <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md" color="black">AI Recommendations</Heading>
            <Text>{recommendations.recommendations}</Text>
                        </VStack>
                    </CardBody>
                  </Card>
    );
  };

  const renderPreferenceSection = (title, category, options, colorScheme = 'blue') => (
    <Box>
      <Text fontWeight="semibold" mb={3} color="gray.700">
        {title}
                          </Text>
      <SimpleGrid columns={[2, 3, 4]} spacing={2}>
        {options.map((option) => (
                              <Button 
            key={option.value}
                                size="sm" 
            variant={selectedPreferences[category] === option.value ? 'solid' : 'outline'}
            colorScheme={colorScheme}
            onClick={() => handlePreferenceSelect(category, option.value)}
            borderRadius="full"
            fontSize="sm"
          >
            {option.label}
                              </Button>
                      ))}
                    </SimpleGrid>
    </Box>
  );

  if (!user || !user.uid) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Text color="gray.500">Please log in to access Solo Mode</Text>
          <Button colorScheme="blackAlpha" onClick={() => window.location.href = '/'}>
            Go to Login
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">


      {/* Main Content */}
      <Box maxW="1200px" mx="auto" p={6}>
        <VStack spacing={8} align="stretch">
          {/* Welcome Section */}
          <Box textAlign="center" py={8}>
            <Heading size="xl" mb={4} color="black">
              Find Your Perfect Place
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="600px" mx="auto">
              Select your preferences below and let AI find the best places for you. 
              Mix and match different options to get personalized recommendations.
            </Text>
          </Box>

          {/* Selected Preferences Display */}
          {Object.values(selectedPreferences).some(val => val) && (
            <Card>
                              <CardBody>
                <VStack spacing={3} align="stretch">
                  <Text fontWeight="semibold" color="gray.700">
                    Your Selections:
                                    </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {Object.entries(selectedPreferences).map(([key, value]) => 
                      value && (
                        <Badge key={key} colorScheme="gray" variant="solid" px={3} py={1}>
                          {key}: {value}
                                  </Badge>
                      )
                    )}
                                </HStack>
                </VStack>
                              </CardBody>
                            </Card>
          )}

          {/* Preference Sections */}
          <VStack spacing={8} align="stretch">
            {renderPreferenceSection(
              "What are you looking for?",
              "purpose",
              [
                { value: "food", label: "🍕 Food" },
                { value: "coffee", label: "☕ Coffee" },
                { value: "study", label: "📚 Study" },
                { value: "work", label: "💼 Work" },
                { value: "entertainment", label: "🎮 Entertainment" },
                { value: "shopping", label: "🛍️ Shopping" },
                { value: "fitness", label: "💪 Fitness" },
                { value: "health", label: "🏥 Health" }
              ],
              "gray"
            )}

            {renderPreferenceSection(
              "What's your mood?",
              "mood",
              [
                { value: "casual", label: "😊 Casual" },
                { value: "romantic", label: "💕 Romantic" },
                { value: "family", label: "👨‍👩‍👧‍👦 Family" },
                { value: "business", label: "💼 Business" },
                { value: "party", label: "🎉 Party" },
                { value: "quiet", label: "🤫 Quiet" },
                { value: "lively", label: "🎵 Lively" },
                { value: "cozy", label: "🏠 Cozy" }
              ],
              "pink"
            )}

            {renderPreferenceSection(
              "What's your budget?",
              "budget",
              [
                { value: "budget", label: "💰 Budget" },
                { value: "affordable", label: "💵 Affordable" },
                { value: "moderate", label: "💳 Moderate" },
                { value: "expensive", label: "💎 Expensive" },
                { value: "luxury", label: "👑 Luxury" }
              ],
              "green"
            )}

            {renderPreferenceSection(
              "When do you want to go?",
              "time",
              [
                { value: "now", label: "⏰ Now" },
                { value: "today", label: "📅 Today" },
                { value: "tomorrow", label: "🌅 Tomorrow" },
                { value: "weekend", label: "🎉 Weekend" },
                { value: "evening", label: "🌆 Evening" },
                { value: "night", label: "🌙 Night" }
              ],
              "orange"
            )}

            {renderPreferenceSection(
              "How will you get there?",
              "transport",
              [
                { value: "walking", label: "🚶 Walking" },
                { value: "cycling", label: "🚴 Cycling" },
                { value: "driving", label: "🚗 Driving" },
                { value: "public", label: "🚌 Public Transport" },
                { value: "any", label: "🚀 Any" }
              ],
              "blue"
            )}

            {renderPreferenceSection(
              "Where do you want to go?",
              "location",
              [
                { value: "nearby", label: "📍 Nearby" },
                { value: "indiranagar", label: "🏘️ Indiranagar" },
                { value: "mg_road", label: "🛣️ MG Road" },
                { value: "jayanagar", label: "🏘️ Jayanagar" },
                { value: "koramangala", label: "🏘️ Koramangala" },
                { value: "whitefield", label: "🏘️ Whitefield" },
                { value: "any", label: "🌍 Anywhere" }
              ],
              "teal"
                                          )}
                                        </VStack>

          {/* Get Recommendations Button */}
          <Box textAlign="center" pt={4}>
                                        <Button 
              size="lg"
              colorScheme="purple"
              onClick={handleGetRecommendations}
              isLoading={isLoading}
              loadingText="Finding perfect places..."
              px={8}
              py={6}
              fontSize="lg"
              borderRadius="full"
              boxShadow="lg"
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
              transition="all 0.2s"
            >
              🚀 Get AI Recommendations
                                        </Button>
                          </Box>

          {/* Recommendations Display */}
          {renderRecommendations()}
        </VStack>
      </Box>
    </Box>
  );
};

export default SoloMode;
