import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class SocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.listeners = new Set();
  }

  connect() {
    if (this.client && this.client.active) {
      return;
    }

    const socketFactory = () => new SockJS('/ws');

    this.client = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 4000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.connected = true;
        this.notifyStatus(true);
        // Resubscribe to existing active channels
        for (const [topic, callbacks] of this.subscriptions.entries()) {
          this.subscribeInternal(topic, callbacks);
        }
      },
      onDisconnect: () => {
        this.connected = false;
        this.notifyStatus(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.connected = false;
        this.notifyStatus(false);
      },
    });

    this.client.activate();
  }

  onStatusChange(callback) {
    this.listeners.add(callback);
    callback(this.connected);
    return () => this.listeners.delete(callback);
  }

  notifyStatus(status) {
    for (const listener of this.listeners) {
      try {
        listener(status);
      } catch (err) {
        console.error('Error in status listener:', err);
      }
    }
  }

  subscribe(topic, callback) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic).add(callback);

    if (this.connected) {
      this.subscribeInternal(topic, this.subscriptions.get(topic));
    }

    // Return un-subscribe function
    return () => {
      const callbacks = this.subscriptions.get(topic);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(topic);
          const sub = this.activeSubscriptions?.[topic];
          if (sub) {
            sub.unsubscribe();
            delete this.activeSubscriptions[topic];
          }
        }
      }
    };
  }

  subscribeInternal(topic, callbacks) {
    if (!this.activeSubscriptions) {
      this.activeSubscriptions = {};
    }
    if (this.activeSubscriptions[topic]) {
      return;
    }

    try {
      const sub = this.client.subscribe(topic, (message) => {
        try {
          const payload = JSON.parse(message.body);
          for (const cb of callbacks) {
            cb(payload);
          }
        } catch (err) {
          console.error('Failed to parse STOMP message payload:', err);
        }
      });
      this.activeSubscriptions[topic] = sub;
    } catch (err) {
      console.error(`Failed to subscribe to ${topic}:`, err);
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
      this.activeSubscriptions = {};
    }
  }
}

export const socketService = new SocketService();
