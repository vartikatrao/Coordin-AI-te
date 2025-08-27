import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Heading,
  Hide,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Show,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { ChevronDownIcon, HamburgerIcon, SearchIcon } from "@chakra-ui/icons";
import { IoMdLocate } from "react-icons/io";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import {
  getPlace,
  getRestrauntSuccess,
  getSearchSuccess,
} from "@/redux/slices/PlacesSlice";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Auth } from "@/firebase/firebase.config";
import { getUserDataSuccess } from "@/redux/slices/UserSlice";
import {
  getInitalUser,
  getMobileInitialUser,
} from "@/redux/actions/UserAction";
import { searchReq, getLiveLocation } from "@/redux/actions/PlacesAction";

const DeleveryNavbar = () => {
  const { place, searchResults } = useSelector((state) => state.placeReducer);
  const { user } = useSelector((store) => store.userReducer);
  const router = useRouter();
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [popularLocations, setPopularLocations] = useState([]);

  const handleClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((positions) => {
        router.push({
          query: {
            lat: positions.coords.latitude,
            lon: positions.coords.longitude,
          },
        });
        // CreateQuery function to update the location in the URL
        const CreateQuery = (location) => {
          router.push({
            query: {
              location: location,
              lat: positions.coords.latitude,
              lon: positions.coords.longitude,
            },
          });
        };
        getLiveLocation(positions.coords, dispatch, CreateQuery);
      });
    }
  };

  const handleLocationSearch = async (searchTerm) => {
    if (searchTerm.length > 2) {
      try {
        // Use your backend location search API
        const response = await fetch(`http://localhost:8000/api/location/search?query=${encodeURIComponent(searchTerm)}&limit=5`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setLocationSuggestions(data.suggestions || []);
      } catch (error) {
        console.error('Location search error:', error);
        // Fallback to mock data if backend is not running
        setLocationSuggestions([
          { formatted: `${searchTerm}, City`, geometry: { lat: 40.7128, lng: -74.0060 } },
          { formatted: `${searchTerm} Downtown`, geometry: { lat: 40.7589, lng: -73.9851 } },
          { formatted: `${searchTerm} Area`, geometry: { lat: 40.7505, lng: -73.9934 } }
        ]);
      }
    } else {
      setLocationSuggestions([]);
    }
  };

  const selectLocation = (location) => {
    setLocationSearch(location.formatted);
    setShowLocationSearch(false);
    setLocationSuggestions([]);
    
    // Update the router with the selected location
    router.push({
      query: {
        location: location.formatted,
        lat: location.geometry.lat,
        lon: location.geometry.lng,
      },
    });
    
    // Dispatch the place action
    dispatch(getPlace(location.formatted));
  };

  const handleLocationMenuClose = () => {
    setShowLocationSearch(false);
    setLocationSuggestions([]);
  };

  useEffect(() => {
    let sub = true;
    dispatch(getPlace(router.query.location));
    return () => {
      sub = false;
    };
  }, [dispatch, router.query.location]);

  // Load popular locations when component mounts
  useEffect(() => {
    const loadPopularLocations = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/location/popular-locations');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPopularLocations(data.popular_locations || []);
      } catch (error) {
        console.error('Failed to load popular locations:', error);
        // Set some default popular locations
        setPopularLocations([
          { formatted: "New York, NY", geometry: { lat: 40.7128, lng: -74.0060 } },
          { formatted: "Los Angeles, CA", geometry: { lat: 34.0522, lng: -118.2437 } },
          { formatted: "Chicago, IL", geometry: { lat: 41.8781, lng: -87.6298 } },
          { formatted: "Miami, FL", geometry: { lat: 25.7617, lng: -80.1918 } },
          { formatted: "San Francisco, CA", geometry: { lat: 37.7749, lng: -122.4194 } }
        ]);
      }
    };
    
    loadPopularLocations();
  }, []);

  const options = [
    { name: "profile", link: "/profile?t=0" },
    { name: "bookmarks", link: "/profile?t=4" },
    { name: "recently viewed", link: "/profile?t=3" },
    { name: "order history", link: "/profile?t=5" },
  ];
  useEffect(() => {
    const unSubscribe = onAuthStateChanged(Auth, (user) => {
      if (user) {
        if (user.providerData[0].providerId == "phone") {
          getMobileInitialUser(dispatch, user);
        } else {
          getInitalUser(user.uid, dispatch);
        }
      } else {
        dispatch(getUserDataSuccess(null));
      }
    });
    return () => {
      unSubscribe();
    };
  }, [dispatch]);

  const handleSearch = (search, dispatch) => {
    const timeout = setTimeout(() => {
      if (search.length > 0) {
        searchReq(dispatch, search, place);
      }
    }, 400);
    return timeout;
  };

  useEffect(() => {
    let timeoutId = handleSearch(search, dispatch);
    if (search.length <= 1) {
      dispatch(getRestrauntSuccess([]));
    }
    return () => {
      console.log("cleanup done for search");
      clearTimeout(timeoutId);
      dispatch(getSearchSuccess([]));
    };
  }, [search, dispatch]);
  return (
    <Flex
      alignItems={"center"}
      color={"black"}
      pt={"10px"}
      pb={"5px"}
      onClick={() => dispatch(getSearchSuccess([]))}
      sx={{
        '& *': {
          color: '#000000 !important'
        }
      }}
    >
      <Flex
        w={{
          base: "90%",
          lg: "70%",
        }}
        alignItems={"center"}
        justifyContent={"space-between"}
        m={"auto"}
      >
        <Hide above="md">
          <HamburgerIcon />
        </Hide>
        <Hide below="md">
          <Link href={"/"}>
            <Heading 
              color={"black"}
            >
              zomato
            </Heading>
          </Link>
        </Hide>
        <Flex
          w={{
            base: "80%",
            lg: "50%",
          }}
          p={2}
          bgColor={"white"}
          borderRadius={10}
          boxShadow={"rgba(99, 99, 99, 0.2) 0px 2px 8px 0px"}
        >
          <Menu onClose={handleLocationMenuClose}>
            <MenuButton
              as={Button}
              bgColor={"white"}
              color={"black"}
              w={"40%"}
              borderRightRadius={"0"}
              _hover={{ bgColor: "white" }}
              _focus={{ bgColor: "white" }}
              _active={{ bgColor: "white" }}
              rightIcon={<ChevronDownIcon />}
              leftIcon={<IoMdLocate />}
              minW={"fit-content"}
            >
              <Text
                display={{ base: "none", md: "block" }}
                minW={"fit-content"}
              >
                {place || "Location"}
              </Text>
            </MenuButton>
            <MenuList bgColor={"white"} color={"black"} mt={"7px"} w={"500px"}>
              {/* Location Search Input */}
              <Box p={3} borderBottom="1px solid" borderColor="gray.200">
                <Input
                  placeholder="Search for a location..."
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    handleLocationSearch(e.target.value);
                  }}
                  onFocus={() => setShowLocationSearch(true)}
                  size="sm"
                />
              </Box>
              
              {/* Location Suggestions */}
              {showLocationSearch && locationSuggestions.length > 0 && (
                <Box maxH="200px" overflowY="auto">
                  {locationSuggestions.map((location, index) => (
                    <MenuItem
                      key={index}
                      onClick={() => selectLocation(location)}
                      closeOnSelect={true}
                      py={2}
                      px={3}
                    >
                      <Text>{location.formatted}</Text>
                    </MenuItem>
                  ))}
                </Box>
              )}
              
              {/* Popular Locations */}
              {!showLocationSearch && popularLocations.length > 0 && (
                <Box>
                  <Text px={3} py={2} fontSize="sm" color="gray.500" fontWeight="bold">
                    Popular Locations
                  </Text>
                  {popularLocations.map((location, index) => (
                    <MenuItem
                      key={index}
                      onClick={() => selectLocation(location)}
                      closeOnSelect={true}
                      py={2}
                      px={3}
                    >
                      <Text>{location.formatted}</Text>
                    </MenuItem>
                  ))}
                </Box>
              )}
              
              {/* GPS Location Option */}
              <MenuItem
                pt={"10px"}
                pb={"10px"}
                closeOnSelect={false}
                onClick={handleClick}
              >
                <IoMdLocate color="red" size={20} />
                <Text ml={"10px"}>
                  Detect current Location Using GPS
                </Text>
              </MenuItem>
            </MenuList>
          </Menu>
          <Divider orientation="vertical" p={"2"} h={"20px"} />

          <Box w={"100%"} position={"relative"}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                {<SearchIcon color="gray.300" />}
              </InputLeftElement>
              <Input
                borderLeftRadius={"0"}
                variant={"filled"}
                type="tel"
                placeholder="search for restaurant, cuisine or a dish"
                bgColor={"white"}
                _hover={{ bgColor: "white" }}
                _focus={{ bgColor: "white" }}
                border={"none"}
                color={"black"}
                onChange={(e) => {
                  if (e.target.value.length < 1) {
                    dispatch(getSearchSuccess([]));
                  } else {
                    setSearch(e.target.value);
                  }
                }}
              />
            </InputGroup>
            {!searchResults.length && search.length > 1 && (
              <Center
                position={"absolute"}
                bgColor={"white"}
                // w={"455px"}
                w={"101%"}
                maxH={"300px"}
                h={"fit-content"}
                overflow={"auto"}
                zIndex={9}
                p={"10px"}
              >
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="blue.500"
                  size="xl"
                />
              </Center>
            )}
            {searchResults.length > 0 && (
              <Box
                position={"absolute"}
                bgColor={"white"}
                // w={"455px"}
                w={"102%"}
                maxH={"300px"}
                h={"fit-content"}
                overflow={"auto"}
                zIndex={9}
                p={"10px"}
              >
                {searchResults?.map((item, i) => {
                  return (
                    <Text
                      zIndex={9}
                      key={i}
                      color={"black"}
                      mb={"10px"}
                      cursor={"pointer"}
                      onClick={() => {
                        router.push(
                          `/${item.restaurant.location.city}/order/${item.restaurant.R.res_id}`
                        );
                      }}
                    >
                      {item.restaurant.name} ,
                      <span>{item.restaurant.location.city}</span>
                    </Text>
                  );
                })}
              </Box>
            )}
          </Box>
        </Flex>
        <Show above="lg">
          {!user ? (
            <>
              <LoginModal />
              <SignupModal />
            </>
          ) : (
            <>
              <Menu>
                <MenuButton
                  as={Button}
                  leftIcon={
                    <Avatar
                      name={user?.displayName}
                      src={user?.photoURL}
                      size={"md"}
                    />
                  }
                  bgColor={"transparent"}
                  minH={"100%"}
                  maxW={"fit-content"}
                  _hover={{ bgColor: "transparent" }}
                  _focus={{ boxShadow: "none", bgColor: "transparent" }}
                  _active={{ boxShadow: "none", bgColor: "transparent" }}
                  rightIcon={<ChevronDownIcon />}
                >
                  {user?.displayName}
                </MenuButton>
                <MenuList
                  bgColor={"white"}
                  color={"black"}
                  as={Flex}
                  direction={"column"}
                  alignItems={"flex-start"}
                >
                  {options.map((text, i) => {
                    return (
                      <MenuItem
                        key={i}
                        as={Button}
                        bgColor={"transparent"}
                        fontWeight={300}
                        textAlign={"left"}
                        w={"fit-content"}
                        _hover={{ bgColor: "transparent" }}
                        onClick={() => router.push(text.link)}
                      >
                        {text.name}
                      </MenuItem>
                    );
                  })}
                  <MenuItem
                    as={Button}
                    onClick={async () => {
                      await signOut(Auth);
                    }}
                    bgColor={"transparent"}
                    fontWeight={300}
                    textAlign={"left"}
                    w={"fit-content"}
                    _hover={{ bgColor: "transparent" }}
                  >
                    Log out
                  </MenuItem>
                </MenuList>
              </Menu>
            </>
          )}
        </Show>
      </Flex>
    </Flex>
  );
};

export default DeleveryNavbar;
