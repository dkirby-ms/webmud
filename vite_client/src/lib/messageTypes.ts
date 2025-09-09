// Message types constants - should be kept in sync with game_service/src/taxonomy.ts
export const MessageTypes = {
    command: {
        SEND_COMMAND: "command:send",
        SENT_COMMAND: "command:sent",
    },
    chat: {
        SEND_MESSAGE: "chat:send",
        SENT_MESSAGE: "chat:sent",
        TELL: "chat:tell",
        MESSAGE_ACK: "chat:ack",
    },
    game: {
        PLAYER_JOIN: "game:player_join",
        PLAYER_LEAVE: "game:player_leave",
        GAME_STATE_UPDATE: "game:state_update",
        ROOM_UPDATE: "game:room_update",
        MAP_UPDATE: "game:map_update",
    },
    character: {
        DELETE_CHARACTER: "character:delete", // Added message type for character deletion
    },
    combat: {
        ATTACK: "combat:attack",
        DEFENSE: "combat:defense",
        DAMAGE: "combat:damage",
        DEATH: "combat:death",
    }
} as const;

export type MessageType = typeof MessageTypes;
