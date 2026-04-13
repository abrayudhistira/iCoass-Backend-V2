const initModels = require("../models/init-models");
const sequelize = require("../database/sequelize");
const { Sequelize } = require('sequelize');
const models = initModels(sequelize);

class HospitalsRepository {
    async create(data) {
        return await models.hospitals.create(data);
    }

    async findById(id) {
        return await models.hospitals.findByPk(id);
    }

    // Mendukung pencarian biasa (alfabetis)
    async findAll(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        return await models.hospitals.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['name', 'ASC']]
        });
    }

    // Mendukung pencarian radius (Haversine)
    async findNearest(userLat, userLng, radiusKm = 10, page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        const distanceSql = sequelize.literal(`(
            6371 * acos(
                cos(radians(${userLat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${userLng})) + 
                sin(radians(${userLat})) * sin(radians(latitude))
            )
        )`);

        return await models.hospitals.findAndCountAll({
            attributes: {
                include: [[distanceSql, 'distance']]
            },
            where: Sequelize.where(distanceSql, { [Sequelize.Op.lte]: radiusKm }),
            order: distanceSql,
            limit,
            offset
        });
    }

    async update(id, data) {
        return await models.hospitals.update(data, { where: { id } });
    }

    async delete(id) {
        return await models.hospitals.destroy({ where: { id } });
    }
}

module.exports = HospitalsRepository;