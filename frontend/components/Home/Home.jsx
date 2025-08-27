import React from "react";
import {
  Box,
  Image,
} from "@chakra-ui/react";
import Navbar from "../Navbar";
import Hero from "./Hero";
import Collections from "./Collections";
import Localities from "./Localities";
import Options from "./Options";
import Explore from "./Explore";

const Home = () => {
  return (
    <Box position="relative" minH="100vh">
      {/* Background Image - Full Image No Cropping */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        zIndex="-1"
      >
        <Image
          src="/background_landing.png"
          alt="Background"
          w="100%"
          h="auto"
          objectFit="contain"
        />
      </Box>

      {/* Main Content */}
      <Box position="relative" zIndex="1">
        <Navbar />
        <Hero />
        
        {/* Options cards after hero */}
        <Options />
        
        {/* Other content below */}
        <Box bg="white" mt="0">
          <Collections />
          <Localities />
          <Explore />
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
