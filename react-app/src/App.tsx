import {ColorModeContext, useMode} from './theme.ts';
import {Container, CssBaseline, ThemeProvider} from "@mui/material";
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit'
import busReducer from './reducers/buses'
import stateReducer from './reducers/states'
import usersReducer from './reducers/users'
import logsReducer from './reducers/logs'
import positionsReducer from './reducers/positions'
import {Helmet} from 'react-helmet'
import AuthProvider from "./misc/authProvider.jsx";
import Routes from "./routes";
import axios from "axios";


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
  let protocol: string;
  import.meta.env.IN_PRODUCTION ? protocol = "https" : protocol = "http";
  axios.defaults.baseURL = `${protocol}://${import.meta.env.VITE_REACT_APP_HOST}:8000`;
  
  const [theme, colorMode] = useMode();
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline/>
        <Provider store={store}>
          <Container>
            <AuthProvider>
              <Helmet>
                <meta name="apple-mobile-web-app-capable" content="yes"/>
                <meta httpEquiv="Content-Security-Policy"
                      content="default-src * data: blob: 'unsafe-inline' 'unsafe-eval' ws: wss:;"/>
                <title>HomeServer</title>
              </Helmet>
              <Routes/>
            </AuthProvider>
          </Container>
        </Provider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default App
