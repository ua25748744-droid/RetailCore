import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api';

// Import firebase-admin to initialize on startup
import './firebase-admin';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server
    credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        name: 'RetailCore Server',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            profile: 'GET /api/profile (protected)',
            protected: 'GET /api/protected (protected)',
        },
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 RetailCore Server running on http://localhost:${PORT}`);
    console.log(`📋 API endpoints available at http://localhost:${PORT}/api`);
});
