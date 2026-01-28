const axios = require("axios");

let cachedToken = null;
let tokenExpiry = 0;

async function getWHOToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.WHO_ICD_CLIENT_ID);
  params.append("client_secret", process.env.WHO_ICD_CLIENT_SECRET);
  params.append("scope", "icdapi_access");

  const response = await axios.post(
    "https://icdaccessmanagement.who.int/connect/token",
    params,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  cachedToken = response.data.access_token;
  tokenExpiry = now + response.data.expires_in * 1000;

  return cachedToken;
}

module.exports = { getWHOToken };
