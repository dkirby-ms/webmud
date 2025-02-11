import { ajv } from "../util.js";
import type { Server as SocketIOServer, Socket } from "socket.io";
import { Repositories } from "../db/index.js";

const validate = ajv.compile({
  type: "object",
  properties: {
    q: { type: "string", default: "" },
    size: { type: "integer", minimum: 1, maximum: 100, default: 10 },
  },
  required: [],
  additionalProperties: false,
});

interface SearchChannelParams {
  io: SocketIOServer;
  socket: Socket;
  session: any;
  repositories: Repositories;
}

export function searchChannels({ io, session, socket, repositories }: SearchChannelParams): (query: any, callback: (result: any) => void) => Promise<void> {
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

    const validatedQuery = query as { q: string; size: number };
    const channels = await repositories.channelRepository.searchChannels(session.userId, validatedQuery.q, validatedQuery.size );

    callback({
      status: "OK",
      data: channels,
    });
  };
}
