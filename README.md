# Waveo Backend Starter

A small Express backend that sits between your frontend app and Teltonika RMS.

This fixes the two biggest MVP problems:

- your API token stays on the server
- your frontend avoids CORS/auth headaches by calling your own backend instead of RMS directly

## What it exposes

### `GET /health`
Health check.

### `GET /devices`
Returns a simplified list of devices.

### `GET /devices/:id`
Returns a combined device summary with:
- online/offline style status
- connection type (LTE / 5G if exposed by RMS)
- WAN IP
- signal block (`rsrp`, `rsrq`, `sinr`, `rssi`)
- connected clients (if your RMS endpoint provides them)
- usage data (if your RMS endpoint provides it)

## 1. Install

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env` and set your values.

```bash
cp .env.example .env
```

At minimum set:

- `RMS_BASE_URL`
- `RMS_API_TOKEN`

If your RMS API paths differ from the defaults, override the path variables in `.env`.

## 3. Run locally

```bash
npm run dev
```

Server default:

```bash
http://localhost:8080
```

## 4. Test

```bash
curl http://localhost:8080/health
curl http://localhost:8080/devices
curl http://localhost:8080/devices/YOUR_DEVICE_ID
```

## Base44 / frontend wiring

Your frontend should call only your backend:

- `GET https://your-api.example/devices`
- `GET https://your-api.example/devices/{id}`

Do **not** expose the RMS token in Base44.

## Recommended next steps

1. Confirm the exact RMS endpoints and payloads in your tenant.
2. Replace the placeholder path templates if needed.
3. Add a tiny cache layer to reduce RMS API calls.
4. Add your own device registry so customers can enter serial/name instead of API IDs.
5. Add auth before exposing this publicly.

## Deploy options

Easy first deployment:
- Render
- Railway

Later:
- AWS ECS / EC2 / App Runner

## Important note

This starter is intentionally tolerant of mismatched RMS payloads.

If one sub-endpoint fails, `GET /devices/:id` still returns the rest of the data it could collect. That makes it easier to get your MVP running before you finalize the exact RMS schemas.
