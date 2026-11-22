import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { asyncHandler, httpError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

export const uploadsRouter = Router();

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(httpError(400, 'Only JPEG, PNG, WebP or HEIC images are allowed'));
  },
});

// POST /api/uploads — multipart form field "file". Returns { url }.
uploadsRouter.post(
  '/',
  authenticate,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') return next(httpError(400, 'File too large (max 10 MB)'));
      return next(httpError(400, err.message));
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) throw httpError(400, 'No file uploaded');
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ url });
  }),
);
