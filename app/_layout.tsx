import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  NavigationProvider,
  TaskRemovedBehavior,
} from '@googlemaps/react-native-navigation-sdk';
import { AuthProvider } from '../src/providers/AuthProvider';
import { DriverSessionProvider } from '../src/providers/DriverSessionProvider';
import { kotuwaBrand } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <DriverSessionProvider>
        <NavigationProvider
          termsAndConditionsDialogOptions={{
            title: 'Navigation',
            companyName: 'Kotuwa Driver',
            showOnlyDisclaimer: false,
          }}
          taskRemovedBehavior={TaskRemovedBehavior.CONTINUE_SERVICE}
        >
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: kotuwaBrand.black },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="home" />
            <Stack.Screen name="delivery" />
            <Stack.Screen name="navigation" />
          </Stack>
        </NavigationProvider>
      </DriverSessionProvider>
    </AuthProvider>
  );
}
