import express from "express";
import { peplinkGet } from "../services/peplinkClient.js";

const router = express.Router();

const ORG_ID = process.env.PEPLINK_ORG_ID;
const GROUP_ID = process.env.PEPLINK_GROUP_ID;

router.get("/debug", (_req, res) => {
  res.json({
    ok: true,
    baseUrl: process.env.PEPLINK_BASE_URL,
    orgIdExists: !!process.env.PEPLINK_ORG_ID,
    groupIdExists: !!process.env.PEPLINK_GROUP_ID,
    clientIdExists: !!process.env.PEPLINK_CLIENT_ID,
    clientSecretExists: !!process.env.PEPLINK_CLIENT_SECRET
  });
});

router.get("/devices", async (_req, res) => {
  try {
    const data = await peplinkGet(`/rest/o/${ORG_ID}/g/${GROUP_ID}/devices`);

    res.json({
      ok: true,
      source: "peplink",
      devices: data
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      source: "peplink",
      error: String(err.response?.data || err.message).slice(0, 1000)
    });
  }
});

router.get("/path-test", async (_req, res) => {
  const paths = [
    `/rest/o/${ORG_ID}/g/${GROUP_ID}/devices`,
    `/rest/o/${ORG_ID}/g/${GROUP_ID}/d`,
    `/rest/o/${ORG_ID}/g/${GROUP_ID}`,
    `/rest/o/${ORG_ID}/devices`,
    `/rest/o/${ORG_ID}/d`
  ];

  const results = [];

  for (const path of paths) {
    try {
      const data = await peplinkGet(path);
      results.push({ path, ok: true, data });
    } catch (err) {
      results.push({
        path,
        ok: false,
        status: err.response?.status,
        error: String(err.response?.data || err.message).slice(0, 200)
      });
    }
  }

  res.json(results);
});

router.get("/usage/today", async (_req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const data = await peplinkGet(`/rest/o/${ORG_ID}/bandwidth_per_device`, {
      from: today,
      to: today
    });

    res.json({
      ok: true,
      source: "peplink",
      date: today,
      usage: data
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      source: "peplink",
      error: String(err.response?.data || err.message).slice(0, 1000)
    });
  }
});

export default router;
