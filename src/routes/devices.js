import { Router } from 'express';
import {
  getDevices,
  getDeviceSummary,
} from '../services/rms.service.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const devices = await getDevices();
    res.json(devices);
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
