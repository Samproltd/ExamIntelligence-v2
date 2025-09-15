import "../styles/globals.css";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { useEffect } from "react";
import { store } from "../store";
import { checkAuth } from "../store/slices/authSlice";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Check if the user is already authenticated on app load
    store.dispatch(checkAuth());
  }, []);

  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}
