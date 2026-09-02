# Error Code Reference

Dokumentasi standar kode error untuk iCoass Backend.  
Semua error response mengikuti format terstruktur:

```json
{
  "success": false,
  "code": "ERR_*",
  "message": "Human-readable description",
  "details": null | object
}
```

---

## Kategori Error

| Kode | HTTP Status | Kelas | Kapan Digunakan |
|------|-------------|-------|-----------------|
| `ERR_VALIDATION` | 400 | `ValidationError` | Input tidak valid, field wajib kosong, format salah |
| `ERR_UNAUTHORIZED` | 401 | `UnauthorizedError` | Token tidak valid, expired, atau tidak ada |
| `ERR_FORBIDDEN` | 403 | `ForbiddenError` | Akses ditolak (role mismatch, bukan pemilik resource) |
| `ERR_NOT_FOUND` | 404 | `NotFoundError` | Resource tidak ditemukan (user, article, hospital, dll) |
| `ERR_CONFLICT` | 409 | `ConflictError` | Duplikasi data (email/username sudah terdaftar, duplicate request) |
| `ERR_INTERNAL` | 500 | `InternalServerError` | Kesalahan server tak terduga (DB down, python service error, bug) |

---

## Daftar Lengkap Error Code per Modul

### 1. Authentication (`/api/register`, `/api/login`, `/api/refresh-token`, `/api/logout`)

| Situasi | Code | Message | Details |
|---------|------|---------|---------|
| Username kosong | `ERR_VALIDATION` | "Username wajib diisi" | `{ field: "username" }` |
| Email kosong | `ERR_VALIDATION` | "Email dan password wajib diisi" | `{ field: "email" }` |
| Password kosong | `ERR_VALIDATION` | "Email dan password wajib diisi" | `{ field: "password" }` |
| Username sudah terdaftar | `ERR_CONFLICT` | "Username sudah terdaftar, silakan gunakan username lain" | `{ field: "username" }` |
| Email sudah terdaftar | `ERR_CONFLICT` | "Email sudah terdaftar, silakan gunakan email lain" | `{ field: "email" }` |
| Username tidak ditemukan | `ERR_NOT_FOUND` | "Username tidak ditemukan" | `{ field: "username" }` |
| Password salah | `ERR_VALIDATION` | "Password salah" | `{ field: "password" }` |
| Refresh token tidak dikirim | `ERR_VALIDATION` | "Token diperlukan" | `{ field: "refreshToken" }` |
| Refresh token invalid/revoked | `ERR_VALIDATION` | "Refresh token tidak valid atau sudah logout" | - |
| User dari token tidak ditemukan | `ERR_NOT_FOUND` | "User tidak ditemukan" | - |

---

### 2. User Profile (`/api/users/:id`)

| Situasi | Code | Message | Details |
|---------|------|---------|---------|
| Akses tidak diizinkan (bukan pemilik & bukan admin) | `ERR_FORBIDDEN` | "Anda tidak memiliki otoritas untuk mengubah data ini" | - |
| User target tidak ditemukan | `ERR_NOT_FOUND` | "User tidak ditemukan" | - |
| Password baru terlalu pendek (validasi FE) | `ERR_VALIDATION` | "Password minimal 8 karakter" | `{ field: "password" }` |

---

### 3. Chat (`/api/chat/*`, Socket Events)

| Situasi | Code | Message | Details |
|---------|------|---------|---------|
| User sudah punya antrian pending/active | `ERR_CONFLICT` | "Anda sudah memiliki sesi konsultasi yang aktif" | - |
| Antrian tidak ditemukan | `ERR_NOT_FOUND` | "Antrian tidak ditemukan" | - |
| Antrian sudah diambil admin lain | `ERR_VALIDATION` | "Antrian sudah diambil admin lain atau tidak lagi pending" | - |
| Chat room tidak aktif/tidak ditemukan | `ERR_VALIDATION` | "Chat room tidak aktif atau tidak ditemukan" | - |
| Sesi sudah ditutup sebelumnya | `ERR_CONFLICT` | "Sesi sudah ditutup sebelumnya" | - |
| Socket: User ID tidak valid | `ERR_VALIDATION` | "User ID tidak valid" | - |
| Socket: Field kosong (sender_id, room_id, message_text) | `ERR_VALIDATION` | "Sender ID, Room ID, dan Message text tidak boleh kosong" | `{ fields: ["sender_id", "room_id", "message_text"] }` |

---

### 4. Articles (`/api/articles/*`)

| Situasi | Code | Message | Details |
|---------|------|---------|---------|
| Judul < 5 karakter | `ERR_VALIDATION` | "Judul minimal 5 karakter" | `{ field: "title" }` |
| Konten kosong | `ERR_VALIDATION` | "Konten artikel tidak boleh kosong" | `{ field: "content" }` |
| Artikel tidak ditemukan | `ERR_NOT_FOUND` | "Artikel tidak ditemukan" | - |

---

### 5. Hospitals (`/api/hospitals/*`)

| Situasi | Code | Message | Details |
|---------|------|---------|---------|
| Nama, Latitude, Longitude wajib | `ERR_VALIDATION` | "Nama, Latitude, dan Longitude wajib diisi" | `{ fields: ["name", "latitude", "longitude"] }` |
| Rumah sakit tidak ditemukan | `ERR_NOT_FOUND` | "Rumah sakit tidak ditemukan" | - |

---

### 6. Diagnosis (`/api/diagnosis`)

| Situasi | Code | Message | Details |
|---------|------|---------|---------|
| `symptoms` bukan array kosong | `ERR_VALIDATION` | "Daftar kode gejala (symptoms) wajib dikirim dalam bentuk array" | `{ field: "symptoms" }` |
| Python service error / timeout | `ERR_INTERNAL` | "Gagal mendapatkan diagnosa dari engine Naive Bayes" | `{ originalError: "..." }` |
| Riwayat diagnosis tidak ditemukan | `ERR_NOT_FOUND` | "Riwayat Diagnosis tidak ditemukan" | - |

---

### 7. Rate Limiting (Middleware)

| Situasi | Code | Message |
|---------|------|---------|
| Melebihi batas auth (5 req/menit) | `ERR_VALIDATION` | "Terlalu banyak percobaan login/registrasi, silakan coba lagi dalam 1 menit." |
| Melebihi batas diagnosis (10 req/5menit) | `ERR_VALIDATION` | "Terlalu banyak permintaan diagnosis, silakan coba lagi dalam 5 menit." |
| Melebihi batas general (100 req/15menit) | `ERR_VALIDATION` | "Terlalu banyak request dari IP ini, silakan coba lagi nanti." |

> **Note:** Rate limit menggunakan `express-rate-limit` yang mengembalikan status **429 Too Many Requests** dengan format message di atas. Header `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` ikut terkirim.

---

### 8. JWT & Token (Middleware `AuthMiddleware`)

| Situasi | Code | Message |
|---------|------|---------|
| Token tidak ada (header Authorization missing) | `ERR_UNAUTHORIZED` | "Akses ditolak, token tidak tersedia" |
| Token format salah (bukan Bearer) | `ERR_UNAUTHORIZED` | "Format token tidak valid" |
| Token expired | `ERR_UNAUTHORIZED` | "Token sudah kadaluarsa" |
| Token invalid (signature/tampered) | `ERR_UNAUTHORIZED` | "Token tidak valid" |
| Algoritma tidak diizinkan (bukan HS256) | `ERR_UNAUTHORIZED` | "Algoritma token tidak diizinkan" |

---

## Implementasi di Kode

### Melempar Error di UseCase
```javascript
const { ValidationError, NotFoundError, ConflictError, ForbiddenError, InternalServerError } = require('../domain/errors/AppError');

// Validasi input
if (!data.username) throw new ValidationError("Username wajib diisi", { field: "username" });

// Resource tidak ditemukan
const user = await this.usersRepository.findById(id, t);
if (!user) throw new NotFoundError("User");

// Duplikasi
if (existing) throw new ConflictError("Email sudah terdaftar");

// Akses ditolak
if (user.role !== 'admin') throw new ForbiddenError("Hanya admin yang boleh menghapus");

// Error internal tak terduga
throw new InternalServerError("Gagal menghubungi layanan AI");
```

### Menangkap Error di Controller / Socket
```javascript
// Controller (Express)
async register(req, res, next) {
  try {
    const user = await this.useCase.register(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error); // Diteruskan ke Global Error Handler di app.js
  }
}

// Socket (Socket.io)
socket.on("request_chat", async (data) => {
  try {
    const room = await chatUseCase.createQueue(userId);
    socket.emit("queue_created", { roomId: room.id });
  } catch (err) {
    const errorMessage = err instanceof AppError ? err.message : "Terjadi kesalahan pada server";
    const errorCode = err instanceof AppError ? err.code : "SERVER_ERROR";
    socket.emit("error_response", { message: errorMessage, code: errorCode });
  }
});
```

---

## Global Error Handler (`app.js`)

```javascript
const { AppError } = require('./src/domain/errors/AppError');

app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      details: err.details
    });
  }

  console.error('💥 UNHANDLED ERROR:', err);
  return res.status(500).json({
    success: false,
    code: 'ERR_INTERNAL',
    message: 'Terjadi kesalahan internal server'
  });
});
```

---

## Best Practices untuk Frontend (Flutter)

1. **Selalu cek `success: false`** sebelum parse `data`.
2. **Gunakan `code` untuk logic branching**, jangan hardcode string `message`.
   ```dart
   switch (response['code']) {
     case 'ERR_CONFLICT': // handle duplicate
     case 'ERR_VALIDATION': // show field errors
     case 'ERR_UNAUTHORIZED': // redirect to login
     case 'ERR_FORBIDDEN': // show "Tidak punya akses"
     case 'ERR_NOT_FOUND': // show 404 UI
     default: // generic error
   }
   ```
3. **Tampilkan `details.field`** untuk highlight form field yang error.
4. **Rate limit (429)**: Implementasikan exponential backoff + tampilkan countdown dari header `RateLimit-Reset`.

---

## Referensi Kode Sumber

- `src/domain/errors/AppError.js` — Definisi kelas error
- `src/application/usecase/*.js` — Penggunaan `throw new XxxError(...)`
- `src/presentation/middlewares/RateLimitMiddleware.js` — Rate limit messages
- `src/presentation/middlewares/AuthMiddleware.js` — JWT error messages
- `app.js` — Global error handler