const { ValidationError } = require('../../domain/errors/AppError');

class UserController {
    constructor(userUseCase) {
        this.useCase = userUseCase;
    }

    register = async (req, res, next) => {
        try {
            const user = await this.useCase.register(req.body);
            res.status(201).json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    };

    login = async (req, res, next) => {
        try {
            const { username, password } = req.body;
            const result = await this.useCase.login(username, password);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    };

    update = async (req, res, next) => {
        try {
            const result = await this.useCase.updateProfile(req.params.id, req.user.id, req.user.role, req.body);
            res.status(200).json({ success: true, message: "Profil berhasil diperbarui", data: result });
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req, res, next) => {
        try {
            const users = await this.useCase.getAllUsers(req.user.id);
            res.status(200).json({ success: true, data: users });
        } catch (error) {
            next(error);
        }
    };

    getProfile = async (req, res, next) => {
        try {
            const user = await this.useCase.getUserById(req.params.id);
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    }

    delete = async (req, res, next) => {
        try {
            await this.useCase.deleteUser(req.params.id, req.user.id);

            res.status(200).json({
                success: true,
                message: `User dengan ID ${req.params.id} berhasil dihapus`
            });
        } catch (error) {
            next(error);
        }
    };

    refreshToken = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new ValidationError("Token diperlukan");
            }

            const result = await this.useCase.refreshAccessToken(refreshToken);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    };

    logout = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            await this.useCase.logout(refreshToken);
            res.status(200).json({ success: true, message: "Logout berhasil" });
        } catch (error) {
            next(error);
        }
    };
}

module.exports = UserController;