export enum CommandType {
    SAY = "say",
    MOVE = "move",
    ATTACK = "attack",
    UNKNOWN = "unknown",
    TELL = "tell",
    LOOK = "look",
}

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

    return { type: CommandType.UNKNOWN };
}
