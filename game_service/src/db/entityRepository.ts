import { Db, Collection, WithId, Document, ObjectId } from "mongodb";

export class EntityRepository {
    private entities: Collection;

    constructor(db: Db) {
        this.entities = db.collection("entities");
    }  

    async getEntity(entityId: string): Promise<WithId<Document> | null> {
        return await this.entities.findOne({ entity_id: entityId });
    }

    async listEntitiesForWorld(worldId: string): Promise<WithId<Document>[]> {
        return await this.entities.find({ world_id: worldId }).toArray();
    }

}