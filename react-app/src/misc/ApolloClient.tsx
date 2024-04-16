import {ApolloProvider, ApolloClient, InMemoryCache, gql} from '@apollo/client';
import {useAuth} from "./authProvider.jsx";
import {useEffect, useState} from "react";
import {GraphQLScalarType} from "graphql/type";

// const typeDefs = gql`
//   scalar BigInt
// `;
const bigIntScalar = new GraphQLScalarType({
  name: 'BigInt',
  description: 'BigInt custom scalar type',
  serialize(value) {
    if (value instanceof String) {
      return parseInt(value);
    }
    throw Error('GraphQL BigInt Scalar serializer expected a `string` object');
  },
  parseValue(value) {
    if (typeof value === 'number') {
      return value.toString();
    }
    throw new Error('GraphQL BigInt Scalar parser expected a `number`');
  },
});

const resolverFunctions = {
  BigInt: bigIntScalar
};

const typeDefs = gql`
  scalar BigInt
`;

export const ApolloWrapper = ({children}) => {
  const {token, setToken} = useAuth();
  const [client, setClient] = useState(null);
  useEffect(() => {
    const client = new ApolloClient({
      uri: `https://${import.meta.env.VITE_REACT_APP_HOST}/graphql`,
      cache: new InMemoryCache(),
      // typeDefs,
      // resolvers: resolverFunctions,
      headers: {
        Authorization: `Bearer ${token}`
      },
      defaultOptions: {
        query: {
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
