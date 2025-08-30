import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import PopulateDummyData from '@/components/Admin/PopulateDummyData';

const PopulateDataPage = () => {
  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.lg" py={8}>
        <PopulateDummyData />
      </Container>
    </Box>
  );
};

export default PopulateDataPage;
