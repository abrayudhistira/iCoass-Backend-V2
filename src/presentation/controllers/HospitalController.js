const { ValidationError } = require('../../domain/errors/AppError');

class HospitalController {
    constructor(HospitalUseCase) {
        this.useCase = HospitalUseCase;
    }

    getAll = async (req, res, next) => {
        try {
            const { latitude, longitude, radius, page, limit } = req.query;
            console.log('[HospitalController] Query:', req.query);

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
            next(err);
        }
    };

    getOne = async (req, res, next) => {
        try {
            const hospital = await this.useCase.getHospitalById(req.params.id);
            res.json({ success: true, data: hospital });
        } catch (err) {
            next(err);
        }
    };

    create = async (req, res, next) => {
        try {
            const hospitalData = req.body;
            if (req.file) {
                hospitalData.image_url = `/uploads/hospitals/${req.file.filename}`;
            }

            const newHospital = await this.useCase.createHospital(hospitalData);
            res.status(201).json({ success: true, data: newHospital });
        } catch (err) {
            next(err);
        }
    };

    update = async (req, res, next) => {
        try {
            await this.useCase.updateHospital(req.params.id, req.body);
            res.json({ success: true, message: "Data RS berhasil diperbarui" });
        } catch (err) {
            next(err);
        }
    };

    delete = async (req, res, next) => {
        try {
            await this.useCase.deleteHospital(req.params.id);
            res.json({ success: true, message: "Data RS berhasil dihapus" });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = HospitalController;