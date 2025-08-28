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
  // Component removed - no longer displaying coordination options
  return null;
};

export default Explore;
