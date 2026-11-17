const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const collaborationController = require('../controllers/collaborationController');

// All collaboration endpoints require verified Firebase ID token
router.use(verifyFirebaseToken);

// Invitations routes
router.post('/invitations', collaborationController.sendInvitation);
router.get('/invitations/received', collaborationController.getReceivedInvitations);
router.get('/invitations/sent', collaborationController.getSentInvitations);
router.post('/invitations/:invitationId/accept', collaborationController.acceptInvitation);
router.post('/invitations/:invitationId/reject', collaborationController.rejectInvitation);
router.post('/invitations/:invitationId/cancel', collaborationController.cancelInvitation);

// Shared Lists
router.get('/lists/shared-with-me', collaborationController.getSharedLists);

// List Membership & Collaborators
router.get('/lists/:listId/members', collaborationController.getListMembers);
router.patch('/lists/:listId/members/:userId/role', collaborationController.updateMemberRole);
router.delete('/lists/:listId/members/:userId', collaborationController.removeMember);
router.post('/lists/:listId/leave', collaborationController.leaveList);

module.exports = router;

