class ChatController {
    constructor(chatUseCase) {
        this.chatUseCase = chatUseCase;
    }
    getRooms = async (req, res, next) => {
        try {
            const { id, role } = req.user;
            const rooms = await this.chatUseCase.getChatList(id, role);
            res.json({ success: true, data: rooms });
        } catch (err) {
            next(err);
        }
    };

    getMessages = async (req, res, next) => {
        try {
            const { roomId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;

            const messages = await this.chatUseCase.getHistory(roomId, page, limit);
            res.json({ success: true, data: messages });
        } catch (err) {
            next(err);
        }
    };

    getQueues = async (req, res, next) => {
        try {
            const queues = await this.chatUseCase.getAvailableQueues();
            res.json({ success: true, data: queues });
        } catch (err) {
            next(err);
        }
    };

    closeChat = async (req, res, next) => {
        try {
            const { roomId } = req.params;
            const room = await this.chatUseCase.closeChat(roomId);
            res.json({
                success: true,
                message: "Sesi chat berhasil ditutup",
                data: room
            });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = ChatController;