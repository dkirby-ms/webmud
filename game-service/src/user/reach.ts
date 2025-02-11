import { ajv, logger, userRoom } from "../util.js";
import type {Server as SocketIOServer, Socket } from "socket.io";
import { Repositories } from "../db/index.js";

const validate = ajv.compile({
  type: "object",
  properties: {
    userIds: {
      type: "array",
      items: { type: "string", format: "uuid" },
      minItems: 1,
      maxItems: 1,
    },
  },
  required: ["userIds"],
  additionalProperties: false,
});

interface ReachUserParams {
  io: SocketIOServer;
  session: any;
  socket: Socket;
  repositories: Repositories;
}

export function reachUser({ io, session, socket, repositories }: ReachUserParams): (payload: any, callback: (result: any) => void) => Promise<void> {
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

    let channel;

    try {
      channel = await repositories.channelRepository.createPrivateChannel(session.userId, payload.userIds);
    } catch (e) {
      return callback({
        status: "ERROR",
      });
    }

    logger.info(
      "private channel [%s] was created by user [%s]",
      channel?.id,
      session.userId,
    );

    // broadcast to other tabs of the same user
    socket.to(userRoom(session.userId)).emit("channel:created", channel);

    io.in(userRoom(session.userId)).socketsJoin(`channel:${channel?.id}`);

    callback({
      status: "OK",
      data: channel,
    });
  };
}
