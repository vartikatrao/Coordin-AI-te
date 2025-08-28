import React from "react";
import { Box } from "@chakra-ui/react";
import TalkToCoordinate from "@/components/TalkToCoordinate/TalkToCoordinate";
import UnifiedNavbar from "@/components/Navbar/UnifiedNavbar";

const TalkToCoordinatePage = () => {
  return (
    <Box h="100vh" overflow="hidden">
      <UnifiedNavbar showModeNavigation={true} />
      <Box h="calc(100vh - 80px)">
        <TalkToCoordinate />
      </Box>
    </Box>
  );
};

export default TalkToCoordinatePage;
