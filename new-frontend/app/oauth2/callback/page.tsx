"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import api, { setAuthTokens } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

function OAuth2CallbackInner() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const searchParams = useSearchParams()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const code = searchParams.get("code")
    const state = searchParams.get("state")

    const storedState = localStorage.getItem("oauth2_state")
    const clientID = localStorage.getItem("oauth2_client_id") || "default"

    if (storedState && state !== storedState) {
      toast.error("OAuth2 state 不匹配，登录被拒绝")
      localStorage.removeItem("oauth2_state")
      localStorage.removeItem("oauth2_client_id")
      router.replace("/login")
      return
    }

    if (!code) {
      toast.error("OAuth2 回调缺少授权码")
      localStorage.removeItem("oauth2_state")
      localStorage.removeItem("oauth2_client_id")
      router.replace("/login")
      return
    }

    api
      .post<{ jwt: string }>("/user_api/oauth2/callback", { clientID, code })
      .then(async ({ data }) => {
        setAuthTokens({ userJwt: data.jwt })
        localStorage.removeItem("oauth2_state")
        localStorage.removeItem("oauth2_client_id")
        // 刷新用户状态，确保 AuthContext 在跳转前已同步
        await refreshUser()
        toast.success("OAuth2 登录成功")
        router.replace("/mailbox/inbox")
      })
      .catch(() => {
        toast.error("OAuth2 登录失败")
        localStorage.removeItem("oauth2_state")
        localStorage.removeItem("oauth2_client_id")
        router.replace("/login")
      })
  }, [searchParams, router])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted/40 px-4 text-center">
      <Loader2 className="size-8 animate-spin text-primary" />
      <div>
        <p className="text-sm font-medium">正在完成登录...</p>
        <p className="mt-1 text-sm text-muted-foreground">
          正在处理 OAuth2 授权回调，请稍候，不要关闭页面。
        </p>
      </div>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <OAuth2CallbackInner />
    </Suspense>
  )
}
