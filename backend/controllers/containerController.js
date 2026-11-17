const containerService = require('../services/containerService');

const createContainer = async (req, res, next) => {
  try {
    const container = await containerService.createContainer(req.user.uid, req.body);
    return res.status(201).json({
      success: true,
      message: 'Container created successfully',
      data: container
    });
  } catch (error) {
    next(error);
  }
};

const getContainers = async (req, res, next) => {
  try {
    const containers = await containerService.getUserContainers(req.user.uid);
    return res.status(200).json({
      success: true,
      data: containers
    });
  } catch (error) {
    next(error);
  }
};

const getContainerById = async (req, res, next) => {
  try {
    const data = await containerService.getContainerById(req.user.uid, req.params.containerId);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const updateContainer = async (req, res, next) => {
  try {
    const updated = await containerService.updateContainer(req.user.uid, req.params.containerId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Container updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const deleteContainer = async (req, res, next) => {
  try {
    const result = await containerService.deleteContainer(req.user.uid, req.params.containerId);
    return res.status(200).json({
      success: true,
      message: 'Container deleted successfully (assigned items were preserved)',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getContainerItems = async (req, res, next) => {
  try {
    const items = await containerService.getItemsInContainer(req.user.uid, req.params.containerId);
    return res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createContainer,
  getContainers,
  getContainerById,
  updateContainer,
  deleteContainer,
  getContainerItems
};

