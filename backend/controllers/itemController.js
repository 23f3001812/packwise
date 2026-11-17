const itemService = require('../services/itemService');

const addItem = async (req, res, next) => {
  try {
    const item = await itemService.addItemToList(req.user.uid, req.params.listId, req.body);
    return res.status(201).json({
      success: true,
      message: 'Item added successfully',
      data: item
    });
  } catch (error) {
    next(error);
  }
};

const getItemsByList = async (req, res, next) => {
  try {
    const items = await itemService.getItemsByList(req.user.uid, req.params.listId);
    return res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

const getItemById = async (req, res, next) => {
  try {
    const item = await itemService.getItemById(req.user.uid, req.params.itemId);
    return res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const updated = await itemService.updateItem(req.user.uid, req.params.itemId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const updateItemStatus = async (req, res, next) => {
  try {
    const updated = await itemService.updateItemStatus(req.user.uid, req.params.itemId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Item status updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const result = await itemService.deleteItem(req.user.uid, req.params.itemId);
    return res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const batchAddItems = async (req, res, next) => {
  try {
    const items = req.body.items || req.body;
    const result = await itemService.batchAddItemsToList(req.user.uid, req.params.listId, items);
    return res.status(201).json({
      success: true,
      message: `${result.count} items added successfully`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addItem,
  batchAddItems,
  getItemsByList,
  getItemById,
  updateItem,
  updateItemStatus,
  deleteItem
};

