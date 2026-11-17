import { get, post, request } from './api';

export const addItem = async (listId, itemData) => {
  const response = await post(`lists/${listId}/items`, itemData, { requiresAuth: true });
  return response.data;
};

export const fetchItemsByList = async (listId) => {
  const response = await get(`lists/${listId}/items`, { requiresAuth: true });
  return response.data || [];
};

export const updateItem = async (itemId, updates) => {
  const response = await request(`items/${itemId}`, {
    method: 'PUT',
    body: updates,
    requiresAuth: true,
  });
  return response.data;
};

export const updateItemStatus = async (itemId, { isPacked, isUnpacked }) => {
  const response = await request(`items/${itemId}/status`, {
    method: 'PATCH',
    body: { isPacked, isUnpacked },
    requiresAuth: true,
  });
  return response.data;
};

export const deleteItem = async (itemId) => {
  const response = await request(`items/${itemId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
  return response.data;
};

export default {
  addItem,
  fetchItemsByList,
  updateItem,
  updateItemStatus,
  deleteItem,
};

