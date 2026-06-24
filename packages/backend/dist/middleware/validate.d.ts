import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
export declare function validate(schema: ZodSchema): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const createRequestSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    customerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sector: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    channel: z.ZodDefault<z.ZodOptional<z.ZodEnum<["email", "web", "api", "phone", "chatbot"]>>>;
    category: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    customerName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerCompany: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    sector: string;
    description: string;
    title: string;
    channel: "email" | "web" | "api" | "phone" | "chatbot";
    category: string;
    customerId?: string | null | undefined;
    customerName?: string | null | undefined;
    customerCompany?: string | null | undefined;
}, {
    description: string;
    title: string;
    sector?: string | undefined;
    customerId?: string | null | undefined;
    channel?: "email" | "web" | "api" | "phone" | "chatbot" | undefined;
    category?: string | undefined;
    customerName?: string | null | undefined;
    customerCompany?: string | null | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const assignSchema: z.ZodObject<{
    agentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    teamId?: string | null | undefined;
    agentId?: string | null | undefined;
}, {
    teamId?: string | null | undefined;
    agentId?: string | null | undefined;
}>;
export declare const statusSchema: z.ZodObject<{
    status: z.ZodEnum<["new", "analyzing", "assigned", "in_progress", "waiting_customer", "escalated", "resolved", "closed"]>;
}, "strip", z.ZodTypeAny, {
    status: "new" | "analyzing" | "assigned" | "in_progress" | "waiting_customer" | "escalated" | "resolved" | "closed";
}, {
    status: "new" | "analyzing" | "assigned" | "in_progress" | "waiting_customer" | "escalated" | "resolved" | "closed";
}>;
export declare const generateReportSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["operational_performance", "sla_compliance", "request_volume", "agent_performance", "customer_satisfaction"]>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type: "operational_performance" | "sla_compliance" | "request_volume" | "agent_performance" | "customer_satisfaction";
    name?: string | undefined;
    filters?: Record<string, any> | undefined;
}, {
    type: "operational_performance" | "sla_compliance" | "request_volume" | "agent_performance" | "customer_satisfaction";
    name?: string | undefined;
    filters?: Record<string, any> | undefined;
}>;
export declare const classifySchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
}, {
    title: string;
    description?: string | undefined;
}>;
export declare const recommendSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    sector: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sector?: string | undefined;
    description?: string | undefined;
    title?: string | undefined;
    category?: string | undefined;
    priority?: string | undefined;
}, {
    sector?: string | undefined;
    description?: string | undefined;
    title?: string | undefined;
    category?: string | undefined;
    priority?: string | undefined;
}>;
//# sourceMappingURL=validate.d.ts.map