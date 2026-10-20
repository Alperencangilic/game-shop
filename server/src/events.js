import { Router } from 'express';

// Server-Sent Events for live stock/price updates and notifications
const clients = new Set();

function send(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export function publish(event) {
  for (const client of clients) send(client.res, event);
}

export function publishToUser(userId, event) {
  for (const client of clients) {
    if (client.userId === userId) send(client.res, event);
  }
}

export const eventsRouter = Router();

eventsRouter.get('/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  res.write('retry: 3000\n\n');

  const client = { res, userId: req.user?.id ?? null };
  clients.add(client);

  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => {
    clearInterval(ping);
    clients.delete(client);
  });
});
