import { Request, Response, NextFunction } from 'express';
import admin from '../firebase-admin';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}

/**
 * Middleware to verify Firebase ID token from Authorization header
 * Expects: Authorization: Bearer <ID_TOKEN>
 */
export const verifyToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or invalid Authorization header. Expected: Bearer <token>'
        });
        return;
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token'
        });
    }
};
