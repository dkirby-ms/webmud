// MongoDB database name and collection name constants.
const MONGODB_NAME = "game-service";
const MONGO_SOCKET_ADAPTER_COLLECTION = "socket.io-adapter";

// Helper function to escape special characters used in search queries.
function escape(str) {
  return str.replaceAll("~", "~~").replaceAll("%", "~%").replaceAll("_", "~_");
}

// Sets up the MongoDB connection, creates a capped collection for socket.io adapter,
// and returns an instance of the DB class.
export async function setupMongoDB(mongoClient, logger) {
  // Connect to the database.
  await mongoClient.connect();
  logger.info("Connected to MongoDB");

  // Try to create a capped collection used by the socket.io adapter for scaling.
  try {
    await mongoClient.db(MONGODB_NAME).createCollection(MONGO_SOCKET_ADAPTER_COLLECTION, {
      capped: true,
      size: 1e6
    });
    logger.info("MongoDB collection created");
  } catch (e) {
    // If the collection exists, log the information.
    logger.info("Collection already exists");
  }
  // Create a new instance of DB and return it.
  const db = new DB(mongoClient.db(MONGODB_NAME));
  return db;
}

// The DB class wraps MongoDB collections and provides methods to interact with them.
export class DB {
  constructor(db) {
    // Store the mongodb database instance.
    this.db = db;
    // Initialize various collections.
    this.users = db.collection("users");
    this.channels = db.collection("channels");
    this.userChannels = db.collection("user_channels");
    this.messages = db.collection("messages");
  }

  // Find and return a user document by their username.
  async findUserByUsername(username) {
    return await this.users.findOne({ username });
  }

  // Create a new user with the given username and hashed password.
  // Also adds the user to the "General" channel if it exists.
  async createUser({ username, hashedPassword }) {
    const result = await this.users.insertOne({
      username,
      password: hashedPassword,
      is_online: false,
      last_ping: new Date()
    });
    const userId = result.insertedId;
    // Look up the "General" channel.
    const generalChannel = await this.channels.findOne({ name: "General" });
    if (generalChannel) {
      // Associate the new user with the "General" channel.
      await this.userChannels.insertOne({
        user_id: userId,
        channel_id: generalChannel._id,
        client_offset: null
      });
    }
    return userId;
  }

  // Update the user's document to mark them as connected,
  // setting a flag and updating the last ping timestamp.

  async setUserIsConnected(userId) {
    const res = await this.users.findOneAndUpdate(
      { _id: userId },
      { $set: { is_online: true, last_ping: new Date() } },
      { returnDocument: "before", upsert: true } // Return previous state
    );
    // Return true/false based on previous state, if needed.
    return res ? !!res.is_online : false;
  }

  // Update the user's document to mark them as disconnected.
  async setUserIsDisconnected(userId) {
    await this.users.updateOne({ _id: userId }, { $set: { is_online: false } });
  }

  // Mark users as zombie (inactive) if their last ping was older than 24 hours,
  // and return an array if needed (here, an empty array is returned for simplicity).
  async cleanupZombieUsers() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.users.updateMany(
      { is_online: true, last_ping: { $lt: cutoff } },
      { $set: { is_online: false } }
    );
    return [];
  }

  // Check if a specific user is already associated with the given channel.
  async isUserInChannel(userId, channelId) {
    const count = await this.userChannels.countDocuments({
      user_id: userId,
      channel_id: channelId
    });
    return count > 0;
  }

  // Retrieve a single user document by its _id.
  async getUser(userId) {
    return await this.users.findOne({ _id: userId });
  }

  // Search for users by a query string, excluding the current user,
  // and limiting results to a specified size.
  async searchUsers(userId, { q, size }) {
    const regex = new RegExp("^" + escape(q), "i");
    return await this.users.find({
      username: { $regex: regex },
      _id: { $ne: userId }
    }).limit(size).toArray();
  }

  // Create a new public channel with the specified name
  // and associate the creating user with that channel.
  async createPublicChannel(userId, { name }) {
    const result = await this.channels.insertOne({ name, type: "public" });
    const channelId = result.insertedId;
    await this.userChannels.insertOne({
      user_id: userId,
      channel_id: channelId,
      client_offset: null
    });
    return await this.channels.findOne({ _id: channelId });
  }

  // Create a new private channel for the specified users.
  // This example assumes a private channel is between two users.
  async createPrivateChannel(userId, userIds) {
    const result = await this.channels.insertOne({ type: "private" });
    const channelId = result.insertedId;
    await this.userChannels.insertMany([
      { user_id: userId, channel_id: channelId, client_offset: null },
      { user_id: userIds[0], channel_id: channelId, client_offset: null }
    ]);
    return await this.channels.findOne({ _id: channelId });
  }

  // Associate a user with an existing channel (join the channel).
  async joinChannel(userId, channelId) {
    await this.userChannels.insertOne({
      user_id: userId,
      channel_id: channelId,
      client_offset: null
    });
    return await this.channels.findOne({ _id: channelId });
  }

  // Retrieve a list of channels that a user is associated with,
  // applying optional pagination and sort order based on the query.
  async listChannels(userId, query) {
    // First, get the IDs for channels associated with the user.
    const channelIds = await this.userChannels.find({ user_id: userId })
      .map(doc => doc.channel_id)
      .toArray();
    const cursor = this.channels.find({ _id: { $in: channelIds } });
    // Optionally sort channels by name ascending.
    if (query.orderBy === "name:asc") {
      cursor.sort({ name: 1 });
    }
    // Fetch one extra document to determine if there are more results.
    const channelsArr = await cursor.limit(query.size + 1).toArray();
    const hasMore = channelsArr.length > query.size;
    if (hasMore) channelsArr.pop(); // Remove the extra document.
    return { data: channelsArr, hasMore };
  }

  // Search for channels that the user is not already a member of,
  // matching a name that starts with a given query string.
  async searchChannels(userId, { q, size }) {
    const userChannelIds = await this.userChannels.find({ user_id: userId })
      .map(doc => doc.channel_id)
      .toArray();
    const regex = new RegExp("^" + escape(q), "i");
    return await this.channels.find({
      name: { $regex: regex },
      _id: { $nin: userChannelIds }
    }).limit(size).toArray();
  }

  // Retrieve the list of channel IDs that the user is associated with.
  async fetchUserChannels(userId) {
    const docs = await this.userChannels.find({ user_id: userId }).toArray();
    return docs.map(doc => doc.channel_id);
  }

  // Insert a message into the messages collection.
  // Also update the user's latest message offset for the channel.
  async insertMessage(message) {
    // Add the message.
    const result = await this.messages.insertOne({
      from_user: message.from,
      channel_id: message.channelId,
      content: message.content
    });
    const messageId = result.insertedId;
    // Update the client offset for the user in that channel.
    await this.userChannels.updateOne(
      { user_id: message.from, channel_id: message.channelId },
      { $set: { client_offset: messageId } }
    );
    return messageId;
  }

  // Retrieve a paginated list of messages for a channel.
  // Sorting is applied based on the "orderBy" value; paging using limit and extra fetch.
  async listMessages(query) {
    // Set sort direction based on orderBy parameter.
    const sort = query.orderBy === "id:asc" ? { _id: 1 } : { _id: -1 };
    const cursor = this.messages.find({ channel_id: query.channelId }).sort(sort);
    // Fetch one extra document to check if there are more messages.
    const messagesArr = await cursor.limit(query.size + 1).toArray();
    const hasMore = messagesArr.length > query.size;
    if (hasMore) messagesArr.pop(); // Remove extra document.
    return { data: messagesArr, hasMore };
  }

  // Acknowledge receipt of a message by updating the userChannels record
  // for a user in a channel with the latest message ID.
  async ackMessage(userId, { channelId, messageId }) {
    await this.userChannels.updateOne(
      { user_id: userId, channel_id: channelId },
      { $set: { client_offset: messageId } }
    );
  }
}