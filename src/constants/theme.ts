import { Platform, StyleSheet } from 'react-native';
import {
  MapColorScheme,
  NavigationNightMode,
  type AndroidStylingOptions,
  type iOSStylingOptions,
} from '@googlemaps/react-native-navigation-sdk';

/** Kotuwa brand palette extracted from logo */
export const kotuwaBrand = {
  black: '#000000',
  navy: '#12121D',
  navyLight: '#1A1A2E',
  navyMuted: '#252538',
  white: '#FFFFFF',
  purple: '#9368B7',
  orange: '#D87C31',
  yellow: '#F7B731',
  textMuted: '#A8A8BC',
};

/**
 * App-wide navigation theme — Kotuwa Driver branding.
 * Edit kotuwaBrand or navigationTheme.colors to retheme the app.
 */
export const navigationTheme = {
  colors: {
    primary: kotuwaBrand.navy,
    primaryDark: '#0C0C14',
    primaryLight: kotuwaBrand.purple,
    accent: kotuwaBrand.yellow,
    accentSecondary: kotuwaBrand.orange,
    background: kotuwaBrand.black,
    surface: kotuwaBrand.navyLight,
    surfaceMuted: kotuwaBrand.navyMuted,
    text: kotuwaBrand.white,
    textMuted: kotuwaBrand.textMuted,
    textOnPrimary: kotuwaBrand.white,
    border: 'rgba(147, 104, 183, 0.35)',
    danger: '#EF4444',
    dangerSurface: 'rgba(127, 29, 29, 0.85)',
    overlay: 'rgba(0, 0, 0, 0.92)',
    overlayText: kotuwaBrand.white,
  },
  map: {
    colorScheme: MapColorScheme.DARK,
    nightMode: NavigationNightMode.AUTO,
  },
};

/** Google Navigation SDK — Android turn banner / header styling */
export const androidNavigationStyling: AndroidStylingOptions = {
  primaryDayModeThemeColor: kotuwaBrand.navy,
  secondaryDayModeThemeColor: kotuwaBrand.navyLight,
  primaryNightModeThemeColor: kotuwaBrand.navy,
  secondaryNightModeThemeColor: kotuwaBrand.navyLight,
  headerLargeManeuverIconColor: kotuwaBrand.yellow,
  headerSmallManeuverIconColor: kotuwaBrand.orange,
  headerNextStepTextColor: kotuwaBrand.textMuted,
  headerDistanceValueTextColor: kotuwaBrand.yellow,
  headerDistanceUnitsTextColor: kotuwaBrand.orange,
  headerInstructionsTextColor: kotuwaBrand.white,
  headerGuidanceRecommendedLaneColor: kotuwaBrand.purple,
  headerInstructionsFirstRowTextSize: '22f',
  headerInstructionsSecondRowTextSize: '16f',
};

/** Google Navigation SDK — iOS turn banner / header styling */
export const iosNavigationStyling: iOSStylingOptions = {
  navigationHeaderPrimaryBackgroundColor: kotuwaBrand.navy,
  navigationHeaderSecondaryBackgroundColor: kotuwaBrand.navyLight,
  navigationHeaderPrimaryBackgroundColorNightMode: kotuwaBrand.navy,
  navigationHeaderSecondaryBackgroundColorNightMode: kotuwaBrand.navyLight,
  navigationHeaderLargeManeuverIconColor: kotuwaBrand.yellow,
  navigationHeaderSmallManeuverIconColor: kotuwaBrand.orange,
  navigationHeaderGuidanceRecommendedLaneColor: kotuwaBrand.purple,
  navigationHeaderNextStepTextColor: kotuwaBrand.textMuted,
  navigationHeaderDistanceValueTextColor: kotuwaBrand.yellow,
  navigationHeaderDistanceUnitsTextColor: kotuwaBrand.orange,
  navigationHeaderInstructionsTextColor: kotuwaBrand.white,
};

export const destinationScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: navigationTheme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
  logo: {
    width: 400,
    height: 146,
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: navigationTheme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: navigationTheme.colors.textMuted,
    marginBottom: 8,
    lineHeight: 22,
  },
  searchContainer: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  searchInputContainer: {
    backgroundColor: navigationTheme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: navigationTheme.colors.border,
    paddingHorizontal: 16,
    minHeight: 52,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 52,
    color: navigationTheme.colors.text,
    backgroundColor: 'transparent',
    paddingVertical: 0,
  },
  suggestionMainText: {
    color: navigationTheme.colors.text,
    fontSize: 16,
  },
  suggestionSecondaryText: {
    color: navigationTheme.colors.textMuted,
    fontSize: 14,
  },
  suggestionsContainer: {
    backgroundColor: navigationTheme.colors.surface,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: navigationTheme.colors.border,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: kotuwaBrand.navyMuted,
  },
  selectedBox: {
    backgroundColor: navigationTheme.colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: kotuwaBrand.purple,
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: kotuwaBrand.purple,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selectedText: {
    fontSize: 16,
    color: navigationTheme.colors.text,
    fontWeight: '500',
  },
  coordsText: {
    fontSize: 13,
    color: navigationTheme.colors.textMuted,
  },
  startButton: {
    backgroundColor: kotuwaBrand.orange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
    ...Platform.select({
      ios: {
        shadowColor: kotuwaBrand.orange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  startButtonDisabled: {
    backgroundColor: kotuwaBrand.navyMuted,
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  startButtonText: {
    color: navigationTheme.colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  statusText: {
    color: navigationTheme.colors.textMuted,
    fontSize: 14,
  },
  warningBox: {
    backgroundColor: navigationTheme.colors.dangerSurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  warningText: {
    color: '#FCA5A5',
    fontSize: 14,
    lineHeight: 20,
  },
});

export const placesInputStyles = {
  container: destinationScreenStyles.searchContainer,
  inputContainer: destinationScreenStyles.searchInputContainer,
  input: destinationScreenStyles.searchInput,
  suggestionsContainer: destinationScreenStyles.suggestionsContainer,
  suggestionItem: destinationScreenStyles.suggestionItem,
  suggestionText: {
    main: destinationScreenStyles.suggestionMainText,
    secondary: destinationScreenStyles.suggestionSecondaryText,
  },
  placeholder: {
    color: navigationTheme.colors.textMuted,
  },
  loadingIndicator: {
    color: kotuwaBrand.orange,
  },
};

export const navigationScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kotuwaBrand.black,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarLoading: {
    paddingTop: 8,
  },
  topBarNavigating: {
    justifyContent: 'flex-end',
    paddingTop: 0,
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: navigationTheme.colors.overlay,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(147, 104, 183, 0.45)',
  },
  spinner: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: navigationTheme.colors.overlayText,
    fontWeight: '500',
  },
  endButton: {
    backgroundColor: navigationTheme.colors.overlay,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(216, 124, 49, 0.55)',
  },
  endButtonText: {
    color: kotuwaBrand.orange,
    fontWeight: '600',
    fontSize: 14,
  },
  errorBanner: {
    backgroundColor: navigationTheme.colors.dangerSurface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  errorText: {
    color: '#FECACA',
    fontSize: 14,
    lineHeight: 20,
  },
  arrivedBanner: {
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: kotuwaBrand.yellow,
  },
  arrivedText: {
    color: navigationTheme.colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: navigationTheme.colors.background,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: navigationTheme.colors.text,
  },
  primaryButton: {
    backgroundColor: kotuwaBrand.orange,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: navigationTheme.colors.textOnPrimary,
    fontWeight: '600',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: kotuwaBrand.yellow,
    fontWeight: '600',
  },
});

export const loginScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: navigationTheme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  logo: {
    width: 400,
    height: 146,
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: navigationTheme.colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: navigationTheme.colors.textMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: navigationTheme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: navigationTheme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: navigationTheme.colors.text,
  },
  errorText: {
    color: navigationTheme.colors.danger,
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: kotuwaBrand.orange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: navigationTheme.colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
});

export const homeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: navigationTheme.colors.background,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: navigationTheme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: navigationTheme.colors.border,
    gap: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: navigationTheme.colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 15,
    color: navigationTheme.colors.textMuted,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  onlineText: {
    fontSize: 15,
    fontWeight: '600',
    color: navigationTheme.colors.text,
  },
  toggle: {
    backgroundColor: navigationTheme.colors.surfaceMuted,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: navigationTheme.colors.border,
  },
  toggleOnline: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e',
  },
  toggleText: {
    color: navigationTheme.colors.text,
    fontWeight: '600',
  },
  earningsCard: {
    backgroundColor: navigationTheme.colors.surfaceMuted,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: navigationTheme.colors.border,
  },
  earningsLabel: {
    fontSize: 14,
    color: navigationTheme.colors.textMuted,
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: '700',
    color: kotuwaBrand.yellow,
    marginTop: 4,
  },
  tripsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: navigationTheme.colors.text,
  },
  wsStatus: {
    fontSize: 12,
    color: navigationTheme.colors.textMuted,
  },
  logoutButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  logoutText: {
    color: kotuwaBrand.orange,
    fontSize: 14,
    fontWeight: '600',
  },
});

export const deliveryScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: navigationTheme.colors.background,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: navigationTheme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: navigationTheme.colors.textMuted,
    lineHeight: 22,
  },
  card: {
    backgroundColor: navigationTheme.colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: navigationTheme.colors.border,
  },
  label: {
    fontSize: 13,
    color: navigationTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: navigationTheme.colors.text,
  },
  primaryButton: {
    backgroundColor: kotuwaBrand.orange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: navigationTheme.colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: navigationTheme.colors.border,
  },
  secondaryButtonText: {
    color: navigationTheme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: navigationTheme.colors.danger,
    fontSize: 14,
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: navigationTheme.colors.surfaceMuted,
  },
});

export const offerModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: navigationTheme.colors.overlay,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: navigationTheme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
    borderTopWidth: 2,
    borderColor: kotuwaBrand.yellow,
  },
  badge: {
    fontSize: 13,
    fontWeight: '700',
    color: kotuwaBrand.yellow,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  merchant: {
    fontSize: 24,
    fontWeight: '700',
    color: navigationTheme.colors.text,
  },
  earnings: {
    fontSize: 32,
    fontWeight: '800',
    color: kotuwaBrand.orange,
  },
  addressBlock: {
    gap: 4,
  },
  addressLabel: {
    fontSize: 12,
    color: navigationTheme.colors.textMuted,
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 15,
    color: navigationTheme.colors.text,
    lineHeight: 20,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  timerTrack: {
    flex: 1,
    height: 8,
    backgroundColor: navigationTheme.colors.surfaceMuted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: kotuwaBrand.yellow,
    borderRadius: 4,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    color: kotuwaBrand.yellow,
    minWidth: 36,
    textAlign: 'right',
  },
  acceptButton: {
    backgroundColor: kotuwaBrand.orange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptText: {
    color: navigationTheme.colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  declineButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineText: {
    color: navigationTheme.colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});
