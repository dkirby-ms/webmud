export enum CommandType {
    SAY = "say",
    MOVE = "move",
    COMBAT = "combat",
    UNKNOWN = "unknown",
    TELL = "tell",
    LOOK = "look",
    EMOTE = "emote", // Added new command type for emotes
    HELP = "help",   // Added new command type for help
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
 * - "kill <target>" or "attack <target>" => CommandType.COMBAT with the target in "args".
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
            type: CommandType.COMBAT,
            args: tokens.slice(1),
        };
    }

    // Handle 'look' command
    if (commandWord === "look" || commandWord === "l") {
        return {
            type: CommandType.LOOK,
            args: tokens.slice(1).length > 0 ? tokens.slice(1) : undefined,
        };
    }

    // Handle 'help' command
    if (commandWord === "help" || commandWord === "h") {
        return {
            type: CommandType.HELP,
            args: tokens.slice(1),
        };
    }

    // Handle emote commands
    // Check if the command is a specific emote
    if (EMOTE_KEYS.includes(commandWord)) {
        // For specific emote commands like "smile", the command itself is the action
        return {
            type: CommandType.EMOTE,
            text: commandWord,
            args: tokens.slice(1).length ? tokens.slice(1) : undefined
        };
    }

    return { type: CommandType.UNKNOWN };
}
