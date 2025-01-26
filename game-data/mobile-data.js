const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function loadMobileData() {
    try {
        await client.connect();
        const database = client.db('local');
        const collection = database.collection('mobile-data');

        // Load YAML file
        const filePath = path.join(__dirname, '../world-assets/mobile.yml');
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const mobileData = yaml.parse(fileContents);

        // Insert data into MongoDB
        await collection.insertMany(mobileData.mob);
        console.log('Mobile data inserted successfully');
    } catch (error) {
        console.error('Error inserting mobile data:', error);
    } finally {
        await client.close();
    }
}

loadMobileData();