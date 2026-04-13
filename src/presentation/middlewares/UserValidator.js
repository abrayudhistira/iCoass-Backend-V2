const { body, validationResult } = require('express-validator');

const validateUser = [
    // 1. Sanitasi & Validasi Username
    body('username')
        .trim()
        .escape()
        .notEmpty().withMessage('Username tidak boleh kosong')
        .isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),

    // 2. Sanitasi & Validasi Email
    body('email')
        .isEmail().withMessage('Format email tidak valid')
        .normalizeEmail() // Mengubah ke lowercase, hapus titik di gmail, dll
        .notEmpty().withMessage('Email wajib diisi'),

    // 3. Validasi Password
    body('password')
        .isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
        .notEmpty().withMessage('Password wajib diisi'),

    // Middleware untuk menangkap error validasi
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
            });
        }
        next();
    }
];

module.exports = { validateUser };