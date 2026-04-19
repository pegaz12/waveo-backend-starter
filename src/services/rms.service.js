const RMS_BASE_URL = process.env.RMS_BASE_URL;
const RMS_API_TOKEN = process.env.RMS_API_TOKEN;

const RMS_DEVICES_PATH = process.env.RMS_DEVICES_PATH || '/api/devices';
const RMS_DEVICE_STATUS_PATH_TEMPLATE =
  process.env.RMS_DEVICE_STATUS_PATH_TEMPLATE || '/api/devices/:id/status';
const RMS_DEVICE_CLIENTS_PATH_TEMPLATE =
  process.env.RMS_DEVICE_CLIENTS_PATH_TEMPLATE || '/api/devices/:id/clients';
const RMS_DEVICE_USAGE_PATH_TEMPLATE =
  process.env.RMS_DEVICE_USAGE_PATH_TEMPLATE || '/api/devices/:id/usage/today';

function buildUrl(path) {
  if (!RMS_BASE_URL) {
    throw new Error('RMS_BASE_URL is missing');
  }
  return new URL(path, RMS_BASE_URL).toString();
}

function pathFor(template, id) {
  return template.replace(':id', encodeURIComponent(id));
}

async function rmsFetch(path) {
  if (!RMS_API_TOKEN) {
    throw new Error('RMS_API_TOKEN is missing');
  }

  const response = await fetch(buildUrl(path), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${RMS_API_TOKEN}`,
      Accept: 'application/json',
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const details = typeof body === 'string' ? body : JSON.stringify(body);
    const error = new Error(`RMS request failed: ${response.status} ${response.statusText} - ${details}`);
    error.statusCode = response.status;
    throw error;
  }

  return body;
}

function normalizeDevice(raw) {
  return {
    id: raw.id ?? raw.device_id ?? raw.serial ?? raw.name,
    name: raw.name ?? raw.hostname ?? raw.serial ?? 'Unnamed device',
    serial: raw.serial ?? null,
    status: raw.status ?? raw.connection_status ?? raw.state ?? 'unknown',
    connection: raw.connection ?? raw.network_type ?? raw.access_technology ?? null,
    signal: raw.signal ?? raw.rssi ?? raw.rsrp ?? null,
    wanIp: raw.wan_ip ?? raw.ip ?? null,
    source: raw,
  };
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.devices)) return payload.devices;
  return [];
}

export async function getDevices() {
  const data = await rmsFetch(RMS_DEVICES_PATH);
  const list = extractList(data);

  return list.map((d) => {
    const s = d.source ?? d;

    return {
      id: s.serial ?? s.id ?? d.id,
      name: s.name ?? 'Unnamed device',
      status: s.status === 1 ? 'online' : 'offline',
      connection: s.connection_type || s.connection_type_2 || null,
      signal: s.signal || s.rsrp || null,
      wan_ip: s.wan_ip ? s.wan_ip.split('/')[0] : null,
      data_used_mb: s.received ? Math.round(s.received / 1024 / 1024) : 0,
    };
  });
}
export async function getDeviceSummary(deviceId) {
  const [statusPayload, clientsPayload, usagePayload] = await Promise.allSettled([
    rmsFetch(pathFor(RMS_DEVICE_STATUS_PATH_TEMPLATE, deviceId)),
    rmsFetch(pathFor(RMS_DEVICE_CLIENTS_PATH_TEMPLATE, deviceId)),
    rmsFetch(pathFor(RMS_DEVICE_USAGE_PATH_TEMPLATE, deviceId)),
  ]);

  const statusRaw = statusPayload.status === 'fulfilled' ? statusPayload.value : null;
  const clientsRaw = clientsPayload.status === 'fulfilled' ? clientsPayload.value : [];
  const usageRaw = usagePayload.status === 'fulfilled' ? usagePayload.value : null;

  const s = statusRaw?.source ?? statusRaw ?? {};

  const sentBytes = s.sent ?? usageRaw?.sent ?? 0;
  const receivedBytes = s.received ?? usageRaw?.received ?? 0;

  return {
    id: s.serial ?? s.id ?? deviceId,
    name: s.name ?? 'Unnamed device',
    serial: s.serial ?? null,
    model: s.model ?? null,
    description: s.description ?? null,
    firmware: s.firmware ?? null,
    router_uptime: s.router_uptime ?? null,
    last_update_at: s.last_update_at ?? null,
    last_connection_at: s.last_connection_at ?? null,

    status: {
      online: s.status === 1,
      status_text: s.status === 1 ? 'online' : 'offline',
      connection_state: s.connection_state ?? null,
      connection_state_2: s.connection_state_2 ?? null,
      connection_uptime: s.connection_uptime ?? null,
      connection_uptime_2: s.connection_uptime_2 ?? null,
      wan_state: s.wan_state ?? null,
    },

    network: {
      connection: s.connection_type ?? null,
      connection_2: s.connection_type_2 ?? null,
      operator: s.operator ?? null,
      operator_2: s.operator_2 ?? null,
      network_state: s.network_state ?? null,
      network_state_2: s.network_state_2 ?? null,
      sim_slot: s.sim_slot ?? null,
      sim_state: s.sim_state ?? null,
      sim_state_2: s.sim_state_2 ?? null,
      wan_ip: s.wan_ip ? s.wan_ip.split('/')[0] : null,
      mobile_ip: s.mobile_ip ? s.mobile_ip.split('/')[0] : null,
      mobile_ip_2: s.mobile_ip_2 ? s.mobile_ip_2.split('/')[0] : null,
      iccid: s.iccid ?? null,
      iccid_2: s.iccid_2 ?? null,
      imei: s.imei ?? null,
      imei_2: s.imei_2 ?? null,
    },

    signal: {
      signal: s.signal ?? null,
      signal_2: s.signal_2 ?? null,
      rsrp: s.rsrp ?? null,
      rsrp_2: s.rsrp_2 ?? null,
      rsrq: s.rsrq ?? null,
      rsrq_2: s.rsrq_2 ?? null,
      sinr: s.sinr ?? null,
      sinr_2: s.sinr_2 ?? null,
      rssi: s.rssi ?? null,
      rssi_2: s.rssi_2 ?? null,
    },

    usage: {
      sent_bytes: sentBytes,
      received_bytes: receivedBytes,
      total_bytes: sentBytes + receivedBytes,
      sent_mb: Math.round(sentBytes / 1024 / 1024),
      received_mb: Math.round(receivedBytes / 1024 / 1024),
      total_mb: Math.round((sentBytes + receivedBytes) / 1024 / 1024),
      raw: usageRaw,
    },

    hardware: {
      temperature: s.temperature ?? null,
      temperature_2: s.temperature_2 ?? null,
      modem_manufacturer: s.modem_manufacturer ?? null,
      modem_manufacturer_2: s.modem_manufacturer_2 ?? null,
      modem_model: s.modem_model ?? null,
      modem_model_2: s.modem_model_2 ?? null,
      modem_firmware: s.modem_firmware ?? null,
      modem_firmware_2: s.modem_firmware_2 ?? null,
      hardware_revision: s.hardware_revision ?? null,
      bootloader_version: s.bootloader_version ?? null,
    },

    location: {
      latitude: s.latitude ?? null,
      longitude: s.longitude ?? null,
      cell_tower_latitude: s.cell_tower_latitude ?? null,
      cell_tower_longitude: s.cell_tower_longitude ?? null,
      cell_tower_accuracy: s.cell_tower_accuracy ?? null,
    },

    clients: extractList(clientsRaw).map((client) => ({
      mac: client.mac ?? client.mac_address ?? null,
      ip: client.ip ?? client.ip_address ?? null,
      hostname: client.hostname ?? client.name ?? null,
      source: client,
    })),

    raw: {
      status: statusRaw,
      clients: clientsRaw,
      usage: usageRaw,
    },
  };
}