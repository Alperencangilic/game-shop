import { Router } from 'express';
import { db } from '../../db.js';
import { requirePermission } from '../../middleware/auth.js';
import { clearQueryLog, getQueryLog } from '../../queryLog.js';

// Audit log + SQL log (admins only)
export const adminLogsRouter = Router();
adminLogsRouter.use(requirePermission('logs.view'));

adminLogsRouter.get('/audit', (req, res) => {
  const entries = db
    .prepare('SELECT id, user_id, user_name, action, details, created_at FROM audit_log ORDER BY id DESC LIMIT 200')
    .all()
    .map((e) => ({
      id: e.id,
      userId: e.user_id,
      userName: e.user_name,
      action: e.action,
      details: e.details,
      createdAt: e.created_at,
    }));
  res.json({ entries });
});

// ?since=<id> returns only newer entries
adminLogsRouter.get('/queries', (req, res) => {
  const since = Number(req.query.since) || 0;
  res.json({ entries: getQueryLog(since) });
});

adminLogsRouter.delete('/queries', (req, res) => {
  clearQueryLog();
  res.json({ ok: true });
});
