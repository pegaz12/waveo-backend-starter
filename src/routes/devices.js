import { Router } from 'express';
import {
  getDevices,
  getDeviceSummary,
  getHotspotUsers,
  testHotspotUserPaths,
} from '../services/rms.service.js';

const router = Router();

/*
 * List all devices
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
 * Discover correct RMS Hotspot API endpoint
 * (temporary - remove later)
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
 * Return active hotspot users
 */
router.get('/:id/hotspot-users', async (req, res, next) => {
  try {
    const users = await getHotspotUsers(req.params.id);
    res.json(users);
  } catch (error) {
    next(error);
  }
});

/*
 * Device details
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
