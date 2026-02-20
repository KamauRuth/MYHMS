const express = require("express");
const axios = require("axios");

const router = express.Router();

/* =========================
   TOKEN CACHE
========================= */
let cachedToken = null;
let tokenExpiry = 0;

/* =========================
   STRIP WHO <em> TAGS
========================= */
function stripEmTags(text = "") {
  return text
    .replace(/<em[^>]*>/gi, "")
    .replace(/<\/em>/gi, "")
    .trim();
}

/* =========================
   WHO ICD-11 OAuth2 TOKEN
========================= */
async function getWhoToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (!process.env.WHO_CLIENT_ID || !process.env.WHO_CLIENT_SECRET) {
    throw new Error("WHO CLIENT ID / SECRET missing in .env");
  }

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.WHO_CLIENT_ID);
  params.append("client_secret", process.env.WHO_CLIENT_SECRET);
  params.append("scope", "icdapi_access");

  const response = await axios.post(
    "https://icdaccessmanagement.who.int/connect/token",
    params,
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10000,
    }
  );

  cachedToken = response.data.access_token;
  tokenExpiry = Date.now() + response.data.expires_in * 1000;

  return cachedToken;
}

/* =========================
   ICD-11 MMS SEARCH (CLEAN)
========================= */
router.get("/suggest", async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 3) return res.json([]);

    const token = await getWhoToken();

    const response = await axios.get(
      "https://id.who.int/icd/release/11/2023-01/mms/search",
      {
        params: {
          q,
          medicalCodingMode: true,
          useFlexisearch: true,
          limit: 15,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "API-Version": "v2",
          Accept: "application/json",
          "Accept-Language": "en",
        },
        timeout: 10000,
      }
    );

    const entities =
      response.data?.destinationEntities?.length
        ? response.data.destinationEntities
        : response.data?.searchResults || [];

    const results = entities
      .map(e => {
        const code = e.theCode || e.code;

        const rawTitle =
          e.title?.["@value"] ||
          e.title ||
          e.matchingPhrases?.[0]?.label?.["@value"];

        const title = stripEmTags(rawTitle);

        if (!code || !title) return null;

        return {
          code,          // ICD-11 code
          title,         // CLEAN diagnosis title
          danger:
            code.startsWith("1F40") || // malaria
            code.startsWith("JA80") || // shock
            code.startsWith("BA00"),   // sepsis
        };
      })
      .filter(Boolean);

    res.json(results);
  } catch (err) {
    console.error("WHO ICD-11 ERROR:", {
      status: err.response?.status,
      message: err.message,
    });
    res.status(500).json({ error: "ICD suggest failed" });
  }
});

module.exports = router;
