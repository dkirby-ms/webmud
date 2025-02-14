import { Db, Collection, WithId, Document } from "mongodb";

export class CharacterSkillsRepository {
  private skills: Collection;

  constructor(db: Db) {
    this.skills = db.collection("characterSkills");
  }

  // Fetch a skill by its skill_id.
  async getSkill(skillId: string): Promise<WithId<Document> | null> {
    return await this.skills.findOne({ skill_id: skillId });
  }

  // List all skills.
  async listSkills(): Promise<WithId<Document>[]> {
    return await this.skills.find({}).toArray();
  }

  // Create a new skill document.
  async createSkill(skill: {
    skill_id: string;
    name: string;
    description: string;
  }): Promise<WithId<Document>> {
    const result = await this.skills.insertOne(skill);
    return await this.skills.findOne({ _id: result.insertedId }) as WithId<Document>;
  }

  // Update an existing skill by skill_id.
  async updateSkill(skillId: string, update: Partial<Omit<Document, "_id">>): Promise<boolean> {
    const result = await this.skills.updateOne({ skill_id: skillId }, { $set: update });
    return result.modifiedCount > 0;
  }

  // Delete a skill by skill_id.
  async deleteSkill(skillId: string): Promise<boolean> {
    const result = await this.skills.deleteOne({ skill_id: skillId });
    return result.deletedCount === 1;
  }
}
