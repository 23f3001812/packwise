/**
 * PackWise Collaboration API Service (Frontend Client)
 * Handles invitations, member role updates, collaborator list, and shared lists.
 */

import { get, post, request } from './api';

export const sendInvitation = async ({ listId, email, role = 'editor' }) => {
  const response = await post('collaboration/invitations', { listId, email, role }, { requiresAuth: true });
  return response.data;
};

export const fetchReceivedInvitations = async () => {
  const response = await get('collaboration/invitations/received', { requiresAuth: true });
  return response.data || [];
};

export const fetchSentInvitations = async (listId) => {
  const response = await get(`collaboration/invitations/sent?listId=${listId}`, { requiresAuth: true });
  return response.data || [];
};

export const acceptInvitation = async (invitationId) => {
  const response = await post(`collaboration/invitations/${invitationId}/accept`, {}, { requiresAuth: true });
  return response.data;
};

export const rejectInvitation = async (invitationId) => {
  const response = await post(`collaboration/invitations/${invitationId}/reject`, {}, { requiresAuth: true });
  return response.data;
};

export const cancelInvitation = async (invitationId) => {
  const response = await post(`collaboration/invitations/${invitationId}/cancel`, {}, { requiresAuth: true });
  return response.data;
};

export const fetchListMembers = async (listId) => {
  const response = await get(`collaboration/lists/${listId}/members`, { requiresAuth: true });
  return response.data;
};

export const updateMemberRole = async (listId, userId, role) => {
  const response = await request(`collaboration/lists/${listId}/members/${userId}/role`, {
    method: 'PATCH',
    body: { role },
    requiresAuth: true
  });
  return response.data;
};

export const removeMember = async (listId, userId) => {
  const response = await request(`collaboration/lists/${listId}/members/${userId}`, {
    method: 'DELETE',
    requiresAuth: true
  });
  return response.data;
};

export const leaveList = async (listId) => {
  const response = await post(`collaboration/lists/${listId}/leave`, {}, { requiresAuth: true });
  return response.data;
};

export const fetchSharedLists = async () => {
  const response = await get('collaboration/lists/shared-with-me', { requiresAuth: true });
  return response.data || [];
};

export default {
  sendInvitation,
  fetchReceivedInvitations,
  fetchSentInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  fetchListMembers,
  updateMemberRole,
  removeMember,
  leaveList,
  fetchSharedLists
};

