const UsersRepository = require("../../infrastructure/repositories/UsersRepository");
const UserUseCase = require("../../application/usecase/UserUseCase");

class UserController {
    constructor(userUseCase) {
        this.useCase = userUseCase;
    }

    register = async (req, res) => {
        try {
            const user = await this.useCase.register(req.body);
            res.status(201).json({ success: true, data: user });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    };

    // login = async (req, res) => {
    //     try {
    //         const { email, password } = req.body;
    //         const result = await this.useCase.login(email, password);
    //         res.status(200).json({ success: true, ...result });
    //     } catch (error) {
    //         res.status(401).json({ success: false, message: error.message });
    //     }
    // };
    login = async (req, res) => {
        try {
            const { username, password } = req.body; // Ambil username
            const result = await this.useCase.login(username, password);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            res.status(401).json({ success: false, message: error.message });
        }
    };

    update = async (req, res) => {
        try {
            // req.user.id berasal dari middleware JWT
            const result = await this.useCase.updateProfile(req.params.id, req.user.id, req.user.role, req.body);
            res.status(200).json({ success: true, message: "Profil berhasil diperbarui" });
        } catch (error) {
            res.status(403).json({ success: false, message: error.message });
        }
    };

    getAll = async (req, res) => {
        try {
            const users = await this.useCase.getAllUsers(req.user.id);
            res.status(200).json({ success: true, data: users });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    };

    getProfile = async (req, res) => {
        try {
            const user = await this.useCase.getUserById(req.params.id);
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            res.status(404).json({ success: false, message: error.message });
        }
    }

    delete = async (req, res) => {
        try {
            await this.useCase.deleteUser(req.params.id, req.user.id);

            res.status(200).json({
                success: true,
                message: `User dengan ID ${req.params.id} berhasil dihapus`
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    };

    refreshToken = async (req, res) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ success: false, message: "Token diperlukan" });
            }

            const result = await this.useCase.refreshAccessToken(refreshToken);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            res.status(401).json({ success: false, message: error.message });
        }
    };

    logout = async (req, res) => {
        try {
            const { refreshToken } = req.body;
            await this.useCase.logout(refreshToken);
            res.status(200).json({ success: true, message: "Logout berhasil" });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    };
}

module.exports = UserController;