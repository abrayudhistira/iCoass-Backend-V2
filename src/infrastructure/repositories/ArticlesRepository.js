class ArticlesRepository {
    constructor(articleModel) {
        this.articleModel = articleModel;
    }

    async create(data, transaction = null) {
        return await this.articleModel.create(data, { transaction });
    }

    async findAll(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        return await this.articleModel.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });
    }

    async findById(id, transaction = null) {
        return await this.articleModel.findByPk(id, { transaction });
    }

    async update(id, data, transaction = null) {
        return await this.articleModel.update(data, { where: { id }, transaction });
    }

    async delete(id, transaction = null) {
        return await this.articleModel.destroy({ where: { id }, transaction });
    }
}

module.exports = ArticlesRepository;