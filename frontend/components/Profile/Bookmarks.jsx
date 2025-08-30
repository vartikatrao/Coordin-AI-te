import { Box, Text } from "@chakra-ui/react";
import React from "react";
import { useSelector } from "react-redux";
import EmptyContainer from "./EmptyContainer";

const Bookmarks = () => {
  const { user } = useSelector((store) => store.userReducer);
  
  return (
    <Box w={"100%"} p={4}>
      <EmptyContainer
        imgURL={
          "https://firebasestorage.googleapis.com/v0/b/zomato-clone-c4414.appspot.com/o/empty%2Fenpty-reviews.webp?alt=media&token=56a1f74d-fe73-4f94-8069-1556b95f0da4"
        }
      />
      <Text textAlign="center" mt={4} color="gray.500">
        Your bookmarked places will appear here
      </Text>
    </Box>
  );
};

export default Bookmarks;