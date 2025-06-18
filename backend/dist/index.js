"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UserManager_1 = require("./UserManager");
const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});
const userManager = new UserManager_1.UserManager();
app.get('/', (req, res) => {
    res.send('/home route');
    return;
});
io.on('connection', (socket) => {
    console.log('New user connected with socket ID:', socket.id);
    userManager.addUser('randamname', socket);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        userManager.removeUser(socket.id);
    });
});
server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
    console.log('WebSocket server is ready for connections');
});
