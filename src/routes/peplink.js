import express from "express";
import { peplinkGet } from "../services/peplinkClient.js";

const router = express.Router();

const ORG_ID = process.env.PEPLINK_ORG_ID;
const GROUP_ID = process.env.PEPLINK_GROUP_ID;

function mapModem(modem) {
  if (!modem) return {};

  return {
    name: modem.name,
    carrier: modem.carrier_name,
    status: modem.status,
    ip: modem.ip,

    imei: modem.imei,
    iccid: modem.sims?.[0]?.iccid,
    imsi: modem.sims?.[0]?.imsi,
    apn: modem.sims?.[0]?.apn || modem.apn,

    rsrp: modem.cellular_signals?.rsrp,
    rsrq: modem.cellular_signals?.rsrq,
    sinr: modem.cellular_signals?.sinr,
    rssi: modem.cellular_signals?.rssi,

    band: modem.gobi_band_class_name,
    technology: modem.data_technology || modem.mobile_type,

    cellId: modem.cell_tower?.cellId,
    tac: modem.cell_tower?.tac
  };
}

router.get("/devices", async (_req, res) => {
  try {

    const result = await peplinkGet(
      `/rest/o/${ORG_ID}/g/${GROUP_ID}/d`
    );

    const devices = result.data.map((device) => {

      const wan = device.interfaces?.find(
        i => i.type === "ethernet" && i.enable
      );

      const cellularInterfaces =
        device.interfaces?.filter(
          i => i.virtualType === "cellular"
        ) || [];

      const modem1 = cellularInterfaces[0];
      const modem2 = cellularInterfaces[1];

      const lan = device.vlan_interfaces?.[0];

      return {

        id: device.id,
        name: device.name,
        model: device.model,
        serial: device.sn,

        online: device.onlineStatus === "ONLINE",
        status: device.onlineStatus,

        firmware: device.fw_ver,
        uptime: device.uptime,

        temperature:
          device.temperature ||
          device.system_temperature ||
          device.temp ||
          null,

        clients: device.client_count,

        wanStatus: wan?.status,
        wanIP: wan?.ip,

        wan: {
          status: wan?.status,
          ip: wan?.ip,
          gateway: wan?.gateway,
          mtu: wan?.mtu
        },

        lan: {
          ip: lan?.vlan_ip,
          subnet: lan?.netmask
        },

        modem1: mapModem(modem1),
        modem2: mapModem(modem2),

        wifi:
          device.ssid_mac_list?.map(ssid => ({
            ssid: ssid.essid,
            radio: ssid.radio,
            enabled: ssid.enable,
            security: ssid.security
          })) || [],

        // Legacy fields (keep for Base44 compatibility)

        carrier: modem1?.carrier_name,
        cellularStatus: modem1?.status,
        rsrp: modem1?.cellular_signals?.rsrp,
        rsrq: modem1?.cellular_signals?.rsrq,
        sinr: modem1?.cellular_signals?.sinr,
        ip: modem1?.ip,

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

router.get("/device/:id/clients", async (req, res) => {

  try {

    const deviceId = req.params.id;

    const result = await peplinkGet(
      `/rest/o/${ORG_ID}/g/${GROUP_ID}/d/${deviceId}/client`
    );

    const clients = (result.data || []).map(client => ({

      name:
        client.name ||
        client.hostname ||
        client.client_name ||
        "Unknown",

      ip:
        client.ip ||
        client.ip_addr ||
        client.address,

      mac:
        client.mac ||
        client.mac_addr,

      interface:
        client.interface ||
        client.interface_name,

      type:
        client.type ||
        client.connection_type,

      vendor: client.vendor,

      connectedSince:
        client.connected_since,

      lastSeen:
        client.last_seen

    }));

    res.json({
      ok: true,
      source: "peplink",
      deviceId,
      clients
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
