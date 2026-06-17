import type { DriverProfile } from './order';

export type AuthState = {
  token: string | null;
  driver: DriverProfile | null;
  isLoading: boolean;
};

export type LoginResponse = {
  token: string;
  driver: DriverProfile;
};
