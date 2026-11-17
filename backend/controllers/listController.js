const listService = require('../services/listService');

const createList = async (req, res, next) => {
  try {
    const list = await listService.createPackingList(req.user.uid, req.body);
    return res.status(201).json({
      success: true,
      message: 'Packing list created successfully',
      data: list
    });
  } catch (error) {
    next(error);
  }
};

const getLists = async (req, res, next) => {
  try {
    const lists = await listService.getUserPackingLists(req.user.uid);
    return res.status(200).json({
      success: true,
      data: lists
    });
  } catch (error) {
    next(error);
  }
};

const getListById = async (req, res, next) => {
  try {
    const data = await listService.getPackingListById(req.user.uid, req.params.id);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const updateList = async (req, res, next) => {
  try {
    const updated = await listService.updatePackingList(req.user.uid, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Packing list updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const deleteList = async (req, res, next) => {
  try {
    const result = await listService.deletePackingList(req.user.uid, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Packing list and associated items deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await listService.getDashboardSummary(req.user.uid);
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createList,
  getLists,
  getListById,
  updateList,
  deleteList,
  getDashboardSummary
};

