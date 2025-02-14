import { Db, Collection, WithId, Document } from "mongodb";

export class CharacterSpeciesRepository {
  private species: Collection;

  constructor(db: Db) {
    this.species = db.collection("characterSpecies");
  }

  // Fetch a species by its race_id.
  async getSpecies(raceId: string): Promise<WithId<Document> | null> {
    return await this.species.findOne({ race_id: raceId });
  }

  // List all species.
  async listSpecies(): Promise<WithId<Document>[]> {
    return await this.species.find({}).toArray();
  }

  // Create a new species document.
  async createSpecies(species: {
    race_id: string;
    base_speed: number;
    default_attributes: {
      base_stats: {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
      }
    };
    description: string;
    name: string;
    size: string;
  }): Promise<WithId<Document>> {
    const result = await this.species.insertOne(species);
    return await this.species.findOne({ _id: result.insertedId }) as WithId<Document>;
  }

  // Update an existing species by race_id.
  async updateSpecies(raceId: string, update: Partial<Omit<Document, "_id">>): Promise<boolean> {
    const result = await this.species.updateOne({ race_id: raceId }, { $set: update });
    return result.modifiedCount > 0;
  }

  // Delete a species by race_id.
  async deleteSpecies(raceId: string): Promise<boolean> {
    const result = await this.species.deleteOne({ race_id: raceId });
    return result.deletedCount === 1;
  }
}
