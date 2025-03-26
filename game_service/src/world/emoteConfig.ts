/**
 * Configuration for emotes in the game.
 * Each emote has:
 * - key: Command that triggers the emote (e.g., "smile")
 * - selfText: Text shown to the player performing the emote (e.g., "You smile happily.")
 * - othersText: Text shown to others in the room (e.g., "{name} smiles happily.")
 * - targetSelfText: Text shown to player when targeting someone (e.g., "You smile at {target}.")
 * - targetOthersText: Text shown to others when targeting someone (e.g., "{name} smiles at {target}.")
 * - targetReceiverText: Text shown to the target (e.g., "{name} smiles at you.")
 */

export interface EmoteDefinition {
    key: string;
    selfText: string;
    othersText: string;
    targetSelfText: string;
    targetOthersText: string;
    targetReceiverText: string;
}

export const EMOTES: EmoteDefinition[] = [
    {
        key: "smile",
        selfText: "You smile happily.",
        othersText: "{name} smiles happily.",
        targetSelfText: "You smile warmly at {target}.",
        targetOthersText: "{name} smiles warmly at {target}.",
        targetReceiverText: "{name} smiles warmly at you."
    },
    {
        key: "grin",
        selfText: "You grin mischievously.",
        othersText: "{name} grins mischievously.",
        targetSelfText: "You grin mischievously at {target}.",
        targetOthersText: "{name} grins mischievously at {target}.",
        targetReceiverText: "{name} grins mischievously at you."
    },
    {
        key: "laugh",
        selfText: "You laugh heartily.",
        othersText: "{name} laughs heartily.",
        targetSelfText: "You laugh at {target}.",
        targetOthersText: "{name} laughs at {target}.",
        targetReceiverText: "{name} laughs at you."
    },
    {
        key: "wave",
        selfText: "You wave.",
        othersText: "{name} waves.",
        targetSelfText: "You wave to {target}.",
        targetOthersText: "{name} waves to {target}.",
        targetReceiverText: "{name} waves to you."
    },
    {
        key: "bow",
        selfText: "You bow gracefully.",
        othersText: "{name} bows gracefully.",
        targetSelfText: "You bow respectfully to {target}.",
        targetOthersText: "{name} bows respectfully to {target}.",
        targetReceiverText: "{name} bows respectfully to you."
    },
    {
        key: "nod",
        selfText: "You nod.",
        othersText: "{name} nods.",
        targetSelfText: "You nod to {target}.",
        targetOthersText: "{name} nods to {target}.",
        targetReceiverText: "{name} nods to you."
    },
    {
        key: "dance",
        selfText: "You dance with wild abandon.",
        othersText: "{name} dances with wild abandon.",
        targetSelfText: "You dance with {target}.",
        targetOthersText: "{name} dances with {target}.",
        targetReceiverText: "{name} dances with you."
    },
    {
        key: "twirl",
        selfText: "You twirl around gracefully.",
        othersText: "{name} twirls around gracefully.",
        targetSelfText: "You twirl around {target} gracefully.",
        targetOthersText: "{name} twirls around {target} gracefully.",
        targetReceiverText: "{name} twirls around you gracefully."
    },
    {
        key: "yawn",
        selfText: "You yawn sleepily.",
        othersText: "{name} yawns sleepily.",
        targetSelfText: "You yawn sleepily at {target}.",
        targetOthersText: "{name} yawns sleepily at {target}.",
        targetReceiverText: "{name} yawns sleepily at you."
    },
    {
        key: "wink",
        selfText: "You wink mischievously.",
        othersText: "{name} winks mischievously.",
        targetSelfText: "You wink mischievously at {target}.",
        targetOthersText: "{name} winks mischievously at {target}.",
        targetReceiverText: "{name} winks mischievously at you."
    },
    {
        key: "sigh",
        selfText: "You sigh deeply.",
        othersText: "{name} sighs deeply.",
        targetSelfText: "You sigh deeply at {target}.",
        targetOthersText: "{name} sighs deeply at {target}.",
        targetReceiverText: "{name} sighs deeply at you."
    },
    {
        key: "cry",
        selfText: "You cry softly.",
        othersText: "{name} cries softly.",
        targetSelfText: "You cry on {target}'s shoulder.",
        targetOthersText: "{name} cries on {target}'s shoulder.",
        targetReceiverText: "{name} cries on your shoulder."
    },
    {
        key: "applaud",
        selfText: "You applaud enthusiastically.",
        othersText: "{name} applauds enthusiastically.",
        targetSelfText: "You applaud {target} enthusiastically.",
        targetOthersText: "{name} applauds {target} enthusiastically.",
        targetReceiverText: "{name} applauds you enthusiastically."
    },
    {
        key: "shrug",
        selfText: "You shrug indifferently.",
        othersText: "{name} shrugs indifferently.",
        targetSelfText: "You shrug indifferently at {target}.",
        targetOthersText: "{name} shrugs indifferently at {target}.",
        targetReceiverText: "{name} shrugs indifferently at you."
    }
];

// Get the keys of all emotes for command parsing
export const EMOTE_KEYS = EMOTES.map(emote => emote.key);

// Get an emote by its key
export function getEmoteByKey(key: string): EmoteDefinition | undefined {
    return EMOTES.find(emote => emote.key === key);
}
