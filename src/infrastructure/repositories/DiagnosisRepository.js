class DiagnosisRepository {
    constructor(diagnosisHistoryModel, userSymptomModel) {
        this.diagnosisHistoryModel = diagnosisHistoryModel;
        this.userSymptomModel = userSymptomModel;
    }

    async createSymptomLog(data, transaction = null) {
        return await this.userSymptomModel.create(data, { transaction });
    }

    async createDiagnosisHistory(data, transaction = null) {
        return await this.diagnosisHistoryModel.create(data, { transaction });
    }

    async findHistoryByUserId(userId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        return await this.diagnosisHistoryModel.findAndCountAll({
            where: { user_id: userId },
            include: [{ model: this.userSymptomModel, as: 'symptom_log' }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
    }

    async findDiagnosisById(id) {
        return await this.diagnosisHistoryModel.findByPk(id, {
            include: [{ model: this.userSymptomModel, as: 'symptom_log' }]
        });
    }
}

module.exports = DiagnosisRepository;