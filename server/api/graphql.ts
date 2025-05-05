import { eventHandler } from "h3";
import { serv } from "~/server/graphserv/serv";

export default eventHandler((event) => serv.handleGraphQLEvent(event));