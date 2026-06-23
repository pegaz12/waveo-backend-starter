import { Router } from 'express';
import {
  getDevices,
  getDeviceSummary,
  getHotspotUsers,
  testHotspotUserPaths,
} from '../services/rms.service.js';

const router = Router();

/*
 * List all RMS devices
 */
router.get('/', async (_req, res, next) => {
  try {
    const devices = await getDevices();
    res.json(devices);
  } catch (error) {
    next(error);
  }
});

/*
 * Temporary endpoint to discover hotspot API paths
 * Remove once hotspot API is confirmed working.
 */
router.get('/:id/hotspot-users-test', async (req, res, next) => {
  try {
    const result = await testHotspotUserPaths(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/*
 * Active Hotspot Users
 *
 * Example:
 * /devices/2214918/hotspot-users
 * /devices/2214918/hotspot-users?index=2
 */
router.get('/:id/hotspot-users', async (req, res, next) => {
  try {

    const hotspotIndex = Number(req.query.index || 1);

    const users = await getHotspotUsers(
      req.params.id,
      hotspotIndex
    );

    res.json(users);

  } catch (error) {
    next(error);
  }
});

/*
 * Device Details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const device = await getDeviceSummary(req.params.id);
    res.json(device);
  } catch (error) {
    next(error);
  }
});

export default router;
