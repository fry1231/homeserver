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
              <ApolloWrapper>
                <Container>

                      <Routes/>
                  
                </Container>
              </ApolloWrapper>
            </ErrorWrapper>
          </Provider>
        </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default App
