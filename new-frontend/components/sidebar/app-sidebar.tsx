"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Activity,
  AtSign,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Inbox,
  LogOut,
  Mail,
  Mails,
  Moon,
  PenSquare,
  Send,
  Settings,
  Shield,
  Sun,
  User,
  Wrench,
  Globe,
} from "lucide-react"

import api, { setAuthTokens } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/hooks/use-theme"
import { useScopedI18n } from "@/hooks/useScopedI18n"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getLocaleLabel, getLocaleOptions } from "@/lib/i18n/locale-registry"
import type { BoundAddress } from "@/lib/types"
import type { SupportedLocale } from "@/lib/i18n/locale-registry"

function AddressSwitcher() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isLoggedIn } = useAuth()

  const { data: settings } = useQuery({
    queryKey: ["sidebar_settings"],
    queryFn: async () => {
      const { data } = await api.get<{ address: string }>("/api/settings")
      return data
    },
    retry: false,
  })

  const { data: addresses } = useQuery({
    queryKey: ["sidebar_bind_address"],
    queryFn: async () => {
      const { data } = await api.get<{ results: BoundAddress[] }>("/user_api/bind_address")
      return data.results
    },
    enabled: isLoggedIn,
    retry: false,
  })

  const currentAddress = settings?.address
  const currentInitial = currentAddress?.charAt(0)?.toUpperCase() || "?"
  const hasAddresses = (addresses?.length ?? 0) > 0

  const handleSwitch = async (addressId: number) => {
    try {
      const { data } = await api.get<{ jwt: string }>(`/user_api/bind_address_jwt/${addressId}`)
      setAuthTokens({ jwt: data.jwt })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inbox"] }),
        queryClient.invalidateQueries({ queryKey: ["sidebar_settings"] }),
      ])
      router.push("/mailbox/inbox")
    } catch {
      toast.error("切换地址失败")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
          />
        }
      >
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
            {currentInitial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
          <div className="truncate text-sm font-semibold leading-tight">
            {currentAddress || "匿名邮箱"}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
            <Activity className="size-3" />
            <span>{currentAddress ? "当前工作邮箱" : "正在读取地址"}</span>
          </div>
        </div>
        {hasAddresses ? (
          <ChevronDown className="size-4 shrink-0 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
        ) : null}
      </DropdownMenuTrigger>

      {hasAddresses ? (
        <DropdownMenuContent align="start" side="right" sideOffset={10} className="w-72">
          {addresses?.map((addr) => (
            <DropdownMenuItem
              key={addr.id}
              onClick={() => handleSwitch(addr.id)}
              className={cn(
                "flex items-center gap-3 px-2 py-2",
                addr.name === currentAddress && "bg-accent font-medium"
              )}
            >
              <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-medium">
                {addr.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{addr.name}</div>
                <div className="text-xs text-muted-foreground">{addr.mail_count} 封邮件</div>
              </div>
              {addr.name === currentAddress ? <Check className="size-4 shrink-0 text-primary" /> : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/account/addresses" />}>
            <User className="size-4" />
            <span>管理地址</span>
            <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      ) : null}
    </DropdownMenu>
  )
}

function LanguageSwitcher({ currentLocale, onLocaleChange }: {
  currentLocale: SupportedLocale
  onLocaleChange: (l: SupportedLocale) => void
}) {
  const localeOptions = getLocaleOptions()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title="切换语言"
          />
        }
      >
        <Globe className="size-4 shrink-0" />
        <span className="group-data-[collapsible=icon]:hidden text-xs">{currentLocale.toUpperCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" sideOffset={10}>
        {localeOptions.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onLocaleChange(opt.value as SupportedLocale)}
            className={cn(currentLocale === opt.value && "bg-accent font-medium")}
          >
            {opt.label}
            {currentLocale === opt.value && <Check className="ml-auto size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppSidebar({ currentLocale, onLocaleChange }: {
  currentLocale?: SupportedLocale
  onLocaleChange?: (l: SupportedLocale) => void
}) {
  const pathname = usePathname()
  const { isAdmin, isLoggedIn, logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t } = useScopedI18n("views.Index")

  const isActive = (href: string) => {
    if (href === "/mailbox/inbox") return pathname === href || pathname.startsWith("/mailbox/inbox/")
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const { data: inboxCount } = useQuery({
    queryKey: ["sidebar_unread_count"],
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>("/api/parsed_mails?limit=1&offset=0")
      const total = data?.count ?? 0
      return total
    },
    retry: false,
    refetchInterval: 30_000,
  })

  const navItems = [
    { href: "/mailbox/inbox", label: t("mailbox") || "收件箱", icon: Inbox, count: inboxCount },
    { href: "/mailbox/sent", label: t("sendbox") || "已发送", icon: Send },
  ]

  const accountItems = [
    { href: "/account/security", label: "账号安全", icon: Shield },
    { href: "/account/addresses", label: "管理地址", icon: AtSign },
  ]

  const adminItems = [
    { href: "/admin/dashboard", label: "仪表盘", icon: BarChart3 },
    { href: "/admin/accounts", label: "邮箱管理", icon: AtSign },
    { href: "/admin/mails", label: "邮件中心", icon: Mail },
    { href: "/admin/users", label: "用户与角色", icon: Shield },
    { href: "/admin/settings", label: "系统设置", icon: Settings },
    { href: "/admin/operations", label: "运维", icon: Wrench },
    { href: "/admin/account", label: "管理员账户", icon: User },
    { href: "/admin/about", label: "关于", icon: Activity },
  ]

  return (
    <Sidebar variant="inset" collapsible="icon" className="w-[220px]">
      <SidebarHeader className="border-b border-sidebar-border/70 px-3 py-2.5">
        <AddressSwitcher />
      </SidebarHeader>

      <SidebarContent className="px-1 py-2">
        {/* Compose button */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/mailbox/compose" />}
                  tooltip={t("sendmail") || "写邮件"}
                  isActive={isActive("/mailbox/compose")}
                  className="h-10 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                >
                  <PenSquare />
                  <span>{t("sendmail") || "写邮件"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Mail nav - no label */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    render={<Link href={item.href} />}
                    tooltip={item.label}
                    className="h-9"
                  >
                    <item.icon />
                    <span>{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-auto h-5 min-w-5 rounded-full px-1.5 text-[11px] font-medium"
                      >
                        {item.count > 99 ? "99+" : item.count}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Account section */}
        {isLoggedIn && (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {accountItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive(item.href)}
                        render={<Link href={item.href} />}
                        tooltip={item.label}
                        className="h-9"
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}

        {/* Admin section */}
        {isAdmin && adminItems.length > 0 && (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive(item.href)}
                        render={<Link href={item.href} />}
                        tooltip={item.label}
                        className="h-9"
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}
      </SidebarContent>

      {/* Bottom: dark mode + language + logout */}
      <SidebarFooter className="border-t border-sidebar-border/70 p-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title={theme === "dark" ? "切换亮色模式" : "切换暗色模式"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span className="text-xs group-data-[collapsible=icon]:hidden">
              {theme === "dark" ? "亮色" : "暗色"}
            </span>
          </button>

          {onLocaleChange && currentLocale && (
            <LanguageSwitcher currentLocale={currentLocale} onLocaleChange={onLocaleChange} />
          )}

          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center rounded-lg px-2 py-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title="退出登录"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
