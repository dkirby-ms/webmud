// MongoDB Playground
// Script to copy MongoDB data to Azure Cosmos DB for MongoDB or Azure Database for MongoDB

// Debug: print available variables
print("Available context variables:");
for (const key in this) {
  if (typeof this[key] !== 'function')
    print(`- ${key}: ${typeof this[key]}`);
}

// Get connection string - try different ways mongosh might expose it
let connectionString = "";

// Try different possible locations for the connection string
if (typeof uri !== 'undefined') {
  connectionString = uri;
  print("Found connection string in 'uri' variable");
} else if (typeof _uri !== 'undefined') {
  connectionString = _uri;
  print("Found connection string in '_uri' variable");
} else if (typeof db !== 'undefined' && db.getMongo && db.getMongo().getURI) {
  // Get from current database connection if available
  connectionString = db.getMongo().getURI();
  print("Found connection string from current database connection");
}

print("Connection string (partial for security):", 
      connectionString ? connectionString.substring(0, 10) + "..." : "Not found");

// Parse database name from connection string if available
let dbName = "game-service"; // Default database name
if (connectionString) {
  const dbNameMatch = connectionString.match(/\/([^/?]+)(\?|$)/);
  if (dbNameMatch && dbNameMatch[1]) {
    dbName = dbNameMatch[1];
    print(`Extracted database name: ${dbName}`);
  } else {
    print("Could not extract database name from connection string, using default");
  }
}

// Source database connection info
const sourceConfig = {
  url: "mongodb://localhost:27017",
  dbName: "game-service"
};

// Target database connection info
const targetConfig = {
  url: connectionString,
  dbName: dbName,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
};

// Print usage info if target URL is not provided
if (!targetConfig.url) {
  print("Debug: Connection string is empty or undefined");
  print("Usage: mongosh <mongodb-connection-string> --file copyDb.js");
  print("Example: mongosh mongodb://user:pass@host:port/dbname --file copyDb.js");
  quit(1);
}


// Connect to source database
const sourceConn = new Mongo(sourceConfig.url);
const sourceDB = sourceConn.getDB(sourceConfig.dbName);

// Connect to target database
const targetConn = new Mongo(targetConfig.url);
const targetDB = targetConn.getDB(targetConfig.dbName);

// Get all collections from source database - removed duplicate "rooms"
const collections = ["rooms", "channels", "characterSkills", "characterSpecies", "worlds"];

// Function to copy a collection from source to target
function copyCollection(collectionName) {
  // Get all documents from source collection
  const docs = sourceDB[collectionName].find().toArray();
  
  // Drop the collection in target database if it exists
  targetDB[collectionName].drop();
  
  // If there are documents to copy
  if (docs.length > 0) {
    // Insert all documents to target collection
    targetDB[collectionName].insertMany(docs);
    print(`Copied ${docs.length} documents from ${sourceConfig.dbName}.${collectionName} to ${targetConfig.dbName}.${collectionName}`);
  } else {
    print(`Collection ${collectionName} is empty, nothing to copy`);
  }
}

// Copy all collections
print(`Starting to copy database`);
collections.forEach(collection => {
  copyCollection(collection);
});

print(`Database copy completed from ${sourceConfig.dbName} to ${targetConfig.dbName}`);

// Close connections
sourceConn.close();
targetConn.close();

