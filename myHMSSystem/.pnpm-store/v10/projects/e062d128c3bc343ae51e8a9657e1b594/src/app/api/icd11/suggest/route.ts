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
    console.log("✅ Using cached WHO token")
    return cachedToken
  }

  console.log("🔄 Requesting new WHO token...")
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
    console.error("❌ TOKEN ERROR:", { status: res.status, error: data })
    throw new Error(`Token request failed: ${data.error || res.statusText}`)
  }

  console.log("✅ WHO token obtained, expires in", data.expires_in, "seconds")
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

    console.log("🔎 ICD-11 search for:", q)
    
    // Check env vars
    if (!process.env.WHO_TOKEN_URL || !process.env.WHO_CLIENT_ID) {
      console.error("❌ Missing WHO env vars:", {
        hasTokenUrl: !!process.env.WHO_TOKEN_URL,
        hasClientId: !!process.env.WHO_CLIENT_ID,
        hasClientSecret: !!process.env.WHO_CLIENT_SECRET,
        hasIcdBase: !!process.env.WHO_ICD_BASE
      })
      return NextResponse.json(
        { error: "Missing WHO configuration" },
        { status: 500 }
      )
    }

    let token
    try {
      token = await getToken()
    } catch (tokenErr: any) {
      console.error("❌ Token fetch failed:", tokenErr.message)
      return NextResponse.json(
        { error: `Token error: ${tokenErr.message}` },
        { status: 500 }
      )
    }

    // ⭐ IMPORTANT FIXES:
    // 1. Add Accept-Language=en
    // 2. Add API-Version=v2
    // 3. Add language query param
    const searchUrl =
      `${process.env.WHO_ICD_BASE}/mms/search` +
      `?q=${encodeURIComponent(q)}` +
      `&useFlexisearch=true` +
      `&flatResults=true` +
      `&limit=20` +
      `&language=en`

    console.log("📡 WHO API URL:", searchUrl)

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
      console.error("❌ WHO SEARCH ERROR:", { status: res.status, body: txt })
      return NextResponse.json(
        { error: `WHO API error: ${res.status} ${txt}` },
        { status: res.status }
      )
    }

    const json = await res.json()
    console.log("📦 WHO raw response keys:", Object.keys(json))
    console.log("📦 WHO full response:", JSON.stringify(json).substring(0, 500))

    const entities =
      json.destinationEntities ||
      json.searchResults ||
      json.results ||
      json.matches ||
      []

    console.log("✅ Entities found:", entities.length)

    const results = entities
      .filter((e: any) => e && (e.theCode || e.code || e.id))
      .map((e: any) => ({
      code: e.theCode || e.code || e.id || "",
      title: stripTags(
        e.title?.["@value"] ||
        e.title ||
        e.postCoordinationAxes?.["@value"] ||
        e.matchingPhrases?.[0]?.label?.["@value"] ||
        e.matchingPhrases?.[0] ||
        "Unknown"
      )
    }))
    .filter((r: any) => r.title && r.title !== "Unknown")

    console.log("✅ Formatted results:", results.slice(0, 3))
    return NextResponse.json(results)

  } catch (err: any) {
    console.error("❌ ICD ROUTE ERROR:", err.message, err.stack)
    return NextResponse.json(
      { error: `Route error: ${err.message}` },
      { status: 500 }
    )
  }
}