"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Copy, Loader2, Mail, RefreshCw, Shield, Zap } from "lucide-react"
import { toast } from "sonner"

import api, { setAuthTokens } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  { icon: Zap, title: "一键生成", desc: "无需注册，点击即可获得一个可用的临时邮箱地址。" },
  { icon: Shield, title: "保护隐私", desc: "用匿名地址注册各类服务，远离垃圾邮件与信息泄露。" },
  { icon: RefreshCw, title: "随取随用", desc: "支持收发、附件、自动回复与 Webhook，像正式邮箱一样好用。" },
]

export default function LandingPage() {
  const router = useRouter()
  const { isLoggedIn, isAdmin, logout } = useAuth()

  // 创建的地址
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [domains, setDomains] = useState<string[]>([])

  // 启动时：检查已有 JWT → 获取当前地址
  useEffect(() => {
    const init = async () => {
      const jwt = localStorage.getItem("jwt")
      if (jwt && jwt !== "undefined" && jwt !== "null") {
        try {
          const { data } = await api.get<{ address: string }>("/api/settings")
          if (data?.address) setAddress(data.address)
        } catch {
          // JWT 过期或无效
          localStorage.removeItem("jwt")
        }
      }
      // 获取域名列表
      try {
        const { data } = await api.get<{ domains?: string[] }>("/open_api/settings")
        if (data?.domains?.length) setDomains(data.domains)
      } catch {
        // fallback: 静默
      }
      setInitialLoading(false)
    }
    init()
  }, [])

  // 一键创建
  const handleCreate = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.post<{ jwt: string; address: string }>("/api/new_address", {})
      setAuthTokens({ jwt: data.jwt })
      setAddress(data.address)
      toast.success("临时邮箱已创建")
    } catch {
      toast.error("创建失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [])

  // 重新生成
  const handleRegenerate = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.post<{ jwt: string; address: string }>("/api/new_address", {})
      setAuthTokens({ jwt: data.jwt })
      setAddress(data.address)
      toast.success("已生成新地址")
    } catch {
      toast.error("生成失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mail className="size-4" />
          </div>
          <span className="font-semibold">匿名邮箱</span>
        </div>
        <nav className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/mailbox/inbox" />}>进入邮箱</Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" render={<Link href="/admin/dashboard" />}>管理后台</Button>
              )}
              <Button variant="ghost" size="sm" onClick={logout}>退出</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>登录</Button>
              <Button size="sm" render={<Link href="/register" />}>注册</Button>
            </>
          )}
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-16">
        <div className="flex w-full max-w-2xl flex-col items-center text-center">
          <Badge variant="secondary" className="mb-4">无需登录 · 即刻可用</Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            一次点击，拥有一个匿名邮箱
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            用临时邮箱地址注册、验证、收发邮件，保护你的真实邮箱不被打扰。
          </p>

          <Card className="mt-8 w-full text-left">
            <CardHeader>
              <CardTitle className="text-base">你的临时邮箱</CardTitle>
              <CardDescription>
                {address ? "点击右侧按钮即可复制" : "点击下方按钮立即创建"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {initialLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : address ? (
                <>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
                    <Mail className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-mono text-sm">{address}</span>
                    <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="复制地址"
                      onClick={() => { navigator.clipboard.writeText(address); toast.success("已复制") }}>
                      <Copy />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button className="flex-1" onClick={handleRegenerate} disabled={loading}>
                      {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw data-icon="inline-start" />}
                      重新生成
                    </Button>
                    <Button variant="outline" className="flex-1" render={<Link href="/mailbox/inbox" />}>
                      进入邮箱工作区
                      <ArrowRight data-icon="inline-end" />
                    </Button>
                  </div>
                </>
              ) : (
                <Button size="lg" className="w-full" onClick={handleCreate} disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 size-4" />
                  )}
                  一键创建临时邮箱
                </Button>
              )}

              {domains.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs text-muted-foreground">可用域名:</span>
                  {domains.map((domain) => (
                    <Badge key={domain} variant="outline">@{domain}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-4" />
                </div>
                <CardTitle className="mt-2 text-base">{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        匿名邮箱 · 临时邮箱服务
      </footer>
    </div>
  )
}
