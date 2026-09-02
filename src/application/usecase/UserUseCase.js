const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ValidationError, ConflictError, NotFoundError, ForbiddenError, InternalServerError } = require('../../domain/errors/AppError');

class UserUseCase {
    constructor(usersRepository, userTokenRepository, sequelize) {
        this.usersRepository = usersRepository;
        this.userTokenRepository = userTokenRepository;
        this.sequelize = sequelize;
    }

    async register(data) {
        return await this.sequelize.transaction(async (t) => {
            // Validasi input sederhana
            if (!data.username) throw new ValidationError("Username wajib diisi");
            if (!data.email || !data.password) throw new ValidationError("Email dan password wajib diisi");

            // Cek apakah username sudah digunakan
            const existingUsername = await this.usersRepository.findByUsername(data.username, t);
            if (existingUsername) throw new ConflictError("Username sudah terdaftar, silakan gunakan username lain");

            // Cek apakah email sudah digunakan
            const existingEmail = await this.usersRepository.findByEmail(data.email, t);
            if (existingEmail) throw new ConflictError("Email sudah terdaftar, silakan gunakan email lain");

            const saltRounds = Math.max(10, Math.min(15, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12));
            const salt = await bcrypt.genSalt(saltRounds);
            const hashedPassword = await bcrypt.hash(data.password, salt);

            const newUser = await this.usersRepository.create({
                ...data,
                password: hashedPassword,
                role: 'patient'
            }, t);
            return newUser;
        });
    }

    async login(username, password) {
        return await this.sequelize.transaction(async (t) => {
            // 1. Validasi keberadaan user berdasarkan username
            const user = await this.usersRepository.findByUsername(username, t);
            if (!user) throw new NotFoundError("Username");

            // 2. Validasi kecocokan password menggunakan bcrypt
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) throw new ValidationError("Password salah");

            // --- LOGIC STRICT SINGLE DEVICE WITH GARBAGE COLLECTION ---
            // Step A: Ubah status semua token aktif lama milik user menjadi revoked (is_revoked = 1)
            await this.userTokenRepository.revokeAllUserTokens(user.id, t);

            // Step B: Jalankan Garbage Collection untuk menghapus token lama yang sudah tidak valid dari DB
            // Note: deleteExpiredAndRevokedTokens will handle both expired and revoked, so revokeAll is done for logic clarity
            await this.userTokenRepository.deleteExpiredAndRevokedTokens(user.id, t);

            // 3. Generate Access Token (Masa aktif singkat: 15 menit)
            const accessToken = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { algorithms: ['HS256'], expiresIn: '15m' }
            );

            // 4. Generate Refresh Token (Masa aktif lama: 7 hari)
            const refreshToken = jwt.sign(
                { id: user.id },
                process.env.REFRESH_TOKEN_SECRET,
                { algorithms: ['HS256'], expiresIn: '7d' }
            );

            // 5. Simpan Refresh Token baru ke database (is_revoked secara default bernilai 0)
            await this.userTokenRepository.createToken({
                user_id: user.id,
                refresh_token: refreshToken,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 hari
            }, t);

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
        });
    }

    async updateProfile(targetId, currentUserId, currentUserRole, updateData) {
        // Aturan Bisnis: Hanya pemilik akun atau Admin yang boleh melakukan update
        if (currentUserRole !== 'admin' && targetId != currentUserId) {
            throw new ForbiddenError("Anda tidak memiliki otoritas untuk mengubah data ini");
        }

        return await this.sequelize.transaction(async (t) => {
            const user = await this.usersRepository.findById(targetId, t);
            if (!user) {
                throw new NotFoundError("User");
            }

            // Hanya hash jika password dikirim dan tidak kosong
            if (updateData.password && updateData.password.trim() !== "") {
                const saltRounds = Math.max(10, Math.min(15, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12));
                const salt = await bcrypt.genSalt(saltRounds);
                updateData.password = await bcrypt.hash(updateData.password, salt);
            } else {
                // Hapus property password dari object agar tidak menimpa password lama dengan string kosong/null
                delete updateData.password;
            }

            await this.usersRepository.update(targetId, updateData, t);
            // Fetch updated user to return latest data
            return await this.usersRepository.findById(targetId, t);
        });
    }

    async getAllUsers(excludeId) {
        return await this.usersRepository.findAllExcept(excludeId);
    }

    async getUserById(id) {
        const user = await this.usersRepository.findById(id);
        if (!user) throw new NotFoundError("User");
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
        return await this.sequelize.transaction(async (t) => {
            if (targetId == adminId) {
                throw new ForbiddenError("Anda tidak dapat menghapus akun Anda sendiri");
            }

            const user = await this.usersRepository.findById(targetId, t);
            if (!user) {
                throw new NotFoundError("User");
            }

            // Level 1: Hapus semua token user terlebih dahulu (Application-level cascade)
            await this.userTokenRepository.deleteAllUserTokens(targetId, t);

            return await this.usersRepository.delete(targetId, t);
        });
    }

    async refreshAccessToken(token) {
        // Cek di DB
        const savedToken = await this.userTokenRepository.findByToken(token);
        if (!savedToken) throw new new ValidationError("Refresh token tidak valid atau sudah logout"); // Typo fixed

        // Verifikasi JWT
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, { algorithms: ['HS256'] });
        const user = await this.usersRepository.findById(decoded.id);
        if (!user) throw new NotFoundError("User");

        // Generate Access Token baru
        const newAccessToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { algorithms: ['HS256'], expiresIn: '15m' }
        );

        return { accessToken: newAccessToken };
    }

    async logout(token) {
        return await this.userTokenRepository.revokeToken(token);
    }
}

module.exports = UserUseCase;