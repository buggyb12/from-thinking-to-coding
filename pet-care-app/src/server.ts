import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, _res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] [SERVER] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Pet Care App API',
    version: '1.0.0',
    endpoints: {
      health: '/health'
    }
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response) => {
  const timestamp = new Date().toLocaleTimeString();
  console.error(`[${timestamp}] [ERROR]`, err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] [SERVER] Server running on port ${PORT}`);
});

export default server;
