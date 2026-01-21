const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Authorization token missing'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET not configured');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach userId to request (single source of truth)
        req.userId = decoded.userId;

        next();
    } catch (err) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
};

module.exports = authMiddleware;
window.auth = new AuthService();

