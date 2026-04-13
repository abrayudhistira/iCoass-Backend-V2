const initModels = require("../models/init-models");
const sequelize = require("../database/sequelize");
const models = initModels(sequelize);

class ArticlesRepository {
    async create(data) {
        return await models.articles.create(data);
    }

    async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    return await models.articles.findAndCountAll({
        limit: limit,
        offset: offset,
        order: [['createdAt', 'DESC']]
    });
}

    async findById(id) {
        return await models.articles.findByPk(id);
    }

    async update(id, data) {
        return await models.articles.update(data, { where: { id } });
    }

    async delete(id) {
        return await models.articles.destroy({ where: { id } });
    }
}

module.exports = ArticlesRepository;