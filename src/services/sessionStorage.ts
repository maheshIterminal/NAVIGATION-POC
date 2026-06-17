import { AUTH_DRIVER_KEY, AUTH_TOKEN_KEY } from '../constants/config';

const memory = new Map<string, string>();

type SecureStoreModule = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

let secureStore: SecureStoreModule | null | undefined;

function getSecureStore(): SecureStoreModule | null {
  if (secureStore !== undefined) {
    return secureStore;
  }

  try {
    // Lazy load so the app still runs in an older dev client without this native module.
    secureStore = require('expo-secure-store') as SecureStoreModule;
  } catch {
    secureStore = null;
  }

  return secureStore;
}

async function getItem(key: string): Promise<string | null> {
  const store = getSecureStore();
  if (store) {
    try {
      return await store.getItemAsync(key);
    } catch {
      // Fall through to memory if native module is missing at runtime.
    }
  }
  return memory.get(key) ?? null;
}

async function setItem(key: string, value: string): Promise<void> {
  const store = getSecureStore();
  if (store) {
    try {
      await store.setItemAsync(key, value);
      return;
    } catch {
      // Fall through to memory if native module is missing at runtime.
    }
  }
  memory.set(key, value);
}

async function deleteItem(key: string): Promise<void> {
  const store = getSecureStore();
  if (store) {
    try {
      await store.deleteItemAsync(key);
    } catch {
      // Fall through to memory if native module is missing at runtime.
    }
  }
  memory.delete(key);
}

export const sessionStorage = {
  getToken: () => getItem(AUTH_TOKEN_KEY),
  getDriverJson: () => getItem(AUTH_DRIVER_KEY),
  saveSession: async (token: string, driverJson: string) => {
    await Promise.all([setItem(AUTH_TOKEN_KEY, token), setItem(AUTH_DRIVER_KEY, driverJson)]);
  },
  clearSession: async () => {
    await Promise.all([deleteItem(AUTH_TOKEN_KEY), deleteItem(AUTH_DRIVER_KEY)]);
  },
};
