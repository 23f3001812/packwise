import { get, post, request } from './api';

export const fetchPackingLists = async () => {
  const response = await get('lists', { requiresAuth: true });
  return response.data || [];
};

export const fetchPackingListById = async (listId) => {
  const response = await get(`lists/${listId}`, { requiresAuth: true });
  return response.data;
};

export const createPackingList = async (listData) => {
  const response = await post('lists', listData, { requiresAuth: true });
  return response.data;
};

export const updatePackingList = async (listId, updates) => {
  const response = await request(`lists/${listId}`, {
    method: 'PUT',
    body: updates,
    requiresAuth: true,
  });
  return response.data;
};

export const deletePackingList = async (listId) => {
  const response = await request(`lists/${listId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
  return response.data;
};

export const fetchDashboardSummary = async () => {
  const response = await get('lists/summary/dashboard', { requiresAuth: true });
  return response.data;
};

export default {
  fetchPackingLists,
  fetchPackingListById,
  createPackingList,
  updatePackingList,
  deletePackingList,
  fetchDashboardSummary,
};

