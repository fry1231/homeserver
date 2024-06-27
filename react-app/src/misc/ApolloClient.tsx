import {ApolloClient, ApolloProvider, HttpLink, InMemoryCache} from '@apollo/client';
import {onError} from '@apollo/client/link/error';
import {setContext} from '@apollo/client/link/context';
import {jwtDecode} from 'jwt-decode';
import {getNewToken, tokenExpiredOrInvalid} from "./utils";
import {setErrorMessage} from "../reducers/errors";
import {store} from "../Store";


const createApolloClient = (token) => {
  const httpLink = new HttpLink({
    uri: `https://${import.meta.env.VITE_REACT_APP_HOST}/graphql`,
  });
  let accessToken: string | null = token;
  const authLink = setContext(async (_, {headers}) => {
    // get the authentication token from local storage if it exists
    // return the auth headers to the context
    if (accessToken) {
      const {exp} = jwtDecode(accessToken);
      if (Date.now() >= exp * 1000) {
        console.log('Refreshing in ApolloClient, old token ', accessToken.slice(-5));
        accessToken = await getNewToken();
        console.log('New token:', accessToken.slice(-5));
      }
    } else {
      accessToken = await getNewToken();
    }
    return {
      headers: {
        ...headers,
        authorization: accessToken ? `Bearer ${accessToken}` : "",
      },
    };
  });
  
  const errorLink = onError(({graphQLErrors, networkError, operation, forward}) => {
    if (graphQLErrors) {
      for (let err of graphQLErrors) {
        if (err.extensions && err.extensions.code === 'UNAUTHENTICATED') {
          operation.setContext(({headers}) => ({
            headers: {
              ...headers,
              authorization: accessToken ? `Bearer ${accessToken}` : "",
            },
          }));
          return forward(operation);
        } else if (err.message) {
          store.dispatch(setErrorMessage(err.message));
        } else {
          store.dispatch(setErrorMessage('Unknown Apollo error'));
          console.error('Unknown error', err)
        }
      }
    }
    
    if (networkError) {
      console.log(`[Network error]: ${networkError}`);
    }
  });
  
  const link = authLink.concat(errorLink).concat(httpLink);
  
  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
      },
    },
  });
};

export const ApolloWrapper = ({children}) => {
  let token: string | null = localStorage.getItem('token');
  if (!token || token === 'undefined') {
    getNewToken()
      .then((newToken) => {
        token = newToken;
      });
  }
  const client: ApolloClient | null = createApolloClient(token);

  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
};