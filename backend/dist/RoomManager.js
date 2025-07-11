"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
let GobalRoomId = 1;
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    addRoom(user1, user2) {
        const roomId = this.generate().toString();
        console.log('📝 Creating new room:', {
            roomId,
            user1: { id: user1.socket.id, name: user1.name },
            user2: { id: user2.socket.id, name: user2.name }
        });
        this.rooms.set(roomId, {
            user1,
            user2,
        });
        // Verify room was created successfully
        const createdRoom = this.rooms.get(roomId);
        console.log('🔍 Room creation verification:', {
            wasCreated: !!createdRoom,
            roomId,
            currentRooms: Array.from(this.rooms.keys())
        });
        // Emit the send-offer event
        console.log('📡 Emitting send-offer event for room:', roomId);
        console.log(user1.name);
        console.log("user 1 socket id me ", user1.name);
        user1.socket.emit("me", { number: 1, roomId });
        user2.socket.emit("me", { number: 2, roomId });
        user1.socket.emit("send-offer", { roomId });
        return roomId; // Return roomId for tracking
    }
    onOffer(roomId, sdp) {
        console.log('📥 Processing offer for room:', roomId);
        const room = this.rooms.get(roomId);
        if (!room) {
            console.error('❌ Room not found:', roomId);
            console.log('Available rooms:', Array.from(this.rooms.keys()));
            return;
        }
        console.log('✅ Found room:', {
            roomId,
            user1: { id: room.user1.socket.id, name: room.user1.name },
            user2: { id: room.user2.socket.id, name: room.user2.name }
        });
        room.user2.socket.emit('offer', {
            roomId,
            sdp
        });
        console.log('📤 Offer sent to user2:', room.user2.socket.id);
    }
    onAnswer(roomId, sdp) {
        console.log('📥 Processing answer for room:', roomId);
        const room = this.rooms.get(roomId);
        if (!room) {
            console.error('❌ Room not found:', roomId);
            console.log('Available rooms:', Array.from(this.rooms.keys()));
            return;
        }
        console.log('✅ Found room for answer:', {
            roomId,
            user1: { id: room.user1.socket.id, name: room.user1.name }
        });
        room.user1.socket.emit('answer', { roomId,
            sdp
        });
        console.log('📤 Answer sent to user1:', room.user1.socket.id);
    }
    onIceCandidate(roomId, candidate, socketId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        // Forward to the other peer
        if (room.user1.socket.id === socketId) {
            room.user2.socket.emit('ice-candidate', { roomId, candidate });
        }
        else if (room.user2.socket.id === socketId) {
            room.user1.socket.emit('ice-candidate', { roomId, candidate });
        }
    }
    removeRoom(roomId) {
        this.rooms.delete(roomId);
    }
    generate() {
        return GobalRoomId++;
    }
}
exports.RoomManager = RoomManager;
