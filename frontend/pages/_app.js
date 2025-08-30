import Footer from '@/components/Footer'
import store from '@/redux/store'
import '@/styles/globals.css'
import { ChakraProvider } from '@chakra-ui/react'
import { Provider } from 'react-redux'
import { LoadScript } from "@react-google-maps/api";
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Auth } from '@/firebase/firebase.config';
import { getUserDataSuccess } from '@/redux/slices/UserSlice';
import theme from '@/theme'

function AuthListener({ children }) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(Auth, (user) => {
      if (user) {
        // User is signed in, dispatch to Redux
        store.dispatch(getUserDataSuccess(user));
        console.log('User authenticated:', user.displayName);
      } else {
        // User is signed out, clear Redux state
        store.dispatch(getUserDataSuccess(null));
        console.log('User signed out');
      }
    });

    return () => unsubscribe();
  }, []);

  return children;
}

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <ChakraProvider theme={theme}>
        <LoadScript
          googleMapsApiKey="AIzaSyBMo1myYnlmnCYMJc5fwiGiDZPqXar03ps"
          libraries={["places"]}
        >
          <AuthListener>
            <Component {...pageProps} />
          </AuthListener>
        </LoadScript>
        <Footer />
      </ChakraProvider>
    </Provider>
  )
}
