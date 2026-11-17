const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const listController = require('../controllers/listController');
const itemController = require('../controllers/itemController');

// All list routes require verified Firebase ID token
router.use(verifyFirebaseToken);

// Dashboard summary aggregation
router.get('/summary/dashboard', listController.getDashboardSummary);

// Base packing lists CRUD
router.post('/', listController.createList);
router.get('/', listController.getLists);
router.get('/:id', listController.getListById);
router.put('/:id', listController.updateList);
router.delete('/:id', listController.deleteList);

// Nested items under a specific list
router.post('/:listId/items', itemController.addItem);
router.post('/:listId/items/batch', itemController.batchAddItems);
router.get('/:listId/items', itemController.getItemsByList);

module.exports = router;

