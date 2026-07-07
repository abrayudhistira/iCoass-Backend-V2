/**
 * Middleware untuk memvalidasi kepemilikan data (Ownership Validation).
 * Memastikan user hanya dapat mengakses data miliknya sendiri.
 * * Mekanisme Kerja:
 * 1. Mengambil ID dari parameter rute (misal: /api/profile/:id)
 * 2. Membandingkannya dengan ID yang terenkripsi dalam token JWT (req.user.id)
 * 3. Jika cocok, akses diberikan. Jika tidak, akses ditolak (403 Forbidden).
 */

const selfMiddleware = (req, res, next) => {
    try {
        // ID user yang sedang login (didapat dari authMiddleware)
        const authenticatedUserId = req.user.id;
        
        // ID user yang dituju pada parameter request (misal: /users/:id)
        const requestedUserId = req.params.id;

        // Validasi Eksistensi: Pastikan req.user telah terisi oleh authMiddleware
        if (!authenticatedUserId) {
            return res.status(401).json({
                success: false,
                message: "Autentikasi diperlukan: Token tidak ditemukan atau tidak valid"
            });
        }

        // Validasi Kepemilikan (Logic Perbandingan)
        // Admin biasanya diberikan pengecualian (bypass) untuk keperluan manajemen data
        if (req.user.role === 'admin' || authenticatedUserId.toString() === requestedUserId.toString()) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: "Akses dilarang: Anda tidak memiliki otoritas atas data pengguna lain"
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Kesalahan internal pada validasi otoritas",
            error: error.message
        });
    }
};

module.exports = selfMiddleware;