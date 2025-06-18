"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
const RoomManager_1 = require("./RoomManager");
class UserManager {
    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager_1.RoomManager();
    }
    addUser(name, socket) {
        console.log(`Adding user ${name} with socket ID ${socket.id}`);
        this.users.push({ name, socket });
        this.queue.push(socket.id);
        console.log('Current queue:', this.queue);
        socket.emit('lobby');
        this.clearQueue();
        this.initHandler(socket);
    }
    removeUser(socketId) {
        console.log(`Removing user with socket ID ${socketId}`);
        this.users = this.users.filter(s => socketId !== s.socket.id);
        this.queue = this.queue.filter(s => socketId !== s);
        console.log('Updated queue after removal:', this.queue);
        console.log('Remaining users:', this.users.map(u => ({ id: u.socket.id, name: u.name })));
    }
    clearQueue() {
        if (this.queue.length < 2) {
            console.log('Not enough users in queue');
            return;
        }
        console.log("in clear queue 1 ");
        const id = this.queue.pop();
        const id2 = this.queue.pop();
        const user1 = this.users.find(user => user.socket.id === id);
        const user2 = this.users.find(user => user.socket.id === id2);
        console.log("in clear queue 2 ");
        if (!user1 || !user2) {
            console.log('Failed to find users:', { user1Id: user1, user2Id: user2 });
            return;
        }
        console.log("room is not created ");
        this.roomManager.addRoom(user1, user2);
    }
    initHandler(socket) {
        socket.on('offer', ({ roomId, sdp }) => {
            console.log('offer  recienved', roomId);
            this.roomManager.onOffer(roomId, sdp);
        });
        socket.on('answer', ({ roomId, sdp }) => {
            console.log('answer recieved :', roomId);
            this.roomManager.onAnswer(roomId, sdp);
        });
    }
}
exports.UserManager = UserManager;
