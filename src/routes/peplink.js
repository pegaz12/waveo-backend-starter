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

router.get("/devices", async (req, res) => {
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
      error: err.response?.data || err.message
    });
  }
});

router.get("/usage/today", async (req, res) => {
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
      error: err.response?.data || err.message
    });
  }
});

export default router;

router.get("/token-test", async (_req, res) => {
  try {
    const response = await fetch(`${process.env.PEPLINK_BASE_URL}/api/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: new URLSearchParams({
        client_id: process.env.PEPLINK_CLIENT_ID,
        client_secret: process.env.PEPLINK_CLIENT_SECRET,
        grant_type: "client_credentials"
      })
    });

    const text = await response.text();

    res.json({
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type"),
      response: text.slice(0, 500)
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});
