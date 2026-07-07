class ChatUseCase {
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
    }

    // async createQueue(userId) {
    //     return await this.chatRepository.createRoom(userId);
    // }
    async createQueue(userId) {
        try {
            return await this.chatRepository.createRoom(userId);
        } catch (error) {
            // Re-throw error dengan message yang jelas
            throw new Error(error.message || "Gagal membuat antrian");
        }
    }

    async getAvailableQueues() {
        return await this.chatRepository.getPendingRooms();
    }

    async acceptPatient(roomId, adminId) {
        return await this.chatRepository.claimPatient(roomId, adminId);
    }

    async saveChat(senderId, roomId, text) {
        return await this.chatRepository.saveMessage({
            room_id: roomId,
            sender_id: senderId,
            message_text: text
        });
    }

    async getHistory(roomId, page, limit) {
        return await this.chatRepository.getMessagesByRoom(roomId, page, limit);
    }

    async getChatList(userId, role) {
        return await this.chatRepository.getRoomsByRole(userId, role);
    }

    async closeChat(roomId) {
        return await this.chatRepository.closeRoom(roomId);
    }
}

module.exports = ChatUseCase;