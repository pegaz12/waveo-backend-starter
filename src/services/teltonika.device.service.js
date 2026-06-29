const TELTONIKA_API_BASE_URL = process.env.TELTONIKA_API_BASE_URL;
const TELTONIKA_USERNAME = process.env.TELTONIKA_USERNAME;
const TELTONIKA_PASSWORD = process.env.TELTONIKA_PASSWORD;

async function teltonikaLogin() {
  const response = await fetch(`${TELTONIKA_API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      username: TELTONIKA_USERNAME,
      password: TELTONIKA_PASSWORD,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Teltonika login failed: ${JSON.stringify(data)}`);
  }

  return data.data?.token || data.token;
}

async function teltonikaGet(path) {
  const token = await teltonikaLogin();

  const response = await fetch(`${TELTONIKA_API_BASE_URL}/api${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Teltonika request failed: ${JSON.stringify(data)}`);
  }

  return data;
}

export async function getDhcpLeases() {
  const data = await teltonikaGet('/dhcp/leases/ipv4/status');

  const leases = data.data || [];

  return {
    ok: true,
    source: 'teltonika-device',
    leases: leases.map((lease) => ({
      hostname: lease.hostname || 'Unknown',
      ip: lease.ipaddr,
      mac: lease.macaddr,
      interface: lease.interface,
      expires: lease.expires,
      raw: lease,
    })),
  };
}
