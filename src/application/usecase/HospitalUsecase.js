class HospitalUseCase {
    constructor(hospitalsRepository) {
        this.hospitalsRepository = hospitalsRepository;
    }

    async getHospitals(params) {
        const { latitude, longitude, radius, page, limit } = params;

        if (latitude && longitude) {
            const searchRadius = parseFloat(radius) || 10;
            return await this.hospitalsRepository.findNearest(
                parseFloat(latitude),
                parseFloat(longitude),
                searchRadius,
                parseInt(page),
                parseInt(limit)
            );
        }

        return await this.hospitalsRepository.findAll(parseInt(page), parseInt(limit));
    }

    async getHospitalById(id) {
        const hospital = await this.hospitalsRepository.findById(id);
        if (!hospital) throw new Error("Rumah sakit tidak ditemukan");
        return hospital;
    }

    async createHospital(data) {
        if (!data.name || !data.latitude || !data.longitude) {
            throw new Error("Nama, Latitude, dan Longitude wajib diisi");
        }
        return await this.hospitalsRepository.create(data);
    }

    async updateHospital(id, data) {
        await this.getHospitalById(id);
        return await this.hospitalsRepository.update(id, data);
    }

    async deleteHospital(id) {
        await this.getHospitalById(id);
        return await this.hospitalsRepository.delete(id);
    }
}

module.exports = HospitalUseCase;