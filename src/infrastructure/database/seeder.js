const bcrypt = require('bcryptjs');
const initModels = require("../models/init-models");
const sequelize = require("./sequelize");
const models = initModels(sequelize);

const seedAdmin = async () => {
    try {
        // Cek apakah akun admin sudah ada
        const adminExists = await models.users.findOne({ where: { role: 'admin' } });

        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('12345678', salt); // Password default admin

            await models.users.create({
                username: 'admin',
                email: 'admin@icoass.com',
                password: hashedPassword,
                role: 'admin'
            });

            console.log('✅ Default Admin created: admin@icoass.com | pass: 12345678');
        } else {
            console.log('ℹ️ Admin account already exists, skipping seed.');
        }
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
    }
};

module.exports = seedAdmin;