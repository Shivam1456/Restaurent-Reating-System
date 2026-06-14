import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Route files
import authRouter from './routes/auth.routes';
import adminRouter from './routes/admin.routes';
import storeRouter from './routes/store.routes';
import ratingRouter from './routes/rating.routes';
import storeOwnerRouter from './routes/store-owner.routes';

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// API Routers
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/stores', storeRouter);
app.use('/ratings', ratingRouter);
app.use('/store-owner', storeOwnerRouter);

// Page Not Found fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

export default app;
