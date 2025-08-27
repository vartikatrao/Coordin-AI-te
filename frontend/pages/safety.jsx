import React from "react";
import CommonNavbar from "@/components/Navbar/CommonNavbar";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";

const SafetyPage = () => {
  return (
    <>
      <CommonNavbar />
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading textAlign="center" color="purple.600">
            Safety Mode
          </Heading>
          
          <Alert status="info">
            <AlertIcon />
            <AlertTitle>Safety Features</AlertTitle>
            <AlertDescription>
              This page will contain safety-related features and information for users.
            </AlertDescription>
          </Alert>

          <Box p={6} borderWidth="1px" borderRadius="lg">
            <Text fontSize="lg">
              Safety mode features are coming soon. This will include:
            </Text>
            <VStack spacing={3} mt={4} align="start">
              <Text>• Emergency contact information</Text>
              <Text>• Safety guidelines and tips</Text>
              <Text>• Location sharing controls</Text>
              <Text>• Privacy settings</Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </>
  );
};

export default SafetyPage;
