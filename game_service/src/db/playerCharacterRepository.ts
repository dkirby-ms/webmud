import { Db, Collection, WithId, Document, ObjectId } from "mongodb";

export class PlayerCharacterRepository {
  private characters: Collection;

  constructor(db: Db) {
    this.characters = db.collection("playerCharacters");

  }

  // Fetch a character by its player_id and worldId
  async getCharacterByWorldId(playerId: string, worldId: string): Promise<WithId<Document> | null> {
    return await this.characters.findOne({ player_id: playerId, world_id: worldId }) as WithId<Document>;
  }

  async getCharacterById(playerId: string): Promise<WithId<Document> | null> {
    return await this.characters.findOne({ _id: new ObjectId(playerId) }) as WithId<Document>;
  }

  // List all characters belonging to a given world.
  async listCharactersForUser(userId: string): Promise<WithId<Document>[]> {
    return await this.characters.find({ userId }).toArray();
  }

  // List characters for user with aggregated species and world details
  async listCharactersForUserWithDetails(userId: string): Promise<WithId<Document>[]> {
    const results = await this.characters.aggregate([
      { $match: { userId: userId } },
      { $lookup: {
        from: "characterSpecies",
        localField: "species",
        foreignField: "_id",
        as: "speciesData"
      }},
      { $unwind: "$speciesData" },
      { $addFields: { 
        speciesName: "$speciesData.name",
        worldObjectId: { $toObjectId: "$worldId" }
      }},
      { $project: { speciesData: 0 } },
      { $lookup: {
        from: "worlds",
        localField: "worldObjectId",
        foreignField: "_id",
        as: "worldData"
      }},
      { $unwind: "$worldData" },
      { $addFields: { worldName: "$worldData.name", worldUrl: "$worldData.url" } },
      { $project: { worldData: 0, worldObjectId: 0 } }
    ]).toArray();
    return results as WithId<Document>[];
  }

  // Create a new character document.
  async createCharacter(character: {
    user_id: string
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
