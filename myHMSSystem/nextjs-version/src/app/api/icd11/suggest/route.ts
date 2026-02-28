import { NextResponse } from "next/server"

let cachedToken: string | null = null
let tokenExpiry = 0

function stripTags(text = "") {
  return text
    .replace(/<em[^>]*>/gi, "")
    .replace(/<\/em>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim()
}

/* =========================
 TOKEN
========================= */
async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const res = await fetch(process.env.WHO_TOKEN_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.WHO_CLIENT_ID!,
      client_secret: process.env.WHO_CLIENT_SECRET!,
      scope: "icdapi_access"
    })
  })

  const data = await res.json()

  if (!res.ok) {
    console.error("TOKEN ERROR:", data)
    throw new Error("Token request failed")
  }

  cachedToken = data.access_token
  tokenExpiry = Date.now() + data.expires_in * 1000

  return cachedToken
}

/* =========================
 ICD SEARCH
========================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")

    if (!q || q.length < 2) {
      return NextResponse.json([])
    }

    const token = await getToken()

    // ⭐ IMPORTANT FIXES:
    // 1. Add Accept-Language=en
    // 2. Add API-Version=v2
    // 3. Add language query param
    const searchUrl =
      `${process.env.WHO_ICD_BASE}/mms/search` +
      `?q=${encodeURIComponent(q)}` +
      `&useFlexisearch=true` +
      `&flatResults=true` +
      `&limit=10` +
      `&language=en`

    const res = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Accept-Language": "en",
        "API-Version": "v2"
      }
    })

    if (!res.ok) {
      const txt = await res.text()
      console.error("WHO SEARCH ERROR:", txt)
      throw new Error("WHO search failed")
    }

    const json = await res.json()

    const entities =
      json.destinationEntities ||
      json.searchResults ||
      []

    const results = entities.map((e: any) => ({
      code: e.theCode || e.code || "",
      title: stripTags(
        e.title?.["@value"] ||
        e.title ||
        e.matchingPhrases?.[0]?.label?.["@value"] ||
        "Unknown"
      )
    }))

    return NextResponse.json(results)

  } catch (err) {
    console.error("ICD ERROR:", err)

    return NextResponse.json(
      { error: "WHO search failed" },
      { status: 500 }
    )
  }
}