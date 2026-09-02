const { Op } = require("sequelize");

class UsersRepository {
    constructor(userModel) {
        this.userModel = userModel;
    }

    async create(data, transaction = null) {
        return await this.userModel.create(data, { transaction });
    }

    async findAll() {
        return await this.userModel.findAll({
            attributes: { exclude: ['password'] }
        });
    }

    async findAllExcept(id) {
        return await this.userModel.findAll({
            where: {
                id: { [Op.ne]: id }
            },
            attributes: { exclude: ['password'] }
        });
    }

    async findById(id, transaction = null) {
        return await this.userModel.findByPk(id, { transaction });
    }

    async findByUsername(username, transaction = null) {
        return await this.userModel.findOne({
            where: { username: username },
            transaction
        });
    }

    async findByEmail(email, transaction = null) {
        return await this.userModel.findOne({
            where: { email: email },
            transaction
        });
    }

    async update(id, data, transaction = null) {
        return await this.userModel.update(data, { where: { id: id }, transaction });
    }

    async delete(id, transaction = null) {
        return await this.userModel.destroy({ where: { id: id }, transaction });
    }
}

module.exports = UsersRepository;