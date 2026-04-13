const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('diagnosis_history', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    symptom_log_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_symptoms',
        key: 'id'
      }
    },
    main_diagnosis: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    confidence_score: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: false
    },
    diagnosis_details: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'diagnosis_history',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "symptom_log_id",
        using: "BTREE",
        fields: [
          { name: "symptom_log_id" },
        ]
      },
      {
        name: "idx_diag_user",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "idx_diag_main",
        using: "BTREE",
        fields: [
          { name: "main_diagnosis" },
        ]
      },
      {
        name: "idx_diag_date",
        using: "BTREE",
        fields: [
          { name: "created_at" },
        ]
      },
    ]
  });
};
