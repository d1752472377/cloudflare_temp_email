// 控制字符 (0x00-0x1F, DEL 0x7F) 在 HTTP header 中非法
function hasControlChar(str: string) {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code < 32 || code === 127) return true
  }
  return false
}

/** 安全的 header 值，不合法时返回 undefined 以跳过该 header */
export function safeHeaderValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "" || trimmed === "undefined" || trimmed === "null") return undefined
  if (hasControlChar(trimmed)) return undefined
  return trimmed
}

/** 构造 Authorization: Bearer ... */
export function safeBearerHeader(jwt: string): string | undefined {
  const safe = safeHeaderValue(jwt)
  return safe ? `Bearer ${safe}` : undefined
}

import axios from "axios"
import { getBrowserLocales, getPreferredLocale, getStoredLocale } from "@/lib/i18n/utils"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ""
const instance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  // 匹配前端的 validateStatus: 200-500（让 401/4xx 在响应拦截里统一处理）
  validateStatus: (status) => status >= 200 && status <= 500,
})

// 请求拦截 — 完全匹配 frontend/src/api/index.js 的 header 注入逻辑
instance.interceptors.request.use(async (config) => {
  const headers: Record<string, string> = {}

  // x-lang
  const preferredLocale = getStoredLocale()
  headers["x-lang"] = preferredLocale || (getPreferredLocale(null, getBrowserLocales()))

  // x-fingerprint（简化版，不依赖 fingerprintjs 库避免额外体积）
  let fingerprint = localStorage.getItem("_fingerprint")
  if (!fingerprint) {
    fingerprint = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem("_fingerprint", fingerprint)
  }
  headers["x-fingerprint"] = fingerprint
  headers["Content-Type"] = "application/json"

  // 逐个注入 auth header — 完全匹配 frontend 的 5 种 header

  // 1. x-user-token ← userJwt
  const userTokenHeader = safeHeaderValue(localStorage.getItem("userJwt"))
  if (userTokenHeader) headers["x-user-token"] = userTokenHeader

  // 2. x-user-access-token ← access_token（从 user_api/settings 返回的）
  const userAccessHeader = safeHeaderValue(localStorage.getItem("access_token"))
  if (userAccessHeader) headers["x-user-access-token"] = userAccessHeader

  // 3. x-custom-auth ← auth（站点全局密码）
  const customAuthHeader = safeHeaderValue(localStorage.getItem("auth"))
  if (customAuthHeader) headers["x-custom-auth"] = customAuthHeader

  // 4. x-admin-auth ← adminAuth
  const adminAuthHeader = safeHeaderValue(localStorage.getItem("adminAuth"))
  if (adminAuthHeader) headers["x-admin-auth"] = adminAuthHeader

  // 5. Authorization: Bearer ← jwt（邮箱地址 JWT）
  const authorizationHeader = safeBearerHeader(localStorage.getItem("jwt") || "")
  if (authorizationHeader) headers["Authorization"] = authorizationHeader

  // 合并到请求
  Object.entries(headers).forEach(([key, value]) => {
    config.headers.set(key, value)
  })

  return config
})

// 响应拦截 — 匹配 frontend 的 401 处理逻辑
instance.interceptors.response.use(
  (response) => {
    // 401 检查（validateStatus 会把 401 放进成功回调）
    if (response.status === 401) {
      const url = response.config?.url || ""
      if (url.startsWith("/admin/")) {
        // 管理员 401 → 清除 adminAuth
        localStorage.removeItem("adminAuth")
        window.location.href = "/login"
      } else if (url.startsWith("/api/")) {
        // 邮箱 API 401 → 清除 jwt
        localStorage.removeItem("jwt")
        // 不清除 userJwt — 用户可能只是没有绑定地址
      } else if (
        url.startsWith("/user_api/") &&
        !url.includes("/login") &&
        !url.includes("/register") &&
        !url.includes("/open_settings") &&
        !url.includes("/authenticate_")
      ) {
        // 用户接口 401 → 清除 userJwt
        localStorage.removeItem("userJwt")
        localStorage.removeItem("access_token")
        window.location.href = "/login"
      }
    }
    // 400/403/404/500 等错误 → 拒绝 promise，让调用方的 .catch() / onError 能收到
    if (response.status >= 300) {
      return Promise.reject(response)
    }
    return response
  },
  (error) => {
    // 网络错误等
    return Promise.reject(error)
  }
)

// —— Auth token 管理（匹配 frontend 的 localStorage key） ——

export function setAuthTokens(tokens: {
  jwt?: string       // 邮箱地址 JWT（frontend 里叫 jwt）
  userJwt?: string   // 用户 JWT
  adminAuth?: string // 管理员密码
  auth?: string      // 站点全局密码
  access_token?: string
}) {
  // 注意 key 名完全匹配 frontend/src/store/index.js 里的 useStorage key
  if (tokens.jwt !== undefined) localStorage.setItem("jwt", tokens.jwt)
  if (tokens.userJwt !== undefined) localStorage.setItem("userJwt", tokens.userJwt)
  if (tokens.adminAuth !== undefined) localStorage.setItem("adminAuth", tokens.adminAuth)
  if (tokens.auth !== undefined) localStorage.setItem("auth", tokens.auth)
  if (tokens.access_token !== undefined) localStorage.setItem("access_token", tokens.access_token)
}

export function clearAuthTokens() {
  // 完全匹配 frontend 清除的 key
  localStorage.removeItem("jwt")
  localStorage.removeItem("userJwt")
  localStorage.removeItem("adminAuth")
  localStorage.removeItem("auth")
  localStorage.removeItem("access_token")
}

export default instance
