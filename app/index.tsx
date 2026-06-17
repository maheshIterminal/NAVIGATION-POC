import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/providers/AuthProvider';
import { loginScreenStyles as styles, navigationTheme } from '../src/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { token, isLoading, login } = useAuth();
  const [email, setEmail] = useState('driver@kotuwa.com');
  const [password, setPassword] = useState('driver123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && token) {
      router.replace('/home');
    }
  }, [isLoading, token, router]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={navigationTheme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const handleLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/kotuwa-driver-logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Kotuwa Driver App"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Driver sign in</Text>
        <Text style={styles.subtitle}>Sign in to start receiving delivery offers.</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={navigationTheme.colors.textMuted}
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={navigationTheme.colors.textMuted}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.signInButton, submitting && styles.signInButtonDisabled]}
          disabled={submitting}
          onPress={() => void handleLogin()}
        >
          {submitting ? (
            <ActivityIndicator color={navigationTheme.colors.textOnPrimary} />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
