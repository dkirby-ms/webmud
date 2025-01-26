const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { GameEvent, EventManager } = require('./event');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 28999;
const SERVER_NAME = process.env.SERVER_NAME || 'Default Game Server';

let gameState = {
    serverName: SERVER_NAME,
    players: {},
    npcs: {},
    objects: {},
    worldDetails: {}
};

const weather = new EventManager();
const combat = new EventManager();
const playerManager = new EventManager();


function updateGameState() {
    // Update game state logic her
    // For example, move NPCs, handle game events, etc.
    // Example of triggering a worldwide event
    const worldwideEvent = new GameEvent('worldwide', { message: 'A new worldwide event has started!' });
    eventManager.triggerEvent(worldwideEvent);
}

function handleInput(input) {
    // Handle input affecting the game world
    // For example, player movements, actions, etc.
}

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const input = JSON.parse(message);
        handleInput(input);
    });

    // // Adding a listener for worldwide events to notify all connected players
    // eventManager.addListener('worldwide', async (data) => {
    //     ws.send(JSON.stringify({ type: 'worldwide', data }));
    // });
});

function gameLoop() {
    updateGameState();

    setTimeout(gameLoop, 1000 / 30); // Run at 60 FPS
}

server.listen(PORT, () => {
    console.log(`${SERVER_NAME} is listening on port ${PORT}`);
    gameLoop();
});
