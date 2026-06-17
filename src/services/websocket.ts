import { WS_URL } from '../constants/config';
import type { WsClientMessage, WsEventHandler, WsServerMessage } from '../types/order';

type ConnectionState = 'disconnected' | 'connecting' | 'connected';

const HEARTBEAT_MS = 15_000;
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;

export class DriverWebSocket {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private shouldConnect = false;
  private handlers = new Set<WsEventHandler>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private state: ConnectionState = 'disconnected';
  private onStateChange?: (state: ConnectionState) => void;

  setOnStateChange(cb: (state: ConnectionState) => void) {
    this.onStateChange = cb;
  }

  getState(): ConnectionState {
    return this.state;
  }

  subscribe(handler: WsEventHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  connect(token: string) {
    this.token = token;
    this.shouldConnect = true;
    this.openSocket();
  }

  disconnect() {
    this.shouldConnect = false;
    this.clearReconnect();
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setState('disconnected');
  }

  send(message: WsClientMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  goOnline() {
    this.send({ type: 'driver_online' });
  }

  goOffline() {
    this.send({ type: 'driver_offline' });
  }

  sendLocation(lat: number, lng: number) {
    this.send({ type: 'location_update', lat, lng });
  }

  private setState(state: ConnectionState) {
    this.state = state;
    this.onStateChange?.(state);
  }

  private openSocket() {
    if (!this.token || !this.shouldConnect) return;
    if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.setState('connecting');
    const url = `${WS_URL}?token=${encodeURIComponent(this.token)}`;
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.setState('connected');
      this.startHeartbeat();
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as WsServerMessage;
        for (const handler of this.handlers) {
          handler(message);
        }
      } catch {
        // ignore malformed messages
      }
    };

    socket.onclose = () => {
      this.stopHeartbeat();
      this.socket = null;
      if (this.shouldConnect) {
        this.setState('connecting');
        this.scheduleReconnect();
      } else {
        this.setState('disconnected');
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'heartbeat' });
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    this.clearReconnect();
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** this.reconnectAttempt, RECONNECT_MAX_MS);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
  }

  private clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export const driverWebSocket = new DriverWebSocket();
