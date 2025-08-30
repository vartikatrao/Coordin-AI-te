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
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  ViewIcon, 
  StarIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  MapPinIcon,
} from '@chakra-ui/icons';
import { groupModeAPI, soloModeAPI } from '@/services/api';

const LocationFinder = ({ group }) => {
  const [meetingType, setMeetingType] = useState('coffee');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [meetingLocations, setMeetingLocations] = useState([]);
  const toast = useToast();

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
    
    // Assign random locations to members if they don't have coordinates
    return group.members.map((member, index) => {
      const location = locations[index % locations.length];
      return {
        name: member.name,
        location: location.coords,
        preferences: `Enjoys ${meetingType} places, likes good ambiance`,
        constraints: "Budget-friendly options preferred",
        group_pref: `Looking for ${meetingType} meetup spots`
      };
    });
  };

  // Safety check for group prop
  if (!group || !group.members) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.500">No group selected</Text>
      </Box>
    );
  }

  const findOptimalLocations = async () => {
    setIsLoading(true);
    
    try {
      // Get dummy locations for group members
      const membersWithLocations = getDummyLocations();
      
      // Call the group coordination backend
      const response = await fetch('http://localhost:8000/api/v1/group/coordinate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          members: membersWithLocations,
          meeting_purpose: `Find ${meetingType} places for group meetup ${searchQuery ? `near ${searchQuery}` : ''}`,
          quick_mode: false
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        // Set AI recommendations from the group agent
        if (result.data.intent) {
          setAiRecommendations(`
🎯 **Group Intent Analysis**
Purpose: ${result.data.intent.purpose || meetingType}
Food Preferences: ${result.data.intent.food || 'Mixed preferences'}
Constraints: ${result.data.intent.constraints || 'Budget-friendly options'}
Categories: ${result.data.intent.categories || 'restaurants, cafes'}

📍 **Optimal Location**: Fair coordinates calculated at ${result.data.fair_coords?.[0]?.toFixed(4)}, ${result.data.fair_coords?.[1]?.toFixed(4)}

🛡️ **Safety Assessment**: ${result.data.safety ? JSON.stringify(result.data.safety) : 'Area assessed for safety'}
          `);
        }
        
        // Set venues from Foursquare search
        if (result.data.venues && result.data.venues.length > 0) {
          setMeetingLocations(result.data.venues.map(venue => ({
            name: venue.name || 'Venue',
            address: venue.location?.formatted_address || venue.address || 'Address not available',
            distance: venue.distance ? `${venue.distance}m away` : 'Near optimal location',
            categories: venue.categories?.[0]?.name || meetingType,
            rating: venue.rating || 'Not rated',
            price: venue.price ? '₹'.repeat(venue.price) : 'Price not available',
            fsq_id: venue.fsq_id,
            website: venue.website,
            phone: venue.tel
          })));
        }
        
        // Also set personalized explanations if available
        if (result.data.personalized && result.data.personalized.length > 0) {
          const personalizedText = result.data.personalized.map(item => 
            `**${item.venue}**: ${Object.entries(item.why_for_each).map(([name, reasons]) => 
              `${name} - ${Array.isArray(reasons) ? reasons.join(', ') : reasons}`).join(' | ')}`
          ).join('\n\n');
          
          setAiRecommendations(prev => prev + '\n\n🎨 **Personalized Matches**:\n' + personalizedText);
        }
      } else {
        throw new Error(result.error || 'No locations found');
      }
      
      toast({
        title: 'Group Locations Found!',
        description: `Found ${result.data?.venues?.length || 0} optimal meeting spots for your group`,
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

  const renderAiRecommendations = () => {
    if (!aiRecommendations) return null;

    return (
      <Card mb={6}>
        <CardHeader>
          <Heading size="md" color="purple.600">
            <StarIcon mr={2} />
            AI-Powered Recommendations
          </Heading>
        </CardHeader>
        <CardBody>
          <Text>{aiRecommendations}</Text>
        </CardBody>
      </Card>
    );
  };

  const renderMeetingLocations = () => {
    if (meetingLocations.length === 0) return null;

    return (
      <VStack spacing={4} align="stretch">
        <Heading size="md" color="blue.600">
          🏢 Recommended Meeting Places ({meetingLocations.length} found)
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {meetingLocations.map((location, index) => (
            <Card 
              key={index}
              cursor="pointer"
              _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
              onClick={() => openInGoogleMaps(location.name)}
            >
              <CardBody>
                <VStack align="start" spacing={3}>
                  <HStack justify="space-between" w="100%">
                    <Text fontWeight="bold" fontSize="lg" color="blue.600">
                      {location.name}
                    </Text>
                    <Text fontSize="xl">📍</Text>
                  </HStack>
                  
                  <VStack align="start" spacing={2} w="100%">
                    {location.categories && (
                      <HStack>
                        <Text fontSize="sm" color="gray.500" fontWeight="semibold">Type:</Text>
                        <Badge colorScheme="purple">{location.categories}</Badge>
                      </HStack>
                    )}
                    {location.distance && (
                      <HStack>
                        <Text fontSize="sm" color="gray.500" fontWeight="semibold">Distance:</Text>
                        <Text fontSize="sm">{location.distance}</Text>
                      </HStack>
                    )}
                    {location.rating && location.rating !== 'Not rated' && (
                      <HStack>
                        <Text fontSize="sm" color="gray.500" fontWeight="semibold">Rating:</Text>
                        <Badge colorScheme="green">{location.rating}/10</Badge>
                      </HStack>
                    )}
                    {location.price && location.price !== 'Price not available' && (
                      <HStack>
                        <Text fontSize="sm" color="gray.500" fontWeight="semibold">Price:</Text>
                        <Text fontSize="sm" color="green.600" fontWeight="bold">{location.price}</Text>
                      </HStack>
                    )}
                    {location.address && (
                      <Text fontSize="sm" color="gray.600">
                        📍 {location.address}
                      </Text>
                    )}
                    {location.phone && (
                      <Text fontSize="sm" color="gray.600">
                        📞 {location.phone}
                      </Text>
                    )}
                  </VStack>

                  <HStack spacing={2}>
                    <Button 
                      size="sm" 
                      colorScheme="blue" 
                      leftIcon={<span>🗺️</span>}
                      onClick={(e) => {
                        e.stopPropagation();
                        openInGoogleMaps(location.name);
                      }}
                    >
                      Open in Maps
                    </Button>
                    {location.website && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        leftIcon={<span>🌐</span>}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(location.website, '_blank');
                        }}
                      >
                        Website
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </VStack>
    );
  };
  
  const openInGoogleMaps = (locationName) => {
    const searchQuery = encodeURIComponent(`${locationName} near me`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <Box>
      <Heading size="lg" mb={6} color="purple.600">
        <MapPinIcon mr={2} />
        Find Meeting Location
      </Heading>
      
      {/* Group Info */}
      <Card mb={6}>
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between">
              <Text fontWeight="bold">Group: {group.name}</Text>
              <Badge colorScheme="purple">{group.members.length} members</Badge>
            </HStack>
            
            <HStack spacing={4}>
              <Avatar size="sm" name={group.members[0]?.name} />
              <Text fontSize="sm" color="gray.600">
                {group.members.slice(0, 3).map(m => m.name).join(', ')}
                {group.members.length > 3 && ` +${group.members.length - 3} more`}
              </Text>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Search Controls */}
      <Card mb={6}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack spacing={4}>
              <FormControl>
                <FormLabel>Meeting Type</FormLabel>
                <Select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                >
                  <option value="coffee">Coffee/Tea</option>
                  <option value="food">Food/Restaurant</option>
                  <option value="work">Work/Study</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="shopping">Shopping</option>
                  <option value="fitness">Fitness/Outdoor</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Location Preference</FormLabel>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., Indiranagar, MG Road, Central"
                />
              </FormControl>
            </HStack>
            
            <Button
              colorScheme="purple"
              onClick={findOptimalLocations}
              isLoading={isLoading}
              loadingText="Finding optimal locations..."
              leftIcon={<SearchIcon />}
              size="lg"
            >
              Find Optimal Meeting Location
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {/* AI Recommendations */}
      {renderAiRecommendations()}
      
      {/* Meeting Locations */}
      {renderMeetingLocations()}
      
      {/* Loading State */}
      {isLoading && (
        <Box textAlign="center" py={8}>
          <Spinner size="xl" color="purple.500" />
          <Text mt={4} color="gray.600">
            AI is analyzing your group's needs and finding optimal locations...
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default LocationFinder;
