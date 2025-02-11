import { ajv, userStateRoom } from "../util.js";
import type { Socket } from "socket.io";
import { Repositories } from "../db/index.js";
import { ObjectId } from "mongodb";

const validate = ajv.compile({
  type: "object",
  properties: {
    userId: { type: "string", format: "uuid" },
  },
  additionalProperties: false,
});

interface GetUserParams {
  socket: Socket;
  repositories: Repositories;
}

export function getUser({ socket, repositories }: GetUserParams): (query: any, callback: (result: any) => void) => Promise<void> {
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

    // Changed: using repositories.userRepository.getUser instead of db.getUser
    const validatedQuery = query as { userId: ObjectId };
    const user = await repositories.userRepository.getUser(validatedQuery.userId);

    if (user) {
      // the user will be notified of any change of the user state
      socket.join(userStateRoom(user.id));

      callback({
        status: "OK",
        data: user,
      });
    } else {
      callback({
        status: "ERROR",
      });
    }
  };
}
