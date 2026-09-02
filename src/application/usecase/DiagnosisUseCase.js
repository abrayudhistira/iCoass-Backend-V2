const axios = require('axios');
const { InternalServerError, ValidationError, NotFoundError } = require('../../domain/errors/AppError');

class DiagnosisUseCase {
    constructor(diagnosisRepository, sequelize) {
        this.diagnosisRepository = diagnosisRepository;
        this.sequelize = sequelize;
        // Menggunakan environment variable untuk fleksibilitas
        this.pythonApiUrl = `${process.env.PYTHON_SERVICE_URL}/predict`;
    }

    async executeDiagnosis(userId, selectedSymptoms) {
        return await this.sequelize.transaction(async (t) => {
            // 1. Simpan log gejala awal (Input User)
            const symptomLog = await this.diagnosisRepository.createSymptomLog({
                user_id: userId,
                selected_symptoms: JSON.stringify(selectedSymptoms) // Format: ["AP002", "AN003"]
            }, t);

            try {
                // 2. Request ke Microservice Python
                const response = await axios.post(this.pythonApiUrl, {
                    symptoms: selectedSymptoms
                });

                // Destructuring sesuai format response Python kamu
                const { diagnosa_utama, keyakinan, kandidat_diagnosa } = response.data.hasil;

                // Parsing keyakinan "94.50%" menjadi float 94.50 untuk database (DECIMAL)
                const numericConfidence = parseFloat(keyakinan.replace('%', ''));

                // 3. Simpan hasil akhir ke diagnosis_history
                const history = await this.diagnosisRepository.createDiagnosisHistory({
                    user_id: userId,
                    symptom_log_id: symptomLog.id,
                    main_diagnosis: diagnosa_utama,
                    confidence_score: numericConfidence,
                    // Seluruh list kandidat disimpan sebagai JSON Detail
                    diagnosis_details: JSON.stringify(kandidat_diagnosa)
                }, t);

                return {
                    history_id: history.id,
                    main_diagnosis: diagnosa_utama,
                    confidence: keyakinan,
                    details: kandidat_diagnosa,
                    created_at: history.created_at
                };
            } catch (error) {
                console.error("NB Engine Error:", error.message);
                throw new InternalServerError("Gagal mendapatkan diagnosa dari engine Naive Bayes");
            }
        });
    }

    async getUserHistory(userId, page, limit) {
        const safeLimit = Math.min(parseInt(limit) || 10, 100); // Max 100 items per page
        const safePage = Math.max(1, parseInt(page) || 1);
        return await this.diagnosisRepository.findHistoryByUserId(userId, safePage, safeLimit);
    }

    async getDiagnosisById(id) {
        const diagnosis = await this.diagnosisRepository.findDiagnosisById(id);
        if (!diagnosis) throw new NotFoundError("Riwayat Diagnosis");
        return diagnosis;
    }
}

module.exports = DiagnosisUseCase;