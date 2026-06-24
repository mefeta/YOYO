import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { JWT_SECRET, authMiddleware } from '../middleware/auth.js';
import { validate, loginSchema } from '../middleware/validate.js';
const router = Router();
// Hardcoded passwords for demo accounts — hashed versions
const DEMO_PASSWORDS = {
    'admin@yoyo.ai': 'admin',
    'manager@yoyo.ai': 'manager',
    'agent@yoyo.ai': 'agent',
    'analyst@yoyo.ai': 'analyst',
    'viewer@yoyo.ai': 'viewer',
};
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        // Verify against demo passwords
        const expectedPassword = DEMO_PASSWORDS[email];
        if (!expectedPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Compare with bcrypt hash if available, fallback to plaintext
        let passwordValid = false;
        if (user.passwordHash && user.passwordHash.startsWith('$2')) {
            passwordValid = bcrypt.compareSync(password, user.passwordHash);
        }
        else {
            passwordValid = password === expectedPassword;
        }
        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate proper JWT
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/me', authMiddleware, (req, res) => {
    try {
        const user = db.select().from(schema.users).where(eq(schema.users.id, req.user.userId)).get();
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
        });
    }
    catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=auth.js.map