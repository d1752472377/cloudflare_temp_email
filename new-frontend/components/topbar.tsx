"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  LogOut,
  Mail,
  Moon,
  Search,
  Shield,
  Sun,
  User,
  Zap,
} from "lucide-react"

import api, { setAuthTokens } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/hooks/use-theme"
import { useScopedI18n } from "@/hooks/useScopedI18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CreateEmailModal } from "@/components/create-email-modal"
import type { BoundAddress } from "@/lib/types"

export function Topbar({ searchQuery, onSearchChange, variant }: {
  searchQuery?: string
  onSearchChange?: (v: string) => void
  variant?: "mailbox" | "admin"
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isLoggedIn, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t } = useScopedI18n("views.Header")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [domains, setDomains] = useState<string[]>([])
  const [showAdminPw, setShowAdminPw] = useState(false)
  const [adminPw, setAdminPw] = useState("")

  // Also check localStorage for admin auth state in case auth context hasn't synced
  const effectiveIsAdmin = isAdmin || (typeof window !== "undefined" && !!localStorage.getItem("adminAuth"))

  const { data: settings } = useQuery({
    queryKey: ["topbar_settings"],
    queryFn: async () => {
      const { data } = await api.get<{ address: string }>("/api/settings")
      return data
    },
    retry: false,
  })

  const { data: addresses } = useQuery({
    queryKey: ["topbar_bind_address"],
    queryFn: async () => {
      const { data } = await api.get<{ results: BoundAddress[] }>("/user_api/bind_address")
      return data.results
    },
    enabled: isLoggedIn,
    retry: false,
  })

  const currentAddress = settings?.address

  const handleCopy = () => {
    if (currentAddress) {
      navigator.clipboard.writeText(currentAddress)
      toast.success("地址已复制")
    }
  }

  const handleSwitch = async (addressId: number) => {
    try {
      const { data } = await api.get<{ jwt: string }>(`/user_api/bind_address_jwt/${addressId}`)
      setAuthTokens({ jwt: data.jwt })
      await queryClient.invalidateQueries({ queryKey: ["inbox"] })
      router.push("/mailbox/inbox")
    } catch {
      toast.error("切换地址失败")
    }
  }

  const handleOpenCreate = async () => {
    try {
      const { data } = await api.get<{ domains?: string[] }>("/open_api/settings")
      setDomains(data.domains || [])
    } catch {
      // ignore
    }
    setShowCreateModal(true)
  }

  const handleAdminClick = () => {
    setShowAdminPw(true)
  }

  const handleAdminConfirm = () => {
    if (adminPw) {
      localStorage.setItem("adminAuth", adminPw)
    }
    setShowAdminPw(false)
    router.push("/admin/dashboard")
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-13 shrink-0 items-center gap-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
        {variant === "admin" ? (
          <>
            <div className="flex min-w-0 shrink-0 items-center gap-2">
              <Link href="/mailbox/inbox" className="text-sm text-muted-foreground hover:text-foreground">
                ← 返回主界面
              </Link>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm font-semibold">管理后台</span>
            </div>
            <div className="flex-1" />
          </>
        ) : (
        <>
        {/* Left: address + copy + dropdown */}
        <div className="flex min-w-0 shrink-0 items-center gap-2 md:min-w-[240px]">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex max-w-[200px] items-center gap-1.5 truncate rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                />
              }
            >
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{currentAddress || "..."}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              {addresses?.map((addr) => (
                <DropdownMenuItem
                  key={addr.id}
                  onClick={() => handleSwitch(addr.id)}
                  className="flex items-center gap-3 px-2 py-2"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-medium text-primary">
                    {addr.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{addr.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {addr.mail_count > 0 ? `${addr.mail_count} 封邮件` : "暂无邮件"}
                    </div>
                  </div>
                  {addr.name === currentAddress && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              {addresses && addresses.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem render={<Link href="/account/addresses" />}>
                <User className="size-4" />
                <span>管理所有地址</span>
                <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {currentAddress && (
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="复制地址"
            >
              <Copy className="size-3.5" />
            </button>
          )}
        </div>

        {/* Center: search */}
        {onSearchChange && (
          <div className="relative mx-2 min-w-0 flex-1 max-md:hidden">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索邮件内容、发件人…"
              className="h-9 bg-muted/50 pl-8"
              value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 max-md:hidden" />

        {/* Right: avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border hover:bg-primary/20"
              />
            }
          >
            {currentAddress?.charAt(0).toUpperCase() || "?"}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleOpenCreate}>
              <Zap className="size-4" />
              <span>创建新邮箱</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleAdminClick}>
              <Shield className="size-4" />
              <span>后台管理</span>
            </DropdownMenuItem>
            {isLoggedIn && (
              <DropdownMenuItem render={<Link href="/account/security" />}>
                <User className="size-4" />
                <span>账号设置</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="size-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </>
        )}
      </header>

      <CreateEmailModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        domains={domains}
      />

      {/* Admin password dialog */}
      <Dialog open={showAdminPw} onOpenChange={(v) => !v && setShowAdminPw(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>管理员验证</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="password"
              placeholder="请输入管理员密码"
              value={adminPw}
              onChange={(e) => setAdminPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdminConfirm()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminPw(false)}>取消</Button>
            <Button onClick={handleAdminConfirm}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
