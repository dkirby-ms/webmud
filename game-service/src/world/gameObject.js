// Base class for game objects: items for inventories, consumables, weapons, armor, etc.
export class GameObject {
    /**
     * @param {Object} options - Options for creating a game object
     * @param {string} [options.id] - Unique identifier for the object
     * @param {string} [options.name='Unknown'] - Name of the object
     * @param {string} [options.description=''] - Description of the object
     * @param {string} [options.type='generic'] - Type or category (e.g., weapon, consumable, armor)
     * @param {number} [options.weight=0] - Weight of the object
     * @param {Object} [options.properties={}] - Additional properties (e.g., damage, defense)
     */
    constructor({ id, name = 'Unknown', description = '', type = 'generic', weight = 0, properties = {} } = {}) {
        this.id = id || GameObject.generateUniqueId();
        this.name = name;
        this.description = description;
        this.type = type;
        this.weight = weight;
        this.properties = properties;
    }

    /**
     * Use the object on a target. By default, it just logs the action.
     * Override this method in subclasses for special behavior.
     * @param {any} target - The target of the action (e.g., character, environment)
     */
    use(target) {
        console.log(`${this.name} has been used on ${target}.`);
    }

    /**
     * Provides a string representation of the object.
     * @returns {string} Description of the object.
     */
    inspect() {
        return `${this.name}: ${this.description}`;
    }

    /**
     * Generates a simple unique ID for the object.
     * @returns {string} A unique identifier.
     */
    static generateUniqueId() {
        return 'obj-' + Math.random().toString(36).substr(2, 9);
    }
}
