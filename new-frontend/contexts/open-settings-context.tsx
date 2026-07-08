"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import api from "@/lib/api"
import type { OpenSettings } from "@/lib/types"

type OpenSettingsContextValue = {
  settings: OpenSettings | null
  loading: boolean
  /** 获取 cfTurnstileSiteKey，如果未启用 Turnstile 则返回空字符串 */
  turnstileSiteKey: string
  /** 是否需要全局 Turnstile 检查 */
  needTurnstile: boolean
}

const OpenSettingsCtx = createContext<OpenSettingsContextValue>({
  settings: null,
  loading: true,
  turnstileSiteKey: "",
  needTurnstile: false,
})

export function OpenSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<OpenSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.get("/open_api/settings")
      .then(({ data }) => {
        if (cancelled) return
        const s: OpenSettings = {
          enable: !!data.enable,
          enableMailVerify: !!data.enableMailVerify,
          oauth2ClientIDs: Array.isArray(data.oauth2ClientIDs) ? data.oauth2ClientIDs : [],
          title: data.title,
          domains: Array.isArray(data.domains) ? data.domains : [],
          domainLabels: data.domainLabels,
          defaultDomains: data.defaultDomains,
          randomSubdomainDomains: data.randomSubdomainDomains,
          version: data.version,
          prefix: data.prefix,
          minAddressLen: data.minAddressLen,
          maxAddressLen: data.maxAddressLen,
          needAuth: !!data.needAuth,
          adminContact: data.adminContact,
          enableUserCreateEmail: !!data.enableUserCreateEmail,
          disableAnonymousUserCreateEmail: !!data.disableAnonymousUserCreateEmail,
          requireUserLogin: !!data.requireUserLogin,
          disableCustomAddressName: !!data.disableCustomAddressName,
          enableUserDeleteEmail: !!data.enableUserDeleteEmail,
          enableAutoReply: !!data.enableAutoReply,
          enableIndexAbout: !!data.enableIndexAbout,
          copyright: data.copyright,
          cfTurnstileSiteKey: data.cfTurnstileSiteKey || "",
          enableWebhook: !!data.enableWebhook,
          isS3Enabled: !!data.isS3Enabled,
          enableSendMail: !!data.enableSendMail,
          showGithubForUser: data.showGithubForUser,
          enableAddressPassword: !!data.enableAddressPassword,
          enableAgentEmailInfo: !!data.enableAgentEmailInfo,
          smtpImapProxyConfig: data.smtpImapProxyConfig,
          statusUrl: data.statusUrl,
          enableGlobalTurnstileCheck: !!data.enableGlobalTurnstileCheck,
          announcement: data.announcement,
          alwaysShowAnnouncement: data.alwaysShowAnnouncement,
        }
        setSettings(s)
      })
      .catch(() => {
        if (!cancelled) setSettings(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const turnstileSiteKey = settings?.cfTurnstileSiteKey || ""
  const needTurnstile = !!settings?.enableGlobalTurnstileCheck || !!turnstileSiteKey

  return (
    <OpenSettingsCtx.Provider value={{ settings, loading, turnstileSiteKey, needTurnstile }}>
      {children}
    </OpenSettingsCtx.Provider>
  )
}

export function useOpenSettings() {
  return useContext(OpenSettingsCtx)
}