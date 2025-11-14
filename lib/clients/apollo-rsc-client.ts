import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

// Create a new Apollo Client instance for each request to avoid cache issues during SSR/SSG
export const getClient = () => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: `${process.env.NEXT_PUBLIC_BACKEND_URL}/graphql`,
    }),
    ssrMode: typeof window === 'undefined',
    defaultOptions: {
      query: {
        fetchPolicy: 'network-only',
      },
    },
  });
};


