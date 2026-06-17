import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import {
  AudioGuidance,
  NavigationSessionStatus,
  RouteStatus,
  TravelMode,
  useNavigation,
  type Waypoint,
} from '@googlemaps/react-native-navigation-sdk';
import type { Destination } from '../types/navigation';

type NavigationSetupState =
  | 'idle'
  | 'waiting_for_map'
  | 'initializing'
  | 'waiting_for_location'
  | 'routing'
  | 'navigating'
  | 'arrived'
  | 'error';

const ROUTE_STATUS_MESSAGES: Record<string, string> = {
  [RouteStatus.NO_ROUTE_FOUND]: 'No route found to this destination.',
  [RouteStatus.NETWORK_ERROR]: 'Network error while calculating route.',
  [RouteStatus.LOCATION_DISABLED]: 'Waiting for GPS location from Navigation SDK...',
  [RouteStatus.LOCATION_UNKNOWN]: 'Unable to determine your location.',
  [RouteStatus.QUOTA_CHECK_FAILED]: 'Navigation quota exceeded. Check Google Cloud billing.',
  [RouteStatus.WAYPOINT_ERROR]: 'Invalid destination. Try selecting another address.',
  [RouteStatus.INVALID_PLACE_ID]: 'Destination place ID expired. Search and select the address again.',
  [RouteStatus.UNKNOWN]:
    'Routing failed. Ensure Navigation SDK is enabled for your API key, then try again.',
};

const INIT_STATUS_MESSAGES: Record<string, string> = {
  [NavigationSessionStatus.NOT_AUTHORIZED]:
    'API key not authorized. Enable Navigation SDK in Google Cloud Console.',
  [NavigationSessionStatus.TERMS_NOT_ACCEPTED]:
    'Navigation terms must be accepted to continue.',
  [NavigationSessionStatus.NETWORK_ERROR]: 'Network error during navigation setup.',
  [NavigationSessionStatus.LOCATION_PERMISSION_MISSING]:
    'Location permission is required. Enable Location → Always for this app in Settings.',
  [NavigationSessionStatus.UNKNOWN_ERROR]: 'Failed to initialize navigation.',
};

const ROUTE_POLL_ATTEMPTS = 20;
const ROUTE_POLL_INTERVAL_MS = 2000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildWaypoint(target: Destination): Waypoint {
  if (target.placeId) {
    return {
      title: target.title,
      placeId: target.placeId,
    };
  }

  return {
    title: target.title,
    position: { lat: target.lat, lng: target.lng },
  };
}

function isValidSdkLocation(location: { lat?: number; lng?: number } | null | undefined): boolean {
  return (
    typeof location?.lat === 'number' &&
    typeof location?.lng === 'number' &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng)
  );
}

function isRetryableRouteStatus(status: RouteStatus): boolean {
  return (
    status === RouteStatus.UNKNOWN ||
    status === RouteStatus.LOCATION_DISABLED ||
    status === RouteStatus.LOCATION_UNKNOWN
  );
}

export function useNavigationSetup(destination: Destination | null) {
  const {
    navigationController,
    setOnArrival,
    setOnLocationChanged,
    setOnRawLocationChanged,
    removeAllListeners,
  } = useNavigation();

  const [state, setState] = useState<NavigationSetupState>('waiting_for_map');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const initializedRef = useRef(false);
  const guidanceStartedRef = useRef(false);
  const pollingRef = useRef(false);
  const waitingForLocationRef = useRef(false);
  const destinationRef = useRef(destination);

  destinationRef.current = destination;

  const requestRouteOnce = useCallback(
    async (target: Destination): Promise<RouteStatus> => {
      return navigationController.setDestinations([buildWaypoint(target)], {
        routingOptions: {
          travelMode: TravelMode.DRIVING,
          avoidFerries: false,
          avoidTolls: false,
        },
        displayOptions: {
          showDestinationMarkers: true,
          showStopSigns: true,
          showTrafficLights: true,
        },
      });
    },
    [navigationController]
  );

  const startGuidanceForRoute = useCallback(async () => {
    guidanceStartedRef.current = true;
    navigationController.setAudioGuidanceType(AudioGuidance.VOICE_ALERTS_AND_GUIDANCE);
    await navigationController.startGuidance();
    setState('navigating');
  }, [navigationController]);

  const pollUntilRouted = useCallback(
    async (target: Destination) => {
      if (pollingRef.current || guidanceStartedRef.current) {
        return;
      }

      pollingRef.current = true;
      waitingForLocationRef.current = true;
      setState('waiting_for_location');

      try {
        for (let attempt = 1; attempt <= ROUTE_POLL_ATTEMPTS; attempt += 1) {
          if (guidanceStartedRef.current) {
            return;
          }

          if (attempt > 1) {
            setState('routing');
          }

          const routeStatus = await requestRouteOnce(target);

          if (routeStatus === RouteStatus.OK) {
            await startGuidanceForRoute();
            return;
          }

          if (!isRetryableRouteStatus(routeStatus)) {
            setState('error');
            setErrorMessage(ROUTE_STATUS_MESSAGES[routeStatus] ?? ROUTE_STATUS_MESSAGES.UNKNOWN);
            return;
          }

          await sleep(ROUTE_POLL_INTERVAL_MS);
        }

        setState('error');
        setErrorMessage(
          'GPS signal not found. Open Settings → Privacy → Location Services, ensure they are on, set this app to Always, enable Precise Location, then try outdoors.'
        );
      } finally {
        pollingRef.current = false;
      }
    },
    [requestRouteOnce, startGuidanceForRoute]
  );

  const enableSdkLocationUpdates = useCallback(async () => {
    if (Platform.OS === 'ios') {
      navigationController.setBackgroundLocationUpdatesEnabled(true);
    }

    navigationController.startUpdatingLocation();
  }, [navigationController]);

  const ensureDeviceLocationReady = useCallback(async (): Promise<boolean> => {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      setState('error');
      setErrorMessage('Location Services are turned off on this device. Enable them in Settings.');
      return false;
    }

    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== Location.PermissionStatus.GRANTED) {
      setState('error');
      setErrorMessage(INIT_STATUS_MESSAGES[NavigationSessionStatus.LOCATION_PERMISSION_MISSING]);
      return false;
    }

    if (Platform.OS === 'ios') {
      const background = await Location.requestBackgroundPermissionsAsync();
      if (background.status !== Location.PermissionStatus.GRANTED) {
        setState('error');
        setErrorMessage(
          'Background location is required for navigation. Set Location to Always in Settings.'
        );
        return false;
      }
    }

    // Wake up device GPS before the Navigation SDK road-snapped provider starts.
    try {
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
    } catch {
      // Continue — Navigation SDK may still obtain a fix after startUpdatingLocation().
    }

    return true;
  }, []);

  const initializeNavigation = useCallback(async () => {
    if (initializedRef.current || !mapReady || !destinationRef.current) {
      return;
    }

    setState('initializing');
    setErrorMessage(null);

    try {
      const locationReady = await ensureDeviceLocationReady();
      if (!locationReady) {
        return;
      }

      const termsAccepted = await navigationController.showTermsAndConditionsDialog();
      if (!termsAccepted) {
        setState('error');
        setErrorMessage(INIT_STATUS_MESSAGES[NavigationSessionStatus.TERMS_NOT_ACCEPTED]);
        return;
      }

      const initStatus = await navigationController.init();
      if (initStatus !== NavigationSessionStatus.OK) {
        setState('error');
        setErrorMessage(INIT_STATUS_MESSAGES[initStatus] ?? INIT_STATUS_MESSAGES.UNKNOWN_ERROR);
        return;
      }

      initializedRef.current = true;

      // Required: road-snapped location updates do not start automatically.
      await enableSdkLocationUpdates();

      // Allow navigator to attach to NavigationView.
      await sleep(1500);

      if (destinationRef.current) {
        await pollUntilRouted(destinationRef.current);
      }
    } catch (error) {
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start navigation.');
    }
  }, [
    enableSdkLocationUpdates,
    ensureDeviceLocationReady,
    mapReady,
    navigationController,
    pollUntilRouted,
  ]);

  const onMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  useEffect(() => {
    const handleLocation = (location: { lat?: number; lng?: number }) => {
      if (!isValidSdkLocation(location) || !initializedRef.current || guidanceStartedRef.current) {
        return;
      }

      if (destinationRef.current && !pollingRef.current) {
        void pollUntilRouted(destinationRef.current);
      }
    };

    setOnLocationChanged(handleLocation);
    setOnRawLocationChanged(handleLocation);

    setOnArrival((event) => {
      if (event.isFinalDestination) {
        void navigationController.stopGuidance();
        setState('arrived');
      }
    });

    return () => {
      removeAllListeners();
    };
  }, [
    navigationController,
    pollUntilRouted,
    removeAllListeners,
    setOnArrival,
    setOnLocationChanged,
    setOnRawLocationChanged,
  ]);

  useEffect(() => {
    if (mapReady && destination) {
      void initializeNavigation();
    }
  }, [destination, initializeNavigation, mapReady]);

  useEffect(() => {
    return () => {
      navigationController.stopUpdatingLocation();
      void navigationController.stopGuidance();
      initializedRef.current = false;
      guidanceStartedRef.current = false;
      pollingRef.current = false;
      waitingForLocationRef.current = false;
    };
  }, [navigationController]);

  const stopNavigation = useCallback(async () => {
    navigationController.stopUpdatingLocation();
    await navigationController.stopGuidance();
    guidanceStartedRef.current = false;
    pollingRef.current = false;
    waitingForLocationRef.current = false;
    setState('idle');
  }, [navigationController]);

  const retryNavigation = useCallback(async () => {
    if (!destinationRef.current || !initializedRef.current) {
      return;
    }

    setErrorMessage(null);
    guidanceStartedRef.current = false;
    pollingRef.current = false;
    await enableSdkLocationUpdates();
    await pollUntilRouted(destinationRef.current);
  }, [enableSdkLocationUpdates, pollUntilRouted]);

  return {
    state,
    errorMessage,
    onMapReady,
    stopNavigation,
    retryNavigation,
  };
}
