import { eventHandler } from 'h3'
import { serv } from '~~/server/graphserv/serv'

export default eventHandler({
  // Create and export the `/api/graphql` route handler
  handler: event => serv.handleGraphQLEvent(event),
  // Create and export the `/api/graphql` websocket handler
  websocket: serv.makeWsHandler(),
})
