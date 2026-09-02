class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode; // HTTP status
    this.code = code;             // Kode error untuk FE: "ERR_VALIDATION", "ERR_NOT_FOUND"
    this.details = details;       // Tambahan: field validation, dsb
    this.isOperational = true;    // Tandai error operasional (bukan bug)
    Error.captureStackTrace(this, this.constructor);
  }
}

// Subclass umum
class ValidationError extends AppError {
  constructor(message, details) { super(message, 400, 'ERR_VALIDATION', details); }
}
class NotFoundError extends AppError {
  constructor(resource) { super(`${resource} tidak ditemukan`, 404, 'ERR_NOT_FOUND'); }
}
class UnauthorizedError extends AppError {
  constructor(message = 'Tidak terotorisasi') { super(message, 401, 'ERR_UNAUTHORIZED'); }
}
class ForbiddenError extends AppError {
  constructor(message = 'Akses ditolak') { super(message, 403, 'ERR_FORBIDDEN'); }
}
class ConflictError extends AppError {
  constructor(message) { super(message, 409, 'ERR_CONFLICT'); }
}
class InternalServerError extends AppError {
  constructor(message = 'Terjadi kesalahan server') { super(message, 500, 'ERR_INTERNAL'); }
}

module.exports = { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, InternalServerError };