import { Auth, db } from "@/firebase/firebase.config";
import { getUserDataSuccess } from "@/redux/slices/UserSlice";
import {
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  useToast,
  Avatar,
  Select,
  Flex,
} from "@chakra-ui/react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useState } from "react";
import { useDispatch } from "react-redux";

// Country codes for international phone input
const countryCodes = [
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'GB', flag: '🇬🇧' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+7', country: 'RU', flag: '🇷🇺' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+82', country: 'KR', flag: '🇰🇷' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+971', country: 'AE', flag: '🇦🇪' },
  { code: '+966', country: 'SA', flag: '🇸🇦' },
  { code: '+27', country: 'ZA', flag: '🇿🇦' },
  { code: '+234', country: 'NG', flag: '🇳🇬' },
  { code: '+254', country: 'KE', flag: '🇰🇪' },
];

const PhoneComponent = () => {
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+1"); // Default to US
  const dispatch = useDispatch();
  const [load, setLoad] = useState(false);
  const [ShowOtp, setShowOtp] = useState(false);
  const [confirmation, setConformation] = useState("");
  const [OTP, setOTP] = useState("");
  const [userData, setUserData] = useState({});
  const toast = useToast();
  
  const customToast = (status, title, description) => {
    toast.closeAll();
    toast({
      title,
      status,
      description,
      position: "top-left",
    });
    setLoad(false);
  };

  function onCaptchVerify() {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response) => {
            console.log(response);
            onSignup();
          },
          "expired-callback": () => {},
        },
        Auth
      );
    }
  }

  const onSignup = () => {
    setLoad(true);
    onCaptchVerify();

    const appVerifier = window.recaptchaVerifier;

    // Use selected country code
    const formatPh = countryCode + phone;

    signInWithPhoneNumber(Auth, formatPh, appVerifier)
      .then((confirmationResult) => {
        setConformation(confirmationResult);
        customToast(
          "info",
          "OTP sent successfully!",
          "A verification code has been sent to the mobile number, please enter it to proceed"
        );
        setShowOtp(true);
        setLoad(false);
      })
      .catch((error) => {
        console.error("Phone auth error:", error);
        customToast("error", "Something went wrong", error.message);
        setLoad(false);
      });
  };

  const onOTPVerify = async (e) => {
    e.preventDefault();
    setLoad(true);
    try {
      const res = await confirmation.confirm(OTP);
      dispatch(getUserDataSuccess(res.user));
      customToast("success", "Successfully logged in", "");
      setLoad(false);
    } catch (error) {
      console.error("OTP verification error:", error);
      customToast("error", "Something went wrong", error.message);
      setLoad(false);
    }
  };

  const handleSearch = async (e, phone) => {
    e.preventDefault();
    setLoad(true);
    const formattedPhone = countryCode + phone;
    const q = query(collection(db, "users"), where("phoneNumber", "==", formattedPhone));
    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.size < 1) {
        console.log(querySnapshot.empty());
        customToast("error", "No user found", "Please signup first");
      } else {
        querySnapshot.forEach((doc) => {
          setUserData(doc.data());
        });
        onSignup();
      }
      setLoad(false);
    } catch (error) {
      console.error("User search error:", error);
      setLoad(false);
    }
  };

  return (
    <>
      <div id="recaptcha-container"></div>
      {ShowOtp ? (
        <form onSubmit={onOTPVerify}>
          <Input
            type="tel"
            placeholder="Enter the verification code"
            mb={"10px"}
            onChange={(e) => setOTP(e.target.value)}
          />
          <Button
            mt={"20px"}
            w={"100%"}
            color={"white"}
            bgColor={"#e03546"}
            _hover={{ bgColor: "#e03546" }}
            type="submit"
            isLoading={load}
          >
            Verify OTP
          </Button>
        </form>
      ) : (
        <form onSubmit={(e) => handleSearch(e, phone)}>
          <InputGroup>
            <InputLeftElement width="90px">
              <Select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                size="sm"
                w="80px"
                border="none"
                bg="transparent"
                _focus={{ border: "none" }}
                fontSize="sm"
              >
                {countryCodes.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </Select>
            </InputLeftElement>
            <Input
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              pl="95px"
            />
          </InputGroup>
          <Button
            mt={"20px"}
            w={"100%"}
            color={"white"}
            bgColor={"#e03546"}
            _hover={{ bgColor: "#e03546" }}
            type="submit"
            isLoading={load}
          >
            Get verification code
          </Button>
        </form>
      )}
    </>
  );
};

export default PhoneComponent;
