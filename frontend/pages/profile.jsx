import UnifiedNavbar from "@/components/Navbar/UnifiedNavbar";
import {
  Box,
  Divider,
  Flex,
  Heading,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import Banner from "@/components/Profile/Banner";
import { useRouter } from "next/router";
import FriendRequests from "@/components/GroupMode/FriendRequests";
import FriendSearch from "@/components/GroupMode/FriendSearch";

const Profile = () => {
  const { user } = useSelector((store) => store.userReducer);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [router, user]);

  return (
    <Box>
      <UnifiedNavbar showModeNavigation={true} />
      <Divider mt={"10px"} />
      <Banner />
      
      <Container maxW="container.xl" py={8}>
        <Flex direction="column" gap={6}>
          <Heading size="lg" fontWeight={500} color="gray.700">
            Friends
          </Heading>
          
          <Tabs variant="soft-rounded" colorScheme="red">
            <TabList>
              <Tab>Friend Requests</Tab>
              <Tab>Find Friends</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel px={0}>
                <FriendRequests />
              </TabPanel>
              <TabPanel px={0}>
                <FriendSearch />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Flex>
      </Container>
    </Box>
  );
};

export default Profile;