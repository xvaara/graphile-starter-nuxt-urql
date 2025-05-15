import { defineWebSocketHandler } from "h3";
import { serv } from "~~/server/graphserv/serv";

export default defineWebSocketHandler(serv.makeWsHandler());
