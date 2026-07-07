const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'iCoass API Documentation',
    description: 'Dokumentasi Otomatis Backend iCoass - Sistem Diagnosa Penyakit Gigi',
  },
  host: 'localhost:3000',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Masukkan Token dengan format: Bearer <token>'
    }
  }
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./app.js']; // Point ke file utama dimana rute didaftarkan

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    console.log("✅ Swagger output generated!");
});