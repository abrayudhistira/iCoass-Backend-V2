const initModels = require("../models/init-models");
const sequelize = require("../database/sequelize");
const models = initModels(sequelize);

class ChatRepository {
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
    async createRoom(userId) {
        // Gunakan managed transaction (otomatis commit/rollback)
        return await sequelize.transaction(async (t) => {
            // LOCK: Cek apakah user sudah punya room pending atau active
            const existingRoom = await models.chat_rooms.findOne({
                where: {
                    user_id: userId,
                    status: ['pending', 'active']
                },
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (existingRoom) {
                throw new Error("Anda sudah memiliki sesi konsultasi yang aktif");
            }

            // Jika tidak ada, buat room baru
            const newRoom = await models.chat_rooms.create({
                user_id: userId,
                status: 'pending'
            }, { transaction: t });

            return newRoom;
        });
        // Tidak perlu try-catch manual, sequelize.transaction() otomatis handle rollback
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
    async claimPatient(roomId, adminId) {
        const transaction = await sequelize.transaction();
        try {
            const room = await models.chat_rooms.findByPk(roomId, { transaction, lock: true });

            if (!room) throw new Error("Antrian tidak ditemukan");
            if (room.status !== 'pending') throw new Error("Sudah diambil admin lain");

            await room.update({
                admin_id: adminId,
                status: 'active'
            }, { transaction });

            await transaction.commit();
            return room;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // 4. Kirim & Update Last Message (Transaction agar sinkron)
    async saveMessage(data) {
        const transaction = await sequelize.transaction();
        try {
            const message = await models.messages.create(data, { transaction });
            
            await models.chat_rooms.update({
                last_message: data.message_text,
                last_message_time: new Date()
            }, { 
                where: { id: data.room_id }, 
                transaction 
            });

            await transaction.commit();
            return message;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // 5. History Chat (Penting buat load di Flutter)
    async getMessagesByRoom(roomId, page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        return await models.messages.findAll({
            where: { room_id: roomId },
            order: [['createdAt', 'ASC']],
            limit,
            offset
        });
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
        
        // FIX: Include 'active' dan 'closed' (exclude 'pending' untuk pasien)
        const statusFilter = isParamAdmin 
            ? { status: ['active', 'closed'] } // Admin lihat active & closed
            : { status: ['active', 'closed'] }; // Pasien juga lihat active & closed
        
        return await models.chat_rooms.findAll({
            where: { 
                [isParamAdmin ? 'admin_id' : 'user_id']: id,
                ...statusFilter
            },
            include: [{ 
                model: models.users, 
                as: isParamAdmin ? 'user' : 'admin', 
                attributes: ['id', 'username'] 
            }],
            order: [['last_message_time', 'DESC']]
        });
    }
     async closeRoom(roomId) {
        const transaction = await sequelize.transaction();
        try {
            const room = await models.chat_rooms.findByPk(roomId, { transaction, lock: true });

            if (!room) throw new Error("Chat room tidak ditemukan");
            if (room.status === 'closed') throw new Error("Sesi sudah ditutup sebelumnya");

            await room.update({
                status: 'closed'
            }, { transaction });

            await transaction.commit();
            return room;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = ChatRepository;