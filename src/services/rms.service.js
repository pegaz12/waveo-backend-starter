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

  const status = statusPayload.status === 'fulfilled' ? statusPayload.value : null;
  const clients = clientsPayload.status === 'fulfilled' ? clientsPayload.value : [];
  const usage = usagePayload.status === 'fulfilled' ? usagePayload.value : null;

  return {
    id: deviceId,
    status: status?.status ?? status?.state ?? 'unknown',
    connection: status?.connection ?? status?.network_type ?? status?.access_technology ?? null,
    wan_ip: status?.wan_ip ?? status?.ip ?? null,
    signal: {
      rsrp: status?.rsrp ?? null,
      rsrq: status?.rsrq ?? null,
      sinr: status?.sinr ?? null,
      rssi: status?.rssi ?? null,
    },
    clients: extractList(clients).map((client) => ({
      mac: client.mac ?? client.mac_address ?? null,
      ip: client.ip ?? client.ip_address ?? null,
      hostname: client.hostname ?? client.name ?? null,
      source: client,
    })),
    usage_today: usage,
    raw: {
      status,
      clients,
      usage,
    },
  };
}
