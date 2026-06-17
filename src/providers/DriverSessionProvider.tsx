import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { api } from '../services/api';
import { driverWebSocket } from '../services/websocket';
import type {
  DriverStats,
  Order,
  OrderOffer,
  WsServerMessage,
} from '../types/order';
import { useAuth } from './AuthProvider';

type DriverSessionContextValue = {
  isOnline: boolean;
  wsState: 'disconnected' | 'connecting' | 'connected';
  stats: DriverStats;
  activeOffer: OrderOffer | null;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  toggleOnline: () => Promise<void>;
  acceptOffer: () => Promise<void>;
  declineOffer: () => Promise<void>;
  refreshStats: () => Promise<void>;
  clearOffer: () => void;
};

const DriverSessionContext = createContext<DriverSessionContextValue | null>(null);

const DEFAULT_STATS: DriverStats = { todayEarnings: 0, todayTrips: 0 };

export function DriverSessionProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [wsState, setWsState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [stats, setStats] = useState<DriverStats>(DEFAULT_STATS);
  const [activeOffer, setActiveOffer] = useState<OrderOffer | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const locationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshStats = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getStats(token);
      setStats(data);
    } catch {
      // keep existing stats on error
    }
  }, [token]);

  const clearOffer = useCallback(() => setActiveOffer(null), []);

  const handleWsMessage = useCallback(
    (message: WsServerMessage) => {
      if (message.type === 'order_offer') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setActiveOffer({
          offerId: message.offerId,
          orderId: message.orderId,
          expiresAt: message.expiresAt,
          merchantName: message.merchantName,
          pickup: message.pickup,
          dropoff: message.dropoff,
          earnings: message.earnings,
        });
      } else if (message.type === 'order_accepted') {
        setActiveOffer(null);
        setActiveOrder(message.order);
        router.push('/delivery');
      } else if (message.type === 'offer_cancelled') {
        setActiveOffer((current) =>
          current?.offerId === message.offerId ? null : current
        );
      }
    },
    [router]
  );

  useEffect(() => {
    driverWebSocket.setOnStateChange(setWsState);
    const unsubscribe = driverWebSocket.subscribe(handleWsMessage);
    return () => {
      unsubscribe();
      driverWebSocket.disconnect();
    };
  }, [handleWsMessage]);

  useEffect(() => {
    if (!token) return;

    async function resumeActiveOrder() {
      if (!token) return;
      try {
        const { order } = await api.getActiveOrder(token);
        if (order) {
          setActiveOrder(order);
          router.replace('/delivery');
        }
      } catch {
        // server may be offline during POC setup
      }
    }

    void resumeActiveOrder();
    void refreshStats();
  }, [token, refreshStats, router]);

  const stopLocationUpdates = useCallback(() => {
    if (locationTimer.current) {
      clearInterval(locationTimer.current);
      locationTimer.current = null;
    }
  }, []);

  const startLocationUpdates = useCallback(() => {
    stopLocationUpdates();
    locationTimer.current = setInterval(async () => {
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        driverWebSocket.sendLocation(
          position.coords.latitude,
          position.coords.longitude
        );
      } catch {
        // location unavailable
      }
    }, 10_000);
  }, [stopLocationUpdates]);

  const goOnline = useCallback(async () => {
    if (!token) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      throw new Error('Location permission is required to go online.');
    }

    driverWebSocket.connect(token);
    await api.setAvailability(token, true);
    setIsOnline(true);

  // Wait briefly for WS to connect before sending online
    const waitForConnect = () =>
      new Promise<void>((resolve) => {
        if (driverWebSocket.getState() === 'connected') {
          resolve();
          return;
        }
        const interval = setInterval(() => {
          if (driverWebSocket.getState() === 'connected') {
            clearInterval(interval);
            resolve();
          }
        }, 200);
        setTimeout(() => {
          clearInterval(interval);
          resolve();
        }, 3000);
      });

    await waitForConnect();
    driverWebSocket.goOnline();
    startLocationUpdates();
  }, [token, startLocationUpdates]);

  const goOffline = useCallback(async () => {
    if (!token) return;
    driverWebSocket.goOffline();
    stopLocationUpdates();
    await api.setAvailability(token, false);
    setIsOnline(false);
    setActiveOffer(null);
    driverWebSocket.disconnect();
  }, [token, stopLocationUpdates]);

  const toggleOnline = useCallback(async () => {
    if (isOnline) {
      await goOffline();
    } else {
      await goOnline();
    }
  }, [isOnline, goOnline, goOffline]);

  const acceptOffer = useCallback(async () => {
    if (!token || !activeOffer) return;
    try {
      const { order } = await api.acceptOffer(token, activeOffer.offerId);
      setActiveOffer(null);
      setActiveOrder(order);
      router.push('/delivery');
    } catch (err) {
      Alert.alert(
        'Could not accept offer',
        err instanceof Error ? err.message : 'Please try again.'
      );
    }
  }, [token, activeOffer, router]);

  const declineOffer = useCallback(async () => {
    if (!token || !activeOffer) return;
    try {
      await api.declineOffer(token, activeOffer.offerId);
    } finally {
      setActiveOffer(null);
    }
  }, [token, activeOffer]);

  const value = useMemo(
    () => ({
      isOnline,
      wsState,
      stats,
      activeOffer,
      activeOrder,
      setActiveOrder,
      toggleOnline,
      acceptOffer,
      declineOffer,
      refreshStats,
      clearOffer,
    }),
    [
      isOnline,
      wsState,
      stats,
      activeOffer,
      activeOrder,
      toggleOnline,
      acceptOffer,
      declineOffer,
      refreshStats,
      clearOffer,
    ]
  );

  return (
    <DriverSessionContext.Provider value={value}>{children}</DriverSessionContext.Provider>
  );
}

export function useDriverSession() {
  const ctx = useContext(DriverSessionContext);
  if (!ctx) throw new Error('useDriverSession must be used within DriverSessionProvider');
  return ctx;
}
