//// filepath: /home/saitcho/webmud/game-service/src/db/worldRepository.ts
import { Db, Collection, WithId, Document } from "mongodb";

export class WorldRepository {
  private worlds: Collection;

  constructor(db: Db) {
    this.worlds = db.collection("worlds");
  }

  async getWorld(name: string): Promise<WithId<Document> | null> {
    const result = await this.worlds.findOne(
      { name }
    );
    return result;
  }

  // List all active worlds
  async listActiveWorlds(): Promise<WithId<Document>[]> {
    return await this.worlds.find({ "properties.is_active": true }).toArray();
  }
}