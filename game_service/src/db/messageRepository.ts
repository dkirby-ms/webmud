//// filepath: /home/saitcho/webmud/game-service/src/db/messageRepository.ts
import { Db, Collection, ObjectId, WithId, Document } from "mongodb";

interface MessageInput {
  from: ObjectId;
  channelId: ObjectId;
  content: string;
}

export class MessageRepository {
  private messages: Collection;
  private userChannels: Collection;

  constructor(db: Db) {
    this.messages = db.collection("messages");
    this.userChannels = db.collection("user_channels");
  }

  async insertMessage(message: MessageInput): Promise<ObjectId> {
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

  async listMessages(channelId: ObjectId, orderBy: string, size: number): Promise<{ data: WithId<Document>[]; hasMore: boolean }> {
    const sort: { _id: 1 | -1 } = orderBy === "id:asc" ? { _id: 1 } : { _id: -1 };
    const cursor = this.messages.find({ channel_id: channelId }).sort(sort);
    const messagesArr = await cursor.limit(size + 1).toArray();
    const hasMore = messagesArr.length > size;
    if (hasMore) messagesArr.pop();
    return { data: messagesArr, hasMore };
  }

  async ackMessage(userId: ObjectId, channelId: ObjectId, messageId: ObjectId): Promise<void> {
    await this.userChannels.updateOne(
      { user_id: userId, channel_id: channelId },
      { $set: { client_offset: messageId } }
    );
  }
}