import { API_URL } from '../constants/config';
import type { LoginResponse } from '../types/auth';
import type { DriverStats, Order } from '../types/order';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const hasBody = body !== undefined;
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json().catch(() => ({}))) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? `Request failed (${response.status})`);
  }

  return data;
}

export const api = {
  login(email: string, password: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  getStats(token: string) {
    return request<DriverStats>('/drivers/me/stats', { token });
  },

  setAvailability(token: string, online: boolean) {
    return request<{ isOnline: boolean }>('/drivers/me/availability', {
      method: 'POST',
      token,
      body: { online },
    });
  },

  acceptOffer(token: string, offerId: string) {
    return request<{ order: Order }>(`/offers/${offerId}/accept`, {
      method: 'POST',
      token,
    });
  },

  declineOffer(token: string, offerId: string) {
    return request<{ ok: boolean }>(`/offers/${offerId}/decline`, {
      method: 'POST',
      token,
    });
  },

  getActiveOrder(token: string) {
    return request<{ order: Order | null }>('/orders/active', { token });
  },

  confirmPickup(token: string, orderId: string) {
    return request<{ order: Order }>(`/orders/${orderId}/pickup`, {
      method: 'POST',
      token,
    });
  },

  confirmDeliver(token: string, orderId: string) {
    return request<{ order: Order }>(`/orders/${orderId}/deliver`, {
      method: 'POST',
      token,
    });
  },

  submitProof(token: string, orderId: string, photoUri?: string, skipped = false) {
    return request<{ order: Order }>(`/orders/${orderId}/proof`, {
      method: 'POST',
      token,
      body: { photoUri, skipped },
    });
  },
};
