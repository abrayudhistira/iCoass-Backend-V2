
class ChatRepository {
    constructor(chatRoomModel, messageModel, userModel) {
        this.chatRoomModel = chatRoomModel;
        this.messageModel = messageModel;
        this.userModel = userModel;
    }
    // 1. Pasien masuk antrian
    // async createRoom(userId) {
    //     return await models.chat_rooms.create({
    //         user_id: userId,
    //         status: 'pending'
    //     });
    // }
    // 1. Pasien masuk antrian - DENGAN VALIDASI
    // async createRoom(userId) {
    //     const transaction = await sequelize.transaction();
        
    //     try {
    //         // LOCK: Cek apakah user sudah punya room pending atau active
    //         const existingRoom = await models.chat_rooms.findOne({
    //             where: {
    //                 user_id: userId,
    //                 status: ['pending', 'active'] // Cek kedua status
    //             },
    //             transaction,
    //             lock: transaction.LOCK.UPDATE // Row-level lock
    //         });

    //         if (existingRoom) {
    //             await transaction.rollback();
    //             throw new Error("Anda sudah memiliki sesi konsultasi yang aktif");
    //         }

    //         // Jika tidak ada, buat room baru
    //         const newRoom = await models.chat_rooms.create({
    //             user_id: userId,
    //             status: 'pending'
    //         }, { transaction });

    //         await transaction.commit();
    //         return newRoom;
    //     } catch (error) {
    //         await transaction.rollback();
    //         throw error;
    //     }
    // }
    async findActiveByUserId(userId, transaction = null) {
        return await this.chatRoomModel.findOne({
            where: {
                user_id: userId,
                status: ['pending', 'active']
            },
            transaction,
            lock: transaction ? transaction.LOCK.UPDATE : false
        });
    }

    async createRoom(userId, transaction = null) {
        return await this.chatRoomModel.create({
            user_id: userId,
            status: 'pending'
        }, { transaction });
    }

    // 2. Admin melihat list antrian (Pending)
    async getPendingRooms() {
        return await models.chat_rooms.findAll({
            where: { status: 'pending' },
            include: [{ 
                model: models.users, 
                as: 'user', // Pastikan alias ini sinkron dengan init-models
                attributes: ['id', 'username'] 
            }],
            order: [['createdAt', 'ASC']]
        });
    }

    // 3. Admin klaim pasien (Pake Lock untuk hindari rebutan)
    async claimPatient(roomId, adminId, transaction = null) {
        const room = await this.chatRoomModel.findByPk(roomId, { transaction, lock: true });

        // Business logic will be moved to UseCase
        // if (!room) throw new Error("Antrian tidak ditemukan");
        // if (room.status !== 'pending') throw new Error("Sudah diambil admin lain");

        await room.update({
            admin_id: adminId,
            status: 'active'
        }, { transaction });

        return room;
    }

    // 4. Kirim & Update Last Message (Transaction agar sinkron)
    async saveMessage(data, transaction = null) {
        const message = await this.messageModel.create(data, { transaction });

        await this.chatRoomModel.update({
            last_message: data.message_text,
            last_message_time: new Date()
        }, {
            where: { id: data.room_id },
            transaction
        });

        return message;
    }

    // 5. History Chat (Penting buat load di Flutter)
    async getMessagesByRoom(roomId, page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        return await this.messageModel.findAll({
            where: { room_id: roomId },
            order: [['createdAt', 'ASC']],
            limit,
            offset
        });
    }

    async getRoomById(roomId, transaction = null) {
        return await this.chatRoomModel.findByPk(roomId, { transaction });
    }

    // 6. List Chat Aktif (Sesuai Role)
    // async getRoomsByRole(id, role) {
    //     const isParamAdmin = role === 'admin';
    //     return await models.chat_rooms.findAll({
    //         where: { 
    //             [isParamAdmin ? 'admin_id' : 'user_id']: id, 
    //             status: 'active' 
    //         },
    //         include: [{ 
    //             model: models.users, 
    //             as: isParamAdmin ? 'user' : 'admin', 
    //             attributes: ['id', 'username'] 
    //         }],
    //         order: [['last_message_time', 'DESC']]
    //     });
    // }
    async getRoomsByRole(id, role) {
        const isParamAdmin = role === 'admin';

        const statusFilter = isParamAdmin
            ? { status: ['active', 'closed'] }
            : { status: ['active', 'closed'] };

        return await this.chatRoomModel.findAll({
            where: {
                [isParamAdmin ? 'admin_id' : 'user_id']: id,
                ...statusFilter
            },
            include: [{
                model: this.userModel,
                as: isParamAdmin ? 'user' : 'admin',
                attributes: ['id', 'username']
            }],
            order: [['last_message_time', 'DESC']]
        });
    }
     async closeRoom(roomId, transaction = null) {
        const room = await this.chatRoomModel.findByPk(roomId, { transaction, lock: true });

        // Business logic will be moved to UseCase
        // if (!room) throw new Error("Chat room tidak ditemukan");
        // if (room.status === 'closed') throw new Error("Sesi sudah ditutup sebelumnya");

        await room.update({
            status: 'closed'
        }, { transaction });

        return room;
    }

module.exports = ChatRepository;