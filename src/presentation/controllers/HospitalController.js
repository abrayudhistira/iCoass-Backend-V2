const HospitalsRepository = require("../../infrastructure/repositories/HospitalRepository");
const HospitalUseCase = require("../../application/usecase/HospitalUsecase");

class HospitalController {
    constructor() {
        const repo = new HospitalsRepository();
        this.useCase = new HospitalUseCase(repo);
    }

    getAll = async (req, res) => {
        try {
            const { latitude, longitude, radius, page, limit } = req.query;
            
            const result = await this.useCase.getHospitals({
                latitude, longitude, radius, 
                page: page || 1, 
                limit: limit || 10
            });

            res.json({
                success: true,
                data: result.rows,
                meta: {
                    totalData: result.count,
                    currentPage: parseInt(page) || 1,
                    totalPages: Math.ceil(result.count / (parseInt(limit) || 10))
                }
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    };

    getOne = async (req, res) => {
        try {
            const hospital = await this.useCase.getHospitalById(req.params.id);
            res.json({ success: true, data: hospital });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    };

    create = async (req, res) => {
        try {
            const hospitalData = req.body;
            if (req.file) {
                hospitalData.image_url = `/uploads/hospitals/${req.file.filename}`;
            }

            const newHospital = await this.useCase.createHospital(hospitalData);
            res.status(201).json({ success: true, data: newHospital });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    };

    update = async (req, res) => {
        try {
            await this.useCase.updateHospital(req.params.id, req.body);
            res.json({ success: true, message: "Data RS berhasil diperbarui" });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    };

    delete = async (req, res) => {
        try {
            await this.useCase.deleteHospital(req.params.id);
            res.json({ success: true, message: "Data RS berhasil dihapus" });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    };
}

module.exports = new HospitalController();