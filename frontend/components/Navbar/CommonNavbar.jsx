import React from 'react';
import {
  Box,
  Flex,
  Button,
  Text,
  HStack,
  useColorModeValue,
  Container,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

const CommonNavbar = () => {
  const router = useRouter();
  const { user } = useSelector((state) => state.userReducer);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const navItems = [
    { name: 'Solo Mode', path: '/solo-mode' },
    { name: 'Group Mode', path: '/group-mode' },
    { name: 'Safety Mode', path: '/safety' },
    { name: 'Chat with AI', path: '/talk-to-coordinate' },
  ];

  const handleNavigation = (path) => {
    router.push(path);
  };

  const isActivePage = (path) => {
    return router.pathname === path;
  };

  return (
    <Box
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={1000}
      shadow="sm"
    >
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center" py={4}>
          {/* Logo/Brand */}
          <Box cursor="pointer" onClick={() => router.push('/')}>
            <Text fontSize="xl" fontWeight="bold" color="#a60629">
              Coordinate
            </Text>
          </Box>

          {/* Navigation Items */}
          <HStack spacing={6}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={isActivePage(item.path) ? 'solid' : 'ghost'}
                bg={isActivePage(item.path) ? '#a60629' : 'transparent'} color={isActivePage(item.path) ? 'white' : 'gray.700'}
                onClick={() => handleNavigation(item.path)}
                size="md"
                fontWeight="medium"
                _hover={{
                  bg: isActivePage(item.path) ? '#8a0522' : 'gray.100',
                }}
              >
                {item.name}
              </Button>
            ))}
          </HStack>

          {/* User Profile/Login */}
          <Box>
            {user ? (
              <Button
                variant="outline"
                bg="#a60629" color="white" _hover={{ bg: "#8a0522" }}
                onClick={() => router.push('/profile')}
                size="md"
              >
                Profile
              </Button>
            ) : (
              <Button
                bg="#a60629" color="white" _hover={{ bg: "#8a0522" }}
                onClick={() => router.push('/')}
                size="md"
              >
                Get Started
              </Button>
            )}
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default CommonNavbar;
