import { browserSessionCookie } from "@/lib/auth/session"

export function startBrowserSession() {
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${browserSessionCookie}=active; Path=/; SameSite=Strict${secure}`
}

export function endBrowserSession() {
  document.cookie = `${browserSessionCookie}=; Path=/; Max-Age=0; SameSite=Strict`
}
