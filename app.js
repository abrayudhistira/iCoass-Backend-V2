const express = require('express');
const cors = require('cors');
require('dotenv').config();

const path = require('path');
const axios = require('axios');
const sequelize = require('./src/infrastructure/database/sequelize');
const seedAdmin = require('./src/infrastructure/database/seeder');
const userController = require('./src/presentation/controllers/UserController');
const authMiddleware = require('./src/presentation/middlewares/AuthMiddleware');
const { validateUser } = require('./src/presentation/middlewares/UserValidator');
const { validateHospital } = require('./src/presentation/middlewares/HospitalValidator');
const adminMiddleware = require('./src/presentation/middlewares/AdminMiddleware');
const articleController = require('./src/presentation/controllers/ArticleController');
const { validateArticle } = require('./src/presentation/middlewares/ArticleValidator');
const { uploadArticleImage, uploadHospitalImage} = require('./src/presentation/middlewares/UploadMiddleware');
const hospitalController = require('./src/presentation/controllers/HospitalController');
const PORT = process.env.PORT;

const app = express();
app.use(cors());
app.use(express.json());


// Public
app.post('/api/register', validateUser,userController.register);
app.post('/api/login', userController.login);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
/**
 * @route   GET /health
 * @desc    Check health status of Main Service, Database, and Python Microservice
 */
app.get('/health', async (req, res) => {
    const healthStatus = {
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        main_service: {
            status: 'OK',
            database: 'CONNECTED'
        },
        microservice_python: {
            status: 'UNKNOWN',
            url: 'https://icoass.vercel.app/'
        }
    };

    try {
        // 1. Verifikasi Database
        await sequelize.authenticate();
        
        // 2. Verifikasi Python Microservice di Vercel
        try {
            const pythonResponse = await axios.get('https://icoass.vercel.app/', { timeout: 5000 });
            healthStatus.microservice_python = {
                status: pythonResponse.data.status === 'Online' ? 'UP' : 'DOWN',
                message: pythonResponse.data.message,
                features_loaded: pythonResponse.data.total_features_loaded
            };
        } catch (pyError) {
            healthStatus.microservice_python.status = 'DOWN';
            healthStatus.microservice_python.error = pyError.message;
            healthStatus.status = 'PARTIAL_DEGRADED';
        }

        res.status(healthStatus.status === 'UP' ? 200 : 207).json(healthStatus);
    } catch (error) {
        healthStatus.status = 'DOWN';
        healthStatus.main_service.status = 'ERROR';
        healthStatus.main_service.database = 'DISCONNECTED';
        healthStatus.main_service.error = error.message;
        
        res.status(503).json(healthStatus);
    }
});

// JWT VALIDATE
app.get('/api/users/:id', authMiddleware, userController.getProfile);
app.put('/api/users/:id', authMiddleware, validateUser, userController.update);
app.get('/api/articles', authMiddleware, articleController.getAll);
app.get('/api/articles/:id', authMiddleware, articleController.getOne);
app.get('/api/hospitals', authMiddleware, hospitalController.getAll);
app.get('/api/hospitals/:id', authMiddleware, hospitalController.getOne);

// Admin Routes
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, userController.delete);
//app.post('/api/articles', authMiddleware, adminMiddleware, validateArticle, articleController.create);
app.put('/api/articles/:id', authMiddleware, adminMiddleware, validateArticle, articleController.update);
app.delete('/api/articles/:id', authMiddleware, adminMiddleware, articleController.delete);
app.post('/api/articles', authMiddleware, adminMiddleware, uploadArticleImage.single('image'), validateArticle, articleController.create);
app.post('/api/hospitals', authMiddleware, adminMiddleware, uploadHospitalImage.single('image'), validateHospital, hospitalController.create);
app.put('/api/hospitals/:id', authMiddleware, adminMiddleware, uploadHospitalImage.single('image'), validateHospital, hospitalController.update);
app.delete('/api/hospitals/:id', authMiddleware, adminMiddleware, hospitalController.delete);

sequelize.sync({ force: false })
    .then(async () => {
        console.log('✅ Database synchronized');
        await seedAdmin();
        
        // TAMBAHKAN VARIABEL PORT DI SINI
        app.listen(PORT, () => {
            console.log(`🚀 iCoass Backend is Running Healthy on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Database sync failed:', err);
    });