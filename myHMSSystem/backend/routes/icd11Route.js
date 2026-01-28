const express = require("express");
const axios = require("axios");

const router = express.Router();

let cachedToken = null;
let tokenExpiry = 0;

/* =========================
   WHO TOKEN
========================= */
async function getWhoToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.WHO_CLIENT_ID);
  params.append("client_secret", process.env.WHO_CLIENT_SECRET);
  params.append("scope", "icdapi_access");

  const res = await axios.post(
    "https://icdaccessmanagement.who.int/connect/token",
    params,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + res.data.expires_in * 1000;

  return cachedToken;
}

/* =========================
   1️⃣ SEARCH (FOUNDATION ONLY)
========================= */
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 3) return res.json([]);

    const token = await getWhoToken();

    const response = await axios.get(
      "https://id.who.int/icd/entity/search",
      {
        params: {
          q,
          useFlexisearch: true,
          flatResults: true,
          limit: 10,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "API-Version": "v2",
          Accept: "application/json",
          "Accept-Language": "en",
        },
      }
    );

    const results =
      response.data.destinationEntities?.map((item) => ({
        id: item.id, // ⚠️ FOUNDATION ENTITY ID
        title: item.title?.replace(/<[^>]+>/g, "").trim(),
      })) || [];

    res.json(results);
  } catch (err) {
    console.error(
      "WHO ICD SEARCH ERROR:",
      err.response?.status,
      err.response?.data || err.message
    );
    res.status(500).json({ error: "ICD search failed" });
  }
});

/* =========================
   2️⃣ RESOLVE → MMS CODE
========================= */
router.get("/resolve/:entityId", async (req, res) => {
  try {
    const token = await getWhoToken();

    const response = await axios.get(
      `https://id.who.int/icd/release/11/2024-01/mms/entity/${req.params.entityId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "API-Version": "v2",
          Accept: "application/json",
          "Accept-Language": "en",
        },
      }
    );

    res.json({
      code: response.data.theCode,               // ✅ 1F40.0, 1F41.Z
      title: response.data.title?.["@value"],
      danger: response.data.theCode?.startsWith("1F40"), // severe malaria
    });
  } catch (err) {
    console.error(
      "WHO ICD RESOLVE ERROR:",
      err.response?.status,
      err.response?.data || err.message
    );
    res.status(500).json({ error: "ICD resolve failed" });
  }
});

module.exports = router;
