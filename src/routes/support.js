import { Router } from 'express';

import {
  getDevices,
  getWirelessClients,
} from '../services/rms.service.js';

const router = Router();

router.get('/device/:kitNumber', async (req, res, next) => {
  try {
    const kitNumber = req.params.kitNumber.toUpperCase();

    const devices = await getDevices();

    const device = devices.find(
      d => d.name?.toUpperCase() === kitNumber
    );

    if (!device) {
      return res.status(404).json({
        error: 'Device not found',
      });
    }

    res.json(device);
  } catch (error) {
    next(error);
  }
});

export default router;
