const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
      evict: 1000
    },
    define: {
      timestamps: false // Matikan jika tabelmu tidak punya kolom createdAt/updatedAt
    }
  }
);

sequelize.authenticate()
  .then(() => console.log('DB Connected.'))
  .catch(err => console.error('DB Not Connected, : ', err));

module.exports = sequelize;