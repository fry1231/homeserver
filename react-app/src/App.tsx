import {ColorModeContext, useMode} from './theme.ts';
import {Container, CssBaseline, ThemeProvider} from "@mui/material";
import {Provider} from 'react-redux';
import Routes from "./routes/index";
import {ErrorWrapper} from "./misc/ErrorHandling";
// import AxiosProvider from "./misc/AxiosInstance";
import {ApolloWrapper} from "./misc/ApolloClient";
import {store} from "./Store";

function App() {
  const [theme, colorMode] = useMode();
  return (
    <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline/>
          <Provider store={store}>
            <ErrorWrapper>
              {/*<AxiosProvider>*/}
                <Container>
                  {/*<ApolloWrapper>*/}
                      {/*<Helmet>*/}
                      {/*  <meta name="apple-mobile-web-app-capable" content="yes"/>*/}
                      {/*  <meta httpEquiv="Content-Security-Policy"*/}
                      {/*        content="default-src * data: blob: 'unsafe-inline' 'unsafe-eval' ws: wss:;"/>*/}
                      {/*  <title>HomeServer</title>*/}
                      {/*</Helmet>*/}
                      <Routes/>
                  {/*</ApolloWrapper>*/}
                </Container>
              {/*</AxiosProvider>*/}
            </ErrorWrapper>
          </Provider>
        </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default App
