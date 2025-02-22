import { ajv } from "../util.js";
import { Server, Socket } from "socket.io";
import { MessageTypes, ChatMessage } from "../taxonomy.js";

// const validate = ajv.compile({
//   type: "object",
//   properties: {
//     content: { type: "string", minLength: 1, maxLength: 5000 },
//     channelId: { type: "string", format: "uuid" },
//   },
//   required: ["content", "channelId"],
//   additionalProperties: false,
// });

// this is the function that will be called when the client emits the "message:send" event. The server will then emit the "chat:sent" event to all clients with the message content and the sender's name.
export const sentMessage = (io: Server, socket: Socket, message: string, channel: string) => {
  const payload: ChatMessage = { content: message, senderName: socket.data.playerCharacterName, channel: channel };

  // validate the message

  // send the message to the appropriate channel (socket.io room)
  if (channel === "global") {
    io.emit(MessageTypes.chat.SENT_MESSAGE, payload);
  }
  else {
    io.to(channel).emit(MessageTypes.chat.SENT_MESSAGE, payload);
  }

}

