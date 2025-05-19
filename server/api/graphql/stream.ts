import { eventHandler } from 'h3'
import { serv } from '~~/server/graphserv/serv'

// Create and export the `/api/graphql/stream` route handler
export default eventHandler(event => serv.handleEventStreamEvent(event))
