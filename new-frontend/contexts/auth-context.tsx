"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import api, { setAuthTokens, clearAuthTokens } from "@/lib/api"
import { hashPassword } from "@/lib/crypto"
import type { UserSettingsResponse } from "@/lib/types"

type User = {
  user_id: number
  user_email: string
  is_admin: boolean
  user_role: UserSettingsResponse["user_role"]
}

type AuthContextValue = {
  user: User | null
  isLoggedIn: boolean
  isAdmin: boolean
  loading: boolean
  login: (email: string, password: string, cfToken?: string) => Promise<void>
  adminLogin: (sitePassword: string, adminPassword: string, cfToken?: string) => Promise<void>
  addressLogin: (email: string, password: string, cfToken?: string) => Promise<void>
  register: (email: string, password: string, cfToken?: string, code?: string) => Promise<void>
  logout: () => void
  switchMailbox: (addressId: number) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** 用户登录后自动获取第一个绑定地址的 mailbox JWT */
async function autoFetchMailboxJwt() {
  try {
    const { data } = await api.get<{ results: Array<{ id: number }> }>("/user_api/bind_address")
    if (data.results?.length > 0) {
      const firstId = data.results[0].id
      const { data: jwtData } = await api.get<{ jwt: string }>(`/user_api/bind_address_jwt/${firstId}`)
      setAuthTokens({ jwt: jwtData.jwt })
    }
  } catch {
    // 没有绑定地址也正常 — 用户可以在用户中心手动绑定
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAdminAuth, setHasAdminAuth] = useState(false)
  const router = useRouter()
  const userRef = useRef<User | null>(null)

  useEffect(() => {
    setHasAdminAuth(!!localStorage.getItem("adminAuth"))
  }, [])

  const refreshUser = useCallback(async () => {
    const storedUserJwt = localStorage.getItem("userJwt")
    if (!storedUserJwt) {
      const storedAdminAuth = localStorage.getItem("adminAuth")
      if (storedAdminAuth && !userRef.current) {
        const adminUser: User = { user_id: 0, user_email: "admin", is_admin: true, user_role: null }
        userRef.current = adminUser
        setUser(adminUser)
      }
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get<UserSettingsResponse>("/user_api/settings")
      const newUser: User = {
        user_id: data.user_id,
        user_email: data.user_email,
        is_admin: data.is_admin,
        user_role: data.user_role,
      }
      userRef.current = newUser
      setUser(newUser)
      if (data.new_user_token) {
        try {
          await api.get("/user_api/settings", {
            headers: { "x-user-token": data.new_user_token },
          })
          setAuthTokens({ userJwt: data.new_user_token })
        } catch {
          console.warn("Failed to refresh user JWT with new token")
        }
      }
      if (data.access_token) {
        setAuthTokens({ access_token: data.access_token })
      }
    } catch {
      clearAuthTokens()
      userRef.current = null
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string, cfToken = "") => {
    const hashedPw = await hashPassword(password)
    const { data } = await api.post<{ jwt: string }>("/user_api/login", { email, password: hashedPw, cf_token: cfToken })
    setAuthTokens({ userJwt: data.jwt })
    await refreshUser()
    // 登录后自动获取 mailbox JWT（从第一个绑定地址），让 /api/* 调用能正常工作
    await autoFetchMailboxJwt()
    toast.success("登录成功")
  }

  const register = async (email: string, password: string, cfToken = "", code?: string) => {
    const hashedPw = await hashPassword(password)
    await api.post("/user_api/register", {
      email,
      password: hashedPw,
      cf_token: cfToken,
      ...(code ? { code } : {}),
    })
    // 注册成功后自动登录
    await login(email, password, cfToken)
    toast.success("注册成功")
  }

  const adminLogin = async (sitePassword: string, adminPassword: string, cfToken = "") => {
    if (sitePassword) {
      const hashedSitePw = await hashPassword(sitePassword)
      await api.post("/open_api/site_login", { password: hashedSitePw, cf_token: cfToken })
    }
    // 存储 admin 密码（匹配 frontend 的 adminAuth 模式：直接存密码作为 header 值）
    setAuthTokens({ adminAuth: adminPassword })
    try {
      await api.get("/admin/statistics")
      setHasAdminAuth(true)
      const storedUserJwt = localStorage.getItem("userJwt")
      if (storedUserJwt) {
        await refreshUser()
      } else {
        const adminUser: User = { user_id: 0, user_email: "admin", is_admin: true, user_role: null }
        userRef.current = adminUser
        setUser(adminUser)
      }
      toast.success("管理员登录成功")
    } catch {
      clearAuthTokens()
      setHasAdminAuth(false)
      throw new Error("管理员密码错误")
    }
  }

  const addressLogin = async (email: string, password: string, cfToken = "") => {
    const hashedPw = await hashPassword(password)
    const { data } = await api.post<{ jwt: string }>("/api/address_login", { email, password: hashedPw, cf_token: cfToken })
    setAuthTokens({ jwt: data.jwt })
    // 邮箱登录后也尝试获取用户信息（如果之前登录过用户账号）
    if (localStorage.getItem("userJwt")) {
      await refreshUser()
    }
    toast.success("邮箱登录成功")
  }

  const logout = () => {
    clearAuthTokens()
    userRef.current = null
    setUser(null)
    setHasAdminAuth(false)
    router.push("/login")
  }

  const switchMailbox = async (addressId: number) => {
    const { data } = await api.get<{ jwt: string }>(`/user_api/bind_address_jwt/${addressId}`)
    setAuthTokens({ jwt: data.jwt })
    router.push("/mailbox/inbox")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin: !!user?.is_admin || hasAdminAuth,
        loading,
        login,
        register,
        adminLogin,
        addressLogin,
        logout,
        switchMailbox,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
