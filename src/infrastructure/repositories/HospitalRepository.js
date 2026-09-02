const { Sequelize } = require('sequelize');

class HospitalRepository {
    constructor(hospitalModel, sequelize) {
        this.hospitalModel = hospitalModel;
        this.sequelize = sequelize;
    }

    async create(data, transaction = null) {
        return await this.hospitalModel.create(data, { transaction });
    }

    async findById(id, transaction = null) {
        return await this.hospitalModel.findByPk(id, { transaction });
    }

    async findAll(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        return await this.hospitalModel.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['name', 'ASC']]
        });
    }

    async findNearest(userLat, userLng, radiusKm = 10, page = 1, limit = 10, transaction = null) {
        const offset = (page - 1) * limit;

        // Kalkulasi Bounding Box (Penyaringan awal agar Database bisa menggunakan Index)
        // 1 derajat latitude ~ 111km
        const latDelta = radiusKm / 111.32;
        // 1 derajat longitude ~ 111km * cos(latitude)
        const lngDelta = radiusKm / (111.32 * Math.cos(userLat * (Math.PI / 180)));

        const minLat = userLat - latDelta;
        const maxLat = userLat + latDelta;
        const minLng = userLng - lngDelta;
        const maxLng = userLng + lngDelta;

        const distanceSql = this.sequelize.literal(`(
        6371 * acos(
            cos(radians(${userLat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${userLng})) +
            sin(radians(${userLat})) * sin(radians(latitude))
        )
    )`);

        const result = await this.hospitalModel.findAndCountAll({
            attributes: {
                include: [[distanceSql, 'distance']]
            },
            where: {
                // Gunakan index pada kolom lat/lng untuk mempercepat pencarian (Bounding Box)
                latitude: { [Sequelize.Op.between]: [minLat, maxLat] },
                longitude: { [Sequelize.Op.between]: [minLng, maxLng] },

                // Filter presisi menggunakan rumus Haversine
                [Sequelize.Op.and]: Sequelize.where(distanceSql, { [Sequelize.Op.lte]: radiusKm })
            },
            order: [[this.sequelize.col('distance'), 'ASC']],
            limit,
            offset,
            transaction
        });

        return result;
    }

    async update(id, data, transaction = null) {
        return await this.hospitalModel.update(data, { where: { id }, transaction });
    }

    async delete(id, transaction = null) {
        return await this.hospitalModel.destroy({ where: { id }, transaction });
    }
}

module.exports = HospitalRepository;