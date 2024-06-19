import {ColorModeContext, useMode} from './theme.ts';
import {Container, CssBaseline, ThemeProvider} from "@mui/material";
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import busReducer from './reducers/buses';
import stateReducer from './reducers/states';
import usersReducer from './reducers/users';
import logsReducer from './reducers/logs';
import positionsReducer from './reducers/draggables';
import authReducer from './reducers/auth';
import Routes from "./routes/index";
import {ErrorWrapper} from "./misc/ErrorHandling";
import AxiosProvider from "./misc/AxiosInstance";
import {ApolloWrapper} from "./misc/ApolloClient";
import errorsReducer from "./reducers/errors";

// Redux store
const store = configureStore({
  reducer: {
      buses: busReducer,
      states: stateReducer,
      users: usersReducer,
      logs: logsReducer,
      positions: positionsReducer,
      auth: authReducer,
      errors: errorsReducer,
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
            <ErrorWrapper>
              <AxiosProvider>
                <Container>
                  <ApolloWrapper>
                      {/*<Helmet>*/}
                      {/*  <meta name="apple-mobile-web-app-capable" content="yes"/>*/}
                      {/*  <meta httpEquiv="Content-Security-Policy"*/}
                      {/*        content="default-src * data: blob: 'unsafe-inline' 'unsafe-eval' ws: wss:;"/>*/}
                      {/*  <title>HomeServer</title>*/}
                      {/*</Helmet>*/}
                      <Routes/>
                  </ApolloWrapper>
                </Container>
              </AxiosProvider>
            </ErrorWrapper>
          </Provider>
        </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default App
