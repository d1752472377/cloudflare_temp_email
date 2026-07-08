"use client"

import { useState } from "react"
import { LogOut, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface AvatarDropdownProps {
  userName?: string
  onManageAddress?: () => void
  onLogout?: () => void
}

export function AvatarDropdown({ 
  userName = "用户", 
  onManageAddress, 
  onLogout 
}: AvatarDropdownProps) {
  const [open, setOpen] = useState(false)
  
  // 获取首字母（支持中文）
  const getInitials = (name: string) => {
    if (!name) return "?"
    // 如果是中文，取第一个字；如果是英文，取前两个字母
    const trimmed = name.trim()
    if (/[\u4e00-\u9fa5]/.test(trimmed)) {
      return trimmed.charAt(0)
    }
    return trimmed.slice(0, 2).toUpperCase()
  }

  const initials = getInitials(userName)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button 
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/50 bg-background transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="用户菜单"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">用户</p>
        </div>
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={onManageAddress}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>管理地址</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}