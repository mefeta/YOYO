import { Request, Response, NextFunction } from 'express';
declare const JWT_SECRET: string;
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export { JWT_SECRET };
//# sourceMappingURL=auth.d.ts.map