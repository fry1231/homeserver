import {ColorModeContext, useMode} from './theme.ts';
import {Container, CssBaseline, ThemeProvider} from "@mui/material";
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import busReducer from './reducers/buses';
import stateReducer from './reducers/states';
import usersReducer from './reducers/users';
import logsReducer from './reducers/logs';
import positionsReducer from './reducers/draggables';
import AuthProvider from "./misc/authProvider.jsx";
import Routes from "./routes";
import axios from "../misc/AxiosInstance";
import {ApolloWrapper} from "./misc/ApolloClient";
import {ErrorProvider} from "./misc/ErrorHandling";

// Redux store
const store = configureStore({
  reducer: {
      buses: busReducer,
      states: stateReducer,
      users: usersReducer,
      logs: logsReducer,
      positions: positionsReducer,
    },
  devTools: import.meta.env.VITE_REACT_APP_IN_PRODUCTION == '0',
});

function App() {
  const [theme, colorMode] = useMode();
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline/>
        <Provider store={store}>
          <AuthProvider>
            <Container>
              <ApolloWrapper>
                <ErrorProvider>
                  {/*<Helmet>*/}
                  {/*  <meta name="apple-mobile-web-app-capable" content="yes"/>*/}
                  {/*  <meta httpEquiv="Content-Security-Policy"*/}
                  {/*        content="default-src * data: blob: 'unsafe-inline' 'unsafe-eval' ws: wss:;"/>*/}
                  {/*  <title>HomeServer</title>*/}
                  {/*</Helmet>*/}
                  <Routes/>
                </ErrorProvider>
              </ApolloWrapper>
            </Container>
          </AuthProvider>
        </Provider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default App
