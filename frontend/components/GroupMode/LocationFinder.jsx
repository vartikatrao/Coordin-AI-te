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
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
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
import { groupModeAPI, soloModeAPI } from '@/services/api';

const LocationFinder = ({ group }) => {
  const [meetingType, setMeetingType] = useState('coffee');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [filters, setFilters] = useState({
    budget: '',
    radius: 2000,
    categories: '',
    timePreference: '',
    atmosphere: '',
    features: []
  });
  const toast = useToast();

  // Filter options (same as Solo Mode)
  const budgetOptions = [
    { value: '', label: 'Any Budget' },
    { value: '1', label: 'Budget Friendly ($)' },
    { value: '2', label: 'Moderate ($$)' },
    { value: '3', label: 'Expensive ($$$)' },
    { value: '4', label: 'Very Expensive ($$$$)' }
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: '13065', label: 'Restaurants' },
    { value: '13032', label: 'Coffee Shops' },
    { value: '16032', label: 'Libraries' },
    { value: '10032', label: 'Gyms & Fitness' },
    { value: '17069', label: 'Shopping' },
    { value: '10027', label: 'Entertainment' },
    { value: '13003', label: 'Bars & Nightlife' },
    { value: '16026', label: 'Parks' },
    { value: '12058', label: 'Co-working Spaces' }
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
      radius: 2000,
      categories: '',
      timePreference: '',
      atmosphere: '',
      features: []
    });
  };

  const findOptimalLocations = async () => {
    setIsLoading(true);
    
    try {
      // Build query with group context and filters
      let filterString = '';
      if (filters.budget) {
        const budgetLabel = budgetOptions.find(b => b.value === filters.budget)?.label || '';
        filterString += ` Budget: ${budgetLabel}.`;
      }
      if (filters.timePreference) {
        filterString += ` Time preference: ${filters.timePreference}.`;
      }
      if (filters.atmosphere) {
        filterString += ` Atmosphere: ${filters.atmosphere}.`;
      }
      if (filters.categories) {
        const categoryLabel = categoryOptions.find(c => c.value === filters.categories)?.label || '';
        filterString += ` Looking for: ${categoryLabel}.`;
      }
      if (filters.features && Array.isArray(filters.features) && filters.features.length > 0) {
        filterString += ` Required features: ${filters.features.join(', ')}.`;
      }
      if (filters.radius !== 2000) {
        filterString += ` Search within ${filters.radius}m radius.`;
      }

      const query = `Find ${meetingType} places suitable for a group of ${group.members.length} people. Group members: ${group.members.map(m => m.name).join(', ')}.${filterString}`;
      
      const response = await fetch('http://localhost:8000/api/v1/solo-page/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          user_location: "12.9716,77.5946", // Default to Bangalore
          context: {
            budget: filters.budget,
            categories: filters.categories,
            radius: filters.radius,
            time_preference: filters.timePreference,
            atmosphere: filters.atmosphere,
            group_type: 'group',
            features: filters.features,
            price: filters.budget,
            group_size: group.members.length
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        setRecommendations([{
          type: 'group',
          suggestions: result.data,
          meetingType: meetingType,
          groupSize: group.members.length
        }]);
        
        toast({
          title: 'Locations Found!',
          description: 'Found perfect places for your group meetup',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('No locations found');
      }
    } catch (error) {
      console.error('Error finding locations:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to find locations',
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
      
      // Check for structured places data from backend
      if (recommendationData && recommendationData.places && Array.isArray(recommendationData.places)) {
        return recommendationData.places.map((place, index) => ({
          name: place.name || 'Unknown Place',
          distance: place.distance ? `${place.distance}m` : 'Near you',
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

              {/* Category Filter */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Place Category</FormLabel>
                <Select 
                  value={filters.categories} 
                  onChange={(e) => handleFilterChange('categories', e.target.value)}
                  placeholder="Select category"
                >
                  {categoryOptions.slice(1).map((option) => (
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

              {/* Search Radius */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">
                  Search Radius: {filters.radius}m
                </FormLabel>
                <Slider
                  value={filters.radius}
                  min={500}
                  max={10000}
                  step={500}
                  onChange={(value) => handleFilterChange('radius', value)}
                >
                  <SliderTrack>
                    <SliderFilledTrack bg="purple.400" />
                  </SliderTrack>
                  <SliderThumb bg="purple.400" />
                </Slider>
                <Flex justify="space-between" fontSize="xs" color="gray.500" mt={1}>
                  <Text>500m</Text>
                  <Text>10km</Text>
                </Flex>
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
              const locations = parseLocationRecommendations(rec.suggestions || rec);
              
              return (
                <Box key={index}>
                  <Heading size="md" mb={4} color="purple.600">
                    Recommended Locations ({locations.length} found)
                  </Heading>
                  
                  {locations.length > 0 ? (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {locations.map((location, locIndex) => (
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
                                {location.distance && (
                                  <HStack>
                                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">Distance:</Text>
                                    <Text fontSize="sm">{location.distance}</Text>
                                  </HStack>
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
                      ))}
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
