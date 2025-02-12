import { Db, Collection, WithId, Document, ObjectId } from "mongodb";

export class EntityRepository {
    private entities: Collection;

    constructor(db: Db) {
        this.entities = db.collection("entities");
        this.entities.createIndex({ entity_id: 1 }, { unique: true });
        this.entities.createIndex({ worldId: 1 });
    }  

    async getEntity(entityId: string): Promise<WithId<Document> | null> {
        return await this.entities.findOne({ entity_id: entityId });
    }

    async listEntitiesForWorld(worldId: string): Promise<WithId<Document>[]> {
        return await this.entities.find({ worldId }).toArray();
    }

    async createEntity(entity: {
        entity_id: string;
        name: string;
        description: string;
        properties: Record<string, any>;
        exits: Record<string, any>;
        worldId: string;
    }): Promise<WithId<Document>> {
        const result = await this.entities.insertOne(entity);
        return await this.entities.findOne({ _id: result.insertedId }) as WithId<Document>;
    }

    async updateEntity(entityId: string, update: Partial<Omit<Document, "_id">>): Promise<boolean> {
        const result = await this.entities.updateOne({ entity_id: entityId }, { $set: update });
        return result.modifiedCount > 0;
    }

    async deleteEntity(entityId: string): Promise<boolean> {
        const result = await this.entities.deleteOne({ entity_id: entityId });
        return result.deletedCount === 1;
    }
}