//// filepath: /home/saitcho/webmud/game-service/src/db/userRepository.ts
import { Db, Collection, ObjectId, WithId, Document } from "mongodb";

interface CreateUserInput {
  username: string;
  hashedPassword: string;
}

export class UserRepository {
  private users: Collection;
  private userChannels: Collection;
  private channels: Collection;

  constructor(db: Db) {
    // Use an index on username for uniqueness.
    this.users = db.collection("users");
    //this.users.createIndex({ username: 1 }, { unique: true });
    this.userChannels = db.collection("user_channels");
    this.channels = db.collection("channels");
  }

  async findUserByUsername(username: string): Promise<WithId<Document> | null> {
    return await this.users.findOne({ username });
  }

  async createUser(input: CreateUserInput): Promise<ObjectId> {
    const result = await this.users.insertOne({
      username: input.username,
      password: input.hashedPassword,
      is_online: false,
      last_ping: new Date()
    });
    const userId = result.insertedId;
    // Associate the new user with the "General" channel if it exists.
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

  async setUserIsConnected(userId: ObjectId): Promise<boolean> {
    const res = await this.users.findOneAndUpdate(
      { _id: userId },
      { $set: { is_online: true, last_ping: new Date() } },
      { returnDocument: "before", upsert: true }
    );
    return res?.value ? !!res.value.is_online : false;
  }

  async setUserIsDisconnected(userId: ObjectId): Promise<void> {
    await this.users.updateOne({ _id: userId }, { $set: { is_online: false } });
  }

  async cleanupZombieUsers(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.users.updateMany(
      { is_online: true, last_ping: { $lt: cutoff } },
      { $set: { is_online: false } }
    );
  }

  async getUser(userId: ObjectId): Promise<WithId<Document> | null> {
    return await this.users.findOne({ _id: userId });
  }

  async searchUsers(userId: ObjectId, q: string, size: number): Promise<WithId<Document>[]> {
    // Import escape function from utils.
    const { escape } = await import("./utils.js");
    const regex = new RegExp("^" + escape(q), "i");
    return await this.users.find({
      username: { $regex: regex },
      _id: { $ne: userId }
    }).limit(size).toArray();
  }
}