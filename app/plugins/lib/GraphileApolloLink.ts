import type {
  FetchResult,
  NextLink,
  Operation,
} from '@apollo/client'
import type { H3Event } from 'h3'
import type { PostGraphileInstance } from 'postgraphile'
import {
  ApolloLink,
  Observable,
} from '@apollo/client'
import { execute, hookArgs, isAsyncIterable } from 'grafast'
import { getOperationAST } from 'graphql'

export interface GraphileApolloLinkInterface {
  /** The event object. */
  event: H3Event

  /** The instance of the express middleware returned by calling `postgraphile()` */
  pgl: PostGraphileInstance
}

/**
 * A Graphile Apollo link for use during SSR. Allows Apollo Client to resolve
 * server-side requests without requiring an HTTP roundtrip.
 */
export class GraphileApolloLink extends ApolloLink {
  constructor(private options: GraphileApolloLinkInterface) {
    super()
  }

  override request(
    operation: Operation,
    _forward?: NextLink,
  ): Observable<FetchResult> | null {
    const { pgl, event } = this.options
    return new Observable((observer) => {
      (async () => {
        try {
          const {
            operationName,
            variables: variableValues,
            query: document,
          } = operation
          const op = getOperationAST(document, operationName)
          if (!op || op.operation !== 'query') {
            if (!observer.closed) {
              /* Only do queries (not subscriptions) on server side */
              observer.complete()
            }
            return
          }
          const schema = await pgl.getSchema()
          const args = {
            schema,
            resolvedPreset: pgl.getResolvedPreset(),
            requestContext: { h3v1: { event } },
            document,
            variableValues,
            operationName,
          }
          await hookArgs(args)
          const data = await execute(args)
          if (isAsyncIterable(data)) {
            data.return?.()
            throw new Error('Iterable not supported by GraphileApolloLink')
          }
          if (!observer.closed) {
            observer.next(data)
            observer.complete()
          }
        }
        catch (e: any) {
          if (!observer.closed) {
            observer.error(e)
          }
          else {
            console.error(e)
          }
        }
      })()
    })
  }
}
