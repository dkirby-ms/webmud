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


// entities represent the state and location of an instance of a mob in the game world
const entitiesData = [
    {
        "world_id": "67b1ff97bfd2ac9c9a8a546b",
        "room_id": "67a8127c506208690c7cccdf",
        "entity_pk": "12345656exampleObjectId",
        "entity_type": "mob",
        "state": {
            // status object needs refining
            "health": 100,
            "mana": 100,
            "stamina": 100,
            "abilities": {
                "skill-001": 10,
                "skill-002": 10,
                "skill-003": 10,
            },
            "attributes": {
                "strength": 12,
                "dexterity": 12,
                "constitution": 12,
                "intelligence": 12,
                "wisdom": 12,
                "charisma": 16,
            },
            "size": "medium",
            "speed": 1.0,
            "effects": [],
            "equipment": {
            },
            "inventory": [],
        },
        "lastAction": {
            "action": "idle",
            "timestamp": new Date()
        },
    },
]

entitiesData.forEach(entity => {
    db.getCollection('entities').updateOne(
        { mob_id: entity.mob_id },
        { $set: entity },
        { upsert: true }
    );
});