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

    let wifiClients = [];

    try {
      const wifiResult = await getWirelessClients(device.id);
      wifiClients = wifiResult.clients ?? [];
    } catch (wifiError) {
      console.error(
        `Failed to retrieve Wi-Fi clients for ${kitNumber}:`,
        wifiError.message
      );
    }

    res.json({
      ...device,
      wifi_clients: wifiClients,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
