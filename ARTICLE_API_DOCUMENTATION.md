# Dokumentasi API Article - iCoass

Dokumentasi ini mencakup semua endpoint untuk manajemen artikel pada sistem iCoass.

**Base URL:** `http://localhost:3000/api`
**Auth:** Semua endpoint memerlukan Header `Authorization: Bearer <token>`

---

## 1. Mendapatkan Semua Artikel
Mengambil daftar seluruh artikel yang tersedia.

- **Endpoint:** `/articles`
- **Method:** `GET`
- **Roles:** `patient`, `admin`

### Response (200 OK)
```json
[
  {
    "id": 1,
    "title": "Kesehatan Gigi dan Mulut",
    "content": "Isi konten artikel...",
    "image_url": "/uploads/articles/123.jpg",
    "createdAt": "2023-10-01T10:00:00.000Z",
    "updatedAt": "2023-10-01T10:00:00.000Z"
  }
]
```

---

## 2. Mendapatkan Detail Artikel
Mengambil detail satu artikel berdasarkan ID.

- **Endpoint:** `/articles/:id`
- **Method:** `GET`
- **Roles:** `patient`, `admin`

### Response (200 OK)
```json
{
  "id": 1,
  "title": "Kesehatan Gigi dan Mulut",
  "content": "Isi konten artikel...",
  "image_url": "/uploads/articles/123.jpg",
  "createdAt": "2023-10-01T10:00:00.000Z",
  "updatedAt": "2023-10-01T10:00:00.000Z"
}
```

### Response (404 Not Found)
```json
{
  "success": false,
  "message": "Artikel tidak ditemukan"
}
```

---

## 3. Membuat Artikel Baru
Membuat artikel baru beserta unggah gambar (Khusus Admin).

- **Endpoint:** `/articles`
- **Method:** `POST`
- **Roles:** `admin`
- **Content-Type:** `multipart/form-data`

### Request Body
| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| title   | String | Yes      | Minimal 5 karakter |
| content | String | Yes      | Konten artikel |
| image   | File   | No       | File gambar (jpg/png) |

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "Cara Menyikat Gigi",
    "content": "Langkah-langkah menyikat gigi...",
    "image_url": "/uploads/articles/image-162345.jpg"
  }
}
```

---

## 4. Memperbarui Artikel
Mengupdate data artikel (Khusus Admin).

- **Endpoint:** `/articles/:id`
- **Method:** `PUT`
- **Roles:** `admin`

### Request Body (JSON)
```json
{
  "title": "Judul Baru Artikel",
  "content": "Konten yang sudah diperbarui"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Artikel berhasil diperbarui"
}
```

---

## 5. Menghapus Artikel
Menghapus data artikel dan file gambar fisiknya dari server (Khusus Admin).

- **Endpoint:** `/articles/:id`
- **Method:** `DELETE`
- **Roles:** `admin`

### Response (200 OK)
```json
{
  "success": true,
  "message": "Artikel berhasil dihapus"
}
```

### Catatan Teknis:
- Validasi `title` dilakukan di `ArticleUseCase.js` (minimal 5 karakter).
- Penghapusan gambar fisik menggunakan `fs.unlinkSync` di `ArticleUseCase.js` jika `image_url` tersedia.
- Middleware `adminMiddleware` memastikan hanya user dengan role `admin` yang bisa akses POST, PUT, dan DELETE.