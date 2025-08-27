import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Grid,
  Heading,
  ListItem,
  UnorderedList,
  useToast,
} from "@chakra-ui/react";
import React from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";

const Explore = () => {
  const router = useRouter();
  const { place } = useSelector((state) => state.placeReducer);
  const toast = useToast();

  const handleVenueTypeClick = (venueType) => {
    if (place) {
      // Navigate to delivery page with search query
      router.push({
        pathname: `/${place}/delivery`,
        query: { search: venueType }
      });
    } else {
      toast({
        title: "Please select a location to proceed",
        status: "warning",
        position: "top",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const data = [
    {
      title: "Meeting Venue Types",
      data: [
        "Coffee shops near me",
        "Co-working spaces near me",
        "Meeting rooms near me",
        "Conference centers near me",
        "Community halls near me",
        "Library meeting rooms near me",
        "Hotel lobbies near me",
        "Restaurant meeting areas near me",
        "Outdoor meeting spots near me",
        "Indoor gathering spaces near me",
        "Quiet study areas near me",
        "Collaborative workspaces near me",
        "Event venues near me",
        "Training centers near me",
        "Seminar halls near me",
        "Workshop spaces near me",
        "Networking venues near me",
        "Team building locations near me",
        "Presentation spaces near me",
        "Group discussion areas near me",
      ],
    },
  ];
  return (
    <Box w={{ base: "100%", lg: "70%" }} m={"auto"} mt={"50px"} mb={"20px"}>
      <Heading
        fontSize={{ base: "2xl", md: "3xl" }}
        m={{ base: "auto", lg: "0" }}
        w={"fit-content"}
        fontWeight={500}
      >
        Coordination Options Near You
      </Heading>
      <Accordion allowMultiple mt={"20px"}>
        {data.map((item, i) => {
          return (
            <AccordionItem
              key={i}
              mb={"20px"}
              border={"1px solid #e8e8e8"}
              minH={"60px"}
              _focus={{ bgColor: "white" }}
              _hover={{ bgColor: "white" }}
            >
              <h2>
                <AccordionButton
                  _focus={{ bgColor: "white" }}
                  _hover={{ bgColor: "white" }}
                  fontSize={"23px"}
                  color={"GrayText"}
                >
                  <Box as="span" flex="1" textAlign="left">
                    {item.title}
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Grid
                  w={"100%"}
                  templateColumns={{
                    base: "repeat(1,1fr)",
                    sm: "repeat(2,1fr)",
                    md: "repeat(4,1fr)",
                    xl: "repeat(4,1fr)",
                  }}
                >
                  {item.data.map((item) => (
                    <UnorderedList key={item}>
                      <ListItem 
                        w={"fit-content"} 
                        mr={"20px"} 
                        color={"#b3b3b3"}
                        cursor={"pointer"}
                        _hover={{ color: "#000000" }}
                        onClick={() => handleVenueTypeClick(item)}
                      >
                        {item}
                      </ListItem>
                    </UnorderedList>
                  ))}
                </Grid>
              </AccordionPanel>
            </AccordionItem>
          );
        })}
      </Accordion>
    </Box>
  );
};

export default Explore;
