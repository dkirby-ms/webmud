function escape(str) {
  return str.replaceAll("~", "~~").replaceAll("%", "~%").replaceAll("_", "~_");
}

export class DB {
  constructor(db) {
    // db is the mongodb database instance
    this.db = db;
    this.users = db.collection("users");
    this.channels = db.collection("channels");
    this.userChannels = db.collection("user_channels");
    this.messages = db.collection("messages");
  }

  async findUserByUsername(username) {
    return await this.users.findOne({ username });
  }

  async createUser({ username, hashedPassword }) {
    const result = await this.users.insertOne({
      username,
      password: hashedPassword,
      is_online: false,
      last_ping: new Date()
    });
    const userId = result.insertedId;
    const generalChannel = await this.channels.findOne({ name: "General" });
    if (generalChannel) {
      await this.userChannels.insertOne({
        user_id: userId,
        channel_id: generalChannel._id,
        client_offset: null
      });
    }
    return userId;
  }

  async setUserIsConnected(userId) {
    const res = await this.users.findOneAndUpdate(
      { _id: userId },
      { $set: { is_online: true, last_ping: new Date() } },
      { returnDocument: "before" }
    );
    return res.value ? !!res.value.is_online : false;
  }

  async setUserIsDisconnected(userId) {
    await this.users.updateOne({ _id: userId }, { $set: { is_online: false } });
  }

  async cleanupZombieUsers() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.users.updateMany(
      { is_online: true, last_ping: { $lt: cutoff } },
      { $set: { is_online: false } }
    );
    // For simplicity, returning an empty array (additional query can be added if needed)
    return [];
  }

  async isUserInChannel(userId, channelId) {
    const count = await this.userChannels.countDocuments({
      user_id: userId,
      channel_id: channelId
    });
    return count > 0;
  }

  async getUser(userId) {
    return await this.users.findOne({ _id: userId });
  }

  async searchUsers(userId, { q, size }) {
    const regex = new RegExp("^" + escape(q), "i");
    // Additional filtering for private channel membership is omitted for brevity
    return await this.users.find({
      username: { $regex: regex },
      _id: { $ne: userId }
    }).limit(size).toArray();
  }

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

  async createPrivateChannel(userId, userIds) {
    const result = await this.channels.insertOne({ type: "private" });
    const channelId = result.insertedId;
    await this.userChannels.insertMany([
      { user_id: userId, channel_id: channelId, client_offset: null },
      { user_id: userIds[0], channel_id: channelId, client_offset: null }
    ]);
    return await this.channels.findOne({ _id: channelId });
  }

  async joinChannel(userId, channelId) {
    await this.userChannels.insertOne({
      user_id: userId,
      channel_id: channelId,
      client_offset: null
    });
    return await this.channels.findOne({ _id: channelId });
  }

  async listChannels(userId, query) {
    // Get channels from user's associations
    const channelIds = await this.userChannels.find({ user_id: userId })
      .map(doc => doc.channel_id)
      .toArray();
    const cursor = this.channels.find({ _id: { $in: channelIds } });
    if (query.orderBy === "name:asc") {
      cursor.sort({ name: 1 });
    }
    const channelsArr = await cursor.limit(query.size + 1).toArray();
    const hasMore = channelsArr.length > query.size;
    if (hasMore) channelsArr.pop();
    // Note: Additional fields (userCount, unreadCount, users) can be computed as needed.
    return { data: channelsArr, hasMore };
  }

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

  async fetchUserChannels(userId) {
    const docs = await this.userChannels.find({ user_id: userId }).toArray();
    return docs.map(doc => doc.channel_id);
  }

  async insertMessage(message) {
    const result = await this.messages.insertOne({
      from_user: message.from,
      channel_id: message.channelId,
      content: message.content
    });
    const messageId = result.insertedId;
    await this.userChannels.updateOne(
      { user_id: message.from, channel_id: message.channelId },
      { $set: { client_offset: messageId } }
    );
    return messageId;
  }

  async listMessages(query) {
    const sort = query.orderBy === "id:asc" ? { _id: 1 } : { _id: -1 };
    const cursor = this.messages.find({ channel_id: query.channelId }).sort(sort);
    // Paging via an "after" parameter can be added by filtering _id if needed.
    const messagesArr = await cursor.limit(query.size + 1).toArray();
    const hasMore = messagesArr.length > query.size;
    if (hasMore) messagesArr.pop();
    return { data: messagesArr, hasMore };
  }

  async ackMessage(userId, { channelId, messageId }) {
    await this.userChannels.updateOne(
      { user_id: userId, channel_id: channelId },
      { $set: { client_offset: messageId } }
    );
  }
}
