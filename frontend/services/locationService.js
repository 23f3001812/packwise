import { get, post, request } from './api';

export const fetchLocations = async () => {
  const response = await get('locations', { requiresAuth: true });
  return response.data || [];
};

export const createLocation = async (data) => {
  const response = await post('locations', data, { requiresAuth: true });
  return response.data;
};

export const updateLocation = async (locationId, updates) => {
  const response = await request(`locations/${locationId}`, {
    method: 'PUT',
    body: updates,
    requiresAuth: true,
  });
  return response.data;
};

export const toggleLocationActive = async (locationId, isActive) => {
  const response = await request(`locations/${locationId}/toggle`, {
    method: 'PATCH',
    body: { isActive },
    requiresAuth: true,
  });
  return response.data;
};

export const deleteLocation = async (locationId) => {
  const response = await request(`locations/${locationId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
  return response.data;
};

export default {
  fetchLocations,
  createLocation,
  updateLocation,
  toggleLocationActive,
  deleteLocation,
};

