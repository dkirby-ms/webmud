import { ajv } from "../util.js";
import type { Socket } from "socket.io";
import { Repositories } from "../db/index.js";
import { ObjectId } from "mongodb";

const validate = ajv.compile({
  type: "object",
  properties: {
    channelId: { type: "string", format: "uuid" },
    after: { type: "string" },
    size: { type: "integer", minimum: 1, maximum: 100, default: 10 },
    orderBy: { type: "string", enum: ["id:asc", "id:desc"], default: "id:asc" },
  },
  required: [],
  additionalProperties: false,
});

interface ListMessagesParams {
  session: any;
  socket: Socket;
  repositories: Repositories;
}

export function listMessages({ session, repositories }: ListMessagesParams): (query: any, callback: (result: any) => void) => Promise<void> {
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
    const validatedQuery = query as { channelId: ObjectId; after: string; size: number; orderBy: string };
    if (!(await repositories.channelRepository.isUserInChannel(session.userId, validatedQuery.channelId))) {
      return callback({
        status: "ERROR",
      });
    }


    const { data, hasMore } = await repositories.messageRepository.listMessages(validatedQuery.channelId, validatedQuery.orderBy, validatedQuery.size);

    callback({
      status: "OK",
      data,
      hasMore,
    });
  };
}
