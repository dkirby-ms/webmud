/* global use, db */
// MongoDB Playground - Card seed data
// This script seeds the database with initial cards for the deck system

// Select the database to use.
use('game-service');

// Define card data
const cardsData = [
    // Basic Spell Cards
    {
        "_id": "card-spell-001",
        "name": "Fireball",
        "description": "A blazing sphere of fire that deals damage to enemies in a small area.",
        "type": "spell",
        "rarity": "common",
        "manaCost": 3,
        "damage": 25,
        "imageUrl": "/cards/fireball.jpg",
        "effects": [
            {
                "type": "damage",
                "value": 25,
                "target": "enemy"
            }
        ],
        "requirements": {
            "level": 1
        },
        "createdAt": new Date(),
        "updatedAt": new Date()
    },
    {
        "_id": "card-spell-002",
        "name": "Lightning Strike",
        "description": "A powerful bolt of lightning that stuns the target.",
        "type": "spell",
        "rarity": "rare",
        "manaCost": 5,
        "damage": 35,
        "duration": 2,
        "imageUrl": "/cards/lightning-strike.jpg",
        "effects": [
            {
                "type": "damage",
                "value": 35,
                "target": "enemy"
            },
            {
                "type": "debuff",
                "target": "enemy",
                "duration": 2,
                "attribute": "stunned"
            }
        ],
        "requirements": {
            "level": 3
        },
        "createdAt": new Date(),
        "updatedAt": new Date()
    },
    {
        "_id": "card-spell-003",
        "name": "Ice Shard",
        "description": "A sharp projectile of ice that slows the target.",
        "type": "spell",
        "rarity": "uncommon",
        "manaCost": 2,
        "damage": 18,
        "duration": 3,
        "imageUrl": "/cards/ice-shard.jpg",
        "effects": [
            {
                "type": "damage",
                "value": 18,
                "target": "enemy"
            },
            {
                "type": "debuff",
                "target": "enemy",
                "duration": 3,
                "attribute": "slowed"
            }
        ],
        "requirements": {
            "level": 2
        },
        "createdAt": new Date(),
        "updatedAt": new Date()
    },
    {
        "_id": "card-spell-004",
        "name": "Meteor",
        "description": "A devastating spell that calls down a meteor from the heavens.",
        "type": "spell",
        "rarity": "legendary",
        "manaCost": 10,
        "damage": 100,
        "cooldown": 30,
        "imageUrl": "/cards/meteor.jpg",
        "effects": [
            {
                "type": "damage",
                "value": 100,
                "target": "all"
            }
        ],
        "requirements": {
            "level": 10,
            "attributes": {
                "intelligence": 20
            }
        },
        "createdAt": new Date(),
        "updatedAt": new Date()
    },

    // Item Cards
    {
        "_id": "card-item-001",
        "name": "Healing Potion",
        "description": "A magical potion that restores health to the user.",
        "type": "item",
        "rarity": "common",
        "healing": 20,
        "imageUrl": "/cards/healing-potion.jpg",
        "effects": [
            {
                "type": "heal",
                "value": 20,
                "target": "self"
            }
        ],
        "requirements": {
            "level": 1
        },
        "createdAt": new Date(),
        "updatedAt": new Date()
    },
    {
        "_id": "card-item-002",
        "name": "Mana Potion",
        "description": "A shimmering blue potion that restores magical energy.",
        "type": "item",
        "rarity": "common",
        "imageUrl": "/cards/mana-potion.jpg",
        "effects": [
            {
                "type": "utility",
                "value": 15,
                "target": "self",
                "attribute": "mana"
            }
        ],
        "requirements": {
            "level": 1
        },
        "createdAt": new Date(),
        "updatedAt": new Date()
    },
    {
        "_id": "card-item-003",
        "name": "Greater Healing Potion",
        "description": "A powerful healing elixir that restores significant health.",
        "type": "item",
        "rarity": "rare",
        "healing": 50,
        "imageUrl": "/cards/greater-healing-potion.jpg",
        "effects": [
            {
                "type": "heal",
                "value": 50,
                "target": "self"
            }
        ],
        "requirements": {
            "level": 5
        },
        "createdAt": new Date(),
        "updatedAt": new Date()
    },
    {
        "_id": "card-item-004",
        "name": "Throwing Knife",
        "description": "A sharp, balanced blade perfect for throwing at enemies.",
        "type": "item",
        "rarity": "uncommon",
        "damage": 15,
        "imageUrl": "/cards/throwing-knife.jpg",
        "effects": [
            {
                "type": "damage",
                "value": 15,
                "target": "enemy"
            }
        ],
        "requirements": {
            "level": 2,
            "attributes": {
                "dexterity": 12
            }
        },
        "createdAt": new Date(),
        "updatedAt": new Date()
    },

    // Ability Cards
    {
        "_id": "card-ability-001",
        "name": "Swift Strike",
        "description": "A quick melee attack that bypasses armor.",
        "type": "ability",
        "rarity": "common",
        "damage": 20,
        "cooldown": 5,
        "imageUrl": "/cards/swift-strike.jpg",
        "effects": [
            {
                "type": "damage",
                "value": 20,
                "target": "enemy"
            }
        ],
        "requirements": {
            "level": 2,
            "attributes": {
                "dexterity": 14
            }
        },
        "createdAt": new Date(),
        "updatedAt": new Date()
    },
    {
        "_id": "card-ability-002",
        "name": "Defensive Stance",
        "description": "Increases armor and reduces incoming damage for a short time.",
        "type": "ability",
        "rarity": "uncommon",
        "duration": 10,
        "cooldown": 15,
        "imageUrl": "/cards/defensive-stance.jpg",
        "effects": [
            {
                "type": "buff",
                "value": 5,
                "target": "self",
                "duration": 10,
                "attribute": "armor"
            }
        ],
        "requirements": {
            "level": 3,
            "attributes": {
                "constitution": 15
            }
        },
        "createdAt": new Date(),
        "updatedAt": new Date()
    },
    {
        "_id": "card-ability-003",
        "name": "Berserker Rage",
        "description": "Increases attack damage but reduces defense for a short time.",
        "type": "ability",
        "rarity": "epic",
        "duration": 8,
        "cooldown": 25,
        "imageUrl": "/cards/berserker-rage.jpg",
        "effects": [
            {
                "type": "buff",
                "value": 10,
                "target": "self",
                "duration": 8,
                "attribute": "damage"
            },
            {
                "type": "debuff",
                "value": 5,
                "target": "self",
                "duration": 8,
                "attribute": "armor"
            }
        ],
        "requirements": {
            "level": 6,
            "attributes": {
                "strength": 18
            }
        },
        "createdAt": new Date(),
        "updatedAt": new Date()
    },

    // Enhancement Cards
    {
        "_id": "card-enhancement-001",
        "name": "Weapon Sharpening",
        "description": "Enhances your weapon to deal additional damage.",
        "type": "enhancement",
        "rarity": "common",
        "duration": 60,
        "imageUrl": "/cards/weapon-sharpening.jpg",
        "effects": [
            {
                "type": "buff",
                "value": 3,
                "target": "self",
                "duration": 60,
                "attribute": "weapon_damage"
            }
        ],
        "requirements": {
            "level": 2
        },
        "createdAt": new Date(),
        "updatedAt": new Date()
    },
    {
        "_id": "card-enhancement-002",
        "name": "Arcane Focus",
        "description": "Enhances magical abilities, reducing mana costs.",
        "type": "enhancement",
        "rarity": "rare",
        "duration": 120,
        "imageUrl": "/cards/arcane-focus.jpg",
        "effects": [
            {
                "type": "buff",
                "value": 2,
                "target": "self",
                "duration": 120,
                "attribute": "mana_efficiency"
            }
        ],
        "requirements": {
            "level": 4,
            "attributes": {
                "intelligence": 16
            }
        },
        "createdAt": new Date(),
        "updatedAt": new Date()
    },
    {
        "_id": "card-enhancement-003",
        "name": "Divine Blessing",
        "description": "A powerful blessing that enhances all abilities.",
        "type": "enhancement",
        "rarity": "legendary",
        "duration": 300,
        "imageUrl": "/cards/divine-blessing.jpg",
        "effects": [
            {
                "type": "buff",
                "value": 5,
                "target": "self",
                "duration": 300,
                "attribute": "all_stats"
            }
        ],
        "requirements": {
            "level": 8,
            "attributes": {
                "wisdom": 20,
                "charisma": 18
            }
        },
        "createdAt": new Date(),
        "updatedAt": new Date()
    }
];

// Insert cards into the collection
cardsData.forEach(card => {
    db.getCollection('cards').updateOne(
        { _id: card._id },
        { $set: card },
        { upsert: true }
    );
});

console.log(`Inserted ${cardsData.length} cards into the cards collection.`);

// Create some sample card collections for existing test characters
const cardCollectionsData = [
    {
        "playerId": "673f2b3df1a9b3a5e8c72f4e", // Saitcho's character ID (replace with actual ID)
        "cards": [
            { "cardId": "card-spell-001", "quantity": 3, "acquiredAt": new Date() },
            { "cardId": "card-spell-002", "quantity": 1, "acquiredAt": new Date() },
            { "cardId": "card-spell-003", "quantity": 2, "acquiredAt": new Date() },
            { "cardId": "card-item-001", "quantity": 5, "acquiredAt": new Date() },
            { "cardId": "card-item-002", "quantity": 3, "acquiredAt": new Date() },
            { "cardId": "card-ability-001", "quantity": 2, "acquiredAt": new Date() },
            { "cardId": "card-enhancement-001", "quantity": 1, "acquiredAt": new Date() }
        ],
        "updatedAt": new Date()
    }
];

// Insert sample collections
cardCollectionsData.forEach(collection => {
    db.getCollection('cardCollections').updateOne(
        { playerId: collection.playerId },
        { $set: collection },
        { upsert: true }
    );
});

console.log(`Created sample card collections.`);

// Create some sample decks
const playerDecksData = [
    {
        "playerId": "673f2b3df1a9b3a5e8c72f4e", // Saitcho's character ID (replace with actual ID)
        "name": "Combat Deck",
        "cards": [
            { "cardId": "card-spell-001", "quantity": 2, "position": 0 },
            { "cardId": "card-item-001", "quantity": 3, "position": 1 },
            { "cardId": "card-ability-001", "quantity": 1, "position": 2 },
            { "cardId": "card-enhancement-001", "quantity": 1, "position": 3 }
        ],
        "isActive": true,
        "maxSize": 30,
        "createdAt": new Date(),
        "updatedAt": new Date()
    },
    {
        "playerId": "673f2b3df1a9b3a5e8c72f4e", // Saitcho's character ID (replace with actual ID)
        "name": "Magic Deck",
        "cards": [
            { "cardId": "card-spell-001", "quantity": 1, "position": 0 },
            { "cardId": "card-spell-002", "quantity": 1, "position": 1 },
            { "cardId": "card-spell-003", "quantity": 2, "position": 2 },
            { "cardId": "card-item-002", "quantity": 3, "position": 3 }
        ],
        "isActive": false,
        "maxSize": 25,
        "createdAt": new Date(),
        "updatedAt": new Date()
    }
];

// Insert sample decks
playerDecksData.forEach(deck => {
    db.getCollection('playerDecks').insertOne(deck);
});

console.log(`Created sample player decks.`);
