import { Flex } from "@chakra-ui/react";
import React from "react";
import OptionCards from "./cards/OptionCards";
import { useSelector } from "react-redux";

const Options = () => {
  const { place } = useSelector((state) => state.placeReducer);
  const options = [
    {
      title: "Solo Mode",
      subTitle: "Hyperlocal Smart Assistant - Learn your routines & preferences",
      imgURL: "/solo_mode.png",
      path: `/solo-mode`,
    },
    {
      title: "Group Mode",
      subTitle: "Equidistant Meetup Finder - Coordinate better with friends",
      imgURL: "/group_mode.png",
      path: `/group-mode`,
    },
    {
      title: "Safety Mode",
      subTitle: "Safe Route Finder - Travel safer with intelligent routing",
      imgURL: "/safety_mode.png",
      path: `/${place}/restaurants`,
    },
    {
      title: "Talk to Coordinate",
      subTitle: "Get instant AI-powered assistance for all your coordination needs",
      imgURL: "/chat_mode.png",
      path: `/talk-to-coordinate`,
    },
  ];
  return (
    <Flex
      w={{ base: "100%", lg: "90%" }}
      h={"auto"}
      m={"auto"}
      mt={"50px"}
      mb={"80px"}
      justifyContent={"space-between"}
      alignItems={"flex-start"}
      flexWrap={"wrap"}
      gap={"40px"}
    >
      {options.map((opt) => {
        return <OptionCards key={opt.title} {...opt} />;
      })}
    </Flex>
  );
};

export default Options;
