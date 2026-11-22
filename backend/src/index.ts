import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { authRouter } from './routes/auth';
import { addressesRouter, usersRouter } from './routes/users';
import { uploadsRouter } from './routes/uploads';
import { vendorsRouter } from './routes/vendors';
import { adminRouter } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './lib/prisma';

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') ?? true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: 'up' });
  } catch {
    res.status(503).json({ ok: false, db: 'down' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/admin', adminRouter);

// Locally stored uploads (avatars, ID documents). Swap for S3/Cloudinary later.
// CORP must be cross-origin: the web app (e.g. :8081) embeds these images from :4000.
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.resolve(process.cwd(), 'uploads')));

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Soko API listening on http://localhost:${port}`);
});
