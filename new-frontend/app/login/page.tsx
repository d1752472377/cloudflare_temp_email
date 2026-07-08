"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Fingerprint, KeyRound, Loader2 } from "lucide-react"

import api from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useOpenSettings } from "@/contexts/open-settings-context"
import { Turnstile } from "@/components/turnstile"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { AuthShell } from "@/components/auth/auth-shell"

export default function LoginPage() {
  return (
    <AuthShell
      title="登录"
      description="选择一种方式登录你的邮箱或账号"
      footer={
        <>
          还没有账号?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            立即注册
          </Link>
        </>
      }
    >
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="address">
            <TabsList className="w-full">
              <TabsTrigger value="address" className="flex-1">邮箱登录</TabsTrigger>
              <TabsTrigger value="user" className="flex-1">用户登录</TabsTrigger>
              <TabsTrigger value="admin" className="flex-1">管理员</TabsTrigger>
            </TabsList>

            <TabsContent value="address" className="mt-5">
              <AddressLoginForm />
            </TabsContent>

            <TabsContent value="user" className="mt-5">
              <Suspense fallback={<div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>}>
                <UserLoginForm />
              </Suspense>
            </TabsContent>

            <TabsContent value="admin" className="mt-5">
              <AdminLoginForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

function AddressLoginForm() {
  const { addressLogin } = useAuth()
  const { turnstileSiteKey, needTurnstile } = useOpenSettings()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [cfToken, setCfToken] = useState("")

  const handleSubmit = async () => {
    if (!email || !password) { toast.error("请填写邮箱和密码"); return }
    setLoading(true)
    try {
      await addressLogin(email, password, cfToken)
      router.push("/mailbox/inbox")
    } catch {
      toast.error("邮箱或密码错误")
    } finally {
      setLoading(false)
    }
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="addr">邮箱地址</FieldLabel>
        <Input id="addr" placeholder="name@relay.mask.mail" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field>
        <FieldLabel htmlFor="addr-pw">邮箱密码</FieldLabel>
        <Input id="addr-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
      </Field>
      {needTurnstile && (
        <Field>
          <Turnstile siteKey={turnstileSiteKey} onToken={setCfToken} />
        </Field>
      )}
      <Button className="w-full" onClick={handleSubmit} disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        登录邮箱
      </Button>
    </FieldGroup>
  )
}

function UserLoginForm() {
  const { login, refreshUser } = useAuth()
  const { turnstileSiteKey, needTurnstile } = useOpenSettings()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [cfToken, setCfToken] = useState("")

  const handleSubmit = async () => {
    if (!email || !password) { toast.error("请填写用户名和密码"); return }
    setLoading(true)
    try {
      await login(email, password, cfToken)
      const redirect = searchParams.get("redirect") || "/mailbox/inbox"
      router.push(redirect)
    } catch {
      toast.error("用户名或密码错误")
    } finally {
      setLoading(false)
    }
  }

  const handlePasskey = async () => {
    setLoading(true)
    try {
      // 1. 获取认证选项
      const { data: options } = await api.post("/user_api/passkey/authenticate_request", {
        domain: window.location.hostname,
      })
      // 2. 调用浏览器 WebAuthn
      const credential = await navigator.credentials.get({ publicKey: options })
      // 3. 验证
      const { data } = await api.post<{ jwt: string }>("/user_api/passkey/authenticate_response", {
        credential,
        domain: window.location.hostname,
        origin: window.location.origin,
      })
      // passkey 登录返回的 JWT 存入 userJwt，然后刷新用户状态
      const { setAuthTokens } = await import("@/lib/api")
      setAuthTokens({ userJwt: data.jwt })
      await refreshUser()
      router.push("/mailbox/inbox")
      toast.success("Passkey 登录成功")
    } catch {
      toast.error("Passkey 登录失败")
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth2 = async (clientID: string) => {
    try {
      const state = crypto.randomUUID()
      localStorage.setItem("oauth2_state", state)
      localStorage.setItem("oauth2_client_id", clientID)
      const { data } = await api.get<{ url: string }>(`/user_api/oauth2/login_url?clientID=${clientID}&state=${state}`)
      window.location.href = data.url
    } catch {
      toast.error("获取 OAuth2 登录地址失败")
    }
  }

  return (
    <>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="user">用户名 / 邮箱</FieldLabel>
          <Input id="user" placeholder="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="user-pw">密码</FieldLabel>
          <Input id="user-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
          <FieldDescription>也可使用 Passkey 或 OAuth2 登录</FieldDescription>
        </Field>
        {needTurnstile && (
          <Field>
            <Turnstile siteKey={turnstileSiteKey} onToken={setCfToken} />
          </Field>
        )}
        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          <KeyRound data-icon="inline-start" />
          密码登录
        </Button>
      </FieldGroup>
      <div className="my-4 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">或</span>
        <Separator className="flex-1" />
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="outline" className="w-full" onClick={handlePasskey} disabled={loading}>
          <Fingerprint data-icon="inline-start" />
          使用 Passkey 登录
        </Button>
        <Button variant="outline" className="w-full" onClick={() => handleOAuth2("demo")} disabled={loading}>
          使用 OAuth2 登录
        </Button>
      </div>
    </>
  )
}

function AdminLoginForm() {
  const { adminLogin } = useAuth()
  const { turnstileSiteKey, needTurnstile } = useOpenSettings()
  const router = useRouter()
  const [sitePw, setSitePw] = useState("")
  const [adminPw, setAdminPw] = useState("")
  const [loading, setLoading] = useState(false)
  const [cfToken, setCfToken] = useState("")

  const handleSubmit = async () => {
    if (!adminPw) { toast.error("请输入管理员密码"); return }
    setLoading(true)
    try {
      await adminLogin(sitePw, adminPw, cfToken)
      router.push("/admin/dashboard")
    } catch {
      toast.error("管理员密码错误")
    } finally {
      setLoading(false)
    }
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="site-pw">站点密码</FieldLabel>
        <Input id="site-pw" type="password" placeholder="如站点已加密" value={sitePw} onChange={(e) => setSitePw(e.target.value)} />
        <FieldDescription>未设置站点密码可留空</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="admin-pw">管理员密码</FieldLabel>
        <Input id="admin-pw" type="password" value={adminPw} onChange={(e) => setAdminPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
      </Field>
      {needTurnstile && (
        <Field>
          <Turnstile siteKey={turnstileSiteKey} onToken={setCfToken} />
        </Field>
      )}
      <Button className="w-full" onClick={handleSubmit} disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        进入管理后台
      </Button>
    </FieldGroup>
  )
}
