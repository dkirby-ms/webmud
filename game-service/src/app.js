const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { GameEvent, EventManager } = require('./event.js');

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

const chatManager = new EventManager();

function handleInput(message) {
    // Handle incoming messages
    
}

function updateGameState() {
    // Update game state logic her
    // For example, move NPCs, handle game events, etc.
    // Example of triggering a worldwide event
    const worldwideEvent = new GameEvent('worldwide', { message: 'A new worldwide event has started!' });
    //eventManager.triggerEvent(worldwideEvent);
}

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        // Handle incoming messages
        //const input = JSON.parse(message);
        handleInput(message);
    });

    ws.on('close', () => {
        // Handle player disconnect
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error: ${error}`);
    });
});

function gameLoop() { // Will we even need a game loop for an event-driven game? hmm
    updateGameState();
    console.log(`Game tick: ${new Date().toISOString()}`);
    
    setTimeout(gameLoop, 10000); // Run at 15 FPS
}

server.listen(PORT, () => {
    console.log(`${SERVER_NAME} is listening on port ${PORT}`);
    gameLoop(); 
});
