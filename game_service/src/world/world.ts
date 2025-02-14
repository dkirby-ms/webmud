import { nextTick } from "process";
import { Repositories } from "../db/index.js";
import { Db, Collection, ObjectId, WithId, Document } from "mongodb";

interface Entity {
    update?(): void;
}

export class World {
    name: string;
    id: string;
    repositories: Repositories
    rooms: WithId<Document>[] = [];
    entities: WithId<Document>[] = [];

    constructor(doc: WithId<Document>, repositories: Repositories) {
        // first check if world exists or not. 
        this.name = doc.name
        this.id = doc._id.toHexString();
        this.repositories = repositories;
        
    }

    private loadRooms(): Promise<WithId<Document>[]> {
        return this.repositories.roomRepository.listRoomsForWorld(this.id);
    }

    private loadEntities(): Promise<WithId<Document>[]> {
        return this.repositories.entityRepository.listEntitiesForWorld(this.id);
    }

    public async start(): Promise<void> {
        this.rooms = await this.loadRooms();
        this.entities = await this.loadEntities();
        

        // loop 
        
    }

}
