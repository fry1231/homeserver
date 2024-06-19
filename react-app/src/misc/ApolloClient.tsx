import {ApolloClient, ApolloProvider, HttpLink, InMemoryCache} from '@apollo/client';
import {onError} from '@apollo/client/link/error';
import {setContext} from '@apollo/client/link/context';
import {jwtDecode} from 'jwt-decode';
import {useDispatch, useSelector} from 'react-redux';
import {getNewAccessToken} from "./AxiosInstance";
import {setToken} from "../reducers/auth";
import {useEffect, useState} from 'react';


const createApolloClient = (token, setNewToken) => {
  const httpLink = new HttpLink({
    uri: `https://${import.meta.env.VITE_REACT_APP_HOST}/graphql`,
  });
  let accessToken = token;
  const authLink = setContext(async (_, {headers}) => {
    if (accessToken) {
      const {exp} = jwtDecode(accessToken);
      if (Date.now() >= exp * 1000) {
        accessToken = await getNewAccessToken();
        setNewToken(accessToken);
      }
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
        } else {
          console.log(err);
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
  const dispatch = useDispatch();
  const {token} = useSelector((state) => state.auth);
  const [client, setClient] = useState(null);
  
  useEffect(() => {
    const client = createApolloClient(token, (newToken) => dispatch(setToken(newToken)));
    setClient(client);
  }, [token]);
  
  if (!client) return <></>;
  
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
};