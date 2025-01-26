class GameEvent {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}

class EventManager {
    constructor() {
        this.listeners = {};
    }

    addListener(eventType, listener) {
        if (!this.listeners[eventType]) {
            this.listeners[eventType] = [];
        }
        this.listeners[eventType].push(listener);
    }

    async triggerEvent(event) {
        if (this.listeners[event.type]) {
            for (const listener of this.listeners[event.type]) {
                await listener(event.data);
            }
        }
    }
}

// // Example usage
// const eventManager = new EventManager();

// // Adding a listener for worldwide events
// eventManager.addListener('worldwide', async (data) => {
//     console.log('Worldwide event received:', data);
// });

// // Triggering a worldwide event
// const worldwideEvent = new GameEvent('worldwide', { message: 'A new worldwide event has started!' });
// eventManager.triggerEvent(worldwideEvent);

module.exports = { GameEvent, EventManager };
