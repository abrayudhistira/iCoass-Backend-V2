const adminMiddleware = (req, res, next) => {
    // req.user didapat dari authMiddleware sebelumnya
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ 
            success: false, 
            message: "Akses dilarang: Hanya Admin yang dapat melakukan tindakan ini" 
        });
    }
};

module.exports = adminMiddleware;