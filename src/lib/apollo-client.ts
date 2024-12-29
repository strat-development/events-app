import { ApolloClient, InMemoryCache } from '@apollo/client';

export const client = new ApolloClient({
  uri: 'https://eu-west-2.cdn.hygraph.com/content/cm41894k5006507w6f1191dj1/master',
  cache: new InMemoryCache(),
});