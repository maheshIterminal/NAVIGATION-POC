import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import type { DeliveryStep, Order } from '../types/order';
import { useAuth } from '../providers/AuthProvider';
import { useDriverSession } from '../providers/DriverSessionProvider';

function stepFromOrder(order: Order): DeliveryStep {
  switch (order.status) {
    case 'assigned':
      return 'assigned';
    case 'picked_up':
      return 'picked_up';
    case 'delivered':
      return 'proof';
    default:
      return 'assigned';
  }
}

export function useActiveDelivery() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ arrived?: string }>();
  const { activeOrder, setActiveOrder, refreshStats } = useDriverSession();
  const [step, setStep] = useState<DeliveryStep>('assigned');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [hasStartedPickupNav, setHasStartedPickupNav] = useState(false);

  useEffect(() => {
    if (activeOrder) {
      setStep(stepFromOrder(activeOrder));
    }
  }, [activeOrder]);

  useEffect(() => {
    if (params.arrived === 'pickup') {
      setStep('at_pickup');
    } else if (params.arrived === 'dropoff') {
      setStep('at_dropoff');
    }
  }, [params.arrived]);

  const startNavigation = useCallback(
    (leg: 'pickup' | 'dropoff') => {
      if (!activeOrder) return;

      const target = leg === 'pickup' ? activeOrder.pickup : activeOrder.dropoff;
      setStep(leg === 'pickup' ? 'navigating_pickup' : 'navigating_dropoff');

      router.push({
        pathname: '/navigation',
        params: {
          leg,
          orderId: activeOrder.id,
          title: target.address,
          lat: String(target.lat),
          lng: String(target.lng),
        },
      });
    },
    [activeOrder, router]
  );

  const confirmPickup = useCallback(async () => {
    if (!token || !activeOrder) return;
    setIsLoading(true);
    setError(null);
    try {
      const { order } = await api.confirmPickup(token, activeOrder.id);
      setActiveOrder(order);
      setHasStartedPickupNav(false);
      startNavigation('dropoff');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm pickup');
    } finally {
      setIsLoading(false);
    }
  }, [token, activeOrder, setActiveOrder, startNavigation]);

  const confirmDelivered = useCallback(async () => {
    if (!token || !activeOrder) return;
    setIsLoading(true);
    setError(null);
    try {
      const { order } = await api.confirmDeliver(token, activeOrder.id);
      setActiveOrder(order);
      setStep('proof');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm delivery');
    } finally {
      setIsLoading(false);
    }
  }, [token, activeOrder, setActiveOrder]);

  const pickPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const completeDelivery = useCallback(
    async (skipped: boolean) => {
      if (!token || !activeOrder) return;
      setIsLoading(true);
      setError(null);
      try {
        await api.submitProof(token, activeOrder.id, photoUri ?? undefined, skipped);
        setActiveOrder(null);
        setPhotoUri(null);
        setStep('completed');
        setHasStartedPickupNav(false);
        await refreshStats();
        router.replace('/home');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete delivery');
      } finally {
        setIsLoading(false);
      }
    },
    [token, activeOrder, photoUri, setActiveOrder, refreshStats, router]
  );

  useEffect(() => {
    if (
      activeOrder?.status === 'assigned' &&
      step === 'assigned' &&
      !hasStartedPickupNav &&
      params.arrived !== 'pickup'
    ) {
      setHasStartedPickupNav(true);
      startNavigation('pickup');
    }
  }, [activeOrder, step, hasStartedPickupNav, params.arrived, startNavigation]);

  useEffect(() => {
    if (
      activeOrder?.status === 'picked_up' &&
      step === 'picked_up' &&
      params.arrived !== 'dropoff'
    ) {
      startNavigation('dropoff');
    }
  }, [activeOrder, step, params.arrived, startNavigation]);

  return {
    order: activeOrder,
    step,
    isLoading,
    error,
    photoUri,
    confirmPickup,
    confirmDelivered,
    pickPhoto,
    completeDelivery,
  };
}
