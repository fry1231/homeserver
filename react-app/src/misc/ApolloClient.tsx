import {ApolloProvider, ApolloClient, InMemoryCache, gql} from '@apollo/client';
import {useDispatch, useSelector} from "react-redux";
import {useEffect, useState} from "react";


export const ApolloWrapper = ({children}) => {
  const {token, isRefreshing} = useSelector((state) => state.auth)
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
