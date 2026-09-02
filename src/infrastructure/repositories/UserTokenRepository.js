class UserTokenRepository {
    constructor(userTokenModel) {
        this.userTokenModel = userTokenModel;
    }

    async createToken(data, transaction = null) {
        return await this.userTokenModel.create(data, { transaction });
    }

    async findByToken(token, transaction = null) {
        return await this.userTokenModel.findOne({
            where: { refresh_token: token, is_revoked: false },
            transaction
        });
    }

    async revokeToken(token, transaction = null) {
        return await this.userTokenModel.update(
            { is_revoked: true },
            { where: { refresh_token: token }, transaction }
        );
    }

    async deleteExpiredTokens(transaction = null) {
        const { Op } = require('sequelize');
        return await this.userTokenModel.destroy({
            where: { expires_at: { [Op.lt]: new Date() } },
            transaction
        });
    }

    async revokeAllUserTokens(userId, transaction = null) {
        return await this.userTokenModel.update(
            { is_revoked: true },
            {
                where: {
                    user_id: userId,
                    is_revoked: false
                },
                transaction
            }
        );
    }

    async deleteExpiredAndRevokedTokens(userId, transaction = null) {
        const { Op } = require('sequelize');
        return await this.userTokenModel.destroy({
            where: {
                user_id: userId,
                [Op.or]: [
                    { is_revoked: true },
                    { expires_at: { [Op.lt]: new Date() } }
                ]
            },
            transaction
        });
    }

    async deleteAllUserTokens(userId, transaction = null) {
        return await this.userTokenModel.destroy({
            where: { user_id: userId },
            transaction
        });
    }
}

module.exports = UserTokenRepository;