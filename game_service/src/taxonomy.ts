export interface ChatMessage {
    content: string;
    senderName: string;
    channel: string;
  }

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
