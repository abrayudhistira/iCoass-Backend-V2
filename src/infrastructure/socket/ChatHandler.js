module.exports = (io, socket, chatUseCase) => {
    
    // 1. Pasien Request Konsultasi (Masuk Antrian)
    // socket.on("request_chat", async (data) => {
    //     try {
    //         const { userId } = data;
    //         const room = await chatUseCase.createQueue(userId);
            
    //         // Pasien otomatis join ke room miliknya sendiri
    //         socket.join(`room_${room.id}`);
            
    //         // Broadcast ke SEMUA Admin/Koas bahwa ada antrian baru
    //         io.emit("new_queue_available", {
    //             roomId: room.id,
    //             userId: userId,
    //             status: 'pending'
    //         });
    //     } catch (err) {
    //         socket.emit("error_response", { message: err.message });
    //     }
    // });
     socket.on("request_chat", async (data) => {
        try {
            const { userId } = data;
            
            // Validasi tambahan di socket layer
            if (!userId) {
                throw new Error("User ID tidak valid");
            }

            const room = await chatUseCase.createQueue(userId);
            
            // Pasien otomatis join ke room miliknya sendiri
            socket.join(`room_${room.id}`);
            
            // Broadcast ke SEMUA Admin/Koas bahwa ada antrian baru
            io.emit("new_queue_available", {
                roomId: room.id,
                userId: userId,
                status: 'pending'
            });

            // Notify ke pasien bahwa request berhasil
            socket.emit("queue_created", {
                roomId: room.id,
                status: 'pending',
                message: "Permintaan konsultasi berhasil dikirim"
            });

        } catch (err) {
            console.error(`❌ [SOCKET] Error creating queue: ${err.message}`);
            
            // Kirim error ke client
            socket.emit("error_response", { 
                message: err.message,
                code: err.message.includes("sudah memiliki") ? "DUPLICATE_REQUEST" : "SERVER_ERROR"
            });
        }
    });

    // 2. Admin ACC Chat (Mengambil Pasien)
    socket.on("accept_chat", async (data) => {
        try {
            const { roomId, adminId } = data;
            const room = await chatUseCase.acceptPatient(roomId, adminId);

            // Admin join ke room pasien
            socket.join(`room_${roomId}`);

            // Beritahu pasien bahwa chat sudah di-acc
            io.to(`room_${roomId}`).emit("chat_activated", {
                roomId: room.id,
                adminId: adminId,
                status: 'active'
            });

            // Update list antrian di semua Admin (agar room tersebut hilang dari list pending)
            io.emit("queue_updated", { roomId: room.id });
        } catch (err) {
            socket.emit("error_response", { message: err.message });
        }
    });

    // 3. Kirim Pesan Real-time
    socket.on("send_message", async (data) => {
        try {
            const { sender_id, room_id, message_text } = data;
            
            // Simpan ke database via UseCase
            const savedMsg = await chatUseCase.saveChat(sender_id, room_id, message_text);

            // Kirim ke semua orang di room tersebut (Pasien & Admin)
            io.to(`room_${room_id}`).emit("receive_message", savedMsg);
        } catch (err) {
            socket.emit("error_response", { message: "Gagal mengirim pesan" });
        }
    });

    // 4. Join Room (Digunakan saat buka aplikasi/pindah layar chat)
    socket.on("join_existing_room", (roomId) => {
        socket.join(`room_${roomId}`);
    });

    // Di ChatHandler.js
    socket.on("close_chat", async (data) => {
        try {
            const { roomId } = data;
            const room = await chatUseCase.closeChat(roomId);

            // Broadcast ke semua user di room bahwa sesi ditutup
            io.to(`room_${roomId}`).emit("chat_closed", {
                roomId: room.id,
                status: 'closed'
            });

            // FIX: Emit queue_updated agar list chat ter-refresh
            io.emit("queue_updated", { 
                roomId: room.id,
                action: 'closed'
            });

            console.log(`✅ [SOCKET] Chat room ${roomId} ditutup`);
        } catch (err) {
            socket.emit("error_response", { message: err.message });
        }
    });
};