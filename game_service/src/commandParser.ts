export enum CommandType {
    SAY = "say",
    MOVE = "move",
    ATTACK = "attack",
    UNKNOWN = "unknown",
    TELL = "tell",
    LOOK = "look",
    EMOTE = "emote", // Added new command type for emotes
}

import { EMOTE_KEYS } from './world/emoteConfig.js';

export interface Command {
    type: CommandType;
    args?: string[];
    text?: string;
}

/**
 * Parses a player's text command into a Command object.
 *
 * Supported commands:
 * - "say <message>" => CommandType.SAY with message in the "text" property.
 * - Direction commands (e.g., "north", "east") => CommandType.MOVE with the direction in "args".
 * - "kill <target>" => CommandType.ATTACK with the target in "args".
 * - "emote <action>" or specific emotes like "smile", "dance" => CommandType.EMOTE
 *
 * If the command is not recognized, type will be CommandType.UNKNOWN.
 */
export function parseCommand(input: string): Command {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
        return { type: CommandType.UNKNOWN };
    }

    const tokens = trimmed.split(/\s+/);
    const commandWord = tokens[0].toLowerCase();
    const rest = tokens.slice(1).join(" ");

    // Handle direction commands.
    const directionMapping: Record<string, string> = {
        "n": "north",
        "north": "north",
        "s": "south",
        "south": "south",
        "e": "east",
        "east": "east",
        "w": "west",
        "west": "west",
        "u": "up",
        "up": "up",
        "d": "down",
        "down": "down",
    };
    if (commandWord in directionMapping) {
        return {
            type: CommandType.MOVE,
            args: [directionMapping[commandWord]],
        };
    }

    // Handle the 'say' command.
    if (commandWord === "say") {
        return {
            type: CommandType.SAY,
            text: rest,
        };
    }

    // Handle the 'tell' command.
    if (commandWord === "tell") {
        const [target, ...message] = rest.split(" ");
        return {
            type: CommandType.TELL,
            args: [target],
            text: message.join(" "),
        };
    }

    // Handle the 'kill/attack' command.
    if (commandWord === "kill" || commandWord === "attack" || commandWord === "k" || commandWord === "a") {
        return {
            type: CommandType.ATTACK,
            args: tokens.slice(1),
        };
    }

    // Handle 'look' command
    if (commandWord === "look" || commandWord === "l") {
        return {
            type: CommandType.LOOK,
            args: tokens.slice(1),
        };
    }

    // Handle emote commands
    // Check if the command is a specific emote or the generic 'emote' command
    if (EMOTE_KEYS.includes(commandWord) || commandWord === "emote" || commandWord === "em") {
        if (commandWord === "emote" || commandWord === "em") {
            // For generic emote command, rest is the full emote text
            return {
                type: CommandType.EMOTE,
                text: rest,
                args: rest.length ? tokens.slice(1) : undefined
            };
        } else {
            // For specific emote commands like "smile", the command itself is the action
            return {
                type: CommandType.EMOTE,
                text: commandWord,
                args: tokens.slice(1).length ? tokens.slice(1) : undefined
            };
        }
    }

    return { type: CommandType.UNKNOWN };
}
