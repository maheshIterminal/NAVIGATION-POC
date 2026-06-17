import type {
  DriverSession,
  DriverStats,
  Order,
  OrderOffer,
} from './types.js';

export const sessions = new Map<string, DriverSession>();
export const tokenToDriverId = new Map<string, string>();
export const orders = new Map<string, Order>();
export const offers = new Map<string, OrderOffer>();
export const orderLocks = new Map<string, string>();
export const driverStats = new Map<string, DriverStats>();
export const dispatchLog: { orderId: string; templateId: string; at: number }[] = [];

let orderCounter = 1;
let offerCounter = 1;

export function nextOrderId(): string {
  const id = `ORD-${String(orderCounter).padStart(3, '0')}`;
  orderCounter += 1;
  return id;
}

export function nextOfferId(): string {
  const id = `OFF-${String(offerCounter).padStart(3, '0')}`;
  offerCounter += 1;
  return id;
}

export function getDriverStats(driverId: string): DriverStats {
  return driverStats.get(driverId) ?? { todayEarnings: 82.35, todayTrips: 8 };
}

export function incrementDriverStats(driverId: string, earnings: number): void {
  const current = getDriverStats(driverId);
  driverStats.set(driverId, {
    todayEarnings: current.todayEarnings + earnings,
    todayTrips: current.todayTrips + 1,
  });
}

export function getActiveOrderForDriver(driverId: string): Order | undefined {
  for (const order of orders.values()) {
    if (order.driverId === driverId && order.status !== 'completed') {
      return order;
    }
  }
  return undefined;
}

export function getSessionByToken(token: string | undefined): DriverSession | undefined {
  if (!token) return undefined;
  const driverId = tokenToDriverId.get(token);
  if (!driverId) return undefined;
  return sessions.get(driverId);
}
