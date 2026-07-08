"use client"

import {
  Archive,
  FileText,
  Inbox,
  RefreshCw,
  Send,
  Trash2,
  Webhook,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { folders, mailboxAddress } from "@/lib/mock-inbox"

const folderIcons: Record<string, typeof Inbox> = {
  inbox: Inbox,
  sent: Send,
  drafts: FileText,
  "auto-reply": RefreshCw,
  webhook: Webhook,
  archive: Archive,
  trash: Trash2,
}

export function InboxSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-9 rounded-lg bg-primary">
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
              匿
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">匿名邮箱</span>
            <span className="truncate text-xs text-muted-foreground">
              {mailboxAddress}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>邮件</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {folders.map((folder) => {
                const Icon = folderIcons[folder.key] ?? Inbox
                return (
                  <SidebarMenuItem key={folder.key}>
                    <SidebarMenuButton isActive={folder.key === "inbox"}>
                      <Icon />
                      <span>{folder.label}</span>
                    </SidebarMenuButton>
                    {folder.count > 0 ? (
                      <SidebarMenuBadge>{folder.count}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          存储用量 · 62 MB / 1 GB
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
