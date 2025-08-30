import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Flex,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Show,
  Hide,
  Text,
  HStack,
  useColorModeValue,
  Container,
  Divider,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  IconButton,
  Badge,
} from '@chakra-ui/react';
import { 
  ChevronDownIcon, 
  HamburgerIcon,
  SearchIcon
} from '@chakra-ui/icons';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Auth } from '@/firebase/firebase.config';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import {
  getInitalUser,
  getMobileInitialUser,
} from '@/redux/actions/UserAction';
import { getUserDataSuccess } from '@/redux/slices/UserSlice';

const UnifiedNavbar = ({ showModeNavigation = true, showLocationSearch = false }) => {
  const { user } = useSelector((store) => store.userReducer);
  const dispatch = useDispatch();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  // Navigation items for different modes
  const navItems = [
    { name: 'Solo Mode', path: '/solo-mode', description: 'Explore on your own' },
    { name: 'Group Mode', path: '/group-mode', description: 'Plan with friends' },
    { name: 'Safety Mode', path: '/safety', description: 'Stay safe & secure' },
    { name: 'Chat with AI', path: '/talk-to-coordinate', description: 'Get AI assistance' },
  ];

  const userOptions = [
    { name: "Profile", link: "/profile?t=0", icon: "👤" },
    { name: "Bookmarks", link: "/profile?t=4", icon: "🔖" },
    { name: "Recently Viewed", link: "/profile?t=3", icon: "👁️" },
    { name: "Order History", link: "/profile?t=5", icon: "📋" },
  ];

  const handleNavigation = (path) => {
    router.push(path);
    onClose(); // Close mobile menu
  };

  const isActivePage = (path) => {
    return router.pathname === path;
  };

  const isCurrentMode = (path) => {
    return router.pathname === path;
  };

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

  const handleLogout = async () => {
    await signOut(Auth);
    router.push('/');
  };

  const getCurrentModeName = () => {
    const currentItem = navItems.find(item => isCurrentMode(item.path));
    return currentItem ? currentItem.name : 'Coordinate';
  };

  const getCurrentModeDescription = () => {
    const currentItem = navItems.find(item => isCurrentMode(item.path));
    return currentItem ? currentItem.description : 'Your AI-powered travel companion';
  };

  return (
    <>
      {/* Desktop Navbar */}
      <Show above="lg">
        <Box
          bg={bgColor}
          borderBottom="1px"
          borderColor={borderColor}
          position="sticky"
          top={0}
          zIndex={1000}
          shadow="sm"
          fontFamily="Montserrat, sans-serif"
        >
          <Container maxW="container.xl">
            <Flex justify="space-between" align="center" py={4}>
              {/* Logo/Brand */}
              <Box cursor="pointer" onClick={() => router.push('/')}>
                <Flex alignItems="center" gap={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="black" fontFamily="Montserrat, sans-serif">
                    Coordin
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="#a60629" fontFamily="Montserrat, sans-serif">
                    AI
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="black" fontFamily="Montserrat, sans-serif">
                    te
                  </Text>
                </Flex>
                {showModeNavigation && (
                  <Text fontSize="xs" color="gray.500" mt={1} fontFamily="Montserrat, sans-serif">
                    {getCurrentModeDescription()}
                  </Text>
                )}
              </Box>

              {/* Mode Navigation */}
              {showModeNavigation && (
                <HStack spacing={4}>
                  {navItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={isActivePage(item.path) ? 'solid' : 'ghost'}
                      bg={isActivePage(item.path) ? '#a60629' : 'transparent'}
                      color={isActivePage(item.path) ? 'white' : 'gray.700'}
                      onClick={() => handleNavigation(item.path)}
                      size="md"
                      fontWeight="medium"
                      fontSize="lg"
                      fontFamily="Montserrat, sans-serif"
                      _hover={{
                        bg: isActivePage(item.path) ? '#8a0522' : 'gray.100',
                      }}
                    >
                      {item.name}
                    </Button>
                  ))}
                </HStack>
              )}

              {/* Right Side - User/Auth */}
              <Flex alignItems="center" gap={4}>

                {!user ? (
                  <HStack spacing={3}>
                    <LoginModal />
                    <SignupModal />
                  </HStack>
                ) : (
                  <Menu>
                    <MenuButton
                      as={Button}
                      leftIcon={
                        <Avatar
                          name={user?.displayName}
                          src={user?.photoURL}
                          size="sm"
                        />
                      }
                      bgColor="transparent"
                      color={textColor}
                      _hover={{ bgColor: "gray.100" }}
                      _focus={{ boxShadow: "none", bgColor: "transparent" }}
                      _active={{ boxShadow: "none", bgColor: "transparent" }}
                      rightIcon={<ChevronDownIcon />}
                      size="md"
                    >
                      {user?.displayName}
                    </MenuButton>
                    <MenuList
                      bgColor="white"
                      color="black"
                      border="1px"
                      borderColor="gray.200"
                      shadow="lg"
                    >
                      {userOptions.map((option, i) => (
                        <MenuItem
                          key={i}
                          as={Button}
                          bgColor="transparent"
                          fontWeight="normal"
                          textAlign="left"
                          w="100%"
                          justifyContent="flex-start"
                          _hover={{ bgColor: "gray.50" }}
                          onClick={() => router.push(option.link)}
                          leftIcon={<Text fontSize="lg">{option.icon}</Text>}
                        >
                          {option.name}
                        </MenuItem>
                      ))}
                      <Divider my={2} />
                      <MenuItem
                        as={Button}
                        onClick={handleLogout}
                        bgColor="transparent"
                        fontWeight="normal"
                        textAlign="left"
                        w="100%"
                        justifyContent="flex-start"
                        _hover={{ bgColor: "red.50" }}
                        color="red.600"
                        leftIcon={<Text fontSize="lg">🚪</Text>}
                      >
                        Log out
                      </MenuItem>
                    </MenuList>
                  </Menu>
                )}
              </Flex>
            </Flex>
          </Container>
        </Box>
      </Show>

      {/* Mobile Navbar */}
      <Hide above="lg">
        <Box
          bg={bgColor}
          borderBottom="1px"
          borderColor={borderColor}
          position="sticky"
          top={0}
          zIndex={1000}
          shadow="sm"
          fontFamily="Montserrat, sans-serif"
        >
          <Container maxW="container.xl">
            <Flex justify="space-between" align="center" py={3}>
              {/* Logo */}
              <Box cursor="pointer" onClick={() => router.push('/')}>
                <Flex alignItems="center" gap={0}>
                  <Text fontSize="xl" fontWeight="bold" color="black" fontFamily="Montserrat, sans-serif">
                    Coordin
                  </Text>
                  <Text fontSize="xl" fontWeight="bold" color="#a60629" fontFamily="Montserrat, sans-serif">
                    AI
                  </Text>
                  <Text fontSize="xl" fontWeight="bold" color="black" fontFamily="Montserrat, sans-serif">
                    te
                  </Text>
                </Flex>
              </Box>

              {/* Mobile Menu Button */}
              <IconButton
                aria-label="Open menu"
                icon={<HamburgerIcon />}
                variant="ghost"
                onClick={onOpen}
                color={textColor}
              />
            </Flex>
          </Container>
        </Box>

        {/* Mobile Drawer */}
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="full">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px" bg="#a60629" color="white">
              <Text fontSize="lg" fontWeight="bold" fontFamily="Montserrat, sans-serif">
                {getCurrentModeName()}
              </Text>
              <Text fontSize="sm" mt={1} opacity={0.8} fontFamily="Montserrat, sans-serif">
                {getCurrentModeDescription()}
              </Text>
            </DrawerHeader>

            <DrawerBody>
              <VStack spacing={4} align="stretch" pt={4}>
                {/* Mode Navigation */}
                {showModeNavigation && (
                  <>
                    <Text fontSize="sm" fontWeight="bold" color="gray.600" px={4}>
                      Switch Modes
                    </Text>
                    {navItems.map((item) => (
                      <Button
                        key={item.path}
                        variant={isActivePage(item.path) ? 'solid' : 'ghost'}
                        bg={isActivePage(item.path) ? '#a60629' : 'transparent'}
                        color={isActivePage(item.path) ? 'white' : 'gray.700'}
                        onClick={() => handleNavigation(item.path)}
                        size="lg"
                        justifyContent="flex-start"
                        px={4}
                        fontSize="lg"
                        fontFamily="Montserrat, sans-serif"
                        _hover={{
                          bg: isActivePage(item.path) ? '#8a0522' : 'gray.100',
                        }}
                      >
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium" fontFamily="Montserrat, sans-serif" fontSize="lg">{item.name}</Text>
                          <Text fontSize="sm" opacity={0.7} fontFamily="Montserrat, sans-serif">
                            {item.description}
                          </Text>
                        </VStack>
                      </Button>
                    ))}
                    <Divider my={4} />
                  </>
                )}

                {/* User Section */}
                {!user ? (
                  <VStack spacing={3} px={4}>
                    <Text fontSize="sm" fontWeight="bold" color="gray.600" alignSelf="start">
                      Account
                    </Text>
                    <LoginModal />
                    <SignupModal />
                  </VStack>
                ) : (
                  <VStack spacing={3} px={4}>
                    <Text fontSize="sm" fontWeight="bold" color="gray.600" alignSelf="start">
                      Account
                    </Text>
                    <Flex alignItems="center" gap={3} w="100%">
                      <Avatar
                        name={user?.displayName}
                        src={user?.photoURL}
                        size="md"
                      />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{user?.displayName}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {user?.email}
                        </Text>
                      </VStack>
                    </Flex>
                    
                    {userOptions.map((option, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        w="100%"
                        justifyContent="flex-start"
                        onClick={() => {
                          router.push(option.link);
                          onClose();
                        }}
                        leftIcon={<Text fontSize="lg">{option.icon}</Text>}
                      >
                        {option.name}
                      </Button>
                    ))}
                    
                    <Divider my={2} />
                    <Button
                      variant="ghost"
                      w="100%"
                      justifyContent="flex-start"
                      onClick={() => {
                        handleLogout();
                        onClose();
                      }}
                      leftIcon={<Text fontSize="lg">🚪</Text>}
                      color="red.600"
                      _hover={{ bg: "red.50" }}
                    >
                      Log out
                    </Button>
                  </VStack>
                )}

                {/* Foursquare Branding */}
                <Divider my={4} />
                <Flex alignItems="center" gap={2} px={4} opacity={0.7}>
                  <Text fontSize="xs" color="gray.500">
                    Powered by Foursquare
                  </Text>
                  <Image 
                    src="/foursquare_logo.webp" 
                    alt="Foursquare" 
                    width={16} 
                    height={16} 
                  />
                </Flex>
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Hide>
    </>
  );
};

export default UnifiedNavbar;
