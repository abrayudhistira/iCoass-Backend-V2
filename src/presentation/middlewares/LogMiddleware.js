module.exports = (req, res, next) => {
    const start = Date.now();

    // Listener saat request selesai
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const method = req.method;
        const url = req.originalUrl;
        
        // Warna-warni terminal sederhana (opsional)
        const color = status >= 400 ? '\x1b[31m' : '\x1b[32m'; // Merah jika error, Hijau jika sukses
        const reset = '\x1b[0m';

        console.log(`${color}[${method}]${reset} ${url} - ${status} (${duration}ms)`);
    });

    next();
};