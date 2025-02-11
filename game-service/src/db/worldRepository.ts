//// filepath: /home/saitcho/webmud/game-service/src/db/worldRepository.ts
import { Db, Collection, WithId, Document } from "mongodb";

export class WorldRepository {
  private worlds: Collection;

  constructor(db: Db) {
    this.worlds = db.collection("worlds");
    this.worlds.createIndex({ name: 1 }, { unique: true });
  }

  async getWorld(name: string): Promise<WithId<Document> | null> {
    const result = await this.worlds.findOne(
      { name }
    );
    return result;
  }
}