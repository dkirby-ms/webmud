import { ajv } from "../util.js";
import type {Server as SocketIOServer, Socket } from "socket.io";
import { Repositories } from "../db/index.js";

const validate = ajv.compile({
  type: "object",
  properties: {
    channelId: { type: "string", format: "uuid" },
    messageId: { type: "string" },
  },
  required: ["channelId", "messageId"],
  additionalProperties: false,
});

interface AckMessageParams {
  socket: Socket;
  session: any;
  repositories: Repositories;
}

export function ackMessage({ socket, session, repositories }: AckMessageParams): (payload: any, callback: (result: any) => void) => Promise<void> {
  return async (payload, callback) => {
    if (typeof callback !== "function") {
      return;
    }

    if (!validate(payload)) {
      return callback({
        status: "ERROR",
        errors: validate.errors,
      });
    }

    try {
      const validatedPayload = payload as { channelId: string; messageId: string };
      await repositories.messageRepository.ackMessage(session.userId, payload.channelId, payload.messageId);
    } catch (e) {
      return callback({
        status: "ERROR",
      });
    }

    callback({
      status: "OK",
    });
  };
}
