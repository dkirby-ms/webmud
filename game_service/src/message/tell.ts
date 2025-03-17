import { Server, Socket } from "socket.io";
import { MessageTypes, ChatMessage } from "../taxonomy.js";

export const tellPlayer = (io: Server, socket: Socket, target: string, message: string) => {
    const payload: ChatMessage = { content: message, senderName: socket.data.playerCharacterName, channel: target };
    io.to(target).emit(MessageTypes.chat.TELL, payload);
}
    