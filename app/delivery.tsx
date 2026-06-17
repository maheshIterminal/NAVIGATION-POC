import { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/providers/AuthProvider';
import { useActiveDelivery } from '../src/hooks/useActiveDelivery';
import { deliveryScreenStyles as styles, navigationTheme } from '../src/constants/theme';
import { formatAud } from '../src/utils/currency';

export default function DeliveryScreen() {
  const router = useRouter();
  const { token, isLoading } = useAuth();
  const {
    order,
    step,
    isLoading: actionLoading,
    error,
    photoUri,
    confirmPickup,
    confirmDelivered,
    pickPhoto,
    completeDelivery,
  } = useActiveDelivery();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/');
    }
  }, [isLoading, token, router]);

  useEffect(() => {
    if (!isLoading && token && !order) {
      router.replace('/home');
    }
  }, [isLoading, token, order, router]);

  if (!order) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={navigationTheme.colors.accent} />
      </View>
    );
  }

  if (step === 'navigating_pickup' || step === 'navigating_dropoff') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={navigationTheme.colors.accent} />
        <Text style={styles.subtitle}>
          {step === 'navigating_pickup' ? 'Navigating to pickup...' : 'Navigating to customer...'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {step === 'assigned' || step === 'at_pickup' ? (
        <>
          <Text style={styles.title}>Pickup order</Text>
          <Text style={styles.subtitle}>Collect the order from the merchant.</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Merchant</Text>
            <Text style={styles.value}>{order.merchantName}</Text>
            <Text style={styles.label}>Pickup address</Text>
            <Text style={styles.value}>{order.pickup.address}</Text>
          </View>
          {step === 'at_pickup' ? (
            <Pressable
              style={[styles.primaryButton, actionLoading && styles.primaryButtonDisabled]}
              disabled={actionLoading}
              onPress={() => void confirmPickup()}
            >
              <Text style={styles.primaryButtonText}>Confirm Pickup</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {step === 'picked_up' || step === 'at_dropoff' ? (
        <>
          <Text style={styles.title}>Deliver order</Text>
          <Text style={styles.subtitle}>Head to the customer and complete the delivery.</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Dropoff address</Text>
            <Text style={styles.value}>{order.dropoff.address}</Text>
            <Text style={styles.label}>Earnings</Text>
            <Text style={styles.value}>{formatAud(order.earnings)}</Text>
          </View>
          {step === 'at_dropoff' ? (
            <Pressable
              style={[styles.primaryButton, actionLoading && styles.primaryButtonDisabled]}
              disabled={actionLoading}
              onPress={() => void confirmDelivered()}
            >
              <Text style={styles.primaryButtonText}>Confirm Delivered</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {step === 'proof' ? (
        <>
          <Text style={styles.title}>Delivery proof</Text>
          <Text style={styles.subtitle}>Optionally attach a photo of the delivered order.</Text>

          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
          ) : null}

          <Pressable style={styles.secondaryButton} onPress={() => void pickPhoto()}>
            <Text style={styles.secondaryButtonText}>
              {photoUri ? 'Retake photo' : 'Take photo'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.primaryButton, actionLoading && styles.primaryButtonDisabled]}
            disabled={actionLoading}
            onPress={() => void completeDelivery(!photoUri)}
          >
            <Text style={styles.primaryButtonText}>
              {photoUri ? 'Upload & Complete' : 'Skip & Complete'}
            </Text>
          </Pressable>
        </>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </SafeAreaView>
  );
}
