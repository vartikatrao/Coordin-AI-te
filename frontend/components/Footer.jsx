import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useRouter } from 'next/router';
import FooterCards from "./Footer/FooterCards";
import SocialLinks from "./Footer/SocialLinks";

const Footer = () => {
  const router = useRouter();
  
  // Hide footer on the talk-to-coordinate page
  if (router.pathname === '/talk-to-coordinate') {
    return null;
  }

  const aboutBlock = [
    "About Us",
    "Contact Us",
  ];
  
  return (
    <Box bgColor={"#f8f8f8"}>
      <Box w={{ base: "100%", lg: "70%" }} m={"auto"} p={"10px"}>
        <Flex
          w={"100%"}
          alignItems={"center"}
          justifyContent={"space-between"}
          mt={"30px"}
          flexWrap={"wrap"}
        >
          <Heading>CoordinAIte</Heading>
          <Flex
            alignItems={"center"}
            w={"300px"}
            justifyContent={"space-between"}
          >
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                variant={"outline"}
              >
                India
              </MenuButton>
            </Menu>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                variant={"outline"}
              >
                English
              </MenuButton>
            </Menu>
          </Flex>
        </Flex>
        <Flex
          w={"100%"}
          alignItems={"baseline"}
          justifyContent={"space-between"}
          mt={"40px"}
          flexWrap={"wrap"}
          gap={{ base: "20px", xl: "0" }}
        >
          <FooterCards title={"ABOUT"} texts={aboutBlock} />
          <SocialLinks />
        </Flex>
        <Divider mt={"20px"} />
        <Text
          key={"text"}
          fontWeight={400}
          fontSize={"sm"}
          color={"gray.500"}
          mt={"20px"}
          mb={"20px"}
          textAlign={"center"}
        >
          Made with ❤️ for people
        </Text>
      </Box>
    </Box>
  );
};

export default Footer;
