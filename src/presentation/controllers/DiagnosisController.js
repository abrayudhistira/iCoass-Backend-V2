const { ValidationError } = require('../../domain/errors/AppError');

class DiagnosisController {
    constructor(DiagnosisUseCase) {
        this.useCase = DiagnosisUseCase;
    }

    diagnose = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { symptoms } = req.body;

            if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
                throw new ValidationError("Daftar kode gejala (symptoms) wajib dikirim dalam bentuk array");
            }

            const result = await this.useCase.executeDiagnosis(userId, symptoms);

            res.status(201).json({
                success: true,
                message: "Diagnosa berhasil dilakukan",
                data: result
            });
        } catch (err) {
            next(err);
        }
    };

    getHistory = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await this.useCase.getUserHistory(userId, page, limit);
            res.json({
                success: true,
                data: result.rows,
                meta: {
                    totalData: result.count,
                    currentPage: page,
                    totalPages: Math.ceil(result.count / limit)
                }
            });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = DiagnosisController;