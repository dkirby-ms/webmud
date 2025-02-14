//// filepath: /home/saitcho/webmud/game-service/src/db/channelRepository.ts
import { Db, Collection, ObjectId, WithId, Document } from "mongodb";

export class ChannelRepository {
  private channels: Collection;
  private userChannels: Collection;

  constructor(db: Db) {
    this.channels = db.collection("channels");
    this.userChannels = db.collection("user_channels");
  }

  async createPublicChannel(userId: ObjectId, name: string): Promise<WithId<Document> | null> {
    const result = await this.channels.insertOne({ name, type: "public" });
    const channelId = result.insertedId;
    await this.userChannels.insertOne({
      user_id: userId,
      channel_id: channelId,
      client_offset: null
    });
    return await this.channels.findOne({ _id: channelId });
  }

  async isUserInChannel(userId: ObjectId, channelId: ObjectId): Promise<boolean> {
    const userChannel = await this.userChannels.findOne({ user_id: userId, channel_id: channelId });
    return !!userChannel;
  }

  async createPrivateChannel(userId: ObjectId, otherUserId: ObjectId): Promise<WithId<Document> | null> {
    const result = await this.channels.insertOne({ type: "private" });
    const channelId = result.insertedId;
    await this.userChannels.insertMany([
      { user_id: userId, channel_id: channelId, client_offset: null },
      { user_id: otherUserId, channel_id: channelId, client_offset: null }
    ]);
    return await this.channels.findOne({ _id: channelId });
  }

  async joinChannel(userId: ObjectId, channelId: ObjectId): Promise<WithId<Document> | null> {
    await this.userChannels.insertOne({
      user_id: userId,
      channel_id: channelId,
      client_offset: null
    });
    return await this.channels.findOne({ _id: channelId });
  }

  async listChannels(userId: ObjectId, orderBy: string, size: number): Promise<{ data: WithId<Document>[]; hasMore: boolean }> {
    // Get channel IDs associated with the user.
    const channelIds = await this.userChannels.find({ user_id: userId })
      .map(doc => doc.channel_id)
      .toArray();
    const cursor = this.channels.find({ _id: { $in: channelIds } });
    if (orderBy === "name:asc") {
      cursor.sort({ name: 1 });
    }
    const channelsArr = await cursor.limit(size + 1).toArray();
    const hasMore = channelsArr.length > size;
    if (hasMore) channelsArr.pop();
    return { data: channelsArr, hasMore };
  }

  async searchChannels(userId: ObjectId, q: string, size: number): Promise<WithId<Document>[]> {
    // Import escape helper.
    const { escape } = await import("./utils.js");
    const userChannelIds = await this.userChannels.find({ user_id: userId })
      .map(doc => doc.channel_id)
      .toArray();
    const regex = new RegExp("^" + escape(q), "i");
    return await this.channels.find({
      name: { $regex: regex },
      _id: { $nin: userChannelIds }
    }).limit(size).toArray();
  }

  async fetchUserChannels(userId: ObjectId): Promise<ObjectId[]> {
    const docs = await this.userChannels.find({ user_id: userId }).toArray();
    return docs.map(doc => doc.channel_id);
  }
}