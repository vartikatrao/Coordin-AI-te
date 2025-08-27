import { Box, Heading, Text, useToast } from "@chakra-ui/react";
import Image from "next/image";
import { useRouter } from "next/router";
import React from "react";
import { useSelector } from "react-redux";

const OptionCards = ({ imgURL, title, subTitle, path }) => {
  const router = useRouter();
  const { place } = useSelector((state) => state.placeReducer);
  const toast = useToast();
  return (
    <Box
      h={"320px"}
      w={"30%"}
      minW={"300px"}
      maxW={"350px"}
      overflow={"hidden"}
      borderRadius={"15px"}
      border={"1px solid #e8e8e8"}
      cursor={"pointer"}
      m={{
        base: "auto",
        lg: "0",
      }}
      mt={{ base: "10px", lg: "0" }}
      bg={"white"}
      boxShadow={"0 4px 12px rgba(0,0,0,0.15)"}
      display={"flex"}
      flexDirection={"column"}
      onClick={() => {
        // Group Mode doesn't require a place selection
        if (title === "Group Mode" || place) {
          router.push(path);
        } else {
          toast.closeAll();
          toast({
            title: "Please select a location to proceed",
            status: "warning",
            position: "top",
          });
        }
      }}
    >
      <Box 
        position={"relative"} 
        h={"200px"} 
        w={"100%"}
        bg={"#f8f8f8"}
      >
        <Image 
          src={imgURL} 
          alt={title}
          fill 
          style={{ 
            objectFit: "cover"
          }} 
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </Box>
      <Box 
        p={"20px"} 
        flex={1}
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"space-between"}
      >
        <Box>
          <Text 
            as={"b"} 
            fontWeight={"600"} 
            fontSize={"2xl"} 
            color={"#2D3748"}
            mb={"10px"}
          >
            {title}
          </Text>
          <Text 
            color={"#718096"} 
            fontSize={"md"}
            lineHeight={"1.5"}
          >
            {subTitle}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default OptionCards;
