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
      const data = await groupModeAPI.findGroupMeetup(
        group.members.map(m => ({
          name: m.name,
          location: m.location || 'Unknown'
        })),
        meetingType,
        group.members.length,
        searchQuery || `Find ${meetingType} places for group meeting`
      );

      setAiRecommendations(data.meetup_plan);
      
      // Also try to get specific location recommendations from the solo agent
      try {
        const soloData = await soloModeAPI.processQuery(
          `Find ${meetingType} places suitable for group of ${group.members.length} people near ${searchQuery || 'central location'}`,
          null,
          {
            purpose: meetingType,
            group_size: group.members.length,
            group_type: 'friends'
          }
        );

        if (soloData.status === 'success') {
          setMeetingLocations([soloData.data]);
        }
      } catch (soloError) {
        console.warn('Solo agent location search failed:', soloError);
      }
      
      toast({
        title: 'AI Recommendations Generated!',
        description: 'Found optimal meeting locations for your group',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error finding locations:', error);
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
        <Heading size="md" color="blue.600">Suggested Meeting Places</Heading>
        {meetingLocations.map((location, index) => (
          <Card key={index}>
            <CardBody>
              {location.recommendations && (
                <Text>{location.recommendations}</Text>
              )}
              {location.response && (
                <Text>{location.response}</Text>
              )}
            </CardBody>
          </Card>
        ))}
      </VStack>
    );
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
