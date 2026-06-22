import express from "express";
import { peplinkGet } from "../services/peplinkClient.js";

const router = express.Router();

const ORG_ID = process.env.PEPLINK_ORG_ID;
const GROUP_ID = process.env.PEPLINK_GROUP_ID;

router.get("/devices", async (req, res) => {
  try {
    const data = await peplinkGet(`/rest/o/${ORG_ID}/g/${GROUP_ID}/d`);

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