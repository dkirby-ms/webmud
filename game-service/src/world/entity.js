export class Entity {
    constructor(id, name, options = {}) {
        this.id = id;
        this.name = name;
        this.position = options.position || { x: 0, y: 0 };
        this.health = options.health || 100;
    }

    move(dx, dy) {
        this.position.x += dx;
        this.position.y += dy;
    }

    takeDamage(amount) {
        this.health = Math.max(this.health - amount, 0);
    }

    isAlive() {
        return this.health > 0;
    }
}
