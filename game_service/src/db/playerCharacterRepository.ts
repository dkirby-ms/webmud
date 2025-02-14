import { Db, Collection, WithId, Document } from "mongodb";

export class PlayerCharacterRepository {
  private characters: Collection;

  constructor(db: Db) {
    this.characters = db.collection("playerCharacters");

  }

  // Fetch a character by its player_id
  async getCharacter(playerId: string): Promise<WithId<Document> | null> {
    return await this.characters.findOne({ player_id: playerId });
  }

  // List all characters belonging to a given world.
  async listCharactersForUser(userId: string): Promise<WithId<Document>[]> {
    return await this.characters.find({ userId }).toArray();
  }

  // Create a new character document.
  async createCharacter(character: {
    player_id: string;
    name: string;
    description: string;
    attributes: Record<string, any>;
    inventory: Record<string, any>;
    worldId: string;
  }): Promise<WithId<Document>> {
    const result = await this.characters.insertOne(character);
    return await this.characters.findOne({ _id: result.insertedId }) as WithId<Document>;
  }

  // Update an existing character by player_id.
  async updateCharacter(playerId: string, update: Partial<Omit<Document, "_id">>): Promise<boolean> {
    const result = await this.characters.updateOne({ player_id: playerId }, { $set: update });
    return result.modifiedCount > 0;
  }

  // Delete a character by player_id.
  async deleteCharacter(playerId: string): Promise<boolean> {
    const result = await this.characters.deleteOne({ player_id: playerId });
    return result.deletedCount === 1;
  }
}
