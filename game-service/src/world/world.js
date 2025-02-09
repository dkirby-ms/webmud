
export class World {
    constructor(name, db) {
        // first check if world exists or not. 
        
        this.name = name;
        this.entities = [];
        this.rooms = {};
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    removeEntity(entity) {
        this.entities = this.entities.filter(e => e !== entity);
    }

    addRoom(roomName, roomData) {
        this.rooms[roomName] = roomData;
    }

    getRoom(roomName) {
        return this.rooms[roomName];
    }

    update() {
        this.entities.forEach(entity => {
            if (typeof entity.update === 'function') {
                entity.update();
            }
        });
    }
}
