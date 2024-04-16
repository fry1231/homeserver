import {ApolloProvider, ApolloClient, InMemoryCache, gql} from '@apollo/client';
import {useAuth} from "./authProvider.jsx";
import {useEffect, useState} from "react";


export const ApolloWrapper = ({children}) => {
  const {token, setToken} = useAuth();
  const [client, setClient] = useState(null);
  useEffect(() => {
    const client = new ApolloClient({
      uri: `https://${import.meta.env.VITE_REACT_APP_HOST}/graphql`,
      cache: new InMemoryCache(),
      headers: {
        Authorization: `Bearer ${token}`
      },
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'no-cache',
        },
      }
    });
    setClient(client);
  }, [token]);
  
  if (!client) return <></>;
  
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
};
