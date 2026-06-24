import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'yoyo-dev-secret-key-change-in-production';
export function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const token = auth.slice(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
export { JWT_SECRET };
//# sourceMappingURL=auth.js.map