# Menggunakan base image Node.js versi LTS (Long Term Support) berbasis Alpine Linux untuk efisiensi ukuran image
FROM node:20-alpine

# Menetapkan direktori kerja di dalam kontainer
WORKDIR /usr/src/app

# Menyalin berkas manifes dependensi terlebih dahulu untuk memanfaatkan caching layer Docker
COPY package*.json ./

# Menginstal seluruh dependensi (termasuk devDependencies seperti nodemon)
RUN npm install

# Menyalin seluruh kode sumber dari host ke dalam kontainer
COPY . .

# Mengekspos port aplikasi (sesuaikan dengan port yang didefinisikan pada app.js atau .env Anda, misal: 3000)
EXPOSE 3003

# Menjalankan aplikasi dengan mode pengembangan
# Pisahkan "run" dan "dev" menjadi argumen terpisah
CMD ["npm", "run", "dev"]