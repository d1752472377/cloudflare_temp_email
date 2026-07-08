"use client"

import { useEffect, useRef, useCallback, useState } from "react"

interface TurnstileProps {
  onToken: (token: string) => void
  siteKey?: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

/**
 * Cloudflare Turnstile 组件。
 * 从 /open_api/settings 获取 siteKey（如果未传入），自动加载 Turnstile SDK。
 */
export function Turnstile({ onToken, siteKey }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!siteKey) return
    // 加载 Turnstile SDK（仅在首次加载）
    if (!document.getElementById("cf-turnstile-sdk")) {
      const script = document.createElement("script")
      script.id = "cf-turnstile-sdk"
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }

    const checkTurnstile = () => {
      if (window.turnstile && containerRef.current) {
        // 清除旧 widget
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current)
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            onToken(token)
          },
          "expired-callback": () => {
            onToken("")
          },
        })
        setReady(true)
      } else {
        setTimeout(checkTurnstile, 200)
      }
    }
    checkTurnstile()

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey, onToken])

  return (
    <div
      ref={containerRef}
      className="turnstile-container"
      style={{ minHeight: ready ? "65px" : "0", overflow: "hidden" }}
    />
  )
}

/**
 * 管理 Turnstile token 的 hook。
 * 同时封装了 openSettings 的获取。
 */
export function useTurnstileToken(siteKey?: string) {
  const [token, setToken] = useState("")
  const handleToken = useCallback((t: string) => setToken(t), [])

  return {
    token,
    setToken,
    turnstileEl: siteKey ? (
      <Turnstile key={siteKey} siteKey={siteKey} onToken={handleToken} />
    ) : null,
  }
}
