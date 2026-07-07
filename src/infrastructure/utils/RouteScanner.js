const printRoutes = (app) => {
    // Trik: Akses properti router untuk memicu inisialisasi di beberapa versi Express
    const router = app._router || (app.router);
    
    if (!router || !router.stack) {
        console.log('⚠️ No routes found. Router might not be initialized yet.');
        return;
    }

    const routes = [];

    function parseStack(stack, prefix = '') {
        stack.forEach((middleware) => {
            if (middleware.route) {
                // Endpoint ditemukan
                const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
                routes.push({
                    method: methods,
                    path: prefix + middleware.route.path
                });
            } else if (middleware.name === 'router' && middleware.handle.stack) {
                // Jika ada sub-router (misal app.use('/api', router))
                const path = middleware.regexp.source
                    .replace('\\/?(?=\\/|$)', '')
                    .replace('^', '')
                    .replace('\\/', '/');
                parseStack(middleware.handle.stack, prefix + path);
            }
        });
    }

    parseStack(router.stack);

    if (routes.length > 0) {
        console.log('\n--- DAFTAR ENDPOINTS ---');
        console.table(routes);
        console.log(`Total: ${routes.length} Endpoints`);
        console.log('----------------------------\n');
    }
};

module.exports = printRoutes;