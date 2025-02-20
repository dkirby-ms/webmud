// "rooms" are socket.io mechanisms that allow for the creation of separate channels for sending messages to one or more clients. In webMUD 
export const SocketRooms = {
    world: {
        CHANNEL_NAME: "world",
        CHANNEL_DESCRIPTION: "Channel for sending non-chat global messages and alerts",
    },
    global_chat: {
        CHANNEL_NAME: "global_chat",
        CHANNEL_DESCRIPTION: "Channel for sending global chat messages to all users",
    }
}

export const MessageTypes = {
    chat: {
        SEND_MESSAGE: "chat:send_message",
        MESSAGE_RECEIVED: "chat:message_received",
        JOIN_ROOM: "chat:join_room",
        LEAVE_ROOM: "chat:leave_room",
    },
    game: {
        PLAYER_JOIN: "game:player_join",
        PLAYER_LEAVE: "game:player_leave",
        GAME_STATE_UPDATE: "game:state_update",
    },
    combat: {
        ATTACK: "combat:attack",
        DAMAGE: "combat:damage",
        DEFEND: "combat:defend",
        COMBAT_END: "combat:combat_end",
    },
    // Additional event categories can be added here
} as const;

export type ChatEvent = keyof typeof MessageTypes.chat;
export type GameEvent = keyof typeof MessageTypes.game;
export type CombatEvent = keyof typeof MessageTypes.combat;
