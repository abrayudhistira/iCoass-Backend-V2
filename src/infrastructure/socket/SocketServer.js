const { Server } = require("socket.io");
const ChatRepository = require("../repositories/ChatRepository");
const ChatUseCase = require("../../application/usecase/ChatUseCase");

const initSocket = (server) => {
    const io = new Server(server, {
        cors: { origin: "*" } // Sesuaikan dengan kebutuhan Flutter kamu
    });

    const chatRepo = new ChatRepository();
    const chatUseCase = new ChatUseCase(chatRepo);

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Join ke room spesifik (berdasarkan ID Chat Room)
        socket.on("join_room", (roomId) => {
            socket.join(`room_${roomId}`);
            console.log(`Socket ${socket.id} joined room_${roomId}`);
        });

        // Menangani pengiriman pesan
        socket.on("send_message", async (data) => {
            try {
                const { sender_id, room_id, message_text } = data;
                
                // Simpan ke DB lewat UseCase
                const savedMsg = await chatUseCase.sendMessage(sender_id, room_id, message_text);

                // Broadcast ke semua orang di room tersebut termasuk pengirim
                io.to(`room_${room_id}`).emit("receive_message", savedMsg);
            } catch (error) {
                socket.emit("error_message", { message: "Gagal mengirim pesan" });
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected");
        });
    });

    return io;
};

module.exports = initSocket;