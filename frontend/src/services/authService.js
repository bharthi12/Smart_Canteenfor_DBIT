import { apiRequest } from './api';

export const authService = {
  async register(name, email, password) {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
  },

  async login(email, password) {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  async getCurrentUser() {
    return apiRequest('/api/auth/me');
  },

  async logout() {
    return apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  },
};
