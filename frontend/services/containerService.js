import { get, post, request } from './api';

export const fetchContainers = async () => {
  const response = await get('containers', { requiresAuth: true });
  return response.data || [];
};

export const fetchContainerById = async (containerId) => {
  const response = await get(`containers/${containerId}`, { requiresAuth: true });
  return response.data;
};

export const createContainer = async (containerData) => {
  const response = await post('containers', containerData, { requiresAuth: true });
  return response.data;
};

export const updateContainer = async (containerId, updates) => {
  const response = await request(`containers/${containerId}`, {
    method: 'PUT',
    body: updates,
    requiresAuth: true,
  });
  return response.data;
};

export const deleteContainer = async (containerId) => {
  const response = await request(`containers/${containerId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
  return response.data;
};

export const fetchContainerItems = async (containerId) => {
  const response = await get(`containers/${containerId}/items`, { requiresAuth: true });
  return response.data || [];
};

export default {
  fetchContainers,
  fetchContainerById,
  createContainer,
  updateContainer,
  deleteContainer,
  fetchContainerItems,
};

