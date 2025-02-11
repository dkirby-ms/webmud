/* global use, db */
// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
// The result of the last command run in a playground is shown on the results panel.
// By default the first 20 documents will be returned with a cursor.
// Use 'console.log()' to print to the debug output.
// For more documentation on playgrounds please refer to
// https://www.mongodb.com/docs/mongodb-vscode/playgrounds/

// Select the database to use.
use('game-service');

const characterRacesData = [
    {
        "race_id": "race-001",
        "name": "Human",
        "description": "Versatile and ambitious.",
        "default_attributes": {
            "base_stats": {
                "strength": 12,
                "dexterity": 12,
                "constitution": 12,
                "intelligence": 12,
                "wisdom": 12,
                "charisma": 16,
            }
        },
        "size": "medium",
        "base_speed": 1.0
    },
    {
        "race_id": "race-002",
        "name": "Tiefling",
        "description": "Part fiend, part human with a knack for minor magicks.",
        "default_attributes": {
            "base_stats": {
                "strength": 13,
                "dexterity": 14,
                "constitution": 11,
                "intelligence": 13,
                "wisdom": 11,
                "charisma": 10,
            }
        },
        "size": "medium",
        "base_speed": 1.1
    },
    {
        "race_id": "race-003",
        "name": "Githyanki",
        "description": "Lithe and lean with innate psionic abilities.",
        "default_attributes": {
            "base_stats": {
                "strength": 14,
                "dexterity": 16,
                "constitution": 12,
                "intelligence": 12,
                "wisdom": 12,
                "charisma": 10,
            },
            "size": "medium",
            "base_speed": 1.0
        }
    }
];

characterRacesData.forEach(race => {
    db.getCollection('characterRaces').updateOne(
        { race_id: race.race_id },
        { $set: race },
        { upsert: true }
    );
});

const playerCharactersData = [
    {
        "playerCharacterId": "pc-001",
        "userId": "7ced8fcb-85c6-47b4-ad6b-715e9fddbfa9",
        "name": "Saitcho",
        "race": "race-001",
        "attributes": {
            "strength": 12,
            "dexterity": 14,
            "constitution": 10,
            "intelligence": 16,
            "wisdom": 10,
            "charisma": 14
        }
    },
    {
        "playerCharacterId": "pc-002",
        "userId": "7ced8fcb-85c6-47b4-ad6b-715e9fddbfa9",
        "name": "Gren",
        "race": "race-003"
    }
];

playerCharactersData.forEach(playerCharacter => {
    db.getCollection('playerCharacters').updateOne(
        { playerCharacterId: playerCharacter.playerCharacterId },
        { $set: playerCharacter },
        { upsert: true }
    );
});

const channelsData = [
    {
        "channel_id": "world-001",
        "name": "World",
        "description": "The main world channel for all players.",
        "is_default": true
    },
    {
        "channel_id": "ooc-001",
        "name": "Out of Character",
        "description": "A channel for out of character discussions.",
        "is_default": false
    },
    {
        "channel_id": "imm-001",
        "name": "Immortals",
        "description": "A channel for immortal discussions.",
        "is_default": false
    }
];

channelsData.forEach(channel => {
    db.getCollection('channels').updateOne(
        { channel_id: channel.channel_id },
        { $set: channel },
        { upsert: true }
    );
});

const roomsData = [
    {
        "worldId": "67a7f0748ffb2594d8436b55",
        "room_id": "room-002",
        "name": "Hallway",
        "description": "A long, narrow corridor with flickering lights, lined with portraits of past inhabitants.",
        "properties": {
            "lighting": "flickering",
            "sound": "echoing",
            "smell": "musty",
            "temperature": "chilly",
            "humidity": "moderate"
        },
        "exits": {
            "south": {
                "room_id": "room-001",
                "description": "A door leading back to the Dank Office.",
                "door": {
                    "locked": false,
                    "key_id": null 
                }
            },
            "east": {
                "room_id": "room-003",
                "description": "A narrow archway leading to a mysterious study.",
                "door": {
                    "locked": true,
                    "key_id": "key-002"
                }
            }
        }
    },
    {
        "worldId": "67a7f0748ffb2594d8436b55",
        "room_id": "room-003",
        "name": "Mysterious Study",
        "description": "A room filled with ancient texts and artifacts, where every shadow hints at hidden secrets.",
        "properties": {
            "lighting": "dim",
            "sound": "whispering",
            "smell": "old paper",
            "temperature": "warm",
            "humidity": "dry"
        },
        "exits": {
            "west": {
                "room_id": "room-002",
                "description": "A small door leading back to the Hallway.",
                "door": {
                    "locked": false,
                    "key_id": null
                }
            }
        }
    },
    {
        "worldId": "67a7f0748ffb2594d8436b55-001",
        "room_id": "room-001",
        "name": "Dank Office",
        "description": "A dusty, dimly-lit room filled with old books and mysterious artifacts. There is a window with a view to a small courtyard.",
        "properties": {
            "lighting": "dim",
            "sound": "quiet",
            "smell": "florid",
            "temperature": "cool",
            "humidity": "mild"
        },
        "exits": {
            "north": {
                "room_id": "room-002",
                "description": "A sturdy, white wooden door with paneled insets leads out of the office.",
                "door": {
                    "locked": false,
                    "key_id": null
                }
            }
        }
    }
];

roomsData.forEach(room => {
    db.getCollection('rooms').updateOne(
        { room_id: room.room_id },
        { $set: room },
        { upsert: true }
    );
});
