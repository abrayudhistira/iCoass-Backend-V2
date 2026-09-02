const { NotFoundError, ValidationError } = require('../domain/errors/AppError');

class HospitalUseCase {
    constructor(hospitalsRepository, sequelize) {
        this.hospitalsRepository = hospitalsRepository;
        this.sequelize = sequelize;
    }

    async getHospitals(params) {
        const { latitude, longitude, radius, page, limit } = params;

        // Enforce max limit to prevent memory exhaustion
        const safeLimit = Math.min(parseInt(limit) || 10, 100);
        const safePage = Math.max(1, parseInt(page) || 1);

        if (latitude && longitude) {
            const searchRadius = parseFloat(radius) || 10;
            return await this.hospitalsRepository.findNearest(
                parseFloat(latitude),
                parseFloat(longitude),
                searchRadius,
                safePage,
                safeLimit
            );
        }

        return await this.hospitalsRepository.findAll(safePage, safeLimit);
    }

    async getHospitalById(id) {
        const hospital = await this.hospitalsRepository.findById(id);
        if (!hospital) throw new NotFoundError("Rumah sakit");
        return hospital;
    }

    async createHospital(data) {
        if (!data.name || !data.latitude || !data.longitude) {
            throw new ValidationError("Nama, Latitude, dan Longitude wajib diisi");
        }
        return await this.sequelize.transaction(async (t) => {
            return await this.hospitalsRepository.create(data, t);
        });
    }

    async updateHospital(id, data) {
        return await this.sequelize.transaction(async (t) => {
            const hospital = await this.hospitalsRepository.findById(id, t);
            if (!hospital) throw new NotFoundError("Rumah sakit");
            await this.hospitalsRepository.update(id, data, t);
            return await this.hospitalsRepository.findById(id, t);
        });
    }

    async deleteHospital(id) {
        return await this.sequelize.transaction(async (t) => {
            const hospital = await this.hospitalsRepository.findById(id, t);
            if (!hospital) throw new NotFoundError("Rumah sakit");
            return await this.hospitalsRepository.delete(id, t);
        });
    }
}

module.exports = HospitalUseCase;