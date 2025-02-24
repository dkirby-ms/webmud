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

// character skills are the base abilities of a character
const characterSkills = [
    {
        "_id": "skill-001",
        "name": "Fighting",
        "description": "The ability to fight with weapons and fists.",
    },
    {
        "_id": "skill-002",
        "name": "Stealth",
        "description": "The ability to move unseen and unheard.",
    },
    {
        "_id": "skill-003",
        "name": "Dodging",
        "description": "The ability to avoid attacks and traps.",
    }
]

characterSkills.forEach(skill => {
    db.getCollection('characterSkills').updateOne(
        { _id: skill._id },
        { $set: skill },
        { upsert: true }
    );
});

// character races are the base "species" of a character
const characterSpecies = [
    {
        "_id": "species-001",
        "name": "Human",
        "description": "Versatile and ambitious.",
        "imageUrl": "human_low.jpg",
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
        "_id": "species-002",
        "name": "Tiefling",
        "imageUrl": "tiefling_low.jpg",
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
        "_id": "species-003",
        "name": "Githyanki",
        "imageUrl": "githyanki_low.jpg",
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

characterSpecies.forEach(race => {
    db.getCollection('characterSpecies').updateOne(
        { _id: race._id },
        { $set: race },
        { upsert: true }
    );
});

const playerCharactersData = [
    {
        "userId": "7ced8fcb-85c6-47b4-ad6b-715e9fddbfa9",
        "world_id": "67b1ff97bfd2ac9c9a8a546b",
        "name": "Saitcho",
        "species": "species-001",
        "playerLevel": 1,
        "attributes": {
            "strength": 12,
            "dexterity": 14,
            "constitution": 10,
            "intelligence": 16,
            "wisdom": 10,
            "charisma": 14
        },
        "saved_state": {
            "location": "room-002",
        }
    },
    {
        "userId": "7ced8fcb-85c6-47b4-ad6b-715e9fddbfa9",
        "world_id": "67b1ff97bfd2ac9c9a8a546b",
        "name": "Gren",
        "species": "species-003",
        "playerLevel": 1,
        "attributes": {
            "strength": 12,
            "dexterity": 14,
            "constitution": 10,
            "intelligence": 16,
            "wisdom": 10,
            "charisma": 14
        },
        "saved_state": {
            "location": "room-002",
        }
    },
    {
        "userId": "7xxxxxxxxxxxxxxxxxxxxx",
        "world_id": "67b1ff97bfd2ac9c9a8a546b",
        "name": "DummyCharNoSelect",
        "species": "species-003",
        "playerLevel": 1,
        "attributes": {
            "strength": 12,
            "dexterity": 14,
            "constitution": 10,
            "intelligence": 16,
            "wisdom": 10,
            "charisma": 14
        },
        "saved_state": {
            "location": "room-002",
        }
    }
];

playerCharactersData.forEach(playerCharacter => {
    db.getCollection('playerCharacters').updateOne(
        { name: playerCharacter.name },
        { $set: playerCharacter },
        { upsert: true }
    );
});

const channelsData = [
    {
        "name": "World",
        "description": "The main world channel for all players.",
        "is_default": true
    },
    {
        "name": "Out of Character",
        "description": "A channel for out of character discussions.",
        "is_default": false
    },
    {
        "name": "Immortals",
        "description": "A channel for immortal discussions.",
        "is_default": false
    }
];

channelsData.forEach(channel => {
    db.getCollection('channels').updateOne(
        { name: channel.name },
        { $set: channel },
        { upsert: true }
    );
});

const roomsData = [
    {
        "world_id": "67b1ff97bfd2ac9c9a8a546b",
        "_id": "room-002",
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
        "world_id": "67b1ff97bfd2ac9c9a8a546b",
        "_id": "room-003",
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
        "world_id": "67b1ff97bfd2ac9c9a8a546b",
        "_id": "room-001",
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
        { _id: room._id },
        { $set: room },
        { upsert: true }
    );
});

const worldsData = [
    {
        "name": "webMUD Test server",
        "description": "Official development server for webMUD.",
        "url": "http://192.168.2.148:28999",
        "properties": {
            "max_players": 10,
            "is_public": false,
            "is_active": true,
            "is_development": true
        }
    },
    {
        "name": "webMUD prod",
        "description": "Planned production server for webMUD (not active)",
        "url": "http://webmud.com:28999",
        "properties": {
            "max_players": 10000,
            "is_public": true,
            "is_active": false,
            "is_development": false
        }
    },
]

worldsData.forEach(world => {
    db.getCollection('worlds').updateOne(
        { name: world.name },
        { $set: world },
        { upsert: true }
    );
});