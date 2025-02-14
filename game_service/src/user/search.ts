import { ajv } from "../util.js";
import type {Server as SocketIOServer, Socket } from "socket.io";
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

interface SearchUserParams {
  io: SocketIOServer;
  session: any;
  socket: Socket;
  repositories: Repositories;
}

export function searchUsers({ io, session, socket, repositories }: SearchUserParams): (query: any, callback: (result: any) => void) => Promise<void> {
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
    const users = await repositories.userRepository.searchUsers(session.userId, validatedQuery.q, validatedQuery.size);

    callback({
      status: "OK",
      data: users,
    });
  };
}
