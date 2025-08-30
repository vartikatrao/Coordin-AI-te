import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import Image from "next/image";
import React from "react";
import { GrLinkedinOption, GrFacebookOption } from "react-icons/gr";
import { AiOutlineInstagram, AiFillYoutube } from "react-icons/ai";
import { BsTwitter } from "react-icons/bs";

const SocialLinks = () => {
  const links = [
    <GrLinkedinOption key={"1"} color="white" />,
    <AiOutlineInstagram key={"2"} color="white" />,
    <BsTwitter key={"3"} color="white" />,
    <AiFillYoutube key={"4"} color="white" />,
    <GrFacebookOption key={"5"} color="white" />,
  ];
  return (
    <Box>
      <Text fontWeight={400} fontSize={"lg"} color={"#363636"} as={"b"}>
        SOCIAL LINKS
      </Text>
      <Flex gap={"10px"} mb={"10px"}>
        {links.map((link, i) => (
          <IconButton
            key={i}
            borderRadius={"50%"}
            bgColor={"black"}
            _hover={{ bgColor: "black" }}
            icon={link}
            h={"40px"}
            w={"10px"}
          />
        ))}
      </Flex>

    </Box>
  );
};

export default SocialLinks;
