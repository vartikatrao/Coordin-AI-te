import React, { useState } from "react";
import {
  Box,
  Flex,
  Container,
} from "@chakra-ui/react";
import Banner from "./Banner";
import Sidebar from "./Sidebar";
import Address from "./Address";

import Recent from "./Recent";
import Bookmarks from "./Bookmarks";

const Profile = () => {
  const [activeTab, setActiveTab] = useState(0);

  const options = [
    { id: 0, name: "profile" },
    { id: 1, name: "address" },
    { id: 2, name: "orders" },
    { id: 3, name: "recently viewed" },
    { id: 4, name: "bookmarks" },
  ];

  const handleTab = (id) => {
    setActiveTab(id);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <Banner />;
      case 1:
        return <Address />;
      case 2:
        return <Address />;
      case 3:
        return <Recent />;
      case 4:
        return <Bookmarks />;
      default:
        return <Banner />;
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Flex gap={8} direction={{ base: "column", lg: "row" }}>
        {/* Sidebar */}
        <Box flexShrink={0}>
          <Sidebar
            options={options}
            heading="Account"
            active={activeTab}
            handleTab={handleTab}
          />
        </Box>

        {/* Main Content */}
        <Box flex="1">
          {renderContent()}
        </Box>
      </Flex>
    </Container>
  );
};

export default Profile;
