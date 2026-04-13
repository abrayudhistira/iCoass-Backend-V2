const { body, validationResult } = require('express-validator');

const validateHospital = [
    body('name')
        .notEmpty().withMessage('Nama rumah sakit tidak boleh kosong')
        .isLength({ max: 150 }).withMessage('Nama maksimal 150 karakter'),
    
    body('address')
        .notEmpty().withMessage('Alamat tidak boleh kosong'),
    
    body('latitude')
        .optional({ checkFalsy: true })
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude harus berupa angka antara -90 sampai 90'),
    
    body('longitude')
        .optional({ checkFalsy: true })
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude harus berupa angka antara -180 sampai 180'),
    
    body('phone')
        .optional({ checkFalsy: true })
        .isLength({ max: 20 }).withMessage('Nomor telepon maksimal 20 karakter'),

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

module.exports = { validateHospital };