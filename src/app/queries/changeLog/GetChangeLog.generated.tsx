import * as Types from '../../../types/graphQlTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetChangeLogQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type GetChangeLogQuery = { __typename?: 'Query', changeLogPosts: Array<{ __typename?: 'ChangeLogPost', logCreatedAt?: any | null, logTitle?: string | null, changeLogDescription?: { __typename?: 'RichText', html: string } | null, changeLogImprovement?: { __typename?: 'RichText', html: string } | null, changeLogFix?: { __typename?: 'RichText', html: string } | null, logImage?: { __typename?: 'Asset', url: string } | null }> };


export const GetChangeLogDocument = gql`
    query GetChangeLog {
  changeLogPosts {
    logCreatedAt
    logTitle
    changeLogDescription {
      html
    }
    changeLogImprovement {
      html
    }
    changeLogFix {
      html
    }
    logImage {
      url
    }
  }
}
    `;

/**
 * __useGetChangeLogQuery__
 *
 * To run a query within a React component, call `useGetChangeLogQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetChangeLogQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetChangeLogQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetChangeLogQuery(baseOptions?: Apollo.QueryHookOptions<GetChangeLogQuery, GetChangeLogQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetChangeLogQuery, GetChangeLogQueryVariables>(GetChangeLogDocument, options);
      }
export function useGetChangeLogLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetChangeLogQuery, GetChangeLogQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetChangeLogQuery, GetChangeLogQueryVariables>(GetChangeLogDocument, options);
        }
export function useGetChangeLogSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetChangeLogQuery, GetChangeLogQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetChangeLogQuery, GetChangeLogQueryVariables>(GetChangeLogDocument, options);
        }
export type GetChangeLogQueryHookResult = ReturnType<typeof useGetChangeLogQuery>;
export type GetChangeLogLazyQueryHookResult = ReturnType<typeof useGetChangeLogLazyQuery>;
export type GetChangeLogSuspenseQueryHookResult = ReturnType<typeof useGetChangeLogSuspenseQuery>;
export type GetChangeLogQueryResult = Apollo.QueryResult<GetChangeLogQuery, GetChangeLogQueryVariables>;