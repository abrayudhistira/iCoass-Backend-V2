const initModels = require("../models/init-models");
const sequelize = require("../database/sequelize");
console.log("Cek Sequelize Instance:", typeof sequelize.define);
const models = initModels(sequelize);

class UsersRepository {
    async create(data) {
        return await models.users.create(data);
    }

    async findAll() {
        return await models.users.findAll();
    }

    async findById(id) {
        return await models.users.findByPk(id);
    }

    async findByEmail(email) {
        return await models.users.findOne({ where: { email: email } });
    }

    async update(id, data) {
        return await models.users.update(data, { where: { id: id } });
    }

    async delete(id) {
        return await models.users.destroy({ where: { id: id } });
    }
}

module.exports = UsersRepository;