import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    req.body = result.data;
    next();
  };
}

export const createRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().min(1, 'Description is required').max(10000),
  customerId: z.string().optional().nullable(),
  sector: z.string().optional().default('General'),
  channel: z.enum(['email', 'web', 'api', 'phone', 'chatbot']).optional().default('web'),
  category: z.string().optional().default('General'),
  customerName: z.string().optional().nullable(),
  customerCompany: z.string().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

export const assignSchema = z.object({
  agentId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
});

export const statusSchema = z.object({
  status: z.enum(['new', 'analyzing', 'assigned', 'in_progress', 'waiting_customer', 'escalated', 'resolved', 'closed']),
});

export const generateReportSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['operational_performance', 'sla_compliance', 'request_volume', 'agent_performance', 'customer_satisfaction']),
  filters: z.record(z.any()).optional(),
});

export const classifySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
});

export const recommendSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  sector: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
});
