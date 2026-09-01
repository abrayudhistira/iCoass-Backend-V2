const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserUseCase {
    constructor(usersRepository, userTokenRepository) {
        this.usersRepository = usersRepository;
        this.userTokenRepository = userTokenRepository;
    }

    async register(data) {
        // Validasi input sederhana
        if (!data.username) throw new Error("Username wajib diisi");
        if (!data.email || !data.password) throw new Error("Email dan password wajib diisi");

        // Cek apakah username sudah digunakan
        const existingUsername = await this.usersRepository.findByUsername(data.username);
        if (existingUsername) throw new Error("Username sudah terdaftar, silakan gunakan username lain");

        // Cek apakah email sudah digunakan
        const existingEmail = await this.usersRepository.findByEmail(data.email);
        if (existingEmail) throw new Error("Email sudah terdaftar, silakan gunakan email lain");

        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(data.password, salt);

        return await this.usersRepository.create({
            ...data,
            password: hashedPassword,
            role: 'patient'
        });
    }

    // async login(email, password) {
    //     const user = await this.usersRepository.findByEmail(email);
    //     if (!user) throw new Error("Akun tidak ditemukan");

    //     const isMatch = await bcrypt.compare(password, user.password);
    //     if (!isMatch) throw new Error("Password salah");

    //     const token = jwt.sign(
    //         { id: user.id, role: user.role },
    //         process.env.JWT_SECRET,
    //         { expiresIn: '24h' }
    //     );

    //     return { token, user: { id: user.id, username: user.username, role: user.role } };
    // }

    // async login(username, password) {
    //     // Cari berdasarkan username, bukan email
    //     const user = await this.usersRepository.findByUsername(username);
    //     if (!user) throw new Error("Username tidak ditemukan");

    //     const isMatch = await bcrypt.compare(password, user.password);
    //     if (!isMatch) throw new Error("Password salah");

    //     const token = jwt.sign(
    //         { id: user.id, role: user.role },
    //         process.env.JWT_SECRET,
    //         { expiresIn: '24h' }
    //     );

    //     return {
    //         token,
    //         user: {
    //             id: user.id,
    //             username: user.username,
    //             email: user.email,
    //             full_name: user.full_name,
    //             role: user.role
    //         }
    //     };
    // }

    // async login(username, password) {
    //     const user = await this.usersRepository.findByUsername(username);
    //     if (!user) throw new Error("Username tidak ditemukan");

    //     const isMatch = await bcrypt.compare(password, user.password);
    //     if (!isMatch) throw new Error("Password salah");

    //     // 1. Generate Access Token (Short-lived: 15m)
    //     const accessToken = jwt.sign(
    //         { id: user.id, role: user.role },
    //         process.env.JWT_SECRET,
    //         { expiresIn: '15m' }
    //     );

    //     // 2. Generate Refresh Token (Long-lived: 7d)
    //     const refreshToken = jwt.sign(
    //         { id: user.id },
    //         process.env.REFRESH_TOKEN_SECRET,
    //         { expiresIn: '7d' }
    //     );

    //     await this.userTokenRepository.revokeAllUserTokens(user.id);

    //     // 3. Simpan Refresh Token ke DB melalui Repository
    //     await this.userTokenRepository.createToken({
    //         user_id: user.id,
    //         refresh_token: refreshToken,
    //         expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 hari
    //     });

    //     return {
    //         accessToken,
    //         refreshToken,
    //         user: { id: user.id, username: user.username, role: user.role }
    //     };
    // }

    // async login(username, password) {
    //     const user = await this.usersRepository.findByUsername(username);
    //     if (!user) throw new Error("Username tidak ditemukan");

    //     const isMatch = await bcrypt.compare(password, user.password);
    //     if (!isMatch) throw new Error("Password salah");

    //     // --- LOGIC STRICT SINGLE DEVICE ---
    //     // Batalkan semua token lama sebelum buat yang baru
    //     await this.userTokenRepository.revokeAllUserTokens(user.id);
    //     // ----------------------------------

    //     const accessToken = jwt.sign(
    //         { id: user.id, role: user.role },
    //         process.env.JWT_SECRET,
    //         { expiresIn: '15m' }
    //     );

    //     const refreshToken = jwt.sign(
    //         { id: user.id },
    //         process.env.REFRESH_TOKEN_SECRET,
    //         { expiresIn: '7d' }
    //     );

    //     await this.userTokenRepository.createToken({
    //         user_id: user.id,
    //         refresh_token: refreshToken,
    //         expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    //     });

    //     return { accessToken, refreshToken, user: { id: user.id, username: user.username, full_name: user.full_name ,role: user.role } };
    // }

    async login(username, password) {
        // 1. Validasi keberadaan user berdasarkan username
        const user = await this.usersRepository.findByUsername(username);
        if (!user) throw new Error("Username tidak ditemukan");

        // 2. Validasi kecocokan password menggunakan bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Password salah");

        // =========================================================================
        // --- LOGIC STRICT SINGLE DEVICE WITH GARBAGE COLLECTION (PENDEKATAN B) ---
        // =========================================================================

        // Step A: Ubah status semua token aktif lama milik user menjadi revoked (is_revoked = 1)
        await this.userTokenRepository.revokeAllUserTokens(user.id);

        // Step B: Jalankan Garbage Collection untuk menghapus token lama yang sudah tidak valid dari DB
        await this.userTokenRepository.deleteExpiredAndRevokedTokens(user.id);

        // =========================================================================

        // 3. Generate Access Token (Masa aktif singkat: 15 menit)
        const accessToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // 4. Generate Refresh Token (Masa aktif lama: 7 hari)
        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        // 5. Simpan Refresh Token baru ke database (is_revoked secara default bernilai 0)
        await this.userTokenRepository.createToken({
            user_id: user.id,
            refresh_token: refreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        // 6. Kembalikan payload data untuk kebutuhan client (Flutter)
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role
            }
        };
    }

    async updateProfile(targetId, currentUserId, currentUserRole, updateData) {
        // Aturan Bisnis: Hanya pemilik akun atau Admin yang boleh melakukan update
        if (currentUserRole !== 'admin' && targetId != currentUserId) {
            throw new Error("Akses dilarang: Anda tidak memiliki otoritas untuk mengubah data ini");
        }

        // Hanya hash jika password dikirim dan tidak kosong
        if (updateData.password && updateData.password.trim() !== "") {
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
            const salt = await bcrypt.genSalt(saltRounds);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        } else {
            // Hapus property password dari object agar tidak menimpa password lama dengan string kosong/null
            delete updateData.password;
        }

        return await this.usersRepository.update(targetId, updateData);
    }

    async getAllUsers(excludeId) {
        return await this.usersRepository.findAllExcept(excludeId);
    }

    async getUserById(id) {
        const user = await this.usersRepository.findById(id);
        if (!user) throw new Error("User tidak ditemukan");
        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                birth_date: user.birth_date,
                gender: user.gender,
                address: user.address,
                role: user.role,
                createdAt: user.createdAt
            }
        };
    }

    async deleteUser(targetId, adminId) {
        if (targetId == adminId) {
            throw new Error("Anda tidak dapat menghapus akun Anda sendiri");
        }

        const user = await this.usersRepository.findById(targetId);
        if (!user) {
            throw new Error("User tidak ditemukan");
        }

        // Level 1: Hapus semua token user terlebih dahulu (Application-level cascade)
        await this.userTokenRepository.deleteAllUserTokens(targetId);

        return await this.usersRepository.delete(targetId);
    }
    async refreshAccessToken(token) {
        // Cek di DB
        const savedToken = await this.userTokenRepository.findByToken(token);
        if (!savedToken) throw new Error("Refresh token tidak valid atau sudah logout");

        // Verifikasi JWT
        // const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, { algorithms: ['HS256'] });
        const user = await this.usersRepository.findById(decoded.id);

        // Generate Access Token baru
        const newAccessToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        return { accessToken: newAccessToken };
    }

    async logout(token) {
        return await this.userTokenRepository.revokeToken(token);
    }
}

module.exports = UserUseCase;