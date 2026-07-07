const express = require('express');
const cors = require('cors');
require('dotenv').config();

const http = require("http");
const { Server } = require("socket.io");
const path = require('path');
const axios = require('axios');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');

// Infrastructure & Database
const sequelize = require('./src/infrastructure/database/sequelize');
const seedAdmin = require('./src/infrastructure/database/seeder');
const chatHandler = require("./src/infrastructure/socket/ChatHandler");

// --- REPOSITORIES ---
const UserTokenRepository = require('./src/infrastructure/repositories/UserTokenRepository');
const ChatRepository = require('./src/infrastructure/repositories/ChatRepository');
const UserRepository = require('./src/infrastructure/repositories/UsersRepository');
const ArticleRepository = require('./src/infrastructure/repositories/ArticlesRepository');
const DiagnosisRepository = require('./src/infrastructure/repositories/DiagnosisRepository');
const HospitalRepository = require('./src/infrastructure/repositories/HospitalRepository');

// --- USE CASES ---
const ChatUseCase = require('./src/application/usecase/ChatUseCase');
const UserUseCase = require('./src/application/usecase/UserUseCase');
const ArticleUseCase = require('./src/application/usecase/ArticleUseCase');
const DiagnosisUseCase = require('./src/application/usecase/DiagnosisUseCase');
const HospitalUseCase = require('./src/application/usecase/HospitalUsecase');

// --- CONTROLLERS ---
const ChatController = require('./src/presentation/controllers/ChatController');
const UserController = require('./src/presentation/controllers/UserController');
const ArticleController = require('./src/presentation/controllers/ArticleController');
const DiagnosisController = require('./src/presentation/controllers/DiagnosisController');
const HospitalController = require('./src/presentation/controllers/HospitalController');

// --- MIDDLEWARES ---
const authMiddleware = require('./src/presentation/middlewares/AuthMiddleware');
const adminMiddleware = require('./src/presentation/middlewares/AdminMiddleware');
const { validateUpdateProfile,validateRegister } = require('./src/presentation/middlewares/UserValidator');
const { validateHospital } = require('./src/presentation/middlewares/HospitalValidator');
const { validateArticle } = require('./src/presentation/middlewares/ArticleValidator');
const { uploadArticleImage, uploadHospitalImage } = require('./src/presentation/middlewares/UploadMiddleware');
const selfMiddleware = require('./src/presentation/middlewares/SelfMiddleware');
const logMiddleware = require('./src/presentation/middlewares/LogMiddleware');
const printRoutes = require('./src/infrastructure/utils/RouteScanner');

// 1. Inisialisasi Express & App Middlewares
const app = express();
app.use(cors());
app.use(express.json());
app.use(logMiddleware);
app.use('/api/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 2. Inisialisasi HTTP Server & Socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- DEPENDENCY INJECTION SETUP ---
const chatRepo = new ChatRepository();
const chatUseCase = new ChatUseCase(chatRepo);
const chatController = new ChatController(chatUseCase);

const userTokenRepo = new UserTokenRepository(); // Instansiasi repo token
const userRepo = new UserRepository();
// Masukkan userTokenRepo ke dalam UserUseCase
const userUseCase = new UserUseCase(userRepo, userTokenRepo); 
const userController = new UserController(userUseCase);

const articleRepo = new ArticleRepository();
const articleUseCase = new ArticleUseCase(articleRepo);
const articleController = new ArticleController(articleUseCase);

const diagnosisRepo = new DiagnosisRepository();
const diagnosisUseCase = new DiagnosisUseCase(diagnosisRepo);
const diagnosisController = new DiagnosisController(diagnosisUseCase);

const hospitalRepo = new HospitalRepository();
const hospitalUseCase = new HospitalUseCase(hospitalRepo);
const hospitalController = new HospitalController(hospitalUseCase);

const PORT = process.env.PORT;

// --- ROUTES ---

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
        micro_service: {
            status: 'UNKNOWN',
            url: `${process.env.PYTHON_SERVICE_URL}`,
        }
    };

    try {
        await sequelize.authenticate();
        try {
            const pythonResponse = await axios.get(`${process.env.PYTHON_SERVICE_URL}`, { timeout: 7000 });
            healthStatus.micro_service = {
                status: pythonResponse.data.status === 'Online' ? 'UP' : 'DOWN',
                message: pythonResponse.data.message,
                features_loaded: pythonResponse.data.total_features_loaded
            };
        } catch (pyError) {
            healthStatus.micro_service.status = 'DOWN';
            healthStatus.micro_service.error = pyError.message;
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

// Public Authentication
app.post('/api/register', validateRegister, userController.register);
app.post('/api/login', userController.login);
app.post('/api/refresh-token', userController.refreshToken);
app.post('/api/logout', authMiddleware, userController.logout);

// User & Feature Routes (Authenticated)
app.get('/api/users/:id', authMiddleware, selfMiddleware, userController.getProfile);
app.put('/api/users/:id', authMiddleware, validateUpdateProfile, userController.update);
app.get('/api/users', authMiddleware, adminMiddleware, userController.getAll);


app.get('/api/articles', authMiddleware, articleController.getAll);
app.get('/api/articles/:id', authMiddleware, articleController.getOne);

app.get('/api/hospitals', authMiddleware, hospitalController.getAll);
app.get('/api/hospitals/:id', authMiddleware, hospitalController.getOne);

app.post('/api/diagnosis', authMiddleware, diagnosisController.diagnose);
app.get('/api/diagnosis/history', authMiddleware, diagnosisController.getHistory);

// Chat Feature Routes
app.get('/api/chat/rooms', authMiddleware, chatController.getRooms);
app.get('/api/chat/messages/:roomId', authMiddleware, chatController.getMessages);
app.get('/api/chat/queues', authMiddleware, adminMiddleware, chatController.getQueues);
app.post('/api/chat/close/:roomId', authMiddleware, adminMiddleware, chatController.closeChat)

// Admin Management Routes
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, userController.delete);

app.post('/api/articles', authMiddleware, adminMiddleware, uploadArticleImage.single('image'), validateArticle, articleController.create);
app.put('/api/articles/:id', authMiddleware, adminMiddleware, validateArticle, articleController.update);
app.delete('/api/articles/:id', authMiddleware, adminMiddleware, articleController.delete);

app.post('/api/hospitals', authMiddleware, adminMiddleware, uploadHospitalImage.single('image'), validateHospital, hospitalController.create);
app.put('/api/hospitals/:id', authMiddleware, adminMiddleware, uploadHospitalImage.single('image'), validateHospital, hospitalController.update);
app.delete('/api/hospitals/:id', authMiddleware, adminMiddleware, hospitalController.delete);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- SOCKET HANDLER INTEGRATION ---
io.on("connection", (socket) => {
    console.log("Connected to Socket.io:", socket.id);
    chatHandler(io, socket, chatUseCase);
});

// --- DATABASE SYNC & SERVER STARTUP ---
sequelize.sync({ force: false })
    .then(async () => {
        console.log('✅ Database synchronized');
        await seedAdmin();
        
        server.listen(PORT, () => {
            console.log(`🚀 iCoass Backend & Real-time Server Running on port ${PORT}`);
            printRoutes(app);
        });
    })
    .catch(err => {
        console.error('❌ Database sync failed:', err);
    });