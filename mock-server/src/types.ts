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

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export type MockDriver = {
  id: string;
  email: string;
  password: string;
  name: string;
};

export type DriverSession = {
  driverId: string;
  token: string;
  isOnline: boolean;
  lastLat?: number;
  lastLng?: number;
  lastSeenAt: number;
  socket?: { send: (data: string) => void; readyState: number };
};

export type OrderTemplate = {
  id: string;
  label: string;
  merchantName: string;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  earnings: number;
};

export type Order = {
  id: string;
  templateId: string;
  merchantName: string;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  earnings: number;
  status: OrderStatus;
  driverId?: string;
  createdAt: number;
};

export type OrderOffer = {
  id: string;
  orderId: string;
  driverId: string;
  status: OfferStatus;
  expiresAt: number;
  createdAt: number;
  timeoutId?: ReturnType<typeof setTimeout>;
};

export type DriverStats = {
  todayEarnings: number;
  todayTrips: number;
};

// WebSocket messages — server → client
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

// WebSocket messages — client → server
export type WsClientMessage =
  | { type: 'driver_online' }
  | { type: 'driver_offline' }
  | { type: 'location_update'; lat: number; lng: number }
  | { type: 'heartbeat' };
