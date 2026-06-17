import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OfferModal } from '../src/components/OfferModal';
import { useAuth } from '../src/providers/AuthProvider';
import { useDriverSession } from '../src/providers/DriverSessionProvider';
import { driverWebSocket } from '../src/services/websocket';
import { homeScreenStyles as styles, navigationTheme } from '../src/constants/theme';
import { formatAud } from '../src/utils/currency';

/** Fallback map centre when GPS is unavailable (Darwin CBD). */
const FALLBACK_REGION: Region = {
  latitude: -12.4634,
  longitude: 130.8456,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const LOCAL_MAP_DELTA = {
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

function regionFromCoords(latitude: number, longitude: number): Region {
  return { latitude, longitude, ...LOCAL_MAP_DELTA };
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { token, driver, isLoading, logout } = useAuth();
  const { isOnline, wsState, stats, toggleOnline } = useDriverSession();
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/');
    }
  }, [isLoading, token, router]);

  useEffect(() => {
    let watcher: Location.LocationSubscription | undefined;
    let cancelled = false;

    async function startLocationTracking() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== Location.PermissionStatus.GRANTED) {
        setMapRegion(FALLBACK_REGION);
        setMapReady(true);
        return;
      }

      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        setMapRegion(
          regionFromCoords(position.coords.latitude, position.coords.longitude)
        );
        setMapReady(true);

        watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 30,
            timeInterval: 5000,
          },
          (update) => {
            setMapRegion(
              regionFromCoords(update.coords.latitude, update.coords.longitude)
            );
          }
        );
      } catch {
        if (!cancelled) {
          setMapRegion(FALLBACK_REGION);
          setMapReady(true);
        }
      }
    }

    void startLocationTracking();

    return () => {
      cancelled = true;
      watcher?.remove();
    };
  }, []);

  const handleToggleOnline = useCallback(async () => {
    setToggling(true);
    try {
      await toggleOnline();
    } catch (err) {
      Alert.alert(
        'Could not go online',
        err instanceof Error ? err.message : 'Please check location permission and mock server.'
      );
    } finally {
      setToggling(false);
    }
  }, [toggleOnline]);

  const handleLogout = useCallback(async () => {
    if (isOnline) {
      driverWebSocket.goOffline();
      driverWebSocket.disconnect();
    }
    await logout();
    router.replace('/');
  }, [isOnline, logout, router]);

  if (isLoading || !token) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={navigationTheme.colors.accent} />
      </View>
    );
  }

  const firstName = driver?.name?.split(' ')[0] ?? 'Driver';

  return (
    <View style={styles.container}>
      {!mapReady || !mapRegion ? (
        <View style={[styles.map, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={navigationTheme.colors.accent} />
        </View>
      ) : (
        <MapView
          style={styles.map}
          region={mapRegion}
          showsUserLocation
          showsMyLocationButton
          followsUserLocation
        />
      )}

      <SafeAreaView style={styles.bottomSheet} edges={['bottom']}>
        <Text style={styles.greeting}>
          {getGreeting()}, {firstName}
        </Text>

        <View style={styles.statusRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: isOnline ? '#22c55e' : '#6b7280' },
              ]}
            />
            <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>

          <Pressable
            style={[styles.toggle, isOnline && styles.toggleOnline]}
            disabled={toggling}
            onPress={() => void handleToggleOnline()}
          >
            {toggling ? (
              <ActivityIndicator size="small" color={navigationTheme.colors.text} />
            ) : (
              <Text style={styles.toggleText}>{isOnline ? 'Go Offline' : 'Go Online'}</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.earningsCard}>
          <View>
            <Text style={styles.earningsLabel}>Today&apos;s earnings</Text>
            <Text style={styles.earningsValue}>{formatAud(stats.todayEarnings)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.earningsLabel}>Trips</Text>
            <Text style={styles.tripsValue}>{stats.todayTrips}</Text>
          </View>
        </View>

        <Text style={styles.wsStatus}>
          Connection: {wsState}
          {isOnline ? ' — waiting for offers' : ''}
        </Text>

        <Pressable style={styles.logoutButton} onPress={() => void handleLogout()}>
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </SafeAreaView>

      <OfferModal />
    </View>
  );
}
