const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/articles'); // Tempat menyimpan file
    },
    filename: (req, file, cb) => {
        // Nama file unik: timestamp + angka acak
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'article-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Hanya diperbolehkan mengunggah gambar (JPEG/JPG/PNG)!'));
    }
};

const uploadArticleImage = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const hospitalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/hospitals');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'hospital-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadHospitalImage = multer({ 
    storage: hospitalStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // Tetap 5MB
});

module.exports = { uploadArticleImage, uploadHospitalImage };