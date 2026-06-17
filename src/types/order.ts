export type LocationPoint = {
  lat: number;
  lng: number;
  address: string;
};

export type OrderStatus =
  | 'ready_for_pickup'
  | 'assigned'
  | 'picked_up'
  | 'delivered'
  | 'completed';

export type Order = {
  id: string;
  templateId?: string;
  merchantName: string;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  earnings: number;
  status: OrderStatus;
  driverId?: string;
  createdAt: number;
};

export type OrderOffer = {
  offerId: string;
  orderId: string;
  expiresAt: string;
  merchantName: string;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  earnings: number;
};

export type DriverProfile = {
  id: string;
  name: string;
  email: string;
};

export type DriverStats = {
  todayEarnings: number;
  todayTrips: number;
};

export type DeliveryStep =
  | 'assigned'
  | 'navigating_pickup'
  | 'at_pickup'
  | 'picked_up'
  | 'navigating_dropoff'
  | 'at_dropoff'
  | 'proof'
  | 'completed';

// WebSocket — server → client
export type WsOrderOffer = {
  type: 'order_offer';
  offerId: string;
  orderId: string;
  expiresAt: string;
  merchantName: string;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  earnings: number;
};

export type WsOrderAccepted = {
  type: 'order_accepted';
  order: Order;
};

export type WsOfferCancelled = {
  type: 'offer_cancelled';
  offerId: string;
  reason: 'taken' | 'expired';
};

export type WsServerMessage = WsOrderOffer | WsOrderAccepted | WsOfferCancelled;

// WebSocket — client → server
export type WsClientMessage =
  | { type: 'driver_online' }
  | { type: 'driver_offline' }
  | { type: 'location_update'; lat: number; lng: number }
  | { type: 'heartbeat' };

export type WsEventHandler = (message: WsServerMessage) => void;
