import express from "express";
import { peplinkGet } from "../services/peplinkClient.js";

const router = express.Router();

const ORG_ID = process.env.PEPLINK_ORG_ID;
const GROUP_ID = process.env.PEPLINK_GROUP_ID;

router.get("/devices", async (_req, res) => {
  try {
    const data = await peplinkGet(`/rest/o/${ORG_ID}/g/${GROUP_ID}/d`);

    res.json({
      ok: true,
      source: "peplink",
      devices: data.data || []
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
