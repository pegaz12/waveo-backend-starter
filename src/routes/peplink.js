import express from "express";
import { peplinkGet } from "../services/peplinkClient.js";

const router = express.Router();

const ORG_ID = process.env.PEPLINK_ORG_ID;
const GROUP_ID = process.env.PEPLINK_GROUP_ID;

router.get("/devices", async (_req, res) => {
  try {
    const result = await peplinkGet(`/rest/o/${ORG_ID}/g/${GROUP_ID}/d`);

    const devices = result.data.map((device) => {
      const wan = device.interfaces?.find(
        (i) => i.type === "ethernet" && i.enable
      );

      const cellularInterfaces =
        device.interfaces?.filter((i) => i.virtualType === "cellular") || [];

      const modem1 = cellularInterfaces[0];
      const modem2 = cellularInterfaces[1];

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

        modem1: {
          name: modem1?.name,
          carrier: modem1?.carrier_name,
          status: modem1?.status,
          ip: modem1?.ip,
          rsrp: modem1?.cellular_signals?.rsrp,
          rsrq: modem1?.cellular_signals?.rsrq,
          sinr: modem1?.cellular_signals?.sinr,
        },

        modem2: {
          name: modem2?.name,
          carrier: modem2?.carrier_name,
          status: modem2?.status,
          ip: modem2?.ip,
          rsrp: modem2?.cellular_signals?.rsrp,
          rsrq: modem2?.cellular_signals?.rsrq,
          sinr: modem2?.cellular_signals?.sinr,
        },

        carrier: modem1?.carrier_name,
        cellularStatus: modem1?.status,
        rsrp: modem1?.cellular_signals?.rsrp,
        rsrq: modem1?.cellular_signals?.rsrq,
        sinr: modem1?.cellular_signals?.sinr,
        ip: modem1?.ip,

        lastSeen: device.last_online,
      };
    });

    res.json({
      ok: true,
      source: "peplink",
      devices,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      ok: false,
      source: "peplink",
      error: err.response?.data || err.message,
    });
  }
});

export default router;
