const { body, validationResult } = require('express-validator');

const validateArticle = [
    body('title').trim().escape().notEmpty().withMessage('Judul wajib diisi'),
    body('content').trim().notEmpty().withMessage('Konten wajib diisi'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
        next();
    }
];

module.exports = { validateArticle };