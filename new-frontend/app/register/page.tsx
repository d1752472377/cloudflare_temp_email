"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import api from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useOpenSettings } from "@/contexts/open-settings-context"
import { Turnstile } from "@/components/turnstile"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { AuthShell } from "@/components/auth/auth-shell"

export default function RegisterPage() {
  const { register } = useAuth()
  const { turnstileSiteKey, needTurnstile, settings } = useOpenSettings()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [createAddress, setCreateAddress] = useState(true)
  const [loading, setLoading] = useState(false)
  const [cfToken, setCfToken] = useState("")
  // 验证码相关
  const [code, setCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [sendCodeLoading, setSendCodeLoading] = useState(false)
  const [codeTimeout, setCodeTimeout] = useState(0)

  const needMailVerify = settings?.enableMailVerify

  // 发送验证码倒计时
  const startCodeTimeout = () => {
    setCodeTimeout(60)
    const timer = setInterval(() => {
      setCodeTimeout((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendCode = async () => {
    if (!email) { toast.error("请先填写邮箱"); return }
    if (!cfToken && needTurnstile) { toast.error("请先完成人机验证"); return }
    setSendCodeLoading(true)
    try {
      await api.post("/user_api/verify_code", { email, cf_token: cfToken })
      setCodeSent(true)
      startCodeTimeout()
      toast.success("验证码已发送")
    } catch {
      toast.error("发送验证码失败")
    } finally {
      setSendCodeLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error("请填写邮箱和密码")
      return
    }
    if (password.length < 8) {
      toast.error("密码至少 8 位")
      return
    }
    if (password !== confirmPw) {
      toast.error("两次密码不一致")
      return
    }
    if (needMailVerify && !code) {
      toast.error("请输入验证码")
      return
    }

    setLoading(true)
    try {
      await register(email, password, cfToken, needMailVerify ? code : undefined)
      toast.success("注册成功")

      if (createAddress) {
        try {
          await api.post("/api/new_address", {})
          toast.success("邮箱地址已创建")
        } catch {
          toast.warning("账号注册成功，但邮箱地址创建失败，可稍后手动创建")
        }
      }

      router.push("/mailbox/inbox")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || "注册失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="创建账号"
      description="注册后可绑定多个邮箱，统一管理"
      footer={
        <>
          已有账号?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            返回登录
          </Link>
        </>
      }
    >
      <Card>
        <CardContent className="pt-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reg-email">邮箱</FieldLabel>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="reg-pw">密码</FieldLabel>
              <Input
                id="reg-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FieldDescription>至少 8 位，包含字母与数字</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="reg-pw2">确认密码</FieldLabel>
              <Input
                id="reg-pw2"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </Field>

            {/* 邮件验证码（仅在 enableMailVerify 时显示） */}
            {needMailVerify && (
              <Field>
                <FieldLabel htmlFor="reg-code">验证码</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="reg-code"
                    placeholder="6位验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleSendCode}
                    disabled={codeTimeout > 0 || sendCodeLoading}
                  >
                    {sendCodeLoading ? <Loader2 className="size-4 animate-spin" /> : codeTimeout > 0 ? `${codeTimeout}s` : "发送验证码"}
                  </Button>
                </div>
              </Field>
            )}

            {/* Turnstile（全局 Turnstile 或有 siteKey 时显示） */}
            {needTurnstile && (
              <Field>
                <Turnstile siteKey={turnstileSiteKey} onToken={setCfToken} />
              </Field>
            )}

            <Field orientation="horizontal">
              <div className="flex flex-col">
                <FieldLabel htmlFor="bind-toggle">注册后创建一个邮箱</FieldLabel>
                <FieldDescription>自动生成并绑定到新账号</FieldDescription>
              </div>
              <Switch id="bind-toggle" checked={createAddress} onCheckedChange={setCreateAddress} />
            </Field>
            <Button className="w-full" onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              注册
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
