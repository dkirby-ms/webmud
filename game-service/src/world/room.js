export class Room {
    constructor(id, description, exits = {}) {
        this.id = id;
        this.description = description;
        this.exits = exits; // Object mapping directions to room IDs, e.g., { north: 'room2' }
        this.entities = []; // Array of entities (players, NPCs, etc.) currently in the room
        this.items = [];    // Array of items available in the room
    }

    // Add an item to the room
    addItem(item) {
        this.items.push(item);
    }

    // Remove an item from the room by its id and return it, if found
    removeItem(itemId) {
        const index = this.items.findIndex((item) => item.id === itemId);
        if (index !== -1) {
            return this.items.splice(index, 1)[0];
        }
        return null;
    }

    // Add an entity to the room
    addEntity(entity) {
        this.entities.push(entity);
    }

    // Remove an entity from the room by its id and return the entity object, if found
    removeEntity(entityId) {
        const index = this.entities.findIndex((entity) => entity.id === entityId);
        if (index !== -1) {
            return this.entities.splice(index, 1)[0];
        }
        return null;
    }

    // Get the room id in a specific direction
    getExit(direction) {
        return this.exits[direction];
    }

    // Add an exit to the room in a certain direction
    addExit(direction, roomId) {
        this.exits[direction] = roomId;
    }
}
