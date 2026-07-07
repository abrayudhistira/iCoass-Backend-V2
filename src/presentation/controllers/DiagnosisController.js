const DiagnosisRepository = require("../../infrastructure/repositories/DiagnosisRepository");
const DiagnosisUseCase = require("../../application/usecase/DiagnosisUseCase");

class DiagnosisController {
    constructor(DiagnosisUseCase){
        this.useCase = DiagnosisUseCase;
    }

    diagnose = async (req, res) => {
        try {
            const userId = req.user.id;
            const { symptoms } = req.body; // Menggunakan key 'symptoms' sesuai request baru kamu

            if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Daftar kode gejala (symptoms) wajib dikirim dalam bentuk array" 
                });
            }

            const result = await this.useCase.executeDiagnosis(userId, symptoms);
            
            res.status(201).json({ 
                success: true, 
                message: "Diagnosa berhasil dilakukan",
                data: result 
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    };

    getHistory = async (req, res) => {
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
            res.status(500).json({ success: false, message: err.message });
        }
    };
}

module.exports = DiagnosisController;