import { ajv, logger, userRoom } from "../util.js";
import type { Server as SocketIOServer, Socket } from "socket.io";
import { Repositories } from "../db/index.js";

const validate = ajv.compile({
  type: "object",
  properties: {
    name: { type: "string", minLength: 2, maxLength: 32 },
  },
  required: ["name"],
  additionalProperties: false,
});

interface CreateChannelParams {
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

export function createChannel({ io, session, socket, repositories }: CreateChannelParams): (payload: any, callback: (result: CallbackResult) => void) => Promise<void> {
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
      channel = await repositories.channelRepository.createPublicChannel(session.userId, payload.name);
    } catch (e) {
      return callback({
        status: "ERROR",
      });
    }

    logger.info(
      "public channel [%s] was created by user [%s]",
      channel.id,
      session.userId,
    );

    // broadcast to other tabs of the same user
    socket.to(userRoom(session.userId)).emit("channel:created", channel);

    io.in(userRoom(session.userId)).socketsJoin(`channel:${channel.id}`);

    callback({
      status: "OK",
      data: channel,
    });
  };
}
