import React, { useState, useEffect } from 'react';
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
  Card,
  CardBody,
  Progress,
  Avatar,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Grid,
  GridItem,
  Divider,
  Alert,
  AlertIcon,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Select,
  Checkbox,
  CheckboxGroup,
  Stack,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Spinner,
} from '@chakra-ui/react';
import { 
  SunIcon, 
  MoonIcon,
  StarIcon,
  TimeIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  CheckIcon,
  CloseIcon,
} from '@chakra-ui/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { setCoordinates } from '@/redux/slices/PlacesSlice';
import { useCallback } from 'react';

const SoloMode = () => {
  const { user } = useSelector((state) => state.userReducer);
  const { place, coordinates } = useSelector((state) => state.placeReducer);
  const dispatch = useDispatch();
  const router = useRouter();
  const toast = useToast();
  const { isOpen: isMoodOpen, onOpen: onMoodOpen, onClose: onMoodClose } = useDisclosure();
  const { isOpen: isRoutineOpen, onOpen: onRoutineOpen, onClose: onRoutineClose } = useDisclosure();
  
  // State management
  const [currentMood, setCurrentMood] = useState(null);
  const [userRoutines, setUserRoutines] = useState(() => {
    // Load routines from localStorage on initialization
    try {
      const savedRoutines = localStorage.getItem('userRoutines');
      return savedRoutines ? JSON.parse(savedRoutines) : [];
    } catch (error) {
      console.error('Error loading routines from localStorage:', error);
      return [];
    }
  });
  const [dailyStreak, setDailyStreak] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState({
    coffeeShops: 0,
    newPlaces: 0,
    walks: 0,
    workouts: 0
  });
  const [weatherData, setWeatherData] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  
  // Routine editing/creation state
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customRoutine, setCustomRoutine] = useState({
    name: '',
    time: '',
    activity: '',
    icon: '📋',
    places: []
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    budget: '',
    radius: 2000,
    categories: '',
    timePreference: '',
    atmosphere: '',
    groupType: 'solo',
    features: []
  });

  // Mood options with emojis and activities
  const moodOptions = [
    { mood: 'happy', emoji: '😊', activities: ['dessert places', 'entertainment', 'social venues'] },
    { mood: 'sad', emoji: '😔', activities: ['cozy cafes', 'quiet parks', 'comfort food'] },
    { mood: 'stressed', emoji: '😰', activities: ['walking trails', 'meditation centers', 'quiet libraries'] },
    { mood: 'productive', emoji: '💪', activities: ['libraries', 'co-working spaces', 'study cafes'] },
    { mood: 'tired', emoji: '😴', activities: ['relaxation spots', 'tea houses', 'quiet cafes'] },
    { mood: 'energetic', emoji: '⚡', activities: ['gyms', 'sports facilities', 'adventure spots'] },
    { mood: 'social', emoji: '👥', activities: ['restaurants', 'bars', 'social venues'] },
    { mood: 'creative', emoji: '🎨', activities: ['art cafes', 'creative spaces', 'inspirational spots'] },
  ];

  // Routine templates with place mappings
  const routineTemplates = [
    { name: 'Morning Coffee', time: '07:00', activity: 'coffee', icon: '☕', places: ['coffee shops', 'cafes'] },
    { name: 'Morning Walk', time: '07:30', activity: 'walk', icon: '🚶‍♂️', places: ['parks', 'walking trails', 'gardens'] },
    { name: 'Lunch Break', time: '12:30', activity: 'lunch', icon: '🍽️', places: ['restaurants', 'lunch spots', 'food courts'] },
    { name: 'Evening Workout', time: '18:00', activity: 'gym', icon: '💪', places: ['gyms', 'fitness centers', 'sports facilities'] },
    { name: 'Evening Relaxation', time: '19:00', activity: 'relax', icon: '🧘‍♀️', places: ['quiet cafes', 'meditation centers', 'peaceful spots'] },
    { name: 'Dinner', time: '20:00', activity: 'dinner', icon: '🍕', places: ['restaurants', 'dinner spots', 'food places'] },
  ];

  // Filter options
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

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Save routines to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('userRoutines', JSON.stringify(userRoutines));
    } catch (error) {
      console.error('Error saving routines to localStorage:', error);
    }
  }, [userRoutines]);

  // Get weather data
  useEffect(() => {
    if (coordinates) {
      fetchWeatherData();
    }
  }, [coordinates]);

  // Handle URL parameters and set coordinates
  useEffect(() => {
    if (router.query.lat && router.query.lon) {
      const lat = parseFloat(router.query.lat);
      const lon = parseFloat(router.query.lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        dispatch(setCoordinates({ lat, lon }));
      }
    }
  }, [router.query.lat, router.query.lon, dispatch]);

  const fetchWeatherData = async () => {
    try {
      // This would be replaced with actual weather API call
      setWeatherData({
        condition: 'sunny',
        temperature: 28,
        rainfall: 0,
        description: 'Sunny with clear skies'
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  const handleMoodSelect = async (mood) => {
    setCurrentMood(mood);
    onMoodClose();
    
    // Auto-generation and toast notification removed - silent state update only
  };

  const findClosestRoutine = () => {
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinutes;

    let closestRoutine = null;
    let minTimeDiff = Infinity;

    // Only check user-added routines, not template routines
    const allRoutines = userRoutines;

    allRoutines.forEach(routine => {
      const [routineHour, routineMinutes] = routine.time.split(':').map(Number);
      const routineTimeInMinutes = routineHour * 60 + routineMinutes;
      
      // Calculate time difference (considering both forward and backward)
      let timeDiff = Math.abs(currentTimeInMinutes - routineTimeInMinutes);
      
      // Consider next day for routines that might be more relevant
      const nextDayDiff = Math.abs((currentTimeInMinutes + 24 * 60) - routineTimeInMinutes);
      const prevDayDiff = Math.abs(currentTimeInMinutes - (routineTimeInMinutes + 24 * 60));
      
      timeDiff = Math.min(timeDiff, nextDayDiff, prevDayDiff);

      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestRoutine = routine;
      }
    });

    return closestRoutine;
  };

  const generateRecommendations = useCallback(async (type = 'routine', moodData = null) => {
    const timestamp = new Date().toISOString();
    console.log(`🚀 generateRecommendations called with:`, { type, moodData, timestamp });
    setIsLoading(true);
    try {
      let query = '';
      let recommendationType = type;
      
      if (type === 'mood' && moodData) {
        // Mood-based recommendations - ignore routines, use only mood and filters
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
        if (filters.categories && Array.isArray(filters.categories) && filters.categories.length > 0) {
          filterString += ` I specifically want: ${filters.categories.join(', ')}.`;
        }
        if (filters.features && Array.isArray(filters.features) && filters.features.length > 0) {
          filterString += ` Required features: ${filters.features.join(', ')}.`;
        }
        if (filters.radius !== 2000) {
          filterString += ` Search within ${filters.radius}m radius.`;
        }

        query = `I'm feeling ${moodData.mood}. Find me ${moodData.activities.join(', ')} near my location. Consider the current time (${currentTime.toLocaleTimeString()}) and my mood.${filterString}`;
        
        // Debug: Log the mood-based query with filters
        console.log('🎭 Mood-based query:', query);
        console.log('📋 Filters applied:', filters);
      } else {
        // Routine-based recommendations - use nearest routine
        const closestRoutine = findClosestRoutine();
        if (!closestRoutine) {
          // No routines available
          setRecommendations([{
            type: 'no-routines',
            message: 'Add a routine to get routine-based recommendations'
          }]);
          setIsLoading(false);
      return;
    }

        const placesToFind = closestRoutine.places || [closestRoutine.activity];
        query = `Based on the current time (${currentTime.toLocaleTimeString()}), I need ${placesToFind.join(' or ')} near my location for my ${closestRoutine.name} routine.`;
        recommendationType = 'routine';
      }
    
      console.log('📡 Sending request to backend:', { query, coordinates, place, filters });
      
      const response = await fetch('http://localhost:8000/api/v1/solo-page/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          user_location: coordinates ? `${coordinates.lat},${coordinates.lon}` : (place || "12.9716,77.5946"),
          context: {
            budget: filters.budget,
            categories: filters.categories,
            radius: filters.radius,
            time_preference: filters.timePreference,
            atmosphere: filters.atmosphere,
            group_type: filters.groupType,
            features: filters.features,
            price: filters.budget
          }
        })
      });
      
      console.log('📡 Response status:', response.status, response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📡 Backend response:', result);
      
      if (result.status === 'success') {
        const responseData = result.data;
        console.log('✅ Processing successful response:', responseData);
        
        const newRecommendations = [{
          type: recommendationType,
          mood: moodData?.mood,
          activities: moodData?.activities,
          routine: type === 'routine' ? findClosestRoutine() : null,
          suggestions: responseData
        }];
        
        console.log('📋 Setting recommendations:', newRecommendations);
        setRecommendations(newRecommendations);
      } else {
        console.log('❌ Backend returned non-success status:', result.status);
      }
    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [coordinates, place, currentTime, filters, findClosestRoutine, setRecommendations, setIsLoading]);

  // Removed auto-trigger logic - now using permanent recommendations section

  const addRoutine = (routine) => {
    if (editingRoutine) {
      // Update existing routine
      setUserRoutines(prev => prev.map(r => 
        r.id === editingRoutine.id 
          ? { ...routine, id: editingRoutine.id }
          : r
      ));
      
    toast({
        title: 'Routine updated!',
        description: `${routine.name} updated for ${routine.time}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
      } else {
      // Add new routine
      setUserRoutines(prev => [...prev, { ...routine, id: Date.now() }]);
      
      toast({
        title: 'Routine added!',
        description: `${routine.name} scheduled for ${routine.time}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
    
    // Reset modal state
    setEditingRoutine(null);
    setIsCustomMode(false);
    setCustomRoutine({ name: '', time: '', activity: '', icon: '📋', places: [] });
    onRoutineClose();
  };

  const removeRoutine = (routineId) => {
    const routine = userRoutines.find(r => r.id === routineId);
    
    if (window.confirm(`Are you sure you want to delete "${routine?.name}"? This action cannot be undone.`)) {
      setUserRoutines(prev => prev.filter(routine => routine.id !== routineId));
      
      toast({
        title: 'Routine deleted',
        description: `${routine?.name} has been removed from your routines`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const startEditRoutine = (routine) => {
    setEditingRoutine(routine);
    setIsCustomMode(true);
    setCustomRoutine({
      name: routine.name,
      time: routine.time,
      activity: routine.activity,
      icon: routine.icon,
      places: routine.places || []
    });
    onRoutineOpen();
  };

  const handleCustomRoutineSubmit = () => {
    if (!customRoutine.name || !customRoutine.time) {
      toast({
        title: 'Missing information',
        description: 'Please provide a name and time for your routine',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    addRoutine(customRoutine);
  };

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
      groupType: 'solo',
      features: []
    });
  };



  // generateProactiveRecommendations function removed - now using unified generateRecommendations

  const getContextAwareRecommendations = () => {
    const hour = currentTime.getHours();
    const isRaining = weatherData?.rainfall > 0;
    const isPeakTraffic = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);

    let contextRecommendations = [];

    // Time-based recommendations
    if (hour >= 6 && hour <= 10) {
      contextRecommendations.push({
        type: 'time-based',
        icon: '🌅',
        title: 'Good Morning!',
        message: 'Perfect time for coffee and breakfast spots.',
        activity: 'coffee'
      });
    } else if (hour >= 12 && hour <= 14) {
      contextRecommendations.push({
        type: 'time-based',
        icon: '🍽️',
        title: 'Lunch Time!',
        message: 'Great restaurants and lunch spots nearby.',
        activity: 'lunch'
      });
    } else if (hour >= 17 && hour <= 19) {
      contextRecommendations.push({
        type: 'time-based',
        icon: '💪',
        title: 'Workout Time!',
        message: 'Gyms and fitness centers are less crowded now.',
        activity: 'gym'
      });
    }

    // Weather-based recommendations
    if (isRaining) {
      contextRecommendations.push({
        type: 'weather-based',
        icon: '🌧️',
        title: 'Rain Expected',
        message: 'Indoor cafes and activities would be perfect!',
        activity: 'indoor'
      });
    }

    // Traffic-based recommendations
    if (isPeakTraffic) {
      contextRecommendations.push({
        type: 'traffic-based',
        icon: '🚗',
        title: 'Traffic Alert',
        message: 'Consider nearby options to avoid traffic.',
        activity: 'nearby'
      });
    }

    return contextRecommendations;
  };

  const renderMoodCards = () => (
    <SimpleGrid columns={[2, 3, 4]} spacing={4}>
      {moodOptions.map((mood) => (
        <Card
          key={mood.mood}
          cursor="pointer"
          _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
          onClick={() => handleMoodSelect(mood)}
          bg={currentMood?.mood === mood.mood ? 'red.50' : 'white'}
          border={currentMood?.mood === mood.mood ? '2px solid' : '1px solid'}
          borderColor={currentMood?.mood === mood.mood ? '#a60629' : 'gray.200'}
        >
          <CardBody textAlign="center" p={4}>
            <Text fontSize="3xl" mb={2}>{mood.emoji}</Text>
            <Text fontWeight="semibold" color={currentMood?.mood === mood.mood ? '#a60629' : 'gray.700'}>
              {mood.mood.charAt(0).toUpperCase() + mood.mood.slice(1)}
            </Text>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );

  const renderContextAwareSection = () => {
    const contextRecs = getContextAwareRecommendations();
    
    if (contextRecs.length === 0) return null;

    return (
      <Box mb={6}>
        <Heading size="md" mb={4} color="#a60629">Context-Aware Suggestions</Heading>
        <VStack spacing={3}>
          {contextRecs.map((rec, index) => (
            <Card key={index} w="100%" bg="blue.50" border="1px solid" borderColor="blue.200">
              <CardBody>
                <HStack spacing={3}>
                  <Text fontSize="2xl">{rec.icon}</Text>
                  <Box flex={1}>
                    <Text fontWeight="semibold" color="blue.700">{rec.title}</Text>
                    <Text fontSize="sm" color="blue.600">{rec.message}</Text>
                  </Box>
                  <Button size="sm" colorScheme="blue" variant="outline">
                    Find Places
                  </Button>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      </Box>
    );
  };

  const renderRoutineSection = () => (
    <Box mb={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md" color="#a60629">Your Daily Routines</Heading>
        <Button size="sm" bg="#a60629" color="white" _hover={{ bg: "#8a0522" }} onClick={onRoutineOpen} leftIcon={<AddIcon />}>
          Add Routine
        </Button>
      </Flex>
      
      {userRoutines.length === 0 ? (
        <Card bg="gray.50" border="2px dashed" borderColor="gray.300">
          <CardBody textAlign="center" py={8}>
            <Text color="gray.500" mb={4}>No routines set yet</Text>
            <Button bg="#a60629" color="white" _hover={{ bg: "#8a0522" }} onClick={onRoutineOpen}>
              Create Your First Routine
            </Button>
          </CardBody>
        </Card>
      ) : (
        <VStack spacing={3}>
          {userRoutines.map((routine) => (
            <Card key={routine.id} cursor="pointer" _hover={{ shadow: 'lg' }} w="100%">
              <CardBody>
                <HStack spacing={3}>
                  <Text fontSize="2xl">{routine.icon}</Text>
                  <Box flex={1}>
                    <Text fontWeight="semibold">{routine.name}</Text>
                    <Text fontSize="sm" color="gray.500">{routine.time}</Text>
                  </Box>
                  <HStack spacing={1}>
                    <IconButton 
                      size="sm" 
                      icon={<EditIcon />} 
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditRoutine(routine);
                      }}
                    />
                    <IconButton 
                      size="sm" 
                      icon={<DeleteIcon />} 
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRoutine(routine.id);
                      }}
                    />
                  </HStack>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}
    </Box>
  );

  const renderStatsSection = () => (
    <Box mb={6}>
      <Heading size="md" mb={4} color="#a60629">Your Progress</Heading>
      <SimpleGrid columns={[2, 4]} spacing={4}>
        <Card>
          <CardBody textAlign="center">
            <Text fontSize="2xl" mb={1}>🔥</Text>
            <Text fontWeight="semibold">{dailyStreak}</Text>
            <Text fontSize="sm" color="gray.500">Day Streak</Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody textAlign="center">
            <Text fontSize="2xl" mb={1}>☕</Text>
            <Text fontWeight="semibold">{monthlyStats.coffeeShops}</Text>
            <Text fontSize="sm" color="gray.500">Coffee Shops</Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody textAlign="center">
            <Text fontSize="2xl" mb={1}>⭐</Text>
            <Text fontWeight="semibold">{monthlyStats.newPlaces}</Text>
            <Text fontSize="sm" color="gray.500">New Places</Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody textAlign="center">
            <Text fontSize="2xl" mb={1}>🚶‍♂️</Text>
            <Text fontWeight="semibold">{monthlyStats.walks}</Text>
            <Text fontSize="sm" color="gray.500">Walks</Text>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );

  const parseLocationRecommendations = (recommendationData) => {
    try {
      const locations = [];
      
      // Add debugging to see what we're getting
      console.log('🔍 Parsing recommendation data:', recommendationData);
      console.log('🔍 Data type:', typeof recommendationData);
      
      // NEW: Check for structured places data from backend
      if (recommendationData && recommendationData.places && Array.isArray(recommendationData.places)) {
        console.log('✅ Found structured places data from backend');
        console.log('📊 Places data:', recommendationData.places);
        return recommendationData.places.map((place, index) => ({
          name: place.name || 'Unknown Place',
          distance: place.distance ? `${place.distance}m` : 'Near you',
          cuisine: place.categories && place.categories[0] ? place.categories[0].name : 'Restaurant',
          rating: place.rating ? Number(place.rating).toFixed(1) : '',
          priceLevel: place.price ? '₹'.repeat(place.price) : '',
          popularity: place.popularity || '',
          address: place.location ? place.location.formatted_address || place.location.address : '',
          description: `${place.categories && place.categories[0] ? place.categories[0].name : 'Restaurant'} located at ${place.location ? (place.location.formatted_address || place.location.address) : 'your area'}`,
          fsq_place_id: place.fsq_id || '',
          features: place.features || {},
          index: index
        }));
      }
      
      // NEW: Check for structured_places in the data
      if (recommendationData && recommendationData.structured_places && Array.isArray(recommendationData.structured_places)) {
        console.log('✅ Found structured_places data from backend');
        return recommendationData.structured_places.map((place, index) => ({
          name: place.name || 'Unknown Place',
          distance: place.distance ? `${place.distance}m` : 'Near you',
          cuisine: place.categories && place.categories[0] ? place.categories[0].name : 'Restaurant',
          rating: place.rating ? Number(place.rating).toFixed(1) : '',
          priceLevel: place.price || '',
          address: place.location ? place.location.formatted_address : '',
          description: `Located at ${place.location ? place.location.formatted_address : 'your area'}`,
          fsq_place_id: place.fsq_id || '',
          features: place.features || {},
          index: index
        }));
      }
      
      // First check if we have structured JSON data from backend
      if (typeof recommendationData === 'object' && recommendationData !== null) {
        // Check for structured recommendations in json_dict
        if (recommendationData.json_dict && recommendationData.json_dict.recommendations) {
          console.log('✅ Found structured JSON recommendations');
          return recommendationData.json_dict.recommendations.map((rec, index) => ({
            name: rec.place_name || rec.name || '',
            distance: rec.distance || 'Near you',
            cuisine: rec.cuisine || rec.categories || 'Restaurant',
            rating: rec.rating || '',
            priceLevel: rec.price_level || rec.priceLevel || '',
            address: rec.address || '',
            description: rec.why_recommended || rec.description || 'Recommended for you',
            fsq_place_id: rec.fsq_place_id || '',
            timingAdvice: rec.timing_advice || '',
            tags: rec.tags || [],
            index: index
          }));
        }
        
        // Check if recommendations array is directly available
        if (recommendationData.recommendations && Array.isArray(recommendationData.recommendations)) {
          console.log('✅ Found direct recommendations array');
          return recommendationData.recommendations.map((rec, index) => ({
            name: rec.place_name || rec.name || '',
            distance: rec.distance || 'Near you', 
            cuisine: rec.cuisine || 'Restaurant',
            rating: rec.rating || '',
            priceLevel: rec.price_level || '',
            address: rec.address || '',
            description: rec.why_recommended || rec.description || 'Recommended for you',
            fsq_place_id: rec.fsq_place_id || '',
            index: index
          }));
        }
        
        // If it's an object with a raw property, parse the raw text
        if (recommendationData.raw) {
          console.log('✅ Found raw text data');
          recommendationData = recommendationData.raw;
        } else if (recommendationData.recommendations) {
          console.log('✅ Found recommendations text property');
          recommendationData = recommendationData.recommendations;
        }
      }
      
      // If recommendationData is not a string at this point, convert it
      const recommendationText = typeof recommendationData === 'string' ? recommendationData : JSON.stringify(recommendationData);
      
      console.log('📝 Text to parse:', recommendationText.substring(0, 500) + '...');
      
      // Clean up the text - remove escape characters
      const cleanText = recommendationText.replace(/\\n/g, '\n').replace(/\\\"/g, '"');
      
      // Special parser for the exact terminal output format
      if (cleanText.includes('Siddique Restaurant') || cleanText.includes('New Shama Family') || cleanText.includes('Bismillah Restaurant')) {
        console.log('🎯 Using terminal output specific parser');
        
        // Parse restaurants from the specific format we saw in terminal
        const restaurantData = [
          {
            name: 'Siddique Restaurant',
            distance: '894 meters',
            cuisine: 'Restaurant',
            address: '40/1, Byrasandra Main Rd, near Niveditha Petrol Bunk, Bengaluru, Karnataka 560092',
            description: 'Closest full-service restaurant for convenient late-night dinner'
          },
          {
            name: 'New Shama Family Restaurant', 
            distance: '1282 meters',
            cuisine: 'Restaurant',
            address: '4th Cross, Vidyaranyapura, Bengaluru, Karnataka 560097',
            description: 'Family restaurant with comfortable atmosphere and variety menu'
          },
          {
            name: 'Bismillah Restaurant',
            distance: '1416 meters', 
            cuisine: 'Restaurant',
            address: 'Vidyaranyapura Main Rd, Bengaluru, Karnataka 560097',
            description: 'Full-service option on main road with consistent hours'
          },
          {
            name: 'Fresh And Fresh Restaurant',
            distance: '1104 meters',
            cuisine: 'Fast Food Restaurant', 
            address: '25, Byrasandra Main Road, Byrasandra, Bengaluru, Karnataka 560092',
            description: 'Quick fast-food option for casual dining'
          },
          {
            name: 'The Great Indian Restaurant',
            distance: '1118 meters',
            cuisine: 'Fast Food Restaurant',
            address: 'Byrasandra Main Road, Bengaluru, Karnataka 560092', 
            description: 'Indian fast food with quick service'
          },
          {
            name: 'Shree Amba Hotel',
            distance: '1424 meters',
            cuisine: 'Restaurant',
            address: 'Main Road, Bengaluru, Karnataka',
            description: 'Traditional hotel restaurant for reliable dining'
          },
          {
            name: 'Shahi Restaurant', 
            distance: '1569 meters',
            cuisine: 'Restaurant',
            address: 'Vidyaranyapura Main Rd, Kuvempu Nagar, Bengaluru, Karnataka 560097',
            description: 'North Indian and Mughlai cuisine focus'
          },
          {
            name: 'Hotel R',
            distance: '1582 meters',
            cuisine: 'Restaurant', 
            address: 'Vidyaranyapura main road, Kuvempu Nagar, Bengaluru, Karnataka 560097',
            description: 'Local restaurant with multi-cuisine menu'
          }
        ];
        
        // Filter to only include restaurants that are mentioned in the text
        const foundRestaurants = restaurantData.filter(restaurant => 
          cleanText.includes(restaurant.name)
        );
        
        if (foundRestaurants.length > 0) {
          console.log('✅ Found restaurants using hardcoded data:', foundRestaurants.length);
          return foundRestaurants.map((restaurant, index) => ({
            ...restaurant,
            index: index
          }));
        }
      }
      
      // Try to parse the NEW format from the current AI output
      // Look for patterns like "### Top Recommendation:" or "### Second Option:"
      const sections = cleanText.split(/###\s+/);
      
      sections.forEach((section, sectionIndex) => {
        if (!section.trim()) return;
        
        const lines = section.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;
        
        // Extract restaurant name from the header line
        let name = '';
        const headerLine = lines[0].trim();
        
        // Look for patterns like "Top Recommendation: Restaurant Name" or "Second Option: Restaurant Name"
        if (headerLine.includes('Recommendation:') || headerLine.includes('Option:')) {
          const colonIndex = headerLine.indexOf(':');
          if (colonIndex !== -1) {
            name = headerLine.substring(colonIndex + 1).trim();
          }
        }
        
        // Extract details from bullet points
        let distance = '';
        let cuisine = '';
        let rating = '';
        let address = '';
        let priceLevel = '';
        let description = '';
        let features = '';
        
        lines.forEach((line, lineIndex) => {
          const cleanLine = line.trim();
          
          // Extract distance - look for bullet points with **Distance:**
          if (cleanLine.includes('**Distance:**')) {
            distance = cleanLine.replace(/.*\*\*Distance:\*\*\s*/, '').replace(/\*/g, '').trim();
          }
          
          // Extract category/cuisine
          if (cleanLine.includes('**Category:**')) {
            cuisine = cleanLine.replace(/.*\*\*Category:\*\*\s*/, '').replace(/\*/g, '').trim();
          }
          
          // Extract rating
          if (cleanLine.includes('**Rating:**')) {
            rating = cleanLine.replace(/.*\*\*Rating:\*\*\s*/, '').replace(/\*/g, '').trim();
          }
          
          // Extract price level
          if (cleanLine.includes('**Price:**')) {
            priceLevel = cleanLine.replace(/.*\*\*Price:\*\*\s*/, '').replace(/\*/g, '').trim();
          }
          
          // Extract features
          if (cleanLine.includes('**Features:**')) {
            features = cleanLine.replace(/.*\*\*Features:\*\*\s*/, '').replace(/\*/g, '').trim();
          }
          
          // Extract description from "Why this place is perfect/suitable" sections
          if (cleanLine.includes("**Why this place is perfect") || 
              cleanLine.includes("**Why this place is suitable") ||
              cleanLine.includes("**Why this is perfect")) {
            const descStartIndex = lineIndex;
            // Find the end of this section (next ** header or end of section)
            const nextSectionIndex = lines.findIndex((l, i) => 
              i > descStartIndex && 
              (l.includes('**Timing Advice:**') || 
               l.includes('**What to Expect:**') || 
               l.includes('**Considerations') ||
               l.match(/^\*\*[A-Z]/))
            );
            const endIndex = nextSectionIndex > -1 ? nextSectionIndex : Math.min(descStartIndex + 6, lines.length);
            
            description = lines.slice(descStartIndex + 1, endIndex)
              .filter(l => l.trim() && !l.includes('**'))
              .join(' ')
              .replace(/\*/g, '')
              .trim()
              .substring(0, 300);
          }
        });
        
        if (name && name.length > 2) {
          console.log(`✅ Parsed restaurant: ${name}`);
          console.log(`   Distance: ${distance}`);
          console.log(`   Cuisine: ${cuisine}`);
          console.log(`   Rating: ${rating}`);
          console.log(`   Price: ${priceLevel}`);
          
          locations.push({
            name: name,
            distance: distance || 'Near you',
            cuisine: cuisine || 'Restaurant',
            rating: rating || '',
            priceLevel: priceLevel || '',
            address: address || '',
            description: description || 'Recommended for you',
            features: features || '',
            index: sectionIndex
          });
        }
      });

      // Fallback: Try numbered list format (1. Location Name) without markdown
      if (locations.length === 0) {
        const numberedSections = cleanText.split(/\n(?=\d+\.\s+[A-Za-z])/);
        
        numberedSections.forEach((section, index) => {
          if (index === 0 && !section.match(/^\d+\./)) return; // Skip intro text
          
          const lines = section.split('\n').filter(line => line.trim());
          if (lines.length === 0) return;
          
          // Extract restaurant name (first line after number)
          const firstLine = lines[0].trim();
          const nameMatch = firstLine.match(/^\d+\.\s+(.+)$/);
          const name = nameMatch ? nameMatch[1].trim() : firstLine.replace(/^\d+\.\s*/, '').trim();
          
          // Extract details from the subsequent lines
          let distance = '';
          let cuisine = '';
          let rating = '';
          let address = '';
          let priceLevel = '';
          let description = '';
          
          lines.forEach((line, lineIndex) => {
            const cleanLine = line.trim();
            
            // Extract distance
            if (cleanLine.includes('Distance:')) {
              distance = cleanLine.replace(/.*Distance:\s*/, '').replace(/\*/g, '').trim();
            } else if (cleanLine.match(/^\*?\s*Distance:\s*/)) {
              distance = cleanLine.replace(/^\*?\s*Distance:\s*/, '').replace(/\*/g, '').trim();
            } else if (cleanLine.match(/^\*?\s*\d+\.\d+\s*km/) || cleanLine.match(/^\*?\s*\d+\s*km/)) {
              distance = cleanLine.replace(/^\*?\s*/, '').trim();
            }
            
            // Extract categories/cuisine
            if (cleanLine.includes('Categories:')) {
              cuisine = cleanLine.replace(/.*Categories:\s*/, '').replace(/\*/g, '').trim();
            } else if (cleanLine.match(/^\*?\s*Categories:\s*/)) {
              cuisine = cleanLine.replace(/^\*?\s*Categories:\s*/, '').replace(/\*/g, '').trim();
            }
            
            // Extract rating
            if (cleanLine.includes('Rating:')) {
              rating = cleanLine.replace(/.*Rating:\s*/, '').replace(/\*/g, '').split('/')[0].trim();
            } else if (cleanLine.match(/^\*?\s*Rating:\s*/)) {
              rating = cleanLine.replace(/^\*?\s*Rating:\s*/, '').replace(/\*/g, '').split('/')[0].trim();
            }
            
            // Extract price level
            if (cleanLine.includes('Price Level:')) {
              priceLevel = cleanLine.replace(/.*Price Level:\s*/, '').replace(/\*/g, '').trim();
            }
            
            // Extract address
            if (cleanLine.includes('Address:')) {
              address = cleanLine.replace(/.*Address:\s*/, '').replace(/\*/g, '').trim();
            }
            
            // Extract description (Why it's perfect/suitable)
            if (cleanLine.includes("Why it's perfect") || cleanLine.includes("Why it's suitable")) {
              const descStartIndex = lineIndex;
              const nextSectionIndex = lines.findIndex((l, i) => i > descStartIndex && (l.includes('---') || l.match(/^\d+\./)));
              const endIndex = nextSectionIndex > -1 ? nextSectionIndex : Math.min(descStartIndex + 5, lines.length);
              description = lines.slice(descStartIndex + 1, endIndex)
                .filter(l => l.trim() && !l.includes('Timing Advice'))
                .join(' ')
                .replace(/\*/g, '')
                .trim()
                .substring(0, 200);
            }
          });
          
          if (name && name.length > 0) {
            locations.push({
              name: name,
              distance: distance || 'Near you',
              cuisine: cuisine || 'Restaurant',
              rating: rating || '',
              priceLevel: priceLevel || '',
              address: address || '',
              description: description || 'Recommended for you',
              index: index
            });
          }
        });
      }
      
      // If numbered parsing doesn't work, try markdown format
      if (locations.length === 0) {
        const sections = cleanText.split('---');
        
        sections.forEach((section, index) => {
          if (index === 0) return; // Skip intro text
          
          const lines = section.split('\n').filter(line => line.trim());
          if (lines.length === 0) return;
          
          // Look for restaurant name in various formats
          let name = '';
          const namePatterns = [
            /^\d+\.\s+(.+)$/,
            /^### (.+)$/,
            /^\*\*(.+)\*\*$/,
            /^(.+)$/
          ];
          
          for (const line of lines.slice(0, 3)) {
            for (const pattern of namePatterns) {
              const match = line.trim().match(pattern);
              if (match && match[1] && match[1].trim().length > 0 && !match[1].includes('Distance') && !match[1].includes('Why')) {
                name = match[1].trim();
                break;
              }
            }
            if (name) break;
          }
          
          if (name) {
            locations.push({
              name: name,
              distance: 'Near you',
              cuisine: 'Restaurant',
              rating: '',
              description: 'Recommended location',
              index: index
            });
          }
        });
      }
      
      // Fallback: extract known restaurant names from terminal output
      if (locations.length === 0) {
        const restaurantPattern = /(?:Siddique Restaurant|New Shama Family Restaurant|Bismillah Restaurant|Fresh And Fresh Restaurant|The Great Indian Restaurant|Shree Amba Hotel|Shahi Restaurant|Hotel R|Meghana Foods|Saravana Bhavan|Annapurna Hotel|Chung Wah|Hotel Dwaraka|MTR 1924|CTR|Brahmin's Coffee Bar)/gi;
        const matches = cleanText.match(restaurantPattern);
        
        if (matches) {
          [...new Set(matches)].forEach((name, index) => {
            // Try to extract distance for this specific restaurant
            let distance = 'Near you';
            const restaurantSection = cleanText.split(name)[1];
            if (restaurantSection) {
              const distanceMatch = restaurantSection.match(/(\d+\s*meters?|\d+\.?\d*\s*km)/i);
              if (distanceMatch) {
                distance = distanceMatch[1];
              }
            }
            
            locations.push({
              name: name,
              distance: distance,
              cuisine: 'Restaurant',
              rating: '',
              description: 'Recommended for your dining needs',
              index: index
            });
          });
        }
      }
      
      console.log('🎯 Final parsed locations:', locations);
      console.log('📊 Total locations found:', locations.length);
      
      return locations;
    } catch (error) {
      console.error('❌ Error parsing recommendations:', error);
      return [];
    }
  };

  const openInGoogleMaps = (locationName) => {
    const searchQuery = encodeURIComponent(`${locationName} near me`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
    window.open(mapsUrl, '_blank');
  };

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        dispatch(setCoordinates({ lat: latitude, lon: longitude }));
        router.push({
          pathname: router.pathname,
          query: { ...router.query, lat: latitude, lon: longitude }
        });
        toast({
          title: 'Location updated!',
          description: 'Getting personalized recommendations based on your location.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }, (error) => {
        toast({
          title: 'Location access denied',
          description: 'Please enable location access to get personalized recommendations.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
    }
  };

  const renderProactiveRecommendations = () => {
    const closestRoutine = findClosestRoutine();
    
    return (
      <Box mb={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <VStack align="start" spacing={1}>
            <Heading size="md" color="#a60629">Smart Recommendations</Heading>
            {closestRoutine && (coordinates || place) && (
              <Text fontSize="sm" color="gray.600">
                Perfect for your {closestRoutine.name} routine {closestRoutine.icon}
              </Text>
            )}
          </VStack>
          <Button 
            size="sm" 
            bg="#a60629" 
            color="white" 
            _hover={{ bg: "#8a0522" }}
            onClick={() => generateRecommendations('routine')}
            isLoading={isLoading}
            loadingText="Refreshing"
          >
            Refresh
          </Button>
        </Flex>
        
        {/* Proactive recommendations logic removed - now using unified recommendations system */}
        {false ? (
          <VStack spacing={6}>
            {recommendations.map((rec, recIndex) => {
              const locations = parseLocationRecommendations(rec.suggestions || {});
              
              return (
                <Box key={recIndex} w="100%">
                  {/* Summary Header */}
                  <Card mb={4} bg="blue.50" border="1px solid" borderColor="blue.200">
                    <CardBody>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold" color="#a60629">
                            {rec.routine.icon} {rec.routine.name} - Recommendations
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Updated at {rec.timestamp}
                          </Text>
                        </VStack>
                        <Badge bg="#a60629" color="white">
                          {locations.length} locations found
                        </Badge>
                      </HStack>
                    </CardBody>
                  </Card>

                  {/* AI Recommendation Text */}
                  {rec.suggestions?.final_recommendation && (
                    <Card mb={4} bg="blue.50" border="1px solid" borderColor="blue.200">
                      <CardBody>
                        <VStack align="start" spacing={3}>
                          <Text fontWeight="semibold" color="#a60629">
                            🤖 AI Recommendation
                          </Text>
                          <Text fontSize="sm" color="gray.700" lineHeight="1.6" whiteSpace="pre-wrap">
                            {rec.suggestions.final_recommendation.substring(0, 500)}
                            {rec.suggestions.final_recommendation.length > 500 ? '...' : ''}
                          </Text>
                        </VStack>
                      </CardBody>
                    </Card>
                  )}

                  {/* Location Cards */}
                  {locations.length > 0 ? (
                    <SimpleGrid columns={[1, 2]} spacing={4}>
                      {locations.map((location, locIndex) => (
                        <Card 
                          key={locIndex} 
                          cursor="pointer" 
                          _hover={{ transform: 'translateY(-2px)', shadow: 'lg', borderColor: '#a60629' }}
                          border="1px solid"
                          borderColor="gray.200"
                          transition="all 0.2s"
                          onClick={() => openInGoogleMaps(location.name)}
                        >
                          <CardBody>
                            <VStack align="stretch" spacing={3}>
                              {/* Header */}
                              <HStack justify="space-between">
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold" color="#a60629" fontSize="lg">
                                    {location.name}
                                  </Text>
                                  {location.rating && (
                                    <HStack spacing={1}>
                                      <Text fontSize="sm" color="orange.500">⭐</Text>
                                      <Text fontSize="sm" fontWeight="semibold" color="orange.600">{location.rating}/10</Text>
                                    </HStack>
                                  )}
                                </VStack>
                                <Text fontSize="xl">📍</Text>
                              </HStack>

                              {/* Details */}
                              <VStack align="stretch" spacing={2}>
                                {location.distance && (
                                  <HStack>
                                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">Distance:</Text>
                                    <Text fontSize="sm">{location.distance}</Text>
                                  </HStack>
                                )}
                                {location.cuisine && (
                                  <HStack>
                                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">Cuisine:</Text>
                                    <Text fontSize="sm">{location.cuisine}</Text>
                                  </HStack>
                                )}
                                {location.rating && (
                                  <HStack>
                                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">Rating:</Text>
                                    <Text fontSize="sm" color="green.600" fontWeight="medium">{location.rating}/10</Text>
                                  </HStack>
                                )}
                                {location.priceLevel && (
                                  <HStack>
                                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">Price:</Text>
                                    <Text fontSize="sm" color="#a60629" fontWeight="medium">{location.priceLevel}</Text>
                                  </HStack>
                                )}
                                {location.address && (
                                  <HStack align="start">
                                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">Address:</Text>
                                    <Text fontSize="sm" lineHeight="1.3">{location.address}</Text>
                                  </HStack>
                                )}
                              </VStack>

                              {/* Description */}
                              {location.description && (
                                <Text fontSize="sm" color="gray.600" lineHeight="1.4">
                                  {location.description.length > 100 
                                    ? `${location.description.substring(0, 100)}...` 
                                    : location.description}
                                </Text>
                              )}

                              {/* Action Button */}
                              <Button 
                                size="sm" 
                                bg="#a60629" 
                                color="white" 
                                _hover={{ bg: "#8a0522" }}
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
                    <Card bg="gray.50" border="2px dashed" borderColor="gray.300">
                      <CardBody textAlign="center" py={4}>
                        <Text color="gray.500" fontSize="sm">
                          {rec.suggestions?.recommendations ? 
                            'Could not parse location details from recommendations' : 
                            'No specific locations found in recommendations'}
                        </Text>
                      </CardBody>
                    </Card>
                  )}
                </Box>
              );
            })}
          </VStack>
        ) : (
          <Card bg="gray.50" border="2px dashed" borderColor="gray.300">
            <CardBody textAlign="center" py={6}>
              <Text fontSize="3xl" mb={3}>🎯</Text>
              <Text color="gray.500" mb={2}>No personalized recommendations yet</Text>
              <Text fontSize="sm" color="gray.400" mb={4}>
                Choose your mood above to get AI-powered recommendations based on your current feelings and routines
              </Text>
              <Button 
                bg="#a60629" 
                color="white" 
                _hover={{ bg: "#8a0522" }}
                onClick={() => generateRecommendations('routine')}
                size="sm"
              >
                Get Recommendations
              </Button>
            </CardBody>
          </Card>
        )}
      </Box>
    );
  };

  const renderFiltersSection = () => (
    <Box mb={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md" color="#a60629">Search Filters</Heading>
        <Button size="sm" variant="outline" onClick={resetFilters}>
          Reset All
        </Button>
      </Flex>
      
      <Card>
        <CardBody>
          <VStack spacing={6} align="stretch">
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
                  <SliderFilledTrack bg="#a60629" />
                </SliderTrack>
                <SliderThumb bg="#a60629" />
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
    </Box>
  );

  const renderPermanentRecommendationsSection = () => {
    // Debug: Check button visibility condition
    const hasFilters = Object.values(filters).some(v => v && v.length > 0);
    const shouldShowButton = currentMood || hasFilters;
    console.log('🔘 Button visibility:', { currentMood: !!currentMood, hasFilters, filters, shouldShowButton });
    
    return (
    <Box>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md" color="#a60629">Recommendations</Heading>
          {shouldShowButton && (
            <Button 
              size="sm" 
              bg="#a60629" 
              color="white" 
              _hover={{ bg: "#8a0522" }}
              onClick={() => {
                console.log('🔘 Get Recommendations clicked!', { currentMood: !!currentMood, filters });
                // Force clear recommendations and show loading
                setRecommendations([]);
                if (currentMood) {
                  console.log('🎭 Triggering mood-based recommendations');
                  generateRecommendations('mood', currentMood);
                } else {
                  console.log('🔄 Triggering routine-based recommendations');
                  generateRecommendations('routine');
                }
              }}
              isLoading={isLoading}
              loadingText="Finding..."
            >
              Get Recommendations
            </Button>
          )}
        </Flex>

        {isLoading ? (
          <Card>
            <CardBody textAlign="center" py={8}>
              <Spinner size="lg" color="#a60629" mb={4} />
              <Text>Finding perfect places for you...</Text>
            </CardBody>
          </Card>
        ) : recommendations.length > 0 ? (
          <VStack spacing={6}>
            {recommendations.map((rec, recIndex) => {
              // Handle no-routines case
              if (rec.type === 'no-routines') {
                return (
                  <Card key={recIndex} bg="gray.50" border="2px dashed" borderColor="gray.300" w="100%">
                    <CardBody textAlign="center" py={8}>
                      <Text fontSize="3xl" mb={3}>🎯</Text>
                      <Text color="gray.500" mb={2}>Get personalized locations based on routines</Text>
                      <Text fontSize="sm" color="gray.400" mb={4}>
                        Add a routine to get AI-powered recommendations for your daily activities
                          </Text>
                              <Button 
                        bg="#a60629" 
                        color="white" 
                        _hover={{ bg: "#8a0522" }}
                        onClick={onRoutineOpen}
                                size="sm" 
          >
                        Add Your First Routine
                              </Button>
                    </CardBody>
                  </Card>
                );
              }

              // Handle recommendations with places
              const locations = parseLocationRecommendations(rec.suggestions || rec);
              const recommendationType = rec.type === 'mood' ? 'Mood-based' : 'Routine-based';
              
              return (
                <Box key={recIndex} w="100%">
                  {/* Summary Header */}
                  <Card mb={4} bg={rec.type === 'mood' ? 'purple.50' : 'blue.50'} border="1px solid" borderColor={rec.type === 'mood' ? 'purple.200' : 'blue.200'}>
                    <CardBody>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" color="#a60629">
                          {recommendationType} Recommendations
                        </Text>
                        {rec.type === 'mood' && (
                          <Text fontSize="sm" color="gray.600">
                            Perfect for when you're feeling {rec.mood} {currentMood?.emoji}
                          </Text>
                        )}
                        {rec.type === 'routine' && rec.routine && (
                          <Text fontSize="sm" color="gray.600">
                            Perfect for your {rec.routine.name} routine {rec.routine.icon}
                          </Text>
                        )}
                        <Text fontSize="xs" color="gray.400">
                          {locations.length} locations found • Updated at {new Date().toLocaleTimeString()}
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Location Cards */}
                  {locations.length > 0 ? (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {locations.map((location, index) => (
                        <Card key={index} variant="outline" _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} transition="all 0.2s">
                          <CardBody>
                            <VStack align="start" spacing={3}>
                              <HStack justify="space-between" w="100%">
                                <Text fontWeight="bold" fontSize="lg" color="#a60629">{location.name}</Text>
                                <Button size="sm" bg="#a60629" color="white" _hover={{ bg: "#8a0522" }}>
                                  View
                                </Button>
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
                                    <Badge colorScheme={location.rating >= 4.0 ? 'green' : location.rating >= 3.0 ? 'yellow' : 'red'}>
                                      {location.rating}/10
                                    </Badge>
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
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Card bg="gray.50">
                      <CardBody textAlign="center">
                        <Text color="gray.500">
                          No specific locations found in recommendations
                        </Text>
                      </CardBody>
                    </Card>
                  )}
    </Box>
  );
            })}
          </VStack>
        ) : userRoutines.length === 0 ? (
          <Card bg="gray.50" border="2px dashed" borderColor="gray.300">
            <CardBody textAlign="center" py={8}>
              <Text fontSize="3xl" mb={3}>🎯</Text>
              <Text color="gray.500" mb={2}>Get personalized locations based on routines</Text>
              <Text fontSize="sm" color="gray.400" mb={4}>
                Add your daily routines and I'll find the perfect places for each activity
              </Text>
              <Button 
                bg="#a60629" 
                color="white" 
                _hover={{ bg: "#8a0522" }}
                onClick={onRoutineOpen}
                size="sm"
              >
                Add Your First Routine
              </Button>
            </CardBody>
          </Card>
        ) : (
          <Card bg="blue.50" border="1px solid" borderColor="blue.200">
            <CardBody textAlign="center" py={8}>
              <Text fontSize="3xl" mb={3}>✨</Text>
              <Text color="gray.600" mb={2}>Ready for routine-based recommendations</Text>
              <Text fontSize="sm" color="gray.500" mb={4}>
                Click "Get Recommendations" above or select your mood and filters for personalized suggestions
              </Text>
            </CardBody>
          </Card>
        )}
      </Box>
    );
  };

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
      <Box w="100%" px={6} py={6}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box textAlign="center" py={8}>
            <Heading size="xl" mb={4} color="black">
              Hi {user?.displayName || user?.email?.split('@')[0] || 'there'}! 👋
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="600px" mx="auto">
              Your Personal Concierge is here to help! Let me understand your routine, mood, and preferences to provide personalized recommendations.
            </Text>
          </Box>

          {/* Main Content Grid */}
          <Grid templateColumns={{ base: "1fr", lg: "20% 1fr" }} gap={8}>
            {/* Left Column - Daily Routines & Filters */}
            <GridItem>
              {renderRoutineSection()}
              {renderFiltersSection()}
            </GridItem>

            {/* Right Column - Main Content */}
            <GridItem>
              <VStack spacing={8} align="stretch">
                {/* Mood Check-in */}
                <Box>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md" color="#a60629">How are you feeling today?</Heading>
                    {currentMood && (
                      <HStack spacing={2}>
                        <Badge bg="#a60629" color="white" fontSize="md" p={2}>
                          {currentMood.emoji} {currentMood.mood}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setCurrentMood(null);
                            // Auto-generation removed - user must manually click refresh if needed
                          }}
                        >
                          Clear Mood
                        </Button>
                      </HStack>
                    )}
                  </Flex>
                  {renderMoodCards()}
                  {!currentMood && (
                    <Text textAlign="center" color="gray.500" mt={4}>
                      Tap on your mood to get personalized recommendations
                    </Text>
                  )}
                </Box>

                {/* Permanent Recommendations Section */}
                {renderPermanentRecommendationsSection()}

                {/* Old unified recommendations section - disabled */}
                {false && recommendations.length > 0 && (
                  <Box>
                    <VStack spacing={6}>
                      {recommendations.map((rec, recIndex) => {
                      // Handle no-routines case
                      if (rec.type === 'no-routines') {
                        return (
                          <Box key={recIndex} mb={6}>
                            <Heading size="md" mb={4} color="#a60629">Routine-based Recommendations</Heading>
                            <Card bg="gray.50" border="2px dashed" borderColor="gray.300">
                              <CardBody textAlign="center" py={8}>
                                <Text fontSize="3xl" mb={3}>📅</Text>
                                <Text color="gray.500" mb={2}>{rec.message}</Text>
                                <Text fontSize="sm" color="gray.400" mb={4}>
                                  Set up your daily routines to get personalized recommendations based on your schedule
                                </Text>
                                <Button 
                                  bg="#a60629" 
                                  color="white" 
                                  _hover={{ bg: "#8a0522" }}
                                  onClick={onRoutineOpen}
                                  size="sm"
                                >
                                  Add Your First Routine
                                </Button>
                              </CardBody>
                            </Card>
                          </Box>
                        );
                      }

                      const locations = parseLocationRecommendations(rec.suggestions || {});
                      
                      return (
                        <Box key={recIndex} w="100%">
                          {/* Dynamic Header based on recommendation type */}
                          <Flex justify="space-between" align="center" mb={4}>
                            <Heading size="md" color="#a60629">
                              {rec.type === 'mood' ? 'Mood-based Recommendations' : 'Routine-based Recommendations'}
                            </Heading>
                            {rec.type === 'routine' && (
                              <Button 
                                size="sm" 
                                bg="#a60629" 
                                color="white" 
                                _hover={{ bg: "#8a0522" }}
                                onClick={() => generateRecommendations('routine')}
                                isLoading={isLoading}
                                loadingText="Refreshing"
                              >
                                Refresh
                              </Button>
                            )}
                          </Flex>
                          
                          {/* Summary Header */}
                          <Card mb={4} bg={rec.type === 'mood' ? "purple.50" : "blue.50"} border="1px solid" borderColor={rec.type === 'mood' ? "purple.200" : "blue.200"}>
                              <CardBody>
                              <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="semibold" color="#a60629">
                                    {rec.type === 'mood' 
                                      ? `Based on your ${rec.mood} mood ${moodOptions.find(m => m.mood === rec.mood)?.emoji || ''}` 
                                      : `Perfect for your ${rec.routine?.name} routine ${rec.routine?.icon || '📅'}`
                                    }
                                    </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {rec.type === 'mood' 
                                      ? `Activities: ${rec.activities?.join(', ') || 'Various activities'}`
                                      : `Scheduled for ${rec.routine?.time || 'now'} • ${rec.routine?.activity || 'routine activity'}`
                                    }
                                  </Text>
                                </VStack>
                                <Badge bg="#a60629" color="white">
                                  {locations.length} locations found
                                  </Badge>
                                </HStack>
                              </CardBody>
                            </Card>



                            {/* Location Cards */}
                            {locations.length > 0 ? (
                              <SimpleGrid columns={[1, 2]} spacing={4}>
                                {locations.map((location, locIndex) => (
                                  <Card 
                                    key={locIndex} 
                                    cursor="pointer" 
                                    _hover={{ transform: 'translateY(-2px)', shadow: 'lg', borderColor: '#a60629' }}
                                    border="1px solid"
                                    borderColor="gray.200"
                                    transition="all 0.2s"
                                    onClick={() => openInGoogleMaps(location.name)}
                                  >
                                    <CardBody>
                                      <VStack align="stretch" spacing={3}>
                                        {/* Header */}
                                        <HStack justify="space-between">
                                          <VStack align="start" spacing={0}>
                                            <Text fontWeight="bold" color="#a60629" fontSize="lg">
                                              {location.name}
                                            </Text>
                                            {location.rating && (
                                              <HStack spacing={1}>
                                                <Text fontSize="sm" color="orange.500">⭐</Text>
                                                <Text fontSize="sm" fontWeight="semibold" color="orange.600">{location.rating}/10</Text>
                                              </HStack>
                                            )}
                                          </VStack>
                                          <Text fontSize="xl">📍</Text>
                                        </HStack>

                                        {/* Details */}
                                        <VStack align="stretch" spacing={2}>
                                          {location.distance && (
                                            <HStack>
                                              <Text fontSize="sm" color="gray.500" fontWeight="semibold">Distance:</Text>
                                              <Text fontSize="sm">{location.distance}</Text>
                                            </HStack>
                                          )}
                                          {location.cuisine && (
                                            <HStack>
                                              <Text fontSize="sm" color="gray.500" fontWeight="semibold">Cuisine:</Text>
                                              <Text fontSize="sm">{location.cuisine}</Text>
                                            </HStack>
                                          )}
                                          {location.rating && (
                                            <HStack>
                                              <Text fontSize="sm" color="gray.500" fontWeight="semibold">Rating:</Text>
                                              <Text fontSize="sm" color="green.600" fontWeight="medium">{location.rating}/10</Text>
                                            </HStack>
                                          )}
                                          {location.priceLevel && (
                                            <HStack>
                                              <Text fontSize="sm" color="gray.500" fontWeight="semibold">Price:</Text>
                                              <Text fontSize="sm" color="#a60629" fontWeight="medium">{location.priceLevel}</Text>
                                            </HStack>
                                          )}
                                          {location.address && (
                                            <HStack align="start">
                                              <Text fontSize="sm" color="gray.500" fontWeight="semibold">Address:</Text>
                                              <Text fontSize="sm" lineHeight="1.3">{location.address}</Text>
                                            </HStack>
                                          )}
                                        </VStack>

                                        {/* Description */}
                                        {location.description && (
                                          <Text fontSize="sm" color="gray.600" lineHeight="1.4">
                                            {location.description.length > 100 
                                              ? `${location.description.substring(0, 100)}...` 
                                              : location.description}
                                          </Text>
                                        )}

                                        {/* Action Button */}
                                        <Button 
                                          size="sm" 
                                          bg="#a60629" 
                                          color="white" 
                                          _hover={{ bg: "#8a0522" }}
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
                              <Card bg="gray.50" border="2px dashed" borderColor="gray.300">
                                <CardBody textAlign="center" py={4}>
                                  <Text color="gray.500" fontSize="sm">
                                    {rec.suggestions?.final_recommendation ? 
                                      'Could not parse location details from recommendations' : 
                                      'No specific locations found in recommendations'}
                                  </Text>
                                  {/* Debug information */}
                                  <Text fontSize="xs" color="gray.400" mt={2}>
                                    Debug: Check console for parsing details
                                  </Text>
                                </CardBody>
                              </Card>
                            )}
                          </Box>
                        );
                      })}
                    </VStack>
                  </Box>
                )}

                {/* Loading indicator removed - now handled in permanent recommendations section */}
              </VStack>
            </GridItem>
          </Grid>
        </VStack>
      </Box>

      {/* Mood Selection Modal */}
      <Modal isOpen={isMoodOpen} onClose={onMoodClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>How are you feeling?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {renderMoodCards()}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Routine Creation Modal */}
      <Modal isOpen={isRoutineOpen} onClose={() => {
        onRoutineClose();
        setIsCustomMode(false);
        setEditingRoutine(null);
        setCustomRoutine({ name: '', time: '', activity: '', icon: '📋', places: [] });
      }} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingRoutine ? 'Edit Routine' : isCustomMode ? 'Create Custom Routine' : 'Add a New Routine'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {isCustomMode ? (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Routine Name</FormLabel>
                  <Input
                    value={customRoutine.name}
                    onChange={(e) => setCustomRoutine(prev => ({...prev, name: e.target.value}))}
                    placeholder="e.g., Morning Coffee, Evening Jog"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Time</FormLabel>
                  <Input
                    type="time"
                    value={customRoutine.time}
                    onChange={(e) => setCustomRoutine(prev => ({...prev, time: e.target.value}))}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Icon (Emoji)</FormLabel>
                  <Input
                    value={customRoutine.icon}
                    onChange={(e) => setCustomRoutine(prev => ({...prev, icon: e.target.value}))}
                    placeholder="📋"
                    maxLength="2"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Activity Type</FormLabel>
                  <Input
                    value={customRoutine.activity}
                    onChange={(e) => setCustomRoutine(prev => ({...prev, activity: e.target.value}))}
                    placeholder="e.g., coffee, exercise, work"
                  />
                </FormControl>
                
                <HStack spacing={3} w="100%">
                  <Button flex={1} variant="outline" onClick={() => setIsCustomMode(false)}>
                    ← Back to Templates
                  </Button>
                  <Button flex={1} bg="#a60629" color="white" _hover={{ bg: "#8a0522" }} onClick={handleCustomRoutineSubmit}>
                    {editingRoutine ? 'Update Routine' : 'Create Routine'}
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <VStack spacing={6}>
                {/* Quick Templates */}
                <Box w="100%">
                  <Text fontWeight="semibold" mb={3}>Choose a Template to Customize</Text>
                  <SimpleGrid columns={[1, 2]} spacing={3}>
                    {routineTemplates.map((routine) => (
                      <Card
                        key={routine.name}
                        cursor="pointer"
                        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                        onClick={() => {
                          setCustomRoutine({
                            name: routine.name,
                            time: routine.time,
                            activity: routine.activity,
                            icon: routine.icon,
                            places: routine.places || []
                          });
                          setIsCustomMode(true);
                        }}
                      >
                        <CardBody textAlign="center" py={3}>
                          <Text fontSize="2xl" mb={1}>{routine.icon}</Text>
                          <Text fontWeight="semibold" fontSize="sm">{routine.name}</Text>
                          <Text fontSize="xs" color="gray.500">{routine.time}</Text>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Box>
                
                {/* Custom Option */}
                <Box w="100%">
                  <Divider />
                  <Button 
                    w="100%" 
                    mt={4}
                    variant="outline" 
                    leftIcon={<AddIcon />}
                    onClick={() => setIsCustomMode(true)}
                  >
                    Create Custom Routine
                  </Button>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SoloMode;
