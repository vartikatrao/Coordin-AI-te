import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import React, { useEffect } from "react";
import CollectionCards from "./cards/CollectionCards";
import { getCollections } from "@/redux/actions/PlacesAction";
import { useDispatch, useSelector } from "react-redux";

const Collections = () => {
  const dispatch = useDispatch();
  const { collections, place } = useSelector((state) => state.placeReducer);
  useEffect(() => {
    const controller = new AbortController();
    getCollections(dispatch, controller, place);
    return () => {
      controller.abort();
    };
  }, [dispatch, place]);
  
  // Component removed - no longer displaying collections
  return null;
};

export default Collections;
