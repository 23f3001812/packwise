/**
 * PackWise Location Controller
 */

const locationService = require('../services/locationService');

const createLocation = async (req, res, next) => {
  try {
    const result = await locationService.createLocation(req.user.uid, req.body);
    return res.status(201).json({
      success: true,
      message: 'Location saved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getLocations = async (req, res, next) => {
  try {
    const locations = await locationService.getLocations(req.user.uid);
    return res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};

const getLocationById = async (req, res, next) => {
  try {
    const location = await locationService.getLocationById(req.user.uid, req.params.id);
    return res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

const updateLocation = async (req, res, next) => {
  try {
    const result = await locationService.updateLocation(req.user.uid, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const toggleLocationActive = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const result = await locationService.toggleLocationActive(req.user.uid, req.params.id, isActive);
    return res.status(200).json({
      success: true,
      message: `Location ${result.isActive ? 'enabled' : 'disabled'}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteLocation = async (req, res, next) => {
  try {
    const result = await locationService.deleteLocation(req.user.uid, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Location deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  toggleLocationActive,
  deleteLocation,
};

