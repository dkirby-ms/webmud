import { Socket } from "socket.io";
import { MessageTypes } from "../taxonomy.js";

export const tellPlayer = (socket: Socket, fromPlayerName: string, message: string) => {
    const formattedMessage = `${fromPlayerName} tells you: ${message}`;
    socket.emit(MessageTypes.chat.TELL, formattedMessage);
}
    