import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import devicesRouter from './routes/devices.js';
import { errorHandler, notFoundHandler } from './utils/errors.js';

const app = express();
const port = Number(process.env.PORT || 8080);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

app.use(express.json());
app.use(morgan('dev'));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin not allowed: ${origin}`));
    },
  })
);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'waveo-backend-starter' });
});

app.use('/devices', devicesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Waveo backend starter listening on http://localhost:${port}`);
});
