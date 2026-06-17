import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationView } from '@googlemaps/react-native-navigation-sdk';
import { useNavigationSetup } from '../src/hooks/useNavigationSetup';
import {
  androidNavigationStyling,
  iosNavigationStyling,
  navigationScreenStyles as styles,
  navigationTheme,
} from '../src/constants/theme';
import type { Destination, NavigationRouteParams } from '../src/types/navigation';

/** Space below the status bar so the SDK maneuver header is not cropped */
const SDK_HEADER_TOP_INSET = 8;

/** Space below the SDK turn-by-turn banner before placing the End button */
const SDK_HEADER_CLEARANCE = 116;

function parseDestination(params: NavigationRouteParams): Destination | null {
  const lat = Number(params.lat);
  const lng = Number(params.lng);

  if (!params.title || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return {
    title: params.title,
    lat,
    lng,
    placeId: params.placeId,
  };
}

const STATUS_LABELS: Record<string, string> = {
  waiting_for_map: 'Loading map...',
  initializing: 'Initializing navigation...',
  waiting_for_location: 'Waiting for GPS signal...',
  routing: 'Calculating route...',
  arrived: 'You have arrived',
  error: 'Navigation error',
};

export default function NavigationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<NavigationRouteParams & { arrived?: string }>();
  const destination = useMemo(() => parseDestination(params), [params]);
  const { state, errorMessage, onMapReady, stopNavigation, retryNavigation } =
    useNavigationSetup(destination);

  const isDeliveryLeg = params.leg === 'pickup' || params.leg === 'dropoff';
  const isNavigating = state === 'navigating';
  const showStatusPill = !isNavigating && state !== 'arrived' && state !== 'error';

  const handleEndNavigation = async () => {
    await stopNavigation();
    if (isDeliveryLeg) {
      router.replace('/delivery');
    } else {
      router.replace('/home');
    }
  };

  const handleArrived = async () => {
    await stopNavigation();
    if (params.leg === 'pickup') {
      router.replace({ pathname: '/delivery', params: { arrived: 'pickup' } });
    } else if (params.leg === 'dropoff') {
      router.replace({ pathname: '/delivery', params: { arrived: 'dropoff' } });
    } else {
      router.replace('/home');
    }
  };

  if (!destination) {
    return (
      <SafeAreaView style={styles.fallbackContainer}>
        <Text style={styles.errorTitle}>Invalid destination</Text>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/home')}>
          <Text style={styles.secondaryButtonText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const legLabel =
    params.leg === 'pickup' ? 'Heading to pickup' : params.leg === 'dropoff' ? 'Heading to customer' : null;

  return (
    <View style={styles.container}>
      <NavigationView
        style={[styles.map, { top: insets.top + SDK_HEADER_TOP_INSET }]}
        headerEnabled
        footerEnabled
        speedometerEnabled
        recenterButtonEnabled
        tripProgressBarEnabled={false}
        myLocationEnabled
        myLocationButtonEnabled
        mapColorScheme={navigationTheme.map.colorScheme}
        navigationNightMode={navigationTheme.map.nightMode}
        androidStylingOptions={androidNavigationStyling}
        iOSStylingOptions={iosNavigationStyling}
        onMapReady={onMapReady}
      />

      <View
        style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        pointerEvents="box-none"
      >
        {legLabel && isNavigating ? (
          <View style={[styles.topBar, styles.topBarLoading]}>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{legLabel}</Text>
            </View>
          </View>
        ) : null}

        {showStatusPill ? (
          <View style={[styles.topBar, styles.topBarLoading]}>
            <View style={styles.statusPill}>
              <ActivityIndicator
                size="small"
                color={navigationTheme.colors.accent}
                style={styles.spinner}
              />
              <Text style={styles.statusText}>{STATUS_LABELS[state] ?? state}</Text>
            </View>
          </View>
        ) : null}

        {isNavigating ? (
          <View
            style={[
              styles.topBar,
              styles.topBarNavigating,
              { marginTop: SDK_HEADER_CLEARANCE },
            ]}
          >
            <Pressable style={styles.endButton} onPress={() => void handleEndNavigation()}>
              <Text style={styles.endButtonText}>End</Text>
            </Pressable>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable style={styles.secondaryButton} onPress={() => void retryNavigation()}>
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => router.replace('/delivery')}>
              <Text style={styles.secondaryButtonText}>Back to delivery</Text>
            </Pressable>
          </View>
        ) : null}

        {state === 'arrived' ? (
          <View style={styles.arrivedBanner}>
            <Text style={styles.arrivedText}>You have arrived at {destination.title}</Text>
            <Pressable style={styles.primaryButton} onPress={() => void handleArrived()}>
              <Text style={styles.primaryButtonText}>
                {params.leg === 'pickup' ? 'Confirm at pickup' : params.leg === 'dropoff' ? 'Confirm at dropoff' : 'Done'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}
