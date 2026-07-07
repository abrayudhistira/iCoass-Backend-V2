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
    // async findNearest(userLat, userLng, radiusKm = 10, page = 1, limit = 10) {
    //     const offset = (page - 1) * limit;

    //     const distanceSql = sequelize.literal(`(
    //         6371 * acos(
    //             cos(radians(${userLat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${userLng})) + 
    //             sin(radians(${userLat})) * sin(radians(latitude))
    //         )
    //     )`);

    //     return await models.hospitals.findAndCountAll({
    //         attributes: {
    //             include: [[distanceSql, 'distance']]
    //         },
    //         where: Sequelize.where(distanceSql, { [Sequelize.Op.lte]: radiusKm }),
    //         order: [[sequelize.col('distance'), 'ASC']],
    //         limit,
    //         offset
    //     });
    // }

    async findNearest(userLat, userLng, radiusKm = 10, page = 1, limit = 10) {
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

        const distanceSql = sequelize.literal(`(
        6371 * acos(
            cos(radians(${userLat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${userLng})) + 
            sin(radians(${userLat})) * sin(radians(latitude))
        )
    )`);

        // Debug input parameter
        console.log('[findNearest] Params:', { userLat, userLng, radiusKm, page, limit });

        const result = await models.hospitals.findAndCountAll({
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
            order: [[sequelize.col('distance'), 'ASC']],
            limit,
            offset
        });

        // Debug output distance
        console.log('[findNearest] Result:', result.rows.map(r => ({
            id: r.id,
            name: r.name,
            latitude: r.latitude,
            longitude: r.longitude,
            distance: r.dataValues.distance
        })));

        return result;
    }

    async update(id, data) {
        return await models.hospitals.update(data, { where: { id } });
    }

    async delete(id) {
        return await models.hospitals.destroy({ where: { id } });
    }
}

module.exports = HospitalsRepository;