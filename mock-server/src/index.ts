import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { MOCK_DRIVERS, ORDER_TEMPLATES } from './data.js';
import {
  acceptOffer,
  attachSocket,
  declineOffer,
  detachSocket,
  dispatchCustomOrder,
  dispatchOrder,
  getConnectedDriversForDashboard,
} from './dispatch.js';
import {
  dispatchLog,
  getActiveOrderForDriver,
  getDriverStats,
  getSessionByToken,
  incrementDriverStats,
  orders,
  orderLocks,
  sessions,
  tokenToDriverId,
} from './store.js';
import type { CustomDispatchBody, WsClientMessage } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(websocket);
await app.register(fastifyStatic, {
  root: join(__dirname, 'static'),
  prefix: '/',
});

function authFromHeader(authHeader: string | undefined): string | undefined {
  if (!authHeader?.startsWith('Bearer ')) return undefined;
  return authHeader.slice(7);
}

function createToken(driverId: string): string {
  return `mock-token-${driverId}`;
}

app.get('/health', async () => ({ ok: true }));

// ─── Auth ───────────────────────────────────────────────────────────────────

app.post<{ Body: { email?: string; password?: string } }>('/auth/login', async (req, reply) => {
  const { email, password } = req.body ?? {};
  const driver = MOCK_DRIVERS.find((d) => d.email === email && d.password === password);
  if (!driver) {
    return reply.status(401).send({ message: 'Invalid email or password' });
  }

  const token = createToken(driver.id);
  tokenToDriverId.set(token, driver.id);

  let session = sessions.get(driver.id);
  if (!session) {
    session = { driverId: driver.id, token, isOnline: false, lastSeenAt: Date.now() };
    sessions.set(driver.id, session);
  } else {
    session.token = token;
  }

  return { token, driver: { id: driver.id, name: driver.name, email: driver.email } };
});

// ─── Driver endpoints ───────────────────────────────────────────────────────

app.post('/drivers/me/availability', async (req, reply) => {
  const token = authFromHeader(req.headers.authorization);
  const session = getSessionByToken(token);
  if (!session) return reply.status(401).send({ message: 'Unauthorized' });

  const body = req.body as { online?: boolean };
  session.isOnline = Boolean(body.online);
  session.lastSeenAt = Date.now();
  return { isOnline: session.isOnline };
});

app.get('/drivers/me/stats', async (req, reply) => {
  const token = authFromHeader(req.headers.authorization);
  const session = getSessionByToken(token);
  if (!session) return reply.status(401).send({ message: 'Unauthorized' });
  return getDriverStats(session.driverId);
});

app.get('/drivers/me', async (req, reply) => {
  const token = authFromHeader(req.headers.authorization);
  const session = getSessionByToken(token);
  if (!session) return reply.status(401).send({ message: 'Unauthorized' });
  const driver = MOCK_DRIVERS.find((d) => d.id === session.driverId);
  return {
    id: session.driverId,
    name: driver?.name,
    email: driver?.email,
    isOnline: session.isOnline,
  };
});

// ─── Offers ─────────────────────────────────────────────────────────────────

app.post<{ Params: { offerId: string } }>('/offers/:offerId/accept', async (req, reply) => {
  const token = authFromHeader(req.headers.authorization);
  const session = getSessionByToken(token);
  if (!session) return reply.status(401).send({ message: 'Unauthorized' });

  const result = acceptOffer(req.params.offerId, session.driverId);
  if (!result.success) {
    return reply.status(result.status).send({ message: result.message });
  }
  return { order: result.order };
});

app.post<{ Params: { offerId: string } }>('/offers/:offerId/decline', async (req, reply) => {
  const token = authFromHeader(req.headers.authorization);
  const session = getSessionByToken(token);
  if (!session) return reply.status(401).send({ message: 'Unauthorized' });

  const ok = declineOffer(req.params.offerId, session.driverId);
  if (!ok) return reply.status(404).send({ message: 'Offer not found' });
  return { ok: true };
});

// ─── Orders ─────────────────────────────────────────────────────────────────

app.get('/orders/active', async (req, reply) => {
  const token = authFromHeader(req.headers.authorization);
  const session = getSessionByToken(token);
  if (!session) return reply.status(401).send({ message: 'Unauthorized' });

  const order = getActiveOrderForDriver(session.driverId);
  return { order: order ?? null };
});

app.post<{ Params: { id: string } }>('/orders/:id/pickup', async (req, reply) => {
  const token = authFromHeader(req.headers.authorization);
  const session = getSessionByToken(token);
  if (!session) return reply.status(401).send({ message: 'Unauthorized' });

  const order = orders.get(req.params.id);
  if (!order || order.driverId !== session.driverId) {
    return reply.status(404).send({ message: 'Order not found' });
  }
  if (order.status !== 'assigned') {
    return reply.status(400).send({ message: 'Order not in assigned state' });
  }
  order.status = 'picked_up';
  orders.set(order.id, order);
  return { order };
});

app.post<{ Params: { id: string } }>('/orders/:id/deliver', async (req, reply) => {
  const token = authFromHeader(req.headers.authorization);
  const session = getSessionByToken(token);
  if (!session) return reply.status(401).send({ message: 'Unauthorized' });

  const order = orders.get(req.params.id);
  if (!order || order.driverId !== session.driverId) {
    return reply.status(404).send({ message: 'Order not found' });
  }
  if (order.status !== 'picked_up') {
    return reply.status(400).send({ message: 'Order not picked up yet' });
  }
  order.status = 'delivered';
  orders.set(order.id, order);
  return { order };
});

app.post<{ Params: { id: string }; Body: { photoUri?: string; skipped?: boolean } }>(
  '/orders/:id/proof',
  async (req, reply) => {
    const token = authFromHeader(req.headers.authorization);
    const session = getSessionByToken(token);
    if (!session) return reply.status(401).send({ message: 'Unauthorized' });

    const order = orders.get(req.params.id);
    if (!order || order.driverId !== session.driverId) {
      return reply.status(404).send({ message: 'Order not found' });
    }
    if (order.status !== 'delivered') {
      return reply.status(400).send({ message: 'Order not delivered yet' });
    }

    order.status = 'completed';
    orders.set(order.id, order);
    incrementDriverStats(session.driverId, order.earnings);
    orderLocks.delete(order.id);

    return { order, proof: { photoUri: req.body?.photoUri ?? null, skipped: Boolean(req.body?.skipped) } };
  }
);

// ─── Mock dashboard endpoints ───────────────────────────────────────────────

app.get('/mock/templates', async () => ORDER_TEMPLATES);

app.get('/mock/drivers', async () => getConnectedDriversForDashboard());

app.get('/mock/dispatch-log', async () => dispatchLog);

function isCustomDispatchBody(body: unknown): body is CustomDispatchBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.merchantName === 'string' &&
    typeof b.pickup === 'object' &&
    b.pickup !== null &&
    typeof b.dropoff === 'object' &&
    b.dropoff !== null &&
    typeof b.earnings === 'number'
  );
}

app.post<{ Body: { templateId?: string } | CustomDispatchBody }>(
  '/mock/dispatch',
  async (req, reply) => {
    const body = req.body;

    if (isCustomDispatchBody(body)) {
      const result = dispatchCustomOrder(body);
      if ('error' in result) {
        return reply.status(400).send({ message: result.error });
      }
      if (result.offerCount === 0) {
        return reply.status(400).send({ message: 'No online drivers available', ...result });
      }
      return result;
    }

    const templateId = (body as { templateId?: string })?.templateId ?? ORDER_TEMPLATES[0].id;
    const result = dispatchOrder(templateId);
    if (result.offerCount === 0) {
      return reply.status(400).send({ message: 'No online drivers available', ...result });
    }
    return result;
  }
);

app.get('/dispatch', async (_req, reply) => {
  return reply.sendFile('dispatch.html');
});

// ─── WebSocket ────────────────────────────────────────────────────────────────

app.get('/ws/driver', { websocket: true }, (socket, req) => {
  const url = new URL(req.url ?? '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token') ?? undefined;
  const session = getSessionByToken(token);

  if (!session) {
    socket.close(4001, 'Unauthorized');
    return;
  }

  attachSocket(session.driverId, socket);

  socket.on('message', (raw: Buffer | ArrayBuffer | Buffer[]) => {
    try {
      const msg = JSON.parse(String(raw)) as WsClientMessage;
      session.lastSeenAt = Date.now();

      if (msg.type === 'driver_online') {
        session.isOnline = true;
      } else if (msg.type === 'driver_offline') {
        session.isOnline = false;
      } else if (msg.type === 'location_update') {
        session.lastLat = msg.lat;
        session.lastLng = msg.lng;
      }
    } catch {
      // ignore malformed messages
    }
  });

  socket.on('close', () => {
    detachSocket(session.driverId);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`Mock dispatch server running at http://localhost:${PORT}`);
  console.log(`Dispatch dashboard: http://localhost:${PORT}/dispatch`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
