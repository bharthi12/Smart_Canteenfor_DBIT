import { apiRequest } from './api';

export const menuService = {
  async getDishes(availableOnly = false) {
    const url = availableOnly ? '/api/dishes?available=true' : '/api/dishes';
    return apiRequest(url);
  },

  async getDishById(id) {
    return apiRequest(`/api/dishes/${id}`);
  },

  async updateDishAvailability(id, available) {
    return apiRequest(`/api/staff/dishes/${id}/availability`, {
      method: 'PATCH',
      body: { available },
    });
  },
};
