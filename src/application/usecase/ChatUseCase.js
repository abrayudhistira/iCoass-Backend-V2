const { NotFoundError, ConflictError, ValidationError } = require('../../domain/errors/AppError');

class ChatUseCase {
    constructor(chatRepository, sequelize) {
        this.chatRepository = chatRepository;
        this.sequelize = sequelize;
    }

    async createQueue(userId) {
        return await this.sequelize.transaction(async (t) => {
            const existingRoom = await this.chatRepository.findActiveByUserId(userId, t);
            if (existingRoom) {
                throw new ConflictError("Anda sudah memiliki sesi konsultasi yang aktif");
            }
            return await this.chatRepository.createRoom(userId, t);
        });
    }

    async getAvailableQueues() {
        return await this.chatRepository.getPendingRooms();
    }

    async acceptPatient(roomId, adminId) {
        return await this.sequelize.transaction(async (t) => {
            const room = await this.chatRepository.claimPatient(roomId, adminId, t);
            if (!room) {
                throw new NotFoundError("Antrian");
            }
            if (room.status !== 'pending') {
                throw new ValidationError("Antrian sudah diambil admin lain atau tidak lagi pending");
            }
            return room;
        });
    }

    async saveChat(senderId, roomId, text) {
        return await this.sequelize.transaction(async (t) => {
            // Cek room exists and is active (business logic)
            const room = await this.chatRepository.getRoomById(roomId, t); // need to add getRoomById to repo
            if (!room || room.status !== 'active') {
                throw new ValidationError("Chat room tidak aktif atau tidak ditemukan");
            }
            return await this.chatRepository.saveMessage({
                room_id: roomId,
                sender_id: senderId,
                message_text: text
            }, t);
        });
    }

    async getHistory(roomId, page, limit) {
        return await this.chatRepository.getMessagesByRoom(roomId, page, limit);
    }

    async getChatList(userId, role) {
        return await this.chatRepository.getRoomsByRole(userId, role);
    }

    async closeChat(roomId) {
        return await this.sequelize.transaction(async (t) => {
            const room = await this.chatRepository.closeRoom(roomId, t);
            if (!room) {
                throw new NotFoundError("Chat room");
            }
            if (room.status === 'closed') {
                throw new ConflictError("Sesi sudah ditutup sebelumnya");
            }
            return room;
        });
    }
}

module.exports = ChatUseCase;