/**
 * PackWise Collaboration Controller
 * Handles HTTP requests for list sharing, invitations, membership roles, and shared lists.
 */

const collaborationService = require('../services/collaborationService');

/**
 * POST /api/collaboration/invitations
 * Sends an invitation to a collaborator by email.
 */
const sendInvitation = async (req, res, next) => {
  try {
    const { listId, email, role } = req.body;
    const inviterId = req.user.uid;
    const inviterEmail = req.user.email || '';
    const inviterName = req.user.name || inviterEmail.split('@')[0];

    const result = await collaborationService.sendInvitation(
      inviterId,
      inviterEmail,
      inviterName,
      { listId, email, role }
    );

    return res.status(201).json({
      success: true,
      message: `Invitation sent to ${email}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/collaboration/invitations/received
 * Retrieves all pending invitations addressed to the current user's email.
 */
const getReceivedInvitations = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const userId = req.user.uid;
    const invitations = await collaborationService.getReceivedInvitations(userEmail, userId);

    return res.status(200).json({
      success: true,
      data: invitations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/collaboration/invitations/sent
 * Retrieves sent pending invitations for a specific list (owner only).
 */
const getSentInvitations = async (req, res, next) => {
  try {
    const { listId } = req.query;
    if (!listId) {
      return res.status(400).json({ success: false, error: 'listId query parameter is required' });
    }
    const invitations = await collaborationService.getSentInvitationsForList(req.user.uid, listId);

    return res.status(200).json({
      success: true,
      data: invitations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/collaboration/invitations/:invitationId/accept
 * Accepts an invitation and joins the packing list.
 */
const acceptInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.uid;
    const userEmail = req.user.email;
    const userName = req.user.name || userEmail?.split('@')[0];

    const result = await collaborationService.acceptInvitation(
      userId,
      userEmail,
      userName,
      invitationId
    );

    return res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/collaboration/invitations/:invitationId/reject
 * Rejects an invitation.
 */
const rejectInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.uid;
    const userEmail = req.user.email;

    const result = await collaborationService.rejectInvitation(userId, userEmail, invitationId);

    return res.status(200).json({
      success: true,
      message: 'Invitation declined',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/collaboration/invitations/:invitationId/cancel
 * Cancels a sent invitation (owner only).
 */
const cancelInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const result = await collaborationService.cancelInvitation(req.user.uid, invitationId);

    return res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/collaboration/lists/:listId/members
 * Retrieves all collaborators and pending invitations for a list.
 */
const getListMembers = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const result = await collaborationService.getListMembers(req.user.uid, listId);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/collaboration/lists/:listId/members/:userId/role
 * Updates a collaborator's role (owner only).
 */
const updateMemberRole = async (req, res, next) => {
  try {
    const { listId, userId: targetUserId } = req.params;
    const { role } = req.body;

    const result = await collaborationService.updateMemberRole(
      req.user.uid,
      listId,
      targetUserId,
      role
    );

    return res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/collaboration/lists/:listId/members/:userId
 * Removes a collaborator from the list (owner only).
 */
const removeMember = async (req, res, next) => {
  try {
    const { listId, userId: targetUserId } = req.params;
    const result = await collaborationService.removeMember(req.user.uid, listId, targetUserId);

    return res.status(200).json({
      success: true,
      message: 'Collaborator removed from list',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/collaboration/lists/:listId/leave
 * Allows a collaborator to leave a shared list.
 */
const leaveList = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const result = await collaborationService.leaveList(req.user.uid, listId);

    return res.status(200).json({
      success: true,
      message: 'You have left the shared packing list',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/collaboration/lists/shared-with-me
 * Retrieves all collaborative packing lists shared with the authenticated user.
 */
const getSharedLists = async (req, res, next) => {
  try {
    const lists = await collaborationService.getSharedListsForUser(req.user.uid);

    return res.status(200).json({
      success: true,
      data: lists
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendInvitation,
  getReceivedInvitations,
  getSentInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  getListMembers,
  updateMemberRole,
  removeMember,
  leaveList,
  getSharedLists
};

