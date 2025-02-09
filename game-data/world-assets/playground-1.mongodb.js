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

// Insert a few documents into the sales collection.
db.getCollection('rooms').insertMany([
    {
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
]);

// Run a find command to view items sold on April 4th, 2014.
// const salesOnApril4th = db.getCollection('sales').find({
//   date: { $gte: new Date('2014-04-04'), $lt: new Date('2014-04-05') }
// }).count();

// // Print a message to the output window.
// console.log(`${salesOnApril4th} sales occurred in 2014.`);

// // Here we run an aggregation and open a cursor to the results.
// // Use '.toArray()' to exhaust the cursor to return the whole result set.
// // You can use '.hasNext()/.next()' to iterate through the cursor page by page.
// db.getCollection('sales').aggregate([
//   // Find all of the sales that occurred in 2014.
//   { $match: { date: { $gte: new Date('2014-01-01'), $lt: new Date('2015-01-01') } } },
//   // Group the total sales for each product.
//   { $group: { _id: '$item', totalSaleAmount: { $sum: { $multiply: [ '$price', '$quantity' ] } } } }
// ]);
