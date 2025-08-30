import { Box } from "@chakra-ui/react";
import Image from "next/image";
import React from "react";

const PhotoContainer = ({ imgURL }) => {
  return (
    <Box
      w={"200px"}
      h={"150px"}
      rounded={"10px"}
      position={"relative"}
      objectFit={"cover"}
      overflow={"hidden"}
      cursor={"pointer"}
    >
      <Image src={imgURL} alt="" fill />
    </Box>
  );
};

export default PhotoContainer;
