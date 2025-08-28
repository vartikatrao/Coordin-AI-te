import {
  Avatar,
  Box,
  Button,
  Flex,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Show,
  Text,
} from "@chakra-ui/react";
import React, { useEffect } from "react";
import LoginModal from "./Navbar/LoginModal";
import SignupModal from "./Navbar/SignupModal";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Auth, db } from "@/firebase/firebase.config";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import {
  getInitalUser,
  getMobileInitialUser,
} from "@/redux/actions/UserAction";
import { getUserDataSuccess } from "@/redux/slices/UserSlice";
import { collection, query, where } from "firebase/firestore";

const Navbar = () => {
  const { user } = useSelector((store) => store.userReducer);
  const dispatch = useDispatch();
  const options = [
    { name: "profile", link: "/profile?t=0" },
    { name: "bookmarks", link: "/profile?t=4" },
    { name: "recently viewed", link: "/profile?t=3" },
    { name: "order history", link: "/profile?t=5" },
  ];
  const router = useRouter();
  useEffect(() => {
    const unSubscribe = onAuthStateChanged(Auth, (user) => {
      if (user) {
        if (user.providerData[0].providerId == "phone") {
          getMobileInitialUser(dispatch, user);
        } else {
          getInitalUser(user.uid, dispatch);
        }
      } else {
        dispatch(getUserDataSuccess(null));
      }
    });
    return () => {
      unSubscribe();
    };
  }, [dispatch]);
  return (
    <Flex alignItems={"center"} h={"80px"} bg={"transparent"} color={"black"} fontFamily="Montserrat, sans-serif">
      <Flex
        w={{
          base: "90%",
          lg: "80%",
        }}
        alignItems={"center"}
        justifyContent={"space-between"}
        m={"auto"}
      >

        {/* Foursquare Branding - Left Side */}
        <Flex alignItems="center" gap="8px">
          <Text fontSize="sm" color="black" fontWeight="500" fontFamily="Montserrat, sans-serif">Powered by</Text>
          <a href="#" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <Image src="/foursquare_logo.webp" alt="Foursquare" width={16} height={16} cursor="pointer" _hover={{ opacity: 0.8 }} />
          </a>
        </Flex>
        
        <Box flex={1}></Box>
        <Show above="md">
          <Flex
            alignItems={"center"}
            justifyContent={"flex-end"}
            gap={6}
            flex={1}
          >

            {/* Always show Services button */}
            <Button
              variant="ghost"
              color="black"
              fontWeight="bold"
              fontSize="md"
              _hover={{ bgColor: "gray.100" }}
              fontFamily="Montserrat, sans-serif"
              onClick={() => {
                document.querySelector('.options-section')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
            >
              Services
            </Button>

            {!user ? (
              <>
                <LoginModal />
                <SignupModal />
              </>
            ) : (
              <>
                <Menu>
                  <MenuButton
                    as={Button}
                    leftIcon={
                      <Avatar
                        name={user?.displayName}
                        src={user?.photoURL}
                        size={"md"}
                      />
                    }
                    bgColor={"transparent"}
                    minH={"100%"}
                    maxW={"fit-content"}
                    color={"black"}
                    _hover={{ bgColor: "transparent" }}
                    _focus={{ boxShadow: "none", bgColor: "transparent" }}
                    _active={{ boxShadow: "none", bgColor: "transparent" }}
                    fontFamily="Montserrat, sans-serif"
                    rightIcon={<ChevronDownIcon />}
                  >
                    {user?.displayName}
                  </MenuButton>
                  <MenuList
                    bgColor={"white"}
                    color={"black"}
                    as={Flex}
                    direction={"column"}
                    alignItems={"flex-start"}
                  >
                    {options.map((text, i) => {
                      return (
                        <MenuItem
                          key={i}
                          as={Button}
                          bgColor={"transparent"}
                          fontWeight={300}
                          textAlign={"left"}
                          w={"fit-content"}
                          _hover={{ bgColor: "transparent" }}
                          onClick={() => router.push(text.link)}
                        >
                          {text.name}
                        </MenuItem>
                      );
                    })}
                    <MenuItem
                      as={Button}
                      onClick={async () => {
                        await signOut(Auth);
                      }}
                      bgColor={"transparent"}
                      fontWeight={300}
                      textAlign={"left"}
                      w={"fit-content"}
                      _hover={{ bgColor: "transparent" }}
                    >
                      Log out
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            )}
          </Flex>
        </Show>
      </Flex>
    </Flex>
  );
};

export default Navbar;
