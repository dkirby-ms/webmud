import { ajv, logger, userRoom } from "../util.js";
import { Server as SocketIOServer, Socket } from "socket.io";
import { Repositories } from "../db/index.js";

const validate = ajv.compile({
  type: "object",
  properties: {
    channelId: { type: "string", format: "uuid" },
  },
  required: ["channelId"],
  additionalProperties: false,
});

interface JoinChannelParams {
  io: SocketIOServer;
  session: any;
  socket: Socket;
  repositories: Repositories;
}

interface CallbackResult {
  status: string;
  errors?: unknown;
  data?: any;
}

export function joinChannel({ io, session, socket, repositories }: JoinChannelParams): (payload: any, callback: (result: CallbackResult) => void) => Promise<void> {
  return async (payload: any, callback: (result: CallbackResult) => void): Promise<void> => {
    if (typeof callback !== "function") {
      return;
    }

    if (!validate(payload)) {
      return callback({
        status: "ERROR",
        errors: validate.errors,
      });
    }

    let channel: any;

    try {
      channel = await repositories.channelRepository.joinChannel(session.userId, payload.channelId);
    } catch (e) {
      return callback({
        status: "ERROR",
      });
    }

    logger.info("user [%s] has joined channel [%s]", session.userId, channel.id);

    // broadcast to the other tabs of the same user
    socket.to(userRoom(session.userId)).emit("channel:joined", channel);

    io.in(userRoom(session.userId)).socketsJoin(`channel:${channel.id}`);

    callback({
      status: "OK",
      data: channel,
    });
  };
}
