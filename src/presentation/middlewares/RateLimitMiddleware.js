const rateLimit = require('express-rate-limit');

// Standard rate limiter for general API endpoints
// 100 requests per 15 minutes (900 seconds) per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Terlalu banyak request dari IP ini, silakan coba lagi nanti.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

// Strict rate limiter for authentication endpoints
// 5 requests per 1 minute (60 seconds) per IP
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login/registrasi, silakan coba lagi dalam 1 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

// Strict rate limiter for diagnosis endpoint (AI service protection)
// 10 requests per 5 minutes (300 seconds) per IP
const diagnosisLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Terlalu banyak permintaan diagnosis, silakan coba lagi dalam 5 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  diagnosisLimiter,
};