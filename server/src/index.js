// Game Shop API (Express). Dev: npm run dev, production: npm start
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './db.js';
import { HttpError } from './errors.js';
import { eventsRouter } from './events.js';
import { attachUser, requirePermission } from './middleware/auth.js';
import { accountRouter } from './routes/account.js';
import { adminGamesRouter } from './routes/admin/games.js';
import { adminLogsRouter } from './routes/admin/logs.js';
import { adminOrdersRouter } from './routes/admin/orders.js';
import { adminPromotionsRouter } from './routes/admin/promotions.js';
import { adminReportsRouter } from './routes/admin/reports.js';
import { adminUsersRouter } from './routes/admin/users.js';
import { authRouter } from './routes/auth.js';
import { gamesRouter } from './routes/games.js';
import { libraryRouter } from './routes/library.js';
import { shopRouter } from './routes/shop.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'img-src': ["'self'", 'data:', 'https:'], // game images come from Steam / Wikimedia
        'upgrade-insecure-requests': null,
      },
    },
  })
);
app.use(express.json({ limit: '20kb' }));
app.use((req, res, next) => {
  req.body ??= {};
  next();
});
app.use(cookieParser());
app.use(attachUser);

app.use('/api/auth', authRouter);
app.use('/api', eventsRouter, gamesRouter, shopRouter, libraryRouter, accountRouter);

const admin = express.Router();
admin.use(requirePermission('backoffice.access'));
admin.use('/games', adminGamesRouter);
admin.use('/promotions', adminPromotionsRouter);
admin.use('/orders', adminOrdersRouter);
admin.use('/users', adminUsersRouter);
admin.use('/reports', adminReportsRouter);
admin.use('/logs', adminLogsRouter);
app.use('/api/admin', admin);

app.use('/api', (req, res) => {
  res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}` });
});

const clientDist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(path.join(clientDist, 'index.html')) : next()));
}

app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...err.extra });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'The request body is not valid JSON.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'The request is too large.' });
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(409).json({ error: 'This record is still used by other data, so it cannot be changed or removed.' });
  }
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'This record already exists.' });
  if (err.code === 'SQLITE_CONSTRAINT_CHECK') return res.status(400).json({ error: 'One of the values is not allowed.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server. Try again in a moment.' });
});

app.listen(PORT, (err) => {
  if (err) {
    console.error(err.code === 'EADDRINUSE' ? `Port ${PORT} is already in use.` : err);
    process.exit(1);
  }
  console.log(`Game Shop API running on http://localhost:${PORT}`);
});
