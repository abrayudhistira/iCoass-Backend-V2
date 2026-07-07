const axios = require('axios');

class DiagnosisUseCase {
    constructor(diagnosisRepository) {
        this.diagnosisRepository = diagnosisRepository;
        // Menggunakan environment variable untuk fleksibilitas
        this.pythonApiUrl = `${process.env.PYTHON_SERVICE_URL}/predict`;
    }

    async executeDiagnosis(userId, selectedSymptoms) {
        // 1. Simpan log gejala awal (Input User)
        const symptomLog = await this.diagnosisRepository.createSymptomLog({
            user_id: userId,
            selected_symptoms: JSON.stringify(selectedSymptoms) // Format: ["AP002", "AN003"]
        });

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
            });

            return {
                history_id: history.id,
                main_diagnosis: diagnosa_utama,
                confidence: keyakinan,
                details: kandidat_diagnosa,
                created_at: history.created_at
            };
        } catch (error) {
            console.error("NB Engine Error:", error.message);
            throw new Error("Gagal mendapatkan diagnosa dari engine Naive Bayes");
        }
    }

    async getUserHistory(userId, page, limit) {
        return await this.diagnosisRepository.findHistoryByUserId(userId, page, limit);
    }
}

module.exports = DiagnosisUseCase;