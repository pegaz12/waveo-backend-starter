import express from "express";
import { peplinkGet } from "../services/peplinkClient.js";

const router = express.Router();

const ORG_ID = process.env.PEPLINK_ORG_ID;
const GROUP_ID = process.env.PEPLINK_GROUP_ID;

router.get("/devices", async (_req, res) => {
  try {

    const result = await peplinkGet(
      `/rest/o/${ORG_ID}/g/${GROUP_ID}/d`
    );

    const devices = result.data.map(device => {

      const cellular = device.interfaces.find(
        i => i.virtualType === "cellular" && i.enable
      );

      const wan = device.interfaces.find(
        i => i.type === "ethernet" && i.enable
      );

      return {
        id: device.id,
        name: device.name,
        model: device.model,
        serial: device.sn,

        online: device.onlineStatus === "ONLINE",
        status: device.onlineStatus,

        firmware: device.fw_ver,
        uptime: device.uptime,

        clients: device.client_count,

        wanStatus: wan?.status,
        wanIP: wan?.ip,

        carrier: cellular?.carrier_name,
        cellularStatus: cellular?.status,

        rsrp: cellular?.cellular_signals?.rsrp,
        rsrq: cellular?.cellular_signals?.rsrq,
        sinr: cellular?.cellular_signals?.sinr,

        ip: cellular?.ip,

        lastSeen: device.last_online
      };

    });

    res.json({
      ok: true,
      source: "peplink",
      devices
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      ok: false,
      source: "peplink",
      error: err.response?.data || err.message
    });

  }
});

export default router;
