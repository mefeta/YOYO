import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireRole('admin'));

// GET /api/users — list all users
router.get('/', (_req, res) => {
  try {
    const users = db.select().from(schema.users).all();
    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
    })));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users — create a new user
router.post('/', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, and role are required' });
    }
    if (!['admin', 'manager', 'agent', 'worker'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existing = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const id = uuid();
    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(password, 10);

    db.insert(schema.users).values({
      id,
      name,
      email,
      passwordHash,
      role,
      avatarUrl: null,
      createdAt: now,
    }).run();

    res.status(201).json({ id, name, email, password, role, createdAt: now });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
