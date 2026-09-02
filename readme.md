# iCoass Backend

## Overview

iCoass Backend adalah layanan RESTful API dan real-time chat yang mendukung aplikasi iCoass. Dibangun dengan Node.js dan Express.js, backend ini mengimplementasikan Clean Architecture untuk pemisahan concern yang jelas antara Presentation, Application (Use Cases), dan Infrastructure (Repositories, Database Models).

Fungsionalitas utama meliputi:
- **Autentikasi Pengguna**: Registrasi, login, refresh token dengan JWT dan refresh token management.
- **Real-time Chat**: Komunikasi chat antara pasien dan admin/koas menggunakan Socket.io.
- **AI Diagnosis**: Integrasi dengan microservice Python untuk diagnosa awal berdasarkan gejala.
- **Manajemen Konten**: CRUD untuk artikel medis dan daftar rumah sakit.
- **Sistem Antrian**: Untuk konsultasi chat antara pasien dan admin/koas.

Backend ini didesain untuk skalabilitas dan kemudahan pemeliharaan, dengan fokus pada keamanan, performa, dan konsistensi data.

## Teknologi yang Digunakan

- **Node.js**: Runtime Environment
- **Express.js**: Web Framework
- **Socket.io**: Real-time bidirectional event-based communication
- **Sequelize ORM**: Object-Relational Mapper untuk MySQL
- **MySQL**: Database
- **bcryptjs**: Hashing password
- **jsonwebtoken**: JSON Web Token untuk autentikasi
- **Multer**: Middleware untuk handle `multipart/form-data` (file uploads)
- **axios**: HTTP client untuk integrasi microservice Python
- **express-rate-limit**: Middleware untuk pembatasan request per IP

## Arsitektur

Proyek ini mengikuti prinsip Clean Architecture dengan layer-layer utama:
- `src/presentation`: Controllers (HTTP request handling), Middlewares, Validators.
- `src/application/usecase`: Business logic (Use Cases), mengorkestrasi Repository dan Domain Errors.
- `src/infrastructure`: Implementasi detail (Database, Sequelize Models, Repositories), Socket.io handlers.
- `src/domain/errors`: Custom Error Classes untuk penanganan error yang konsisten.

## Setup Lingkungan Lokal

### 1. Kloning Repositori
```bash
git clone <URL_REPOSITORY>
cd iCoass-Skripsi/backend
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env` di root project (`backend/.env`) dan isi dengan konfigurasi berikut:
```env
PORT=3000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password # Sesuaikan dengan password MySQL Anda
DB_NAME=db_icoass

JWT_SECRET=your_jwt_secret_strong_string # Gunakan string acak dan kuat (e.g., openssl rand -base64 32)
REFRESH_TOKEN_SECRET=your_refresh_token_secret_strong_string # Gunakan string acak dan kuat
BCRYPT_SALT_ROUNDS=12 # Jumlah salt rounds untuk bcrypt (min 10, max 15)

PYTHON_SERVICE_URL=http://localhost:5000 # URL microservice Python AI (sesuaikan jika berbeda)
```

> **PENTING**: Untuk `JWT_SECRET` dan `REFRESH_TOKEN_SECRET`, generate string acak dan kuat. Jangan gunakan nilai default yang mudah ditebak.

### 4. Database Setup
Pastikan MySQL server berjalan. Backend akan secara otomatis membuat tabel jika belum ada (`sequelize.sync({ force: false })`).

Untuk local development dengan Docker Compose (saat ini dikomentari di `docker-compose.yml`):
```yaml
# docker-compose.yml
# version: '3.8'
# services:
#   db:
#     image: mysql:8.0
#     container_name: icoass-mysql
#     environment:
#       MYSQL_ROOT_PASSWORD: your_db_password
#       MYSQL_DATABASE: db_icoass
#     ports:
#       - "3306:3306"
#     volumes:
#       - db_data:/var/lib/mysql
#   python-ai:
#     build: ./path/to/your/python/service # Sesuaikan path ke Dockerfile Python service
#     container_name: icoass-python-ai
#     ports:
#       - "5000:5000"
# volumes:
#   db_data:
```

### 5. Seeding Admin User (Opsional)
Backend akan menjalankan seeder admin (`src/infrastructure/database/seeder.js`) saat startup jika database kosong. Ini akan membuat user admin default.

## Script yang Tersedia

- `npm start`: Menjalankan aplikasi Node.js dalam mode produksi.
- `npm dev`: Menjalankan aplikasi dengan `nodemon` untuk hot-reloading selama pengembangan.
- `npm swagger`: Menggenerate ulang dokumentasi Swagger API (`swagger-output.json`).

## Auto Generate Sequelize Models

Untuk meregenerasi model Sequelize dari skema database yang sudah ada:
```bash
npx sequelize-auto -h ${DB_HOST} -d ${DB_NAME} -u ${DB_USER} -x ${DB_PASSWORD} -p 3306 --dialect mysql -o "./src/infrastructure/models" -z
```
> **Catatan**: Pastikan Anda telah menginstal `sequelize-auto` secara global atau sebagai dev dependency.

## API Documentation (Swagger)

Akses dokumentasi API interaktif melalui Swagger UI setelah server berjalan:

`http://localhost:3000/api-docs`

## Error Code Reference

Untuk detail tentang kode error yang dikembalikan API, lihat dokumentasi khusus:

[ERROR-CODE.md](./error-code.md)

## Deployment

Pastikan konfigurasi environment (`.env.production`), tuning database connection pool, dan graceful shutdown sudah diperiksa untuk lingkungan produksi.
