import { Avatar, Box, Button, Flex, Text } from "@chakra-ui/react";
import React from "react";
import { useSelector } from "react-redux";
import { FiEdit } from "react-icons/fi";
import EditModal from "./EditModal";

const Banner = () => {
  const { user } = useSelector((store) => store.userReducer);

  return (
    <Flex
      w={{ base: "90%", md: "70%" }}
      alignItems={"center"}
      m={"auto"}
      h={{ base: "200px", md: "200px" }}
      bg={"black"}
      gap={5}
      justifyContent={"space-between"}
    >
      <Flex
        w={"90%"}
        alignItems={"center"}
        m={"auto"}
        justifyContent={"space-between"}
      >
        <Flex alignItems={"center"} h={"100%"} gap={"20px"}>
          <Avatar src={user?.photoURL} size={"2xl"} borderWidth={2} />
          <Text fontWeight={400} fontSize={"25px"} color={"white"}>
            {user?.displayName}
          </Text>
        </Flex>
        <Box textAlign={"right"}>
          <EditModal />
        </Box>
      </Flex>
    </Flex>
  );
};

export default Banner;
