import React from 'react';
import { Box, Text, Heading, Button, Input, VStack } from '@chakra-ui/react';

const FontTest = () => {
  return (
    <Box p={8} fontFamily="Montserrat, sans-serif">
      <VStack spacing={6} align="start">
        <Heading size="lg">Font Test - Montserrat</Heading>
        
        <Text fontSize="xl">This is a large text with Montserrat</Text>
        <Text fontSize="lg">This is a large text with Montserrat</Text>
        <Text fontSize="md">This is a medium text with Montserrat</Text>
        <Text fontSize="sm">This is a small text with Montserrat</Text>
        
        <Button colorScheme="blue">Button with Montserrat</Button>
        
        <Input placeholder="Input with Montserrat" />
        
        <Text fontWeight="light">Light weight text</Text>
        <Text fontWeight="normal">Normal weight text</Text>
        <Text fontWeight="medium">Medium weight text</Text>
        <Text fontWeight="semibold">Semibold weight text</Text>
        <Text fontWeight="bold">Bold weight text</Text>
        
        <div style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <p>This is a regular paragraph with Montserrat</p>
          <h1>This is an h1 with Montserrat</h1>
          <h2>This is an h2 with Montserrat</h2>
          <h3>This is an h3 with Montserrat</h3>
        </div>
      </VStack>
    </Box>
  );
};

export default FontTest;
