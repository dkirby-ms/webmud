import { Db, Collection, WithId, Document, ObjectId } from "mongodb";

export class RoomRepository {
  private rooms: Collection;

  constructor(db: Db) {
    this.rooms = db.collection("rooms");
    // Create a unique index on room_id and an index for worldId for faster lookups.
    this.rooms.createIndex({ room_id: 1 }, { unique: true });
    this.rooms.createIndex({ worldId: 1 });
  }

  // Fetch a room by its room_id
  async getRoom(roomId: string): Promise<WithId<Document> | null> {
    return await this.rooms.findOne({ room_id: roomId });
  }

  // List all rooms belonging to a given world.
  async listRoomsForWorld(worldId: string): Promise<WithId<Document>[]> {
    return await this.rooms.find({ worldId }).toArray();
  }

  // Create a new room document.
  async createRoom(room: {
    room_id: string;
    name: string;
    description: string;
    properties: Record<string, any>;
    exits: Record<string, any>;
    worldId: string;
  }): Promise<WithId<Document>> {
    const result = await this.rooms.insertOne(room);
    return await this.rooms.findOne({ _id: result.insertedId }) as WithId<Document>;
  }

  // Update an existing room by room_id.
  async updateRoom(roomId: string, update: Partial<Omit<Document, "_id">>): Promise<boolean> {
    const result = await this.rooms.updateOne({ room_id: roomId }, { $set: update });
    return result.modifiedCount > 0;
  }

  // Delete a room by room_id.
  async deleteRoom(roomId: string): Promise<boolean> {
    const result = await this.rooms.deleteOne({ room_id: roomId });
    return result.deletedCount === 1;
  }
}