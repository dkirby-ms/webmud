const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { GameEvent, EventManager } = require('./event.js');
const socketIo = require('socket.io');
const { connectPlayer, disconnectPlayer} = require('./player'); // Import the registerPlayer function

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

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
const players = {};

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Add player to the players object
    socket.on('register', (data) => {
        connectPlayer(data, socket, players);
    });

    // Handle player disconnection
    socket.on('disconnect', (data) => {
        disconnectPlayer(socket, players);
    });

    // Handle other socket events here
});

function handleInput(message) {
    // Handle incoming messages
}

function updateGameState() {
    // Update game state logic here
    // For example, move NPCs, handle game events, etc.
    // Example of triggering a worldwide event
    const worldwideEvent = new GameEvent('worldwide', { message: 'A new worldwide event has started!' });
    //eventManager.triggerEvent(worldwideEvent);
}

function gameLoop() { // Will we even need a game loop for an event-driven game? hmm
    updateGameState();
    console.log(`Game tick: ${new Date().toISOString()}`);
    
    setTimeout(gameLoop, 10000); // Run at 15 FPS
}

server.listen(PORT, () => {
    console.log(`${SERVER_NAME} is listening on port ${PORT}`);
    gameLoop(); 
});
