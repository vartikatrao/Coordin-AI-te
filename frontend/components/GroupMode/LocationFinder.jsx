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
  Divider,
  useToast,
  Select,
  Input,
  FormControl,
  FormLabel,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Alert,
  AlertIcon,
  SimpleGrid,

  Checkbox,
  CheckboxGroup,
  Stack,
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  ViewIcon, 
  StarIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons';
import { useSelector } from 'react-redux';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import { groupModeAPI, soloModeAPI } from '@/services/api';

const LocationFinder = ({ group }) => {
  const { user } = useSelector((state) => state.userReducer);
  const [meetingType, setMeetingType] = useState('coffee');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [filters, setFilters] = useState({
    budget: '',
    timePreference: '',
    atmosphere: '',
    features: []
  });
  const toast = useToast();

  // Function to calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 1000); // Return distance in meters
  };

  // Dummy locations for group members (you can customize these based on your needs)
  const getDummyLocations = () => {
    const locations = [
      { area: "Koramangala", coords: "12.9352,77.6245" },
      { area: "Indiranagar", coords: "12.9784,77.6408" },
      { area: "Whitefield", coords: "12.9698,77.7500" },
      { area: "Jayanagar", coords: "12.9250,77.5850" },
      { area: "Marathahalli", coords: "12.9591,77.6974" },
      { area: "HSR Layout", coords: "12.9082,77.6476" },
      { area: "Electronic City", coords: "12.8454,77.6600" },
      { area: "Rajajinagar", coords: "12.9925,77.5548" },
      { area: "Malleshwaram", coords: "13.0039,77.5749" },
      { area: "Banashankari", coords: "12.9081,77.5570" },
      { area: "Bellandur", coords: "12.9257,77.6747" },
      { area: "Sarjapur", coords: "12.8963,77.6836" },
      { area: "Yelahanka", coords: "13.1007,77.5963" },
      { area: "RT Nagar", coords: "13.0181,77.5958" },
      { area: "JP Nagar", coords: "12.9116,77.5712" }
    ];
    
    // Build preferences string from filters
    let preferencesText = `Enjoys ${meetingType} places`;
    if (filters.atmosphere) {
      preferencesText += `, likes ${filters.atmosphere} atmosphere`;
    }
    if (filters.features && filters.features.length > 0) {
      preferencesText += `, needs ${filters.features.join(', ')}`;
    }
    
    // Build constraints string from filters
    let constraintsText = "";
    if (filters.budget) {
      const budgetLabel = budgetOptions.find(b => b.value === filters.budget)?.label || '';
      constraintsText += budgetLabel;
    }
    if (filters.timePreference) {
      constraintsText += constraintsText ? `, ${filters.timePreference}` : filters.timePreference;
    }
    if (!constraintsText) {
      constraintsText = "Budget-friendly options preferred";
    }
    
    // Assign locations to members with filter-based preferences
    return group.members.map((member, index) => {
      const location = locations[index % locations.length];
      const [lat, lng] = location.coords.split(',').map(parseFloat);
      return {
        name: member.name || `Member ${index + 1}`,
        age: 25, // Default age
        gender: "Other", // Default gender
        location: {
          lat: lat,
          lng: lng,
          address: location.area + ", Bangalore"
        },
        preferences: {
          meetingType: meetingType,
          atmosphere: filters.atmosphere || '',
          features: filters.features || [],
          description: preferencesText
        },
        constraints: {
          budget: filters.budget || '',
          timePreference: filters.timePreference || '',
          description: constraintsText
        }
      };
    });
  };

  // Filter options (same as Solo Mode)
  const budgetOptions = [
    { value: '', label: 'Any Budget' },
    { value: '1', label: 'Budget Friendly ($)' },
    { value: '2', label: 'Moderate ($$)' },
    { value: '3', label: 'Expensive ($$$)' },
    { value: '4', label: 'Very Expensive ($$$$)' }
  ];

  const timeOptions = [
    { value: '', label: 'Anytime' },
    { value: 'morning', label: 'Morning (6-12)' },
    { value: 'afternoon', label: 'Afternoon (12-17)' },
    { value: 'evening', label: 'Evening (17-21)' },
    { value: 'night', label: 'Night (21-6)' }
  ];

  const atmosphereOptions = [
    { value: '', label: 'Any Atmosphere' },
    { value: 'quiet', label: 'Quiet & Peaceful' },
    { value: 'lively', label: 'Lively & Energetic' },
    { value: 'romantic', label: 'Romantic' },
    { value: 'casual', label: 'Casual & Relaxed' },
    { value: 'professional', label: 'Professional' }
  ];

  const featureOptions = [
    { value: 'wifi', label: 'WiFi Available' },
    { value: 'parking', label: 'Parking Available' },
    { value: 'outdoor', label: 'Outdoor Seating' },
    { value: 'pet_friendly', label: 'Pet Friendly' },
    { value: 'kid_friendly', label: 'Kid Friendly' },
    { value: 'wheelchair_accessible', label: 'Wheelchair Accessible' }
  ];

  // Safety check for group prop
  if (!group || !group.members) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.500">No group selected</Text>
      </Box>
    );
  }

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      budget: '',
      timePreference: '',
      atmosphere: '',
      features: []
    });
  };

  const findOptimalLocations = async () => {
    setIsLoading(true);
    
    try {
      // Get dummy locations for group members
      const membersWithLocations = getDummyLocations();
      
      // Build meeting purpose with filters
      let purposeDetails = `Find ${meetingType} places for group meetup`;
      if (filters.budget) {
        const budgetLabel = budgetOptions.find(b => b.value === filters.budget)?.label || '';
        purposeDetails += ` with ${budgetLabel} budget`;
      }
      if (filters.timePreference) {
        purposeDetails += ` for ${filters.timePreference}`;
      }
      if (filters.atmosphere) {
        purposeDetails += ` with ${filters.atmosphere} atmosphere`;
      }
      if (filters.features && Array.isArray(filters.features) && filters.features.length > 0) {
        purposeDetails += ` with features: ${filters.features.join(', ')}`;
      }
      
      // Call the group coordination backend
      const response = await fetch('http://localhost:8000/api/v1/group/coordinate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          members: membersWithLocations,
          meeting_purpose: purposeDetails
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 Full backend response:', JSON.stringify(result, null, 2));
      
      if (result.status === 'success' && result.results) {
        console.log('🎯 Group coordination result:', result.results);
        console.log('📍 Fair coordinates:', result.results.fair_coords);
        console.log('🛡️ Safety assessment:', result.results.safety);
        
        // Set venues from the new backend structure
        if (result.results.venues && result.results.venues.length > 0) {
          console.log('🏢 Raw venues from backend:', result.results.venues);
          console.log('🛡️ Safety data:', result.results.safety);
          
          const venueRecommendations = {
            places: result.results.venues.map(venue => {
              // Use the distances already calculated by the backend
              const memberDistances = venue.member_distances ? 
                venue.member_distances.map(dist => ({
                  memberName: dist.member_name,
                  distance: Math.round(dist.distance_km * 1000) // Convert km to meters
                })) : [];
              
              return {
                name: venue.name || 'Venue',
                location: {
                  formatted_address: venue.location?.formatted_address || venue.address || 'Address not available'
                },
                distance: venue.distance || venue.average_distance || 100,
                memberDistances: memberDistances,
                categories: venue.categories || [{ name: meetingType }],
                rating: venue.rating || 4.0,
                price: venue.price || 2,
                safetyScore: venue.safety_score || 6.0,
                averageDistance: venue.average_distance || 0,
                fsq_id: venue.fsq_id,
                website: venue.website,
                tel: venue.tel
              };
            }),
            safety: result.results.safety || {},
            groupMembers: result.results.member_locations || []
          };
          setRecommendations([venueRecommendations]);
        } else {
          setRecommendations([]);
        }
        
        // Note: Personalized explanations are available in result.results.personalized if needed for future features
      } else {
        throw new Error(result.error || 'No locations found');
      }
      
      toast({
        title: 'Group Locations Found!',
        description: `Found ${result.results?.venues?.length || 0} optimal meeting spots for your group`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error finding locations:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to find group meeting locations',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to parse location recommendations (simplified from Solo Mode)
  const parseLocationRecommendations = (recommendationData) => {
    try {
      const locations = [];
      console.log('🔍 Parsing recommendation data:', recommendationData);
      
      // Check for structured places data from backend
      if (recommendationData && recommendationData.places && Array.isArray(recommendationData.places)) {
        console.log('✅ Found places array:', recommendationData.places);
        return recommendationData.places.map((place, index) => ({
          name: place.name || 'Unknown Place',
          distance: place.distance ? `${place.distance}m` : 'Near you',
          memberDistances: place.memberDistances || [], // Preserve member distances
          cuisine: place.categories && place.categories[0] ? place.categories[0].name : 'Restaurant',
          rating: place.rating ? Number(place.rating).toFixed(1) : '',
          priceLevel: place.price ? '₹'.repeat(place.price) : '',
          address: place.location ? place.location.formatted_address || place.location.address : '',
          description: `${place.categories && place.categories[0] ? place.categories[0].name : 'Restaurant'} located at ${place.location ? (place.location.formatted_address || place.location.address) : 'your area'}`,
          fsq_place_id: place.fsq_id || '',
          index: index
        }));
      }
      
      // Fallback parsing for text-based recommendations
      if (typeof recommendationData === 'string') {
        const sections = recommendationData.split('###');
        sections.forEach((section, index) => {
          const lines = section.split('\n').filter(line => line.trim());
          if (lines.length === 0) return;
          
          let name = '';
          const headerLine = lines[0].trim();
          if (headerLine.includes(':')) {
            const colonIndex = headerLine.indexOf(':');
            if (colonIndex !== -1) {
              name = headerLine.substring(colonIndex + 1).trim();
            }
          }
          
          if (name && name.length > 2) {
            locations.push({
              name: name,
              distance: 'Near you',
              cuisine: 'Restaurant',
              rating: '',
              priceLevel: '',
              address: '',
              description: 'Recommended for your group',
              index: index
            });
          }
        });
      }
      
      return locations;
    } catch (error) {
      console.error('Error parsing recommendations:', error);
      return [];
    }
  };

  const openInGoogleMaps = (locationName) => {
    const searchQuery = encodeURIComponent(`${locationName} near me`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
    window.open(mapsUrl, '_blank');
  };

  const createPollForAllVenues = async (locations, recData) => {
    if (!locations || locations.length === 0) {
      toast({
        title: 'No venues to poll',
        description: 'No recommended venues available for polling',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if user is available
    if (!user || !user.uid) {
      toast({
        title: 'User not found',
        description: 'Please log in to create polls',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Create poll options from all recommended venues
      const pollOptions = locations.map((location, index) => ({
        id: `venue_${index}`,
        text: `📍 ${location.name}`,
        venue: {
          name: location.name,
          address: location.address,
          rating: location.rating,
          priceLevel: location.priceLevel,
          cuisine: location.cuisine,
          memberDistances: location.memberDistances,
          description: location.description
        },
        votes: []
      }));

      // Add an "Other suggestions" option
      pollOptions.push({
        id: 'other',
        text: '💭 Other suggestions',
        venue: null,
        votes: []
      });

      const pollData = {
        type: 'location_poll',
        question: `Where should we meet? (${meetingType} places)`,
        meetingType: meetingType,
        searchFilters: {
          budget: filters.budget,
          atmosphere: filters.atmosphere,
          features: filters.features,
          timePreference: filters.timePreference
        },
        options: pollOptions,
        venues: locations, // Store all venue data
        safetyInfo: recData.safety,
        createdBy: {
          uid: user.uid,
          name: user.displayName,
          avatar: user.photoURL
        },
        createdAt: serverTimestamp(),
        isActive: true,
        totalVotes: 0
      };

      const pollDocRef = await addDoc(collection(db, 'groups', group.id, 'polls'), pollData);
      
      // Update the poll with its own ID for easier reference
      await updateDoc(pollDocRef, { id: pollDocRef.id });
      
      // Also add a system message to the chat
      await addDoc(collection(db, 'groups', group.id, 'messages'), {
        userId: 'system',
        userName: 'System',
        userAvatar: '',
        message: `${user.displayName} created a poll: "${pollData.question}" with ${locations.length} venue options`,
        timestamp: serverTimestamp(),
        isSystemMessage: true,
        pollData: pollData
      });

      toast({
        title: 'Poll Created!',
        description: `Created a poll with ${locations.length} venue options`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating poll:', error);
      toast({
        title: 'Error creating poll',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box 
      h="100%" 
      overflowY="auto" 
      overflowX="hidden"
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
      <VStack spacing={6} align="stretch" pb={8}>
        {/* Header */}
        <Box textAlign="center">
          <Heading size="lg" mb={2} color="purple.600">
        <ViewIcon mr={2} />
            Find Group Location
      </Heading>
          <Text color="gray.600">
            Choose what type of place you're looking for and apply filters
          </Text>
        </Box>
      
      {/* Group Info */}
        <Card>
        <CardBody>
            <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <Text fontWeight="bold">Group: {group.name}</Text>
              <Badge colorScheme="purple">{group.members.length} members</Badge>
            </HStack>
            
              <HStack spacing={2}>
                {group.members.slice(0, 4).map((member, index) => (
                  <Avatar key={index} size="xs" name={member.name} src={member.avatar} />
                ))}
                {group.members.length > 4 && (
                  <Text fontSize="xs" color="gray.500">+{group.members.length - 4} more</Text>
                )}
            </HStack>
          </VStack>
        </CardBody>
      </Card>

        {/* Meeting Type Selection */}
        <Card>
          <CardBody>
            <FormControl>
              <FormLabel fontWeight="bold">What kind of place are you looking for?</FormLabel>
              <Select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                size="lg"
              >
                <option value="coffee">☕ Coffee/Tea Places</option>
                <option value="food">🍽️ Restaurants/Food</option>
                <option value="work">💼 Work/Study Spaces</option>
                <option value="entertainment">🎮 Entertainment/Fun</option>
                <option value="shopping">🛍️ Shopping Areas</option>
                <option value="fitness">💪 Fitness/Outdoor</option>
                <option value="others">🏢 Others</option>
              </Select>
            </FormControl>
          </CardBody>
        </Card>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="md">Filters</Heading>
              <Button size="sm" variant="outline" onClick={resetFilters}>
                Reset All
              </Button>
            </Flex>
          </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
              {/* Budget Filter */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Budget Range</FormLabel>
                <Select 
                  value={filters.budget} 
                  onChange={(e) => handleFilterChange('budget', e.target.value)}
                  placeholder="Select budget range"
                >
                  {budgetOptions.slice(1).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Time Preference */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Time Preference</FormLabel>
                <Select 
                  value={filters.timePreference} 
                  onChange={(e) => handleFilterChange('timePreference', e.target.value)}
                  placeholder="Select time preference"
                >
                  {timeOptions.slice(1).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Atmosphere */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Atmosphere</FormLabel>
                <Select
                  value={filters.atmosphere} 
                  onChange={(e) => handleFilterChange('atmosphere', e.target.value)}
                  placeholder="Select atmosphere"
                >
                  {atmosphereOptions.slice(1).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              


              {/* Features */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Required Features</FormLabel>
                <CheckboxGroup 
                  value={filters.features} 
                  onChange={(value) => handleFilterChange('features', value)}
                >
                  <SimpleGrid columns={[1, 2]} spacing={2}>
                    {featureOptions.map((option) => (
                      <Checkbox key={option.value} value={option.value} size="sm">
                        {option.label}
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </CheckboxGroup>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>
            
        {/* Find Location Button */}
            <Button
              colorScheme="purple"
              onClick={findOptimalLocations}
              isLoading={isLoading}
          loadingText="Finding locations..."
              leftIcon={<SearchIcon />}
              size="lg"
            >
          Find Perfect Locations
        </Button>

        {/* Results */}
        {isLoading ? (
          <Card>
            <CardBody textAlign="center" py={8}>
              <Spinner size="lg" color="purple.500" mb={4} />
              <Text>Finding perfect places for your group...</Text>
            </CardBody>
          </Card>
        ) : recommendations.length > 0 ? (
          <VStack spacing={4} align="stretch">
            {recommendations.map((rec, index) => {
              const locations = parseLocationRecommendations(rec);
              console.log('🏗️ Parsed locations for UI:', locations);
              
              return (
                <Box key={index}>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md" color="purple.600">
                      Recommended Locations ({locations.length} found)
                    </Heading>
                    <Button
                      colorScheme="green"
                      leftIcon={<span>📊</span>}
                      onClick={() => createPollForAllVenues(locations, rec)}
                      size="sm"
                      isDisabled={!locations || locations.length === 0}
                    >
                      Create Poll ({locations.length} options)
                    </Button>
                  </Flex>
                  
                  {/* Safety Assessment Section */}
                  {rec.safety && rec.safety.score && (
                    <Card mb={4} bg="blue.50" border="1px solid" borderColor="blue.200">
                      <CardBody>
                        <VStack align="start" spacing={3}>
                          <HStack>
                            <Text fontSize="lg" fontWeight="bold" color="blue.600">
                              🛡️ Area Safety Assessment
                            </Text>
                            <Badge 
                              colorScheme={rec.safety.score >= 8 ? 'green' : rec.safety.score >= 6 ? 'yellow' : 'red'}
                              fontSize="sm"
                            >
                              {rec.safety.score}/10
                            </Badge>
                          </HStack>
                          
                          {rec.safety.assessment && (
                            <Text fontSize="sm" color="blue.600">
                              {rec.safety.assessment}
                            </Text>
                          )}
                          
                          {rec.safety.coordinates && (
                            <Text fontSize="sm" color="blue.500">
                              📍 Fair coordinates: {rec.safety.coordinates.lat?.toFixed(4)}, {rec.safety.coordinates.lng?.toFixed(4)}
                            </Text>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  )}
                  
                  {locations.length > 0 ? (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {locations.map((location, locIndex) => {
                        
                        return (
                          <Card 
                            key={locIndex} 
                            cursor="pointer" 
                            _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                            onClick={() => openInGoogleMaps(location.name)}
                          >
                            <CardBody>
                              <VStack align="start" spacing={3}>
                                <HStack justify="space-between" w="100%">
                                  <Text fontWeight="bold" fontSize="lg" color="purple.600">
                                    {location.name}
                                  </Text>
                                  <Text fontSize="xl">📍</Text>
                                </HStack>
                              
                              <VStack align="start" spacing={2} w="100%">
                                {/* Individual distances from each group member */}
                                {location.memberDistances && location.memberDistances.length > 0 && (
                                  <Box>
                                    <Text fontSize="sm" color="gray.500" fontWeight="semibold" mb={1}>Distances:</Text>
                                    <VStack align="start" spacing={1} ml={2}>
                                      {location.memberDistances.map((memberDist, distIndex) => (
                                        <HStack key={distIndex} spacing={2}>
                                          <Text fontSize="xs" color="gray.600" fontWeight="medium">
                                            {memberDist.memberName}:
                                          </Text>
                                          <Text fontSize="xs" color="gray.700">
                                            {memberDist.distance > 1000 
                                              ? `${(memberDist.distance / 1000).toFixed(1)}km away`
                                              : `${memberDist.distance}m away`
                                            }
                                          </Text>
                                        </HStack>
                                      ))}
                                    </VStack>
                                  </Box>
                                )}
                                {location.cuisine && (
                                  <HStack>
                                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">Type:</Text>
                                    <Text fontSize="sm">{location.cuisine}</Text>
                                  </HStack>
                                )}
                                {location.rating && (
                                  <HStack>
                                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">Rating:</Text>
                                    <Badge colorScheme="green">{location.rating}/10</Badge>
                                  </HStack>
                                )}
                                {location.priceLevel && (
                                  <HStack>
                                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">Price:</Text>
                                    <Text fontSize="sm" color="green.600" fontWeight="bold">{location.priceLevel}</Text>
                                  </HStack>
                                )}
                                {location.safetyScore && (
                                  <HStack>
                                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">Safety:</Text>
                                    <Badge 
                                      colorScheme={
                                        location.safetyScore >= 8 ? 'green' : 
                                        location.safetyScore >= 6 ? 'yellow' : 'red'
                                      }
                                    >
                                      {location.safetyScore}/10
                                    </Badge>
                                  </HStack>
                                )}
                                {location.averageDistance > 0 && (
                                  <HStack>
                                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">Avg Distance:</Text>
                                    <Text fontSize="sm" color="blue.600" fontWeight="bold">
                                      {location.averageDistance}km
                                    </Text>
                                  </HStack>
                                )}
                                {location.address && (
                                  <Text fontSize="sm" color="gray.600">
                                    📍 {location.address}
                                  </Text>
                                )}
                              </VStack>



                              <Button 
                                size="sm" 
                                colorScheme="purple" 
                                leftIcon={<span>🗺️</span>}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInGoogleMaps(location.name);
                                }}
                              >
                                Open in Maps
                              </Button>
                            </VStack>
                          </CardBody>
                        </Card>
                        );
                      })}
                    </SimpleGrid>
                  ) : (
                    <Card bg="gray.50">
                      <CardBody textAlign="center">
                        <Text color="gray.500">No locations found. Try adjusting your filters.</Text>
                      </CardBody>
                    </Card>
                  )}
                </Box>
              );
            })}
          </VStack>
        ) : (
          <Card bg="blue.50" border="1px solid" borderColor="blue.200">
            <CardBody textAlign="center" py={8}>
              <Text fontSize="3xl" mb={3}>🎯</Text>
              <Text color="gray.600" mb={2}>Ready to find the perfect meeting spot</Text>
              <Text fontSize="sm" color="gray.500">
                Select your preferences above and click "Find Perfect Locations"
          </Text>
            </CardBody>
          </Card>
      )}
      </VStack>
    </Box>
  );
};

export default LocationFinder;
