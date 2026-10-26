import { apiRequest } from './api';

export const orderService = {
  async createOrder(items) {
    return apiRequest('/api/orders', {
      method: 'POST',
      body: {
        paymentMethod: 'CASH',
        items: items.map(item => ({
          dishId: item.dishId,
          quantity: item.quantity,
        })),
      },
    });
  },

  async getMyOrders() {
    return apiRequest('/api/orders/my');
  },

  async getOrderById(id) {
    return apiRequest(`/api/orders/${id}`);
  },

  async cancelOrder(id) {
    return apiRequest(`/api/orders/${id}/cancel`, {
      method: 'PATCH',
    });
  },

  // Staff endpoints
  async getStaffActiveOrders() {
    return apiRequest('/api/staff/orders/active');
  },

  async getStaffOrderHistory() {
    return apiRequest('/api/staff/orders/history');
  },

  async updateOrderStatus(id, status) {
    return apiRequest(`/api/staff/orders/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  async updatePaymentStatus(id, paymentStatus) {
    return apiRequest(`/api/staff/orders/${id}/payment`, {
      method: 'PATCH',
      body: { paymentStatus },
    });
  },
};
