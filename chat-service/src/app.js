const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { swaggerUi, swaggerDocs } = require('./swagger');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

const PORT = process.env.PORT || 28900;
const SERVER_NAME = process.env.SERVER_NAME || 'Default chat server';

const channels = [
    { name: 'chat', description: 'General chat channel', users: [] },
    { name: 'auction', description: 'Auction channel', users: [] },
    { name: 'group', description: 'Group chat channel', users: [] },
    { name: 'room', description: 'Room chat channel', users: [] }
];

function addUserToChannel(channelName, user) {
    const channel = channels.find(c => c.name === channelName);
    if (channel) {
        channel.users.push(user);
    }
}

function removeUserFromChannel(channelName, user) {
    const channel = channels.find(c => c.name === channelName);
    if (channel) {
        channel.users = channel.users.filter(u => u !== user);
    }
}

function getChannelUsers(channelName) {
    const channel = channels.find(c => c.name === channelName);
    return channel ? channel.users : [];
}

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /channels:
 *   get:
 *     summary: Get list of channels
 *     responses:
 *       200:
 *         description: List of channels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 */
app.get('/channels', (req, res) => {
    res.json(channels);
});

/**
 * @swagger
 * /channels/{channelName}/users:
 *   get:
 *     summary: Get users in a channel
 *     parameters:
 *       - in: path
 *         name: channelName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users in the channel
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
app.get('/channels/:channelName/users', (req, res) => {
    const users = getChannelUsers(req.params.channelName);
    res.json(users);
});

/**
 * @swagger
 * /channels/{channelName}/users:
 *   post:
 *     summary: Add a user to a channel
 *     parameters:
 *       - in: path
 *         name: channelName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *     responses:
 *       200:
 *         description: User added to the channel
 */
app.post('/channels/:channelName/users', (req, res) => {
    addUserToChannel(req.params.channelName, req.body.user);
    res.sendStatus(200);
});

/**
 * @swagger
 * /channels/{channelName}/users:
 *   delete:
 *     summary: Remove a user from a channel
 *     parameters:
 *       - in: path
 *         name: channelName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: user
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User removed from the channel
 */
app.delete('/channels/:channelName/users', (req, res) => {
    removeUserFromChannel(req.params.channelName, req.query.user);
    res.sendStatus(200);
});

io.on('connection', (socket) => {
    console.log('new connection opened');
});

server.listen(PORT, () => {
  console.log(`chat-service listening on *:${PORT}`);
});