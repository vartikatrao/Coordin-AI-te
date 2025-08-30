import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import FriendRequestsDebug from '@/components/Debug/FriendRequestsDebug';

const FriendRequestsDebugPage = () => {
  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.lg" py={8}>
        <FriendRequestsDebug />
      </Container>
    </Box>
  );
};

export default FriendRequestsDebugPage;
