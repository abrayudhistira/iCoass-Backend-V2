const initModels = require("../models/init-models");
const sequelize = require("../database/sequelize");
const models = initModels(sequelize);

class DiagnosisRepository {
    async createSymptomLog(data) {
        return await models.user_symptoms.create(data);
    }

    async createDiagnosisHistory(data) {
        return await models.diagnosis_history.create(data);
    }

    async findHistoryByUserId(userId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        return await models.diagnosis_history.findAndCountAll({
            where: { user_id: userId },
            include: [{ model: models.user_symptoms, as: 'symptom_log' }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
    }

    async findDiagnosisById(id) {
        return await models.diagnosis_history.findByPk(id, {
            include: [{ model: models.user_symptoms, as: 'symptom_log' }]
        });
    }
}

module.exports = DiagnosisRepository;