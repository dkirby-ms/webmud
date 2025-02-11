import { ajv } from "../util.js";
import type { Server as SocketIOServer, Socket } from "socket.io";
import { Repositories } from "../db/index.js";

const validate = ajv.compile({
  type: "object",
  properties: {
    size: { type: "integer", minimum: 1, maximum: 100, default: 10 },
    orderBy: { type: "string", enum: ["name:asc"], default: "name:asc" },
  },
  additionalProperties: false,
});

interface ListChannelsParams {
	io: SocketIOServer;
  session: any;
	socket: Socket;
	repositories: Repositories;
}

export function listChannels({ io, session, socket, repositories }: ListChannelsParams): (query: any, callback: (result: any) => void) => Promise<void> {
  return async (query, callback) => {
    if (typeof callback !== "function") {
      return;
    }

    if (!validate(query)) {
      return callback({
        status: "ERROR",
        errors: validate.errors,
      });
    }

    const typedQuery = query as { size: number; orderBy: "name:asc" };
    const { data, hasMore } = await repositories.channelRepository.listChannels(session.userId, typedQuery.orderBy, typedQuery.size);

    callback({
      status: "OK",
      data,
      hasMore,
    });
  };
}
