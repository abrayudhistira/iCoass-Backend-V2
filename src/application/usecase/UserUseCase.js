const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserUseCase {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }

    async register(data) {
        // Validasi input sederhana
        if (!data.email || !data.password) throw new Error("Email dan password wajib diisi");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);

        return await this.usersRepository.create({
            ...data,
            password: hashedPassword,
            role: 'patient'
        });
    }

    async login(email, password) {
        const user = await this.usersRepository.findByEmail(email);
        if (!user) throw new Error("Akun tidak ditemukan");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Password salah");

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return { token, user: { id: user.id, username: user.username, role: user.role } };
    }

    async updateProfile(targetId, currentUserId, updateData) {
        // Aturan Bisnis: Pasien hanya boleh update data miliknya sendiri
        if (targetId != currentUserId) {
            throw new Error("Akses dilarang: Anda hanya bisa mengubah data sendiri");
        }

        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }

        return await this.usersRepository.update(targetId, updateData);
    }

    async getUserById(id) {
        const user = await this.usersRepository.findById(id);
        if (!user) throw new Error("User tidak ditemukan");
        return user;
    }

    async deleteUser(targetId, adminId) {
    if (targetId == adminId) {
        throw new Error("Anda tidak dapat menghapus akun Anda sendiri");
    }

    const user = await this.usersRepository.findById(targetId);
    if (!user) {
        throw new Error("User tidak ditemukan");
    }

    return await this.usersRepository.delete(targetId);
}
}

module.exports = UserUseCase;