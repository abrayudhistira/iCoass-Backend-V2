const initModels = require("../models/init-models");
const sequelize = require("../database/sequelize");
const models = initModels(sequelize);

class UserTokenRepository {
    async createToken(data) {
        return await models.user_tokens.create(data);
    }

    async findByToken(token) {
        return await models.user_tokens.findOne({
            where: { refresh_token: token, is_revoked: false }
        });
    }

    async revokeToken(token) {
        return await models.user_tokens.update(
            { is_revoked: true },
            { where: { refresh_token: token } }
        );
    }

    async deleteExpiredTokens() {
        const { Op } = require('sequelize');
        return await models.user_tokens.destroy({
            where: { expires_at: { [Op.lt]: new Date() } }
        });
    }

    async revokeAllUserTokens(userId) {
        return await models.user_tokens.update(
            { is_revoked: true },
            {
                where: {
                    user_id: userId,
                    is_revoked: false
                }
            }
        );
    }

    async deleteExpiredAndRevokedTokens(userId) {
        const { Op } = require('sequelize');
        return await models.user_tokens.destroy({
            where: {
                user_id: userId,
                [Op.or]: [
                    { is_revoked: true },
                    { expires_at: { [Op.lt]: new Date() } }
                ]
            }
        });
    }

    async deleteAllUserTokens(userId) {
        return await models.user_tokens.destroy({
            where: { user_id: userId }
        });
    }
}

module.exports = UserTokenRepository;