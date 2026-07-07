const initModels = require("../models/init-models");
const sequelize = require("../database/sequelize");
const { Op } = require("sequelize");
const models = initModels(sequelize);

class UsersRepository {
    async create(data) {
        return await models.users.create(data);
    }

    async findAll() {
        return await models.users.findAll({
            attributes: { exclude: ['password'] }
        });
    }

    async findAllExcept(id) {
        return await models.users.findAll({
            where: {
                id: { [Op.ne]: id }
            },
            attributes: { exclude: ['password'] }
        });
    }

    async findById(id) {
        return await models.users.findByPk(id);
    }

    async findByUsername(username) {
        return await models.users.findOne({ 
            where: { username: username } 
        });
    }

    async findByEmail(email) {
        return await models.users.findOne({ 
            where: { email: email } 
        });
    }

    async update(id, data) {
        return await models.users.update(data, { where: { id: id } });
    }

    async delete(id) {
        return await models.users.destroy({ where: { id: id } });
    }
}

module.exports = UsersRepository;