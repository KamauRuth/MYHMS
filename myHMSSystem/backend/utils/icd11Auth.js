const axios = require("axios")

let cachedToken = null
let tokenExpiry = null

async function getICD11Token() {
  if (cachedToken && tokenExpiry > Date.now()) {
    return cachedToken
  }

  const response = await axios.post(
    "https://icdaccessmanagement.who.int/connect/token",
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.WHO_ICD11_CLIENT_ID,
      client_secret: process.env.WHO_ICD11_CLIENT_SECRET,
      scope: "icdapi_access"
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  )

  cachedToken = response.data.access_token
  tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000

  return cachedToken
}

module.exports = getICD11Token
