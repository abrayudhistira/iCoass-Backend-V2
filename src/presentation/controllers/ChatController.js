class ChatController {
    constructor(chatUseCase) {
        this.chatUseCase = chatUseCase;
    }
    getRooms = async (req, res) => {
        try {
            const { id, role } = req.user;
            const rooms = await this.chatUseCase.getChatList(id, role);
            res.json({ success: true, data: rooms });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    };

    getMessages = async (req, res) => {
        try {
            const { roomId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;

            const messages = await this.chatUseCase.getHistory(roomId, page, limit);
            res.json({ success: true, data: messages });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    };

    getQueues = async (req, res) => {
        try {
            const queues = await this.chatUseCase.getAvailableQueues();
            res.json({ success: true, data: queues });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    };

    closeChat = async (req, res) => {
        try {
            const { roomId } = req.params;
            const room = await this.chatUseCase.closeChat(roomId);
            res.json({ 
                success: true, 
                message: "Sesi chat berhasil ditutup",
                data: room 
            });
        } catch (err) {
            res.status(400).json({ 
                success: false, 
                message: err.message 
            });
        }
    };
}

module.exports = ChatController;