type DriverSocket = {
  send: (data: string) => void;
  readyState: number;
};
import { MOCK_DRIVERS, OFFER_TTL_MS, ORDER_TEMPLATES } from './data.js';
import {
  dispatchLog,
  getActiveOrderForDriver,
  nextOfferId,
  nextOrderId,
  offers,
  orderLocks,
  orders,
  sessions,
} from './store.js';
import type {
  Order,
  OrderOffer,
  WsOfferCancelled,
  WsOrderAccepted,
  WsOrderOffer,
  WsServerMessage,
} from './types.js';

export function sendToDriver(driverId: string, message: WsServerMessage): void {
  const session = sessions.get(driverId);
  if (!session?.socket || session.socket.readyState !== 1) return;
  session.socket.send(JSON.stringify(message));
}

export function broadcastOfferCancelled(
  orderId: string,
  exceptDriverId: string | null,
  reason: 'taken' | 'expired'
): void {
  for (const offer of offers.values()) {
    if (offer.orderId !== orderId || offer.status !== 'pending') continue;
    if (exceptDriverId && offer.driverId === exceptDriverId) continue;

    offer.status = reason === 'taken' ? 'cancelled' : 'expired';
    if (offer.timeoutId) clearTimeout(offer.timeoutId);

    const msg: WsOfferCancelled = {
      type: 'offer_cancelled',
      offerId: offer.id,
      reason,
    };
    sendToDriver(offer.driverId, msg);
  }
}

function scheduleOfferExpiry(offer: OrderOffer): void {
  const remaining = offer.expiresAt - Date.now();
  const delay = Math.max(0, remaining);

  offer.timeoutId = setTimeout(() => {
    if (offer.status !== 'pending') return;
    offer.status = 'expired';
    broadcastOfferCancelled(offer.orderId, null, 'expired');
  }, delay);
}

export function dispatchOrder(templateId: string): { orderId: string; offerCount: number } {
  const template = ORDER_TEMPLATES.find((t) => t.id === templateId) ?? ORDER_TEMPLATES[0];

  const orderId = nextOrderId();
  const order: Order = {
    id: orderId,
    templateId: template.id,
    merchantName: template.merchantName,
    pickup: template.pickup,
    dropoff: template.dropoff,
    earnings: template.earnings,
    status: 'ready_for_pickup',
    createdAt: Date.now(),
  };
  orders.set(orderId, order);
  dispatchLog.unshift({ orderId, templateId: template.id, at: Date.now() });
  if (dispatchLog.length > 20) dispatchLog.pop();

  let offerCount = 0;
  const expiresAt = Date.now() + OFFER_TTL_MS;

  for (const session of sessions.values()) {
    if (!session.isOnline) continue;
    if (getActiveOrderForDriver(session.driverId)) continue;

    const offerId = nextOfferId();
    const offer: OrderOffer = {
      id: offerId,
      orderId,
      driverId: session.driverId,
      status: 'pending',
      expiresAt,
      createdAt: Date.now(),
    };
    offers.set(offerId, offer);
    scheduleOfferExpiry(offer);
    offerCount += 1;

    const msg: WsOrderOffer = {
      type: 'order_offer',
      offerId,
      orderId,
      expiresAt: new Date(expiresAt).toISOString(),
      merchantName: template.merchantName,
      pickup: template.pickup,
      dropoff: template.dropoff,
      earnings: template.earnings,
    };
    sendToDriver(session.driverId, msg);
  }

  return { orderId, offerCount };
}

export function acceptOffer(
  offerId: string,
  driverId: string
): { success: true; order: Order } | { success: false; status: number; message: string } {
  const offer = offers.get(offerId);
  if (!offer) return { success: false, status: 404, message: 'Offer not found' };
  if (offer.driverId !== driverId) return { success: false, status: 403, message: 'Not your offer' };
  if (offer.status !== 'pending') return { success: false, status: 410, message: 'Offer no longer available' };
  if (Date.now() > offer.expiresAt) {
    offer.status = 'expired';
    return { success: false, status: 410, message: 'Offer expired' };
  }

  const order = orders.get(offer.orderId);
  if (!order) return { success: false, status: 404, message: 'Order not found' };

  if (orderLocks.has(order.id)) {
    return { success: false, status: 409, message: 'Order already taken' };
  }

  orderLocks.set(order.id, driverId);
  offer.status = 'accepted';
  if (offer.timeoutId) clearTimeout(offer.timeoutId);

  order.driverId = driverId;
  order.status = 'assigned';
  orders.set(order.id, order);

  broadcastOfferCancelled(order.id, driverId, 'taken');

  const msg: WsOrderAccepted = { type: 'order_accepted', order };
  sendToDriver(driverId, msg);

  return { success: true, order };
}

export function declineOffer(offerId: string, driverId: string): boolean {
  const offer = offers.get(offerId);
  if (!offer || offer.driverId !== driverId || offer.status !== 'pending') return false;
  offer.status = 'declined';
  if (offer.timeoutId) clearTimeout(offer.timeoutId);
  return true;
}

export function getConnectedDriversForDashboard() {
  return MOCK_DRIVERS.map((driver) => {
    const session = sessions.get(driver.id);
    return {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      connected: Boolean(session?.socket && session.socket.readyState === 1),
      isOnline: session?.isOnline ?? false,
      lastSeenAt: session?.lastSeenAt ?? null,
      lastLat: session?.lastLat ?? null,
      lastLng: session?.lastLng ?? null,
    };
  });
}

export function attachSocket(driverId: string, socket: DriverSocket): void {
  let session = sessions.get(driverId);
  if (!session) {
    session = {
      driverId,
      token: '',
      isOnline: false,
      lastSeenAt: Date.now(),
    };
    sessions.set(driverId, session);
  }
  session.socket = socket;
  session.lastSeenAt = Date.now();
}

export function detachSocket(driverId: string): void {
  const session = sessions.get(driverId);
  if (!session) return;
  session.socket = undefined;
  session.isOnline = false;
  session.lastSeenAt = Date.now();
}
