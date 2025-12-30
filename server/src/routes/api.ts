import { Router, Response } from 'express';
import { AuthenticatedRequest, verifyToken } from '../middleware/auth';

const router = Router();

/**
 * GET /api/profile
 * Protected route - returns authenticated user info
 */
router.get('/profile', verifyToken, (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    res.json({
        uid: user.uid,
        email: user.email,
        name: user.name || null,
        picture: user.picture || null,
        emailVerified: user.email_verified,
    });
});

/**
 * GET /api/protected
 * Example protected endpoint
 */
router.get('/protected', verifyToken, (req: AuthenticatedRequest, res: Response) => {
    res.json({
        message: 'This is protected data',
        user: req.user?.email,
        timestamp: new Date().toISOString(),
    });
});

/**
 * GET /api/health
 * Public health check endpoint
 */
router.get('/health', (_req, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

export default router;
