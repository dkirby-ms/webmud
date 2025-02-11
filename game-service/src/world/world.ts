interface Entity {
    update?(): void;
}

export class World {
    name: string;
    entities: Entity[];
    rooms: Record<string, any>;

    constructor(name: string, db: any /* unused db parameter, adjust as needed */) {
        // first check if world exists or not. 
        
        this.name = name;
        this.entities = [];
        this.rooms = {};
    }

    addEntity(entity: Entity): void {
        this.entities.push(entity);
    }

    removeEntity(entity: Entity): void {
        this.entities = this.entities.filter(e => e !== entity);
    }

    addRoom(roomName: string, roomData: any): void {
        this.rooms[roomName] = roomData;
    }

    getRoom(roomName: string): any {
        return this.rooms[roomName];
    }

    update(): void {
        this.entities.forEach(entity => {
            if (typeof entity.update === 'function') {
                entity.update();
            }
        });
    }
}
