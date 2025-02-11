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

    constructor(doc: WithId<Document>, repositories: Repositories) {
        // first check if world exists or not. 
        this.name = doc.name
        this.id = doc._id.toHexString();
        this.repositories = repositories;
        this.loadRooms().then((rooms) => {
            this.rooms = rooms;
        });
        }

        private loadRooms(): Promise<WithId<Document>[]> {
            return this.repositories.roomRepository.listRoomsForWorld(this.id);
        }

    private loadEntities(): void {
        // load entities from db
    }

}
