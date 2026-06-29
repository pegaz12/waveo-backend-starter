import { Router } from 'express';
import {
  getDevices,
  getDeviceSummary,
  getHotspotUsers,
  testHotspotUserPaths,
  testClientPaths,
} from '../services/rms.service.js';

import { getDhcpLeases } from '../services/teltonika.device.service.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const devices = await getDevices();
    res.json(devices);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/clients-test', async (req, res, next) => {
  try {
    const result = await testClientPaths(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/hotspot-users-test', async (req, res, next) => {
  try {
    const result = await testHotspotUserPaths(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/hotspot-users', async (req, res, next) => {
  try {
    const hotspotIndex = Number(req.query.index || 1);
    const users = await getHotspotUsers(req.params.id, hotspotIndex);
    res.json(users);
  } catch (error) {
    next(error);
  }
});

/*
 * DHCP leases from the Teltonika router itself
 */
router.get('/:id/dhcp-leases', async (_req, res, next) => {
  try {
    const leases = await getDhcpLeases();
    res.json(leases);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const device = await getDeviceSummary(req.params.id);
    res.json(device);
  } catch (error) {
    next(error);
  }
});

export default router;
